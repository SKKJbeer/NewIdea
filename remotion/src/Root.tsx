import { Composition } from 'remotion';
import { PokemonVideo } from './PokemonVideo';

const defaultBranding = { primaryColor: '#7c3aed', secondaryColor: '#4f46e5', logoText: 'PokéMarket Intelligence', channelName: '@pokemarketintelligence' };

const sampleScenes = [
  { type: 'intro' as const, duration: 5, text: 'Top 5 Investment-Karten dieser Woche', narration: 'Willkommen bei PokéMarket Intelligence!' },
  { type: 'card_spotlight' as const, duration: 15, text: 'Eine der stärksten Investment-Karten', narration: 'Auf Platz 1 diese Woche...', card: { name: 'Charizard ex', imageUrl: 'https://images.pokemontcg.io/sv3/6_hires.png', prices: { holofoil: { market: 89.99 } }, trendPercent: 12.4, investmentScore: 88 } },
  { type: 'cta' as const, duration: 5, text: 'Alle Preise auf unserer Website', narration: 'Jetzt auf Cardmarket kaufen!' },
  { type: 'outro' as const, duration: 5, text: 'Nächste Woche: Neue Analyse', narration: 'Bis nächste Woche!' },
];

export function RemotionRoot() {
  return (
    <>
      <Composition id="PokemonVideoYouTube" component={PokemonVideo} durationInFrames={900} fps={30} width={1920} height={1080} defaultProps={{ scenes: sampleScenes, branding: defaultBranding, affiliateUrl: 'cardmarket.com/Pokemon' }} />
      <Composition id="PokemonVideoShorts" component={PokemonVideo} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{ scenes: sampleScenes.slice(0, 3), branding: defaultBranding, affiliateUrl: 'cardmarket.com/Pokemon' }} />
    </>
  );
}
