import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
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
  return [
    {
      name: 'Wöchentliche Marktanalyse',
      endpoint: '/api/cron',
      schedule: '0 7 * * 1',
      scheduleLabel: 'Montags 07:00 UTC',
      description: 'Generiert KI-Marktbericht, bereitet Newsletter vor, speichert Preis-Snapshots',
      active: cronActive,
      trigger: 'Vercel Cron',
    },
    {
      name: 'Täglicher Preis-Cron',
      endpoint: '/api/cron/daily',
      schedule: '0 8 * * *',
      scheduleLabel: 'Täglich 08:00 UTC',
      description: 'Speichert aktuelle Preise in Supabase, wärmt Blog- und Karten-Cache auf',
      active: cronActive,
      trigger: 'Vercel Cron',
    },
    {
      name: 'KI-Blog-Generierung',
      endpoint: '/api/generate',
      schedule: 'On Demand',
      scheduleLabel: 'Manuell (Studio)',
      description: 'Generiert Marktberichte, Newsletter-Texte, Video-Skripte via Claude API',
      active: env('ANTHROPIC_API_KEY'),
      trigger: 'Manuell',
    },
    {
      name: 'Newsletter-Versand',
      endpoint: '/api/newsletter',
      schedule: 'On Demand',
      scheduleLabel: 'Bei Anmeldung / Manuell',
      description: 'Sendet Newsletter über Beehiiv; sammelt Anmeldungen auch ohne Key',
      active: env('BEEHIIV_API_KEY') && env('BEEHIIV_PUBLICATION_ID'),
      trigger: 'Webhook',
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

  // Test TCG API
  let tcgApiWorking = false;
  if (env('POKEMON_TCG_API_KEY')) {
    try {
      const res = await fetch('https://api.pokemontcg.io/v2/cards?pageSize=1', {
        headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY! },
        next: { revalidate: 300 },
      });
      tcgApiWorking = res.ok;
    } catch {
      tcgApiWorking = false;
    }
  }

  const data = {
    // Build info
    build: {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '?',
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

    // Feature / Content status
    features: {
      supabaseConnected,
      priceSnapshots: { working: supabaseConnected, label: 'Preis-Snapshots (Supabase)', effect: 'Echte tägl. Preis-Historie' },
      tcgPrices: { working: tcgApiWorking, label: 'Echtzeit-Preise (Cardmarket EUR)', effect: 'via TCG-API-Key' },
      aiBlog: { working: env('ANTHROPIC_API_KEY'), label: 'KI-Blog-Artikel', effect: 'Ohne Key: Evergreen-Fallback-Inhalte' },
      cronDaily: { working: env('CRON_SECRET') && !!siteUrl, label: 'Täglicher Cron (08:00)', effect: 'Speichert Preise & wärmt Cache' },
      newsletter: { working: env('BEEHIIV_API_KEY') && env('BEEHIIV_PUBLICATION_ID'), label: 'Newsletter-Versand', effect: 'Anmeldungen werden gesammelt, aber nicht versendet' },
      video: { working: env('ELEVENLABS_API_KEY'), label: 'Video-Pipeline (ElevenLabs)', effect: 'Skript-Generator funktioniert, Stimme fehlt' },
      socialMedia: { working: env('BUFFER_ACCESS_TOKEN'), label: 'Social-Media-Auto-Post', effect: 'Posts werden generiert, aber nicht geplant' },
    },

    // Skills & Workflows
    skills: getSkills(),
    workflows: getWorkflows(env('CRON_SECRET') && !!siteUrl),

    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
