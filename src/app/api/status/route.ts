import { NextResponse } from 'next/server';

// Reports which integrations are configured (env vars present).
// Used by the control dashboard to show connection status.
export async function GET() {
  const integrations = {
    pokemon: {
      name: 'Pokémon TCG API',
      configured: Boolean(process.env.POKEMON_TCG_API_KEY),
      required: true,
      category: 'data',
      purpose: 'Live-Kartenpreise abrufen',
    },
    claude: {
      name: 'Claude AI (Anthropic)',
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
      required: true,
      category: 'ai',
      purpose: 'Content automatisch generieren',
    },
    beehiiv: {
      name: 'Beehiiv Newsletter',
      configured: Boolean(process.env.BEEHIIV_API_KEY && process.env.BEEHIIV_PUBLICATION_ID),
      required: false,
      category: 'publish',
      purpose: 'Newsletter automatisch versenden',
    },
    elevenlabs: {
      name: 'ElevenLabs Voice',
      configured: Boolean(process.env.ELEVENLABS_API_KEY),
      required: false,
      category: 'video',
      purpose: 'KI-Sprecher für Videos',
    },
    youtube: {
      name: 'YouTube Upload',
      configured: Boolean(process.env.YOUTUBE_ACCESS_TOKEN),
      required: false,
      category: 'publish',
      purpose: 'Videos automatisch hochladen',
    },
    buffer: {
      name: 'Buffer Social Media',
      configured: Boolean(process.env.BUFFER_ACCESS_TOKEN),
      required: false,
      category: 'publish',
      purpose: 'Posts auf Insta/TikTok/Twitter planen',
    },
  };

  const requiredReady = Object.values(integrations)
    .filter((i) => i.required)
    .every((i) => i.configured);

  const totalConfigured = Object.values(integrations).filter((i) => i.configured).length;

  return NextResponse.json({
    integrations,
    requiredReady,
    totalConfigured,
    totalIntegrations: Object.keys(integrations).length,
    checkedAt: new Date().toISOString(),
  });
}
