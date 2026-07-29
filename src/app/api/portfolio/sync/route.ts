import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverAuthClient, currentUser, displayName } from '@/lib/supabase-auth';
import { rowToHolding, holdingToRow, type HoldingRow } from '@/lib/portfolio-sync';
import { normalizeHolding, type PortfolioHolding } from '@/lib/portfolio';

// Portfolio im Konto lesen und schreiben.
//
// GET  → Bestand des angemeldeten Nutzers
// PUT  → Bestand vollständig ersetzen (die Seite schickt immer den ganzen Stand)
//
// Zugriffsschutz liegt DOPPELT: Diese Route prüft den angemeldeten Nutzer, und
// die Tabelle hat Row Level Security. Der zweite Riegel ist der wichtigere —
// er wirkt auch dann, wenn hier einmal eine Prüfung vergessen wird.

export const dynamic = 'force-dynamic';

const MAX_HOLDINGS = 500;

async function client() {
  const cookieStore = await cookies();
  return serverAuthClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

export async function GET() {
  const sb = await client();
  if (!sb) {
    return NextResponse.json({ configured: false, holdings: [] }, { status: 200 });
  }

  const user = await currentUser(sb);
  if (!user) {
    return NextResponse.json({ configured: true, signedIn: false, holdings: [] }, { status: 200 });
  }

  const { data, error } = await sb
    .from('portfolio_holdings')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Portfolio laden fehlgeschlagen:', error.message);
    // Klartext-Ursache nur ins Log, nach außen eine verständliche Meldung —
    // die Seite arbeitet dann mit dem lokalen Bestand weiter.
    return NextResponse.json(
      { configured: true, signedIn: true, holdings: [], error: 'load_failed' },
      { status: 200 },
    );
  }

  return NextResponse.json({
    configured: true,
    signedIn: true,
    user: { name: displayName(user), email: user.email ?? null },
    holdings: (data ?? []).map((row) => rowToHolding(row as Partial<HoldingRow>)),
  });
}

export async function PUT(request: Request) {
  const sb = await client();
  if (!sb) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const user = await currentUser(sb);
  if (!user) return NextResponse.json({ error: 'not_signed_in' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { holdings?: unknown };
  if (!Array.isArray(body.holdings)) {
    return NextResponse.json({ error: 'holdings fehlt' }, { status: 400 });
  }

  const holdings: PortfolioHolding[] = (body.holdings as Array<Record<string, unknown>>)
    .filter((h) => typeof h.cardId === 'string' && h.cardId.length > 0)
    .slice(0, MAX_HOLDINGS)
    .map((h) => normalizeHolding(h as Partial<PortfolioHolding> & { cardId: string }));

  // Vollständig ersetzen: erst löschen, was nicht mehr dabei ist, dann den
  // Rest schreiben. Zwei Schritte statt „alles löschen, alles neu" — sonst
  // wäre das Portfolio zwischen den beiden Aufrufen kurz leer.
  const behalten = holdings.map((h) => h.cardId);

  const loeschen = sb.from('portfolio_holdings').delete().eq('user_id', user.id);
  const { error: deleteError } = behalten.length
    ? await loeschen.not('card_id', 'in', `(${behalten.map((id) => `"${id}"`).join(',')})`)
    : await loeschen;

  if (deleteError) {
    console.error('Portfolio aufräumen fehlgeschlagen:', deleteError.message);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  if (holdings.length > 0) {
    const { error: upsertError } = await sb
      .from('portfolio_holdings')
      .upsert(holdings.map((h) => holdingToRow(h, user.id)), { onConflict: 'user_id,card_id' });

    if (upsertError) {
      console.error('Portfolio speichern fehlgeschlagen:', upsertError.message);
      return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ saved: holdings.length });
}
