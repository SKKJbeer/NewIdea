import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import {
  igKonfig,
  profil,
  kontingent,
  letzteBeitraege,
  berlinerDatum,
  GRAPH_VERSION,
  GraphFehler,
} from '@/lib/instagram';
import { planFuer, WOCHENPLAN } from '@/lib/social-plan';

// INSTAGRAM IM STUDIO — Zustand lesen (GET) und Zugang einrichten (POST).
//
// Der Einrichtungsweg ist der muehsamste Teil des ganzen Autopiloten: Meta
// liefert im Graph-Explorer nur einen Token mit einer Stunde Laufzeit. Daraus
// wird ein langlebiger Nutzer-Token, daraus ein Seiten-Token, und erst an der
// Seite haengt die Instagram-Konto-ID. Drei Aufrufe mit App-ID und App-Secret,
// die niemand von Hand machen sollte. Diese Route macht sie.
//
// DER ERGEBNIS-TOKEN LAEUFT NICHT AB: Ein Seiten-Token, der aus einem
// langlebigen Nutzer-Token abgeleitet ist, hat laut Meta kein Ablaufdatum.
// Die Route prueft das per `debug_token` und zeigt es an, statt es zu
// behaupten.
//
// Nichts davon wird gespeichert oder geloggt. Das App-Secret verlaesst den
// Server nur Richtung Meta.

export const runtime = 'nodejs';

const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphGet<T>(pfad: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`${GRAPH}/${pfad}?${new URLSearchParams(params)}`, {
    signal: AbortSignal.timeout(20_000),
  });
  const daten = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number } };
  if (!res.ok || daten.error) {
    throw new GraphFehler(daten.error?.message ?? `HTTP ${res.status}`, daten.error?.code ?? null, null);
  }
  return daten;
}

function naechsteTage(n: number) {
  const tage = [];
  const heute = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(heute.getTime() + i * 86_400_000);
    tage.push({ datum: berlinerDatum(d), art: planFuer(d).art });
  }
  return tage;
}

export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const k = igKonfig();
  const basis = {
    konfiguriert: Boolean(k),
    graphVersion: GRAPH_VERSION,
    wochenplan: WOCHENPLAN,
    naechsteTage: naechsteTage(7),
  };
  if (!k) return NextResponse.json(basis, { headers: { 'Cache-Control': 'no-store' } });

  try {
    const [p, kont, beitraege] = await Promise.all([profil(k), kontingent(k), letzteBeitraege(k, 6)]);
    return NextResponse.json(
      { ...basis, profil: p, kontingent: kont, letzteBeitraege: beitraege },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    // Die Meldung von Meta ist genau das, was man zum Beheben braucht
    // („Error validating access token: Session has expired" usw.).
    return NextResponse.json(
      { ...basis, fehler: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

interface Seite {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: { id: string; username?: string };
}

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = (wert: unknown): string => (typeof wert === 'string' ? wert.trim() : '');
  const appId = text(body.appId);
  const appSecret = text(body.appSecret);
  const kurzToken = text(body.kurzToken);
  if (!/^\d{5,25}$/.test(appId) || appSecret.length < 16 || kurzToken.length < 40) {
    return NextResponse.json(
      { error: 'App-ID (nur Ziffern), App-Secret und Token aus dem Graph-Explorer werden gebraucht' },
      { status: 400 },
    );
  }

  try {
    // 1. Kurzlebigen Nutzer-Token (1 h) in einen langlebigen (60 Tage) tauschen.
    const lang = await graphGet<{ access_token: string }>('oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: kurzToken,
    });

    // 2. Seiten des Nutzers — deren Tokens sind, aus dem langlebigen Nutzer-
    //    Token abgeleitet, unbefristet.
    const seiten = await graphGet<{ data?: Seite[] }>('me/accounts', {
      fields: 'id,name,access_token,instagram_business_account{id,username}',
      access_token: lang.access_token,
    });

    const kandidaten = [];
    for (const s of seiten.data ?? []) {
      if (!s.access_token) continue;
      // 3. Ablauf pruefen statt behaupten.
      let laeuftAb: string | null = 'unbekannt';
      try {
        const dbg = await graphGet<{ data?: { expires_at?: number; is_valid?: boolean } }>('debug_token', {
          input_token: s.access_token,
          access_token: `${appId}|${appSecret}`,
        });
        const t = dbg.data?.expires_at;
        laeuftAb = t === 0 ? null : typeof t === 'number' ? new Date(t * 1000).toISOString() : 'unbekannt';
      } catch (err) {
        console.warn('[instagram-einrichtung] debug_token fehlgeschlagen:', (err as Error).message);
      }
      kandidaten.push({
        seite: s.name,
        seitenId: s.id,
        instagramId: s.instagram_business_account?.id ?? null,
        instagramName: s.instagram_business_account?.username ?? null,
        token: s.access_token,
        laeuftAb,
      });
    }

    if (kandidaten.length === 0) {
      return NextResponse.json(
        {
          error:
            'Keine Facebook-Seite gefunden. Beim Erzeugen des Tokens muss die Seite ausgewaehlt und die Berechtigung pages_show_list erteilt sein.',
        },
        { status: 422 },
      );
    }
    return NextResponse.json({ kandidaten }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? `Meta: ${err.message}` : 'Unbekannter Fehler' },
      { status: 502 },
    );
  }
}
