import { ImageResponse } from 'next/og';

// Standard-OG-Bild (Startseite + Fallback für Segmente ohne eigenes Bild).
// Wird von Next automatisch in og:image + twitter:image verdrahtet.
export const alt = 'PokéMarket Intelligence — Pokémon Kartenmarkt in Echtzeit';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '90px',
          background: 'linear-gradient(135deg, #12122a 0%, #0a0a0f 55%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 44 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 76,
              height: 76,
              borderRadius: 22,
              background: '#7c3aed',
              fontSize: 44,
              fontWeight: 800,
              marginRight: 24,
            }}
          >
            P
          </div>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800 }}>
            <span>PokéMarket&nbsp;</span>
            <span style={{ color: '#a78bfa' }}>Intelligence</span>
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          Pokémon Kartenmarkt in Echtzeit
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#94a3b8', marginTop: 28, maxWidth: 900 }}>
          Echte Cardmarket-Preise · Trends · Marktanalysen · kostenlos &amp; auf Deutsch
        </div>
        <div style={{ display: 'flex', marginTop: 48 }}>
          <div style={{ display: 'flex', height: 8, width: 220, borderRadius: 8, background: 'linear-gradient(to right, #7c3aed, #34d399)' }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
