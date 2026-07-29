// Fertige Reel-Bilder (1080x1920) — Text wird hier gerendert, NICHT von FFmpeg.
//
// WARUM: Die mitgelieferte FFmpeg-Binary (ffmpeg-static) enthält den Filter
// `drawtext` NICHT — 486 Filter, keiner davon drawtext. Der ursprüngliche
// Reel-Generator legte JEDE Textzeile darüber und konnte deshalb nie ein Reel
// erzeugen. Stattdessen rendert `next/og` (Satori) die vollständigen Bilder —
// dieselbe Technik, die auf der Seite schon die Social-Vorschaubilder erzeugt.
//
// GESTALTUNG: Es gilt der Look der Plattform (CLAUDE.md → UI-Design-Regeln):
// tiefes Anthrazit als Grund, Violett/Fuchsia als Akzent, Emerald für steigende
// und Rose für fallende Werte, tabellarische Ziffern. Dazu ein feines Raster im
// Hintergrund — die Anmutung eines Handels-Terminals, nicht die einer Grußkarte.
//
// Satori kann kein `filter: blur()`. Leuchteffekte entstehen deshalb über
// radiale Verläufe, Tiefe über Schlagschatten und Ringe.

import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { formatEur, formatPercent } from '@/lib/format';

export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;

const BG = '#08080d';
const VIOLET = '#a78bfa';
const FUCHSIA = '#e879f9';
const UP = '#34d399';
const DOWN = '#fb7185';
const MUTED = '#64748b';

let fontRegular: Buffer | null = null;
async function reelFont(): Promise<Buffer> {
  if (!fontRegular) {
    fontRegular = await readFile(join(process.cwd(), 'src/assets/fonts/reel-font.ttf'));
  }
  return fontRegular;
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

/** Feines Raster — gibt dem Grund die Anmutung eines Terminals. */
const GRID =
  'linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px),' +
  'linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px)';

/**
 * Grundfläche mit Raster und zwei farbigen Lichtquellen.
 * `accent` steuert die Stimmung des Segments (Violett im Intro, Trendfarbe bei
 * Karten) — dadurch fühlt sich jeder Abschnitt eigenständig an.
 */
function stage(accent: string, secondary = VIOLET, translucent: false | 'card' | 'text' = false): React.CSSProperties {
  // Textbilder brauchen mehr Deckung als Kartenbilder: Dort steht die Schrift
  // über der ganzen Fläche, nicht nur an Ober- und Unterkante.
  const alpha = translucent === 'text' ? 0.7 : 0.45;
  return {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // `translucent`: Der Grund bleibt teildurchlässig, damit das unscharf
    // gerechnete Kartenbild dahinter durchschimmert (FFmpeg legt es unter).
    // Ohne Durchsicht wäre die Karten-Atmosphäre nicht sichtbar.
    backgroundColor: translucent ? `rgba(8,8,13,${alpha})` : BG,
    backgroundImage:
      `radial-gradient(900px 900px at 50% 8%, ${accent}2e 0%, transparent 62%),` +
      `radial-gradient(760px 760px at 12% 92%, ${secondary}24 0%, transparent 60%),` +
      GRID,
    backgroundSize: 'auto, auto, 54px 54px, 54px 54px',
    fontFamily: 'Reel',
    color: '#ffffff',
  };
}

/**
 * Angedeutetes Sammel-Motiv: ein sehr großer, sehr blasser Umriss, der über den
 * Bildrand hinausläuft — Kreis, Mittelband, Innenring.
 *
 * Bewusst eine eigene, rein geometrische Form: keine fremden Grafiken, keine
 * Marken-Assets. Bei 4–6 % Deckkraft liest es sich als Atmosphäre, nicht als
 * Bildmotiv, und bleibt damit auch bei kleinen Vorschaubildern ruhig.
 */
function Motif({
  size,
  top,
  left,
  color,
  opacity,
}: {
  size: number;
  top: number;
  left: number;
  color: string;
  opacity: number;
}) {
  return (
    <div style={{ display: 'flex', position: 'absolute', top, left, opacity }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="2.4" />
        <circle cx="50" cy="50" r="15" fill="none" stroke={color} strokeWidth="2.4" />
        <circle cx="50" cy="50" r="24" fill="none" stroke={color} strokeWidth="1.2" />
        <line x1="4.5" y1="50" x2="35" y2="50" stroke={color} strokeWidth="2.4" />
        <line x1="65" y1="50" x2="95.5" y2="50" stroke={color} strokeWidth="2.4" />
      </svg>
    </div>
  );
}

/** Zwei versetzte Motive — oben angeschnitten, unten gegenläufig. */
function Backdrop({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <Motif size={980} top={-330} left={-300} color={color} opacity={0.075} />
      <Motif size={620} top={1420} left={720} color={color} opacity={0.06} />
    </div>
  );
}

/**
 * Verspielte Streuelemente: schwebende Kreise und Ringe in der Akzentfarbe.
 * Bewusst dezent — sie sollen Tiefe geben, nicht vom Kartenbild ablenken.
 */
function Confetti({ color }: { color: string }) {
  const dots = [
    { top: 210, left: 78, size: 22, ring: false, o: '55' },
    { top: 330, left: 962, size: 34, ring: true, o: '44' },
    { top: 620, left: 44, size: 14, ring: false, o: '66' },
    { top: 980, left: 1000, size: 18, ring: false, o: '40' },
    { top: 1310, left: 62, size: 46, ring: true, o: '33' },
    { top: 1520, left: 950, size: 20, ring: false, o: '55' },
    { top: 1690, left: 120, size: 12, ring: false, o: '66' },
  ];
  return (
    <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            position: 'absolute',
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            borderRadius: 999,
            ...(d.ring
              ? { border: `3px solid ${color}${d.o}` }
              : { backgroundColor: `${color}${d.o}` }),
          }}
        />
      ))}
    </div>
  );
}

/** Kleines Etikett mit Rahmen — wiederkehrendes Element der Seite. */
function Pill({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        border: `2px solid ${color}55`,
        backgroundColor: `${color}18`,
        color,
        borderRadius: 999,
        padding: '14px 30px',
        fontSize: 30,
        letterSpacing: 3,
      }}
    >
      {text}
    </div>
  );
}

/** Fortschritt am unteren Rand: welches Segment von wie vielen. */
function Progress({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            width: i + 1 === current ? 64 : 26,
            height: 8,
            borderRadius: 999,
            // Inaktiv bewusst halbtransparent weiß statt Anthrazit: Auf dem
            // farbigen, unscharfen Kartenhintergrund verschwindet #2a2a3a.
            backgroundColor: i + 1 === current ? color : 'rgba(226,232,240,0.30)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Haken — das ERSTE Bild des Reels.
 *
 * Bewusst KEIN Marken-Intro: Die ersten Sekunden entscheiden, ob jemand bleibt.
 * Die Marke steht am Ende (siehe reel-concepts.ts → Dramaturgie).
 */
export function hookFrame(
  headline: string,
  sub: string | undefined,
  accent: 'violet' | 'up' | 'down' = 'violet',
  translucent = false,
): Promise<Buffer> {
  const color = accent === 'up' ? UP : accent === 'down' ? DOWN : VIOLET;
  return toPng(
    <div
      style={{
        ...stage(color, FUCHSIA, translucent && 'text'),
        justifyContent: 'center',
        padding: '0 76px',
      }}
    >
      <Backdrop color={color} />
      <Confetti color={FUCHSIA} />
      <div
        style={{
          display: 'flex',
          fontSize: 82,
          lineHeight: 1.16,
          textAlign: 'center',
          letterSpacing: -2,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          display: 'flex',
          width: 240,
          height: 8,
          borderRadius: 999,
          backgroundImage: `linear-gradient(90deg, ${color}, ${FUCHSIA})`,
          margin: '52px 0',
        }}
      />
      {sub ? (
        <div style={{ display: 'flex', fontSize: 42, color: '#94a3b8', textAlign: 'center' }}>{sub}</div>
      ) : null}
    </div>,
  );
}

/** Einordnung: was die Zahlen bedeuten — der Grund, bis zum Ende zu bleiben. */
export function insightFrame(headline: string, body: string, translucent = false): Promise<Buffer> {
  return toPng(
    <div
      style={{
        ...stage(VIOLET, FUCHSIA, translucent && 'text'),
        justifyContent: 'center',
        padding: '0 84px',
      }}
    >
      <Backdrop color={VIOLET} />
      <Confetti color={FUCHSIA} />
      <Pill text="EINORDNUNG" color={VIOLET} />
      <div style={{ display: 'flex', fontSize: 68, marginTop: 54, textAlign: 'center', lineHeight: 1.2 }}>
        {headline}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 40,
          color: '#94a3b8',
          marginTop: 40,
          textAlign: 'center',
          lineHeight: 1.45,
        }}
      >
        {body}
      </div>
    </div>,
  );
}

/**
 * Karten-Segment: Kartenbild als Held, Trend als große Kennzahl.
 * Die Stimmungsfarbe folgt der Trendrichtung — steigende Karten leuchten grün,
 * fallende rot. Dadurch erkennt man die Richtung, bevor man die Zahl liest.
 */
export function cardFrame(
  card: { name: string; price: number; trendPercent: number },
  rank: number,
  total: number,
  imageDataUri: string,
  {
    label = 'TOP-MOVER DER WOCHE',
    metric = 'trend',
    hideValue = false,
    translucent = false,
  }: {
    label?: string;
    /** Welche Kennzahl im Vordergrund steht. */
    metric?: 'trend' | 'price' | 'change30';
    /** Quiz-Modus: Karte zeigen, Wert verdecken. */
    hideValue?: boolean;
    /**
     * FFmpeg legt das Kartenbild unscharf und abgedunkelt unter dieses Bild.
     * Dann muss der Grund teildurchlässig bleiben, sonst sieht man nichts davon.
     */
    translucent?: boolean;
  } = {},
): Promise<Buffer> {
  const up = card.trendPercent >= 0;
  // Beim Preis-Format ist die Richtung nicht die Aussage — dann Violett.
  const accent = metric === 'price' ? VIOLET : up ? UP : DOWN;

  return toPng(
    <div
      style={{
        ...stage(accent, VIOLET, translucent && 'card'),
        justifyContent: 'space-between',
        paddingTop: 78,
        paddingBottom: 74,
      }}
    >
      {/*
        Abdunklung an Ober- und Unterkante. Ohne sie hinge die Lesbarkeit von
        Schrift und Kennzahl davon ab, wie hell die jeweilige Karte ist — eine
        gelbe Karte würde die weiße Schrift verschlucken.
      */}
      {translucent ? (
        <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 540,
              backgroundImage: 'linear-gradient(to bottom, rgba(8,8,13,0.94), rgba(8,8,13,0))',
            }}
          />
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 660,
              backgroundImage: 'linear-gradient(to top, rgba(8,8,13,0.94), rgba(8,8,13,0))',
            }}
          />
        </div>
      ) : null}

      <Confetti color={accent} />

      {/* Kopf: Platzierung + Rubrik */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Pill text={label} color={VIOLET} />
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 26 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 150,
              lineHeight: 1,
              letterSpacing: -6,
              // Verlauf in der Trendfarbe statt flachem Weiß — die Platzierung
              // ist das erste, was ins Auge fällt.
              backgroundImage: `linear-gradient(160deg, #ffffff 30%, ${accent})`,
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {String(rank).padStart(2, '0')}
          </div>
          <div style={{ display: 'flex', fontSize: 44, color: MUTED, marginTop: 16, marginLeft: 12 }}>
            {`/ ${String(total).padStart(2, '0')}`}
          </div>
        </div>
      </div>

      {/*
        Karte mit farbigem Ring und Schlagschatten. Die leichte Neigung wechselt
        je Platzierung die Richtung — das nimmt dem Raster die Strenge und lässt
        die Karte wie hingelegt wirken statt wie eingescannt.

        Die Drehung MUSS auf einem eigenen Element ohne `boxShadow` sitzen:
        Satori verwirft `transform`, sobald am selben Element ein Schlagschatten
        hängt (getestet — die Karte blieb waagerecht).
      */}
      <div style={{ display: 'flex', transform: `rotate(${rank % 2 === 0 ? 3 : -3}deg)` }}>
        <div
          style={{
            display: 'flex',
            padding: 12,
            borderRadius: 34,
            border: `3px solid ${accent}88`,
            backgroundColor: 'rgba(8,8,13,0.55)',
            boxShadow: `0 40px 130px ${accent}55`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageDataUri} width={648} height={905} alt="" style={{ borderRadius: 24 }} />
        </div>
      </div>

      {/* Fuß: Name, Trend als Kennzahl, Preis */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', fontSize: 58, textAlign: 'center', padding: '0 70px', lineHeight: 1.15 }}>
          {card.name}
        </div>

        {hideValue ? (
          // Quiz: Wert verdeckt — der Zuschauer soll schätzen.
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 26,
              border: `3px dashed ${VIOLET}77`,
              borderRadius: 24,
              padding: '26px 76px',
            }}
          >
            <div style={{ display: 'flex', fontSize: 92, color: VIOLET, lineHeight: 1 }}>? ? ?</div>
          </div>
        ) : metric === 'price' ? (
          <div style={{ display: 'flex', fontSize: 96, color: '#ffffff', letterSpacing: -2, lineHeight: 1, marginTop: 26 }}>
            {formatEur(card.price)}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 26 }}>
            {/*
              Richtungspfeil als echtes SVG. Der CSS-Trick mit transparenten
              Rahmen erzeugt in Satori KEIN Dreieck, sondern ein Rechteck.
            */}
            <svg width="54" height="46" viewBox="0 0 54 46">
              <polygon points={up ? '27,0 54,46 0,46' : '0,0 54,0 27,46'} fill={accent} />
            </svg>
            <div style={{ display: 'flex', fontSize: 96, color: accent, letterSpacing: -2, lineHeight: 1 }}>
              {formatPercent(card.trendPercent)}
            </div>
          </div>
        )}

        {!hideValue && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 22,
              border: '2px solid #2a2a3a',
              backgroundColor: '#13131ecc',
              borderRadius: 18,
              padding: '14px 34px',
            }}
          >
            <div style={{ display: 'flex', fontSize: 26, color: MUTED, letterSpacing: 2 }}>
              {metric === 'price' ? 'MARKTWERT' : metric === 'change30' ? 'GEGEN Ø 30 TAGE' : 'MARKTWERT'}
            </div>
            <div style={{ display: 'flex', fontSize: 46, color: '#e2e8f0' }}>
              {metric === 'price' ? formatPercent(card.trendPercent) : formatEur(card.price)}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', marginTop: 34 }}>
          <Progress current={rank} total={total} color={accent} />
        </div>
      </div>
    </div>,
  );
}

/** Outro: Hinweis auf die Website. */
export function outroFrame(line = 'täglich aktuell', translucent = false): Promise<Buffer> {
  return toPng(
    <div style={{ ...stage(FUCHSIA, VIOLET, translucent && 'text'), justifyContent: 'center' }}>
      <Backdrop color={FUCHSIA} />
      <Confetti color={VIOLET} />
      <Pill text="KOSTENLOS & AUF DEUTSCH" color={FUCHSIA} />

      {/*
        Die Zeile kommt vollständig aus dem Format (reel-concepts.ts). Früher
        stand hier zusätzlich ein fester Vorspann „Alle Preise" — zusammen mit
        „Preise täglich aktuell" ergab das eine doppelte, sinnlose Aussage.
      */}
      <div
        style={{
          display: 'flex',
          fontSize: 76,
          marginTop: 74,
          padding: '0 80px',
          lineHeight: 1.2,
          backgroundImage: `linear-gradient(90deg, ${VIOLET}, ${FUCHSIA})`,
          backgroundClip: 'text',
          color: 'transparent',
          textAlign: 'center',
        }}
      >
        {line}
      </div>

      <div
        style={{
          display: 'flex',
          width: 260,
          height: 8,
          borderRadius: 999,
          backgroundImage: `linear-gradient(90deg, ${VIOLET}, ${FUCHSIA})`,
          margin: '58px 0',
        }}
      />

      <div style={{ display: 'flex', fontSize: 44, color: '#94a3b8' }}>Marktdaten, Trends und Guides</div>
      <div style={{ display: 'flex', fontSize: 56, color: VIOLET, marginTop: 46, letterSpacing: 1 }}>
        Link in der Bio
      </div>
      <div style={{ display: 'flex', fontSize: 28, color: MUTED, marginTop: 70, letterSpacing: 3 }}>
        POKEMARKET-INTELLIGENCE
      </div>
    </div>,
  );
}
