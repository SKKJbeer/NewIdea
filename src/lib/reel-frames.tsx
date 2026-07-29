// Fertige Reel-Bilder (1080x1920) — Text wird hier gerendert, NICHT von FFmpeg.
//
// WARUM: Die mitgelieferte FFmpeg-Binary (ffmpeg-static) enthält den Filter
// `drawtext` NICHT — 486 Filter, keiner davon drawtext. Der ursprüngliche
// Reel-Generator legte JEDE Textzeile (Intro, Kartenname, Preis, Trend, Outro)
// über drawtext und konnte deshalb nie ein Reel erzeugen, weder lokal noch auf
// dem Server. Auch der Schriftart-Fix lief ins Leere, weil der Filter fehlt.
//
// Stattdessen erzeugt `next/og` (Satori) die vollständigen Bilder — dieselbe
// Technik, die auf der Seite schon die Social-Vorschaubilder rendert. FFmpeg
// muss dann nur noch Bild → Video und die Segmente aneinanderhängen.

import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { formatEur, formatPercent } from '@/lib/format';

export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;

const BG = '#0a0a0f';
const VIOLET = '#a78bfa';
const UP = '#34d399';
const DOWN = '#fb7185';

let fontCache: Buffer | null = null;
async function reelFont(): Promise<Buffer> {
  if (!fontCache) {
    fontCache = await readFile(join(process.cwd(), 'src/assets/fonts/reel-font.ttf'));
  }
  return fontCache;
}

async function toPng(element: React.ReactElement): Promise<Buffer> {
  const font = await reelFont();
  const response = new ImageResponse(element, {
    width: REEL_WIDTH,
    height: REEL_HEIGHT,
    fonts: [{ name: 'Reel', data: new Uint8Array(font).buffer as ArrayBuffer, style: 'normal', weight: 700 }],
  });
  return Buffer.from(await response.arrayBuffer());
}

const page: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: BG,
  fontFamily: 'Reel',
  color: '#ffffff',
};

/** Intro: Markenbild mit Titel und Datum. */
export function introFrame(title: string, dateLabel: string): Promise<Buffer> {
  return toPng(
    <div style={page}>
      <div style={{ display: 'flex', fontSize: 92, letterSpacing: -2 }}>POKÉMARKET</div>
      <div style={{ display: 'flex', fontSize: 92, letterSpacing: -2, color: VIOLET, marginTop: -12 }}>
        INTELLIGENCE
      </div>
      <div style={{ display: 'flex', width: 220, height: 6, backgroundColor: VIOLET, margin: '56px 0' }} />
      <div style={{ display: 'flex', fontSize: 56, color: '#e2e8f0', textAlign: 'center', padding: '0 80px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', fontSize: 38, color: '#64748b', marginTop: 28 }}>{dateLabel}</div>
    </div>,
  );
}

/** Karten-Segment: Kartenbild mit Name, Preis und Trend. */
export function cardFrame(
  card: { name: string; price: number; trendPercent: number },
  rank: number,
  imageDataUri: string,
): Promise<Buffer> {
  const up = card.trendPercent >= 0;
  return toPng(
    <div style={{ ...page, justifyContent: 'space-between', paddingTop: 110, paddingBottom: 90 }}>
      <div style={{ display: 'flex', fontSize: 40, color: VIOLET, letterSpacing: 2 }}>
        {`#${rank}  TOP-MOVER DER WOCHE`}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageDataUri} width={720} height={1005} alt="" style={{ borderRadius: 28 }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontSize: 58, textAlign: 'center', padding: '0 60px' }}>{card.name}</div>
        <div style={{ display: 'flex', fontSize: 52, color: '#e2e8f0', marginTop: 18 }}>
          {formatEur(card.price)}
        </div>
        <div style={{ display: 'flex', fontSize: 52, color: up ? UP : DOWN, marginTop: 12 }}>
          {formatPercent(card.trendPercent)}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#475569', marginTop: 34 }}>
          pokemarket-intelligence
        </div>
      </div>
    </div>,
  );
}

/** Outro: Hinweis auf die Website. */
export function outroFrame(): Promise<Buffer> {
  return toPng(
    <div style={page}>
      <div style={{ display: 'flex', fontSize: 60 }}>Alle Preise täglich aktuell</div>
      <div style={{ display: 'flex', fontSize: 46, color: '#94a3b8', marginTop: 28 }}>
        Kostenlos &amp; auf Deutsch
      </div>
      <div style={{ display: 'flex', width: 220, height: 6, backgroundColor: VIOLET, margin: '56px 0' }} />
      <div style={{ display: 'flex', fontSize: 56, color: VIOLET }}>Link in der Bio</div>
    </div>,
  );
}
