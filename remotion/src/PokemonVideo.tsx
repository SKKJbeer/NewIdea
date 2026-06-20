import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface PokemonVideoProps {
  scenes: Scene[];
  branding: { primaryColor: string; secondaryColor: string; logoText: string; channelName: string };
  affiliateUrl: string;
}

interface Scene {
  type: 'intro' | 'card_spotlight' | 'chart' | 'cta' | 'outro';
  duration: number;
  text: string;
  narration: string;
  card?: { name: string; imageUrl: string; prices: { holofoil?: { market?: number }; market?: number }; trendPercent?: number; investmentScore?: number };
}

export function PokemonVideo({ scenes, branding, affiliateUrl }: PokemonVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let sceneStart = 0, currentScene: Scene | null = null, sceneFrame = 0;
  for (const scene of scenes) {
    const dur = scene.duration * fps;
    if (frame < sceneStart + dur) { currentScene = scene; sceneFrame = frame - sceneStart; break; }
    sceneStart += dur;
  }
  if (!currentScene) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: '#0f0a1a', fontFamily: 'sans-serif' }}>
      {currentScene.type === 'intro' && <IntroScene scene={currentScene} frame={sceneFrame} fps={fps} branding={branding} />}
      {currentScene.type === 'card_spotlight' && <CardSpotlightScene scene={currentScene} frame={sceneFrame} fps={fps} />}
      {currentScene.type === 'cta' && <CtaScene scene={currentScene} frame={sceneFrame} fps={fps} affiliateUrl={affiliateUrl} />}
      {currentScene.type === 'outro' && <OutroScene scene={currentScene} frame={sceneFrame} fps={fps} branding={branding} />}
    </AbsoluteFill>
  );
}

function IntroScene({ scene, frame, fps, branding }: { scene: Scene; frame: number; fps: number; branding: PokemonVideoProps['branding'] }) {
  const opacity = spring({ frame, fps, config: { damping: 20 } });
  const scale = interpolate(frame, [0, 20], [0.8, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>⚡</div>
        <h1 style={{ color: '#fff', fontSize: 56, fontWeight: 900, margin: '16px 0 0' }}>{branding.logoText}</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 24, marginTop: 16 }}>{scene.text}</p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, marginTop: 8 }}>{branding.channelName}</p>
      </div>
    </AbsoluteFill>
  );
}

function CardSpotlightScene({ scene, frame, fps }: { scene: Scene; frame: number; fps: number }) {
  const opacity = spring({ frame, fps, config: { damping: 30 } });
  const cardSlide = interpolate(frame, [0, 15], [-100, 0], { extrapolateRight: 'clamp' });
  const price = scene.card?.prices.market || scene.card?.prices.holofoil?.market || 0;
  const trend = scene.card?.trendPercent || 0;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg,#1a0a2e,#0f0a1a)', display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 80, gap: 60 }}>
      <div style={{ transform: `translateX(${cardSlide}px)`, opacity }}>
        {scene.card?.imageUrl && <Img src={scene.card.imageUrl} style={{ width: 420, borderRadius: 16, boxShadow: '0 20px 60px rgba(124,58,237,0.5)' }} />}
      </div>
      <div style={{ flex: 1, opacity }}>
        <div style={{ color: '#a78bfa', fontSize: 18, fontWeight: 600 }}>KARTE DER WOCHE</div>
        <h2 style={{ color: '#fff', fontSize: 42, fontWeight: 900, margin: '8px 0 16px' }}>{scene.card?.name}</h2>
        <div style={{ display: 'flex', gap: 24 }}>
          <div><div style={{ color: '#9ca3af', fontSize: 14 }}>Marktpreis</div><div style={{ color: '#fff', fontSize: 36, fontWeight: 800 }}>{price.toFixed(2)} €</div></div>
          <div><div style={{ color: '#9ca3af', fontSize: 14 }}>7-Tage-Trend</div><div style={{ color: trend >= 0 ? '#4ade80' : '#f87171', fontSize: 36, fontWeight: 800 }}>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</div></div>
        </div>
        <div style={{ marginTop: 24, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 12, padding: '16px 20px', color: '#d8b4fe', fontSize: 18, lineHeight: 1.6 }}>{scene.text}</div>
      </div>
    </AbsoluteFill>
  );
}

function CtaScene({ scene, frame, fps, affiliateUrl }: { scene: Scene; frame: number; fps: number; affiliateUrl: string }) {
  const opacity = spring({ frame, fps, config: { damping: 20 } });
  const bounce = spring({ frame: frame - 10, fps, config: { damping: 8, stiffness: 100 } });
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ opacity, textAlign: 'center' }}>
        <p style={{ color: '#c4b5fd', fontSize: 22 }}>{scene.text}</p>
        <div style={{ transform: `scale(${bounce})`, background: '#fff', color: '#7c3aed', fontWeight: 900, fontSize: 28, padding: '20px 48px', borderRadius: 16, marginTop: 24 }}>{affiliateUrl.replace('https://', '')}</div>
        <p style={{ color: '#a78bfa', fontSize: 18, marginTop: 24 }}>🔗 Link in der Beschreibung</p>
      </div>
    </AbsoluteFill>
  );
}

function OutroScene({ scene, frame, fps, branding }: { scene: Scene; frame: number; fps: number; branding: PokemonVideoProps['branding'] }) {
  const opacity = spring({ frame, fps, config: { damping: 20 } });
  return (
    <AbsoluteFill style={{ background: '#0f0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ opacity, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>⚡</div>
        <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 900 }}>{branding.logoText}</h2>
        <p style={{ color: '#a78bfa', fontSize: 20 }}>{scene.text}</p>
        <p style={{ color: '#6b7280', fontSize: 16, marginTop: 16 }}>Abonnieren • Liken • Glocke aktivieren</p>
      </div>
    </AbsoluteFill>
  );
}
