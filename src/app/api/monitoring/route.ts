import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/app-version';
import { loadUsageSummary, AI_USAGE_SETUP_SQL } from '@/lib/ai-usage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { collectSystemHealth } from '@/lib/system-health';
import fs from 'fs';
import path from 'path';

// Read skills dynamically from .claude/commands/ — auto-updates when files are added/changed
function getSkills() {
  const dir = path.join(process.cwd(), '.claude', 'commands');
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((file) => {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        // First non-empty line after the title heading
        const lines = content.split('\n');
        const descLine = lines.find((l, i) => i > 0 && l.trim() && !l.startsWith('#') && !l.startsWith('Du bist')) ?? '';
        const stats = fs.statSync(path.join(dir, file));
        return {
          name: file.replace('.md', ''),
          title: titleMatch?.[1]?.trim() || file.replace('.md', ''),
          description: descLine.replace(/[*_`]/g, '').trim().slice(0, 140),
          lastModified: stats.mtime.toISOString(),
        };
      });
  } catch {
    return [];
  }
}

// Describe automation workflows — derived from vercel.json + known API routes
function getWorkflows(cronActive: boolean) {
  // WAS HIER STEHEN MUSS, ist der TATSAECHLICHE Ablauf — nicht der von damals.
  //
  // BEFUND BEIM AUFRAEUMEN: Der taegliche Cron war mit „Speichert aktuelle
  // Preise in Supabase, waermt Blog- und Karten-Cache auf" beschrieben. Er
  // stoesst inzwischen ausserdem die flaechendeckende Erfassung an, schreibt
  // den Indexstand fort, waermt die Suche vor, erzeugt sonntags und
  // donnerstags einen Artikel und dienstags und freitags einen Guide. Eine
  // Beschreibung, die das Wichtigste verschweigt, ist schlimmer als keine.
  return [
    {
      name: 'Wöchentliche Marktanalyse',
      endpoint: '/api/cron',
      schedule: '0 7 * * 1',
      scheduleLabel: 'Montags 07:00 UTC',
      description: 'Erzeugt den Wochenbericht, bereitet den Newsletter vor und speichert Preis-Schnappschüsse',
      active: cronActive,
      trigger: 'Vercel Cron',
    },
    {
      name: 'Täglicher Cron',
      endpoint: '/api/cron/daily',
      schedule: '0 8 * * *',
      scheduleLabel: 'Täglich 08:00 UTC',
      description:
        'Schnappschüsse der Top-Karten, Indexstand, Vorwärmen der Suche — und der Anstoß für die flächendeckende Preiserfassung',
      active: cronActive,
      trigger: 'Vercel Cron',
    },
    {
      name: 'Flächendeckende Preiserfassung',
      endpoint: '/api/cron/price-sweep',
      schedule: 'Kette',
      scheduleLabel: 'Reicht sich selbst weiter, bis der Tag fertig ist',
      description:
        'Holt alle ~20.500 Karten seitenweise, schreibt Messpunkte und den Kartenindex fort. Der Fortschritt steht im Betriebszustand',
      active: cronActive,
      trigger: 'Täglicher Cron',
    },
    {
      name: 'Artikel (Sonntag + Donnerstag)',
      endpoint: '/api/cron/daily',
      schedule: '0 8 * * 0,4',
      scheduleLabel: 'Sonntags + donnerstags',
      description: 'Erzeugt den Wochenrückblick bzw. das Marktthema — nur an diesen beiden Tagen',
      active: cronActive,
      trigger: 'Täglicher Cron',
    },
    {
      name: 'Guides (Dienstag + Freitag)',
      endpoint: '/api/cron/daily',
      schedule: '0 8 * * 2,5',
      scheduleLabel: 'Dienstags + freitags',
      description:
        'Nimmt das nächste Thema aus der Warteschlange. Verletzt die Ausgabe eine Inhaltsregel, wird sie NICHT gespeichert',
      active: cronActive,
      trigger: 'Täglicher Cron',
    },
    {
      name: 'Newsletter-Versand',
      endpoint: '/api/newsletter',
      schedule: 'On Demand',
      scheduleLabel: 'Bei Anmeldung / Manuell',
      description: 'Versendet über Beehiiv; Anmeldungen werden auch ohne Key gesammelt',
      active: !!process.env.BEEHIIV_API_KEY && !!process.env.BEEHIIV_PUBLICATION_ID,
      trigger: 'Formular / Studio',
    },
  ];
}

function env(key: string) {
  return Boolean(process.env[key]);
}
function envVal(key: string, fallback = '') {
  return process.env[key] || fallback;
}

export async function GET(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const siteUrl = envVal('NEXT_PUBLIC_SITE_URL');
  const cardmarketUrl = envVal('NEXT_PUBLIC_CARDMARKET_URL');
  const tradeRepublicUrl = envVal('NEXT_PUBLIC_TRADE_REPUBLIC_URL');
  const amazonUrl = envVal('NEXT_PUBLIC_AMAZON_URL');

  // Test Supabase connectivity
  let supabaseConnected = false;
  if (isSupabaseConfigured()) {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      if (sb) {
        const { error } = await sb.from('price_snapshots').select('id').limit(1);
        supabaseConnected = !error;
      }
    } catch {
      supabaseConnected = false;
    }
  }

  // Outcome-Monitoring: Was ist tatsächlich passiert? (echte Zeilen, Datenstände,
  // Klartext-Fehler) — nicht nur, ob Schlüssel gesetzt sind.
  const health = await collectSystemHealth().catch(() => null);

  // Test TCG API
  let tcgApiWorking = false;
  if (env('POKEMON_TCG_API_KEY')) {
    try {
      const res = await fetch('https://api.pokemontcg.io/v2/cards?pageSize=1', {
        headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY! },
        // Ohne Zeitlimit hängt die Monitoring-Seite bis zum Vercel-Hardlimit,
        // wenn die TCG-API klemmt — ausgerechnet die Seite, die den Ausfall
        // anzeigen soll.
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 300 },
      });
      tcgApiWorking = res.ok;
    } catch {
      tcgApiWorking = false;
    }
  }

  // KI-Verbrauch der letzten 30 Tage — beantwortet die Frage „wofür ging das
  // Guthaben drauf?", die sich ohne Erfassung nur raten lässt.
  const aiUsage = await loadUsageSummary(30).catch((err) => {
    console.warn('KI-Verbrauch konnte nicht geladen werden:', err);
    return null;
  });

  const data = {
    aiUsage: aiUsage ? { ...aiUsage, setupSql: aiUsage.missingTable ? AI_USAGE_SETUP_SQL : null } : null,
    // Build info
    build: {
      version: APP_VERSION,
      siteUrl: siteUrl || null,
      siteUrlMissing: !siteUrl,
      nodeEnv: process.env.NODE_ENV,
    },

    // API Keys
    apiKeys: {
      pokemonTcg: { set: env('POKEMON_TCG_API_KEY'), working: tcgApiWorking, required: true, label: 'Pokémon TCG API', envVar: 'POKEMON_TCG_API_KEY', hint: 'https://dev.pokemontcg.io/', effect: 'Karten & Echte Preise' },
      anthropic: { set: env('ANTHROPIC_API_KEY'), required: true, label: 'Claude AI (Anthropic)', envVar: 'ANTHROPIC_API_KEY', hint: 'https://console.anthropic.com/', effect: 'KI-Blog, Marktberichte, Newsletter' },
      cronSecret: { set: env('CRON_SECRET'), required: true, label: 'CRON_SECRET', envVar: 'CRON_SECRET', hint: 'Selbst definierten Zufallsstring', effect: 'Täglicher & wöchentlicher Cron' },
      supabaseUrl: { set: env('SUPABASE_URL'), required: false, label: 'SUPABASE_URL', envVar: 'SUPABASE_URL', hint: 'Supabase Dashboard → Settings → API', effect: 'Preis-Verlauf in DB speichern' },
      supabaseKey: { set: env('SUPABASE_SERVICE_ROLE_KEY'), required: false, label: 'SUPABASE_SERVICE_ROLE_KEY', envVar: 'SUPABASE_SERVICE_ROLE_KEY', hint: 'service_role Key (sb_secret_…)', effect: 'Schreibrecht auf price_snapshots' },
      portfolioLoginFlag: { set: env('NEXT_PUBLIC_PORTFOLIO_LOGIN'), required: false, label: 'NEXT_PUBLIC_PORTFOLIO_LOGIN', envVar: 'NEXT_PUBLIC_PORTFOLIO_LOGIN', hint: 'Wert `on` schaltet die Anmeldung frei — getrennt von den Zugangsdaten, damit sich Supabase erst in Ruhe einrichten lässt', effect: 'Erst damit erscheinen die Anmeldeknöpfe im Portfolio' },
      supabasePublicUrl: { set: env('NEXT_PUBLIC_SUPABASE_URL'), required: false, label: 'NEXT_PUBLIC_SUPABASE_URL', envVar: 'NEXT_PUBLIC_SUPABASE_URL', hint: 'Dieselbe URL wie SUPABASE_URL — muss öffentlich sein', effect: 'Konto-Anmeldung im Portfolio (Google/Apple)' },
      supabaseAnonKey: { set: env('NEXT_PUBLIC_SUPABASE_ANON_KEY'), required: false, label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', envVar: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', hint: 'Supabase → Settings → API → anon/publishable (NICHT service_role!)', effect: 'Konto-Anmeldung im Portfolio (Google/Apple)' },
      beehiivKey: { set: env('BEEHIIV_API_KEY'), required: false, label: 'BEEHIIV_API_KEY', envVar: 'BEEHIIV_API_KEY', hint: 'https://beehiiv.com/', effect: 'Newsletter automatisch versenden' },
      beehiivPub: { set: env('BEEHIIV_PUBLICATION_ID'), required: false, label: 'BEEHIIV_PUBLICATION_ID', envVar: 'BEEHIIV_PUBLICATION_ID', hint: 'Beehiiv Dashboard → Publication ID', effect: 'Newsletter automatisch versenden' },
      elevenlabs: { set: env('ELEVENLABS_API_KEY'), required: false, label: 'ELEVENLABS_API_KEY', envVar: 'ELEVENLABS_API_KEY', hint: 'https://elevenlabs.io/', effect: 'KI-Stimme für Videos' },
      youtube: { set: env('YOUTUBE_ACCESS_TOKEN'), required: false, label: 'YOUTUBE_ACCESS_TOKEN', envVar: 'YOUTUBE_ACCESS_TOKEN', hint: 'Google Cloud Console', effect: 'Videos automatisch hochladen' },
      buffer: { set: env('BUFFER_ACCESS_TOKEN'), required: false, label: 'BUFFER_ACCESS_TOKEN', envVar: 'BUFFER_ACCESS_TOKEN', hint: 'https://buffer.com/', effect: 'Social-Media-Posts planen' },
    },

    // Affiliate Links
    affiliates: {
      cardmarket: {
        label: 'Cardmarket',
        url: cardmarketUrl || null,
        isDefault: !cardmarketUrl || cardmarketUrl === 'https://www.cardmarket.com/en/Pokemon',
        isBroken: false,
        env: 'NEXT_PUBLIC_CARDMARKET_URL',
        hint: 'Cardmarket Partner-Programm → Deinen Referral-Link einsetzen',
      },
      tradeRepublic: {
        label: 'Trade Republic',
        url: tradeRepublicUrl || null,
        isDefault: !tradeRepublicUrl,
        isBroken: !tradeRepublicUrl || tradeRepublicUrl === '#',
        env: 'NEXT_PUBLIC_TRADE_REPUBLIC_URL',
        hint: 'Trade Republic Affiliate-Programm → Deinen Link einsetzen (30–80€/Depot)',
      },
      amazon: {
        label: 'Amazon',
        url: amazonUrl || null,
        isDefault: !amazonUrl || amazonUrl.includes('amazon.de/s?k=pokemon+booster'),
        isBroken: false,
        env: 'NEXT_PUBLIC_AMAZON_URL',
        hint: 'Amazon PartnerNet → Deinen Tracking-Link einsetzen',
      },
    },

    // Legal pages
    legal: {
      impressum: {
        label: 'Impressum',
        hasPlaceholders: true,
        placeholders: ['[Dein Vor- und Nachname]', '[Straße und Hausnummer]', '[PLZ Ort]', '[deine@email.de]', '[Telefon]'],
        path: '/impressum',
        hint: 'src/app/impressum/page.tsx öffnen und alle [...]-Platzhalter ersetzen',
      },
      datenschutz: {
        label: 'Datenschutz',
        hasPlaceholders: true,
        placeholders: ['[deine@email.de]', '[Name]', '[Adresse]'],
        path: '/datenschutz',
        hint: 'src/app/datenschutz/page.tsx öffnen und alle [...]-Platzhalter ersetzen',
      },
    },

    // FRUEHER STAND HIER „features".
    //
    // Der Block zaehlte auf, welche Funktionen konfiguriert sind — und sagte
    // damit zum DRITTEN Mal dasselbe: `apiKeys` nennt die Konfiguration,
    // `health` nennt die Ergebnisse. Jeder einzelne Eintrag war anderswo
    // bereits beantwortet. Die Anzeige war schon entfernt; das Feld hier
    // stehen zu lassen waere genau die Drift, gegen die der Umbau war.


    // Betriebszustand: echte Ergebnisse statt nur Konfiguration
    health,

    // Skills & Workflows
    skills: getSkills(),
    // „AKTIV" HAENGT NUR NOCH AM SECRET.
    //
    // BEFUND: Hier stand `env('CRON_SECRET') && !!siteUrl`. `siteUrl` ist
    // NEXT_PUBLIC_SITE_URL — und die zeigt auf eine Domain, die nie verbunden
    // wurde, ist also nicht gesetzt. Das Monitoring meldete beide Crons damit
    // als INAKTIV, waehrend sie nachweislich jeden Tag liefen.
    //
    // Die Cron-Routen brauchen die Variable auch gar nicht: Sie verwenden
    // `url.origin`, also die Adresse, unter der sie gerade laufen — genau
    // deshalb, weil NEXT_PUBLIC_SITE_URL ins Leere zeigte.
    workflows: getWorkflows(env('CRON_SECRET')),

    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
