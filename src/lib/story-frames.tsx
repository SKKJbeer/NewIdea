import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { formatCount, formatEur, formatPercent, formatPp } from '@/lib/format';
import { STORY_FORMATE, type StoryFormat } from '@/lib/story-formats';

export { STORY_FORMATE };
export type { StoryFormat };

// MARKT-GESCHICHTEN — die Website als Quelle für alles, was nach außen geht.
//
// AUFGABE: Reels, Stories, Karussells, Teilen-Vorschauen und Beitragsköpfe
// sollen erkennbar zu CardBeacon gehören — und dieselben Zahlen zeigen wie die
// Seite. Bisher entstand jedes Format für sich; ein Reel-Bild und eine
// OG-Vorschau hatten weder dieselbe Gestaltung noch dieselbe Datenquelle.
//
// ZWEI ENTSCHEIDUNGEN, die den Unterschied machen:
//
// 1. EIN LAYOUT, DREI FORMATE. Die Vorlagen kennen ihre Größe nicht; sie
//    beschreiben nur den Aufbau. Das Format kommt von außen. Sonst gibt es
//    dieselbe Geschichte dreimal, und beim vierten Format vergisst jemand eine.
//
// 2. KEINE FREIEN TEXTPARAMETER. Die Vorlagen nehmen ausschließlich
//    ausgewertete Marktdaten entgegen — keine Zeichenketten aus einer Adresse.
//    Eine öffentliche Bild-Route, die beliebigen Text im CardBeacon-Layout
//    setzt, wäre eine Fläche, auf der jeder eine Behauptung erzeugen kann, die
//    aussieht wie eine Messung von uns. Genau das verbietet die
//    Wahrheitspflicht dieses Projekts — und zwar unabhängig davon, ob jemand
//    es tatsächlich täte.
//
// SATORI-FALLEN (siehe CLAUDE.md, Stolperstellen 30/31):
//   · `transform` wird verworfen, wenn am selben Element ein `boxShadow` hängt
//   · jedes Element mit mehreren Kindern braucht ein ausdrückliches `display`
//   · Ergebnis IMMER ansehen — nicht unterstützte Kombinationen scheitern still


const BG = '#08080b';
const LINIE = '#1c1c24';
const HELL = '#e2e8f0';
const MUTED = '#64748b';
const UP = '#34d399';
const DOWN = '#fb7185';
const VIOLET = '#a78bfa';

/**
 * Vorschubbreiten der mitgelieferten Schrift (Liberation Sans Bold) in em —
 * aus der Datei gelesen (hmtx/cmap), nicht geschaetzt. Nur die Zeichen, die in
 * den grossen Kennzahlen vorkommen; alles andere zaehlt vorsichtig breit.
 */
const ZEICHENBREITE: Record<string, number> = {
  '0': 0.556, '1': 0.556, '2': 0.556, '3': 0.556, '4': 0.556,
  '5': 0.556, '6': 0.556, '7': 0.556, '8': 0.556, '9': 0.556,
  '+': 0.584, '-': 0.333, '\u2212': 0.584, ',': 0.278, '.': 0.278,
  '%': 0.889, ' ': 0.278, '\u00a0': 0.278, p: 0.611,
};

/**
 * Schriftgroesse der grossen Kennzahl, damit sie in die Flaeche passt.
 *
 * BEFUND auf Produktion: „+156,2 %" lief bei 260 px rechts aus dem Bild — das
 * Prozentzeichen war abgeschnitten. Bei 260 px ist die Zahl 1.106 px breit,
 * verfuegbar sind 904. Die Groesse wird deshalb aus der Textbreite berechnet,
 * nie groesser als die Grundgroesse, mit 4 % Reserve.
 */
export function heldGroesse(text: string, basis: number, verfuegbar: number): number {
  const em = [...text].reduce((n, c) => n + (ZEICHENBREITE[c] ?? 0.72), 0);
  if (em <= 0) return basis;
  return Math.min(basis, Math.floor((verfuegbar * 0.96) / em));
}

/** Nutzbare Breite einer Buehne (Formatbreite minus Innenabstand links und rechts). */
function nutzbreite(format: StoryFormat): number {
  return STORY_FORMATE[format].width - (format === 'og' ? 128 : 176);
}

function ton(wert: number | null): string {
  if (wert === null || !Number.isFinite(wert)) return MUTED;
  return wert > 0 ? UP : wert < 0 ? DOWN : HELL;
}

let schrift: Buffer | null = null;
async function ladeSchrift(): Promise<Buffer> {
  // Dieselbe mitgelieferte Schrift wie bei den Reels: Vercels serverlose
  // Umgebung hat KEINE Systemschriften (Stolperstelle 20).
  if (!schrift) schrift = await readFile(join(process.cwd(), 'src/assets/fonts/reel-font.ttf'));
  return schrift;
}

export async function rendereStory(
  element: React.ReactElement,
  format: StoryFormat,
): Promise<Buffer> {
  const font = await ladeSchrift();
  const { width, height } = STORY_FORMATE[format];
  const antwort = new ImageResponse(element, {
    width,
    height,
    fonts: [
      { name: 'CB', data: new Uint8Array(font).buffer as ArrayBuffer, style: 'normal', weight: 700 },
    ],
  });
  return Buffer.from(await antwort.arrayBuffer());
}

/** Grundfläche. Dieselbe Zurückhaltung wie die Seite: dunkel, Linien statt Flächen. */
function Buehne({ children, kompakt }: { children: React.ReactNode; kompakt: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: BG,
        padding: kompakt ? '56px 64px' : '110px 88px',
        fontFamily: 'CB',
        color: HELL,
      }}
    >
      {children}
    </div>
  );
}

/** Abschnittsmarke — dasselbe Element wie über jedem Abschnitt der Website. */
function Marke({ text, kompakt }: { text: string; kompakt: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        fontSize: kompakt ? 22 : 30,
        letterSpacing: 6,
        color: MUTED,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </div>
  );
}

/** Fußzeile mit der Marke. Sie steht ZULETZT — wer bis hierher liest, darf wissen, von wem es kam. */
function Fuss({ kompakt, datenstand }: { kompakt: boolean; datenstand: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginTop: kompakt ? 28 : 48,
        paddingTop: kompakt ? 24 : 40,
        borderTop: `2px solid ${LINIE}`,
      }}
    >
      <div style={{ display: 'flex', fontSize: kompakt ? 26 : 34, color: HELL }}>CardBeacon</div>
      <div style={{ display: 'flex', fontSize: kompakt ? 18 : 24, color: MUTED }}>{datenstand}</div>
    </div>
  );
}

export interface MoverDaten {
  name: string;
  set: string;
  trend: number;
  preis: number;
  /** Abstand zum Index in Prozentpunkten. `null` = nicht vergleichbar. */
  gegenMarkt: number | null;
  /**
   * Kartenbild als Data-URI. Optional: Schlaegt der Abruf fehl, entsteht das
   * Bild ohne Karte statt gar nicht — die Zahl bleibt die Aussage.
   */
  bild?: string | null;
}

/**
 * GROSSE BEWEGUNG — eine Karte, eine Zahl.
 *
 * Die Zahl ist der Held: Sie füllt die halbe Fläche. Der Name erklärt sie, nicht
 * umgekehrt.
 */
export function BigMover({
  karte,
  format,
  datenstand,
  titel = 'Stärkste Bewegung · 30 Tage',
}: {
  karte: MoverDaten;
  format: StoryFormat;
  datenstand: string;
  titel?: string;
}) {
  const kompakt = format === 'og';
  // Das Kartenbild nur dort, wo Platz ist. In der Teilen-Vorschau (1200×630)
  // haette es die Zahl verdraengt — und die Zahl ist die Aussage.
  const mitBild = !kompakt && Boolean(karte.bild);
  // Hochformat (Story, 1080×1920): Bild ueber dem Text und deutlich groesser —
  // nebeneinander blieb dort das untere Drittel leer.
  const hoch = format === 'reel';
  const bildBreite = hoch ? 600 : 330;
  const bildHoehe = Math.round((bildBreite * 88) / 63); // echtes Kartenformat 63:88
  return (
    <Buehne kompakt={kompakt}>
      <Marke text={titel} kompakt={kompakt} />
      <div
        style={{
          display: 'flex',
          fontSize: heldGroesse(formatPercent(karte.trend), kompakt ? 150 : 260, nutzbreite(format)),
          lineHeight: 1,
          marginTop: kompakt ? 24 : 56,
          color: ton(karte.trend),
        }}
      >
        {formatPercent(karte.trend)}
      </div>
      {mitBild ? (
        <div style={{ display: 'flex', flexDirection: hoch ? 'column' : 'row', alignItems: hoch ? 'flex-start' : 'center', marginTop: 52 }}>
          {/* Schatten und Rahmen auf demselben Element sind in Satori
              unkritisch — verworfen wird nur `transform` neben `boxShadow`
              (Stolperstelle 31), und gedreht wird hier nichts. */}
          <img
            src={karte.bild as string}
            width={bildBreite}
            height={bildHoehe}
            style={{ borderRadius: 18, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: hoch ? 0 : 48, marginTop: hoch ? 48 : 0, ...(hoch ? {} : { flex: 1, minWidth: 0 }) }}>
            <div style={{ display: 'flex', fontSize: hoch ? 80 : 62, lineHeight: 1.1 }}>{karte.name}</div>
            <div style={{ display: 'flex', fontSize: 34, color: MUTED, marginTop: 18 }}>{karte.set}</div>
            <div style={{ display: 'flex', fontSize: 44, marginTop: 34 }}>{formatEur(karte.preis)}</div>
            {karte.gegenMarkt !== null && (
              <div style={{ display: 'flex', fontSize: 30, color: MUTED, marginTop: 10 }}>
                {`${formatPp(karte.gegenMarkt)} zum Markt`}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', fontSize: kompakt ? 46 : 76, marginTop: kompakt ? 20 : 44 }}>
            {karte.name}
          </div>
          <div style={{ display: 'flex', fontSize: kompakt ? 24 : 38, color: MUTED, marginTop: 12 }}>
            {karte.set} · {formatEur(karte.preis)}
            {karte.gegenMarkt !== null ? ` · ${formatPp(karte.gegenMarkt)} zum Markt` : ''}
          </div>
        </>
      )}
      <div style={{ display: 'flex', flexGrow: 1 }} />
      <Fuss kompakt={kompakt} datenstand={datenstand} />
    </Buehne>
  );
}

export interface SetDaten {
  name: string;
  trend: number;
}

/** SET GEGEN SET — zwei Sets, ein Vergleich. */
export function SetBattle({ a, b, format, datenstand }: { a: SetDaten; b: SetDaten; format: StoryFormat; datenstand: string }) {
  const kompakt = format === 'og';
  const zeile = (s: SetDaten) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: kompakt ? 20 : 44 }}>
      <div style={{ display: 'flex', fontSize: kompakt ? 34 : 56, color: HELL }}>{s.name}</div>
      <div style={{ display: 'flex', fontSize: kompakt ? 76 : 130, lineHeight: 1.05, color: ton(s.trend) }}>
        {formatPercent(s.trend)}
      </div>
    </div>
  );
  return (
    <Buehne kompakt={kompakt}>
      <Marke text="Set-Markt · 30 Tage" kompakt={kompakt} />
      {zeile(a)}
      <div style={{ display: 'flex', fontSize: kompakt ? 22 : 34, color: MUTED, marginTop: kompakt ? 16 : 32 }}>
        gegen
      </div>
      {zeile(b)}
      <div style={{ display: 'flex', flexGrow: 1 }} />
      <Fuss kompakt={kompakt} datenstand={datenstand} />
    </Buehne>
  );
}

export interface MarktDaten {
  cbi: number;
  breite: number;
  temperatur: string;
  karten: number;
  sets: number;
}

/** MARKTSTAND — der Index, groß, mit seiner Datengrundlage daneben. */
export function MarketState({ markt, format, datenstand }: { markt: MarktDaten; format: StoryFormat; datenstand: string }) {
  const kompakt = format === 'og';
  return (
    <Buehne kompakt={kompakt}>
      <Marke text="CardBeacon Index · 30 Tage" kompakt={kompakt} />
      <div
        style={{
          display: 'flex',
          fontSize: heldGroesse(formatPercent(markt.cbi), kompakt ? 150 : 260, nutzbreite(format)),
          lineHeight: 1,
          marginTop: kompakt ? 24 : 56,
          color: ton(markt.cbi),
        }}
      >
        {formatPercent(markt.cbi)}
      </div>
      {/* DREI SPALTEN MIT FESTEM ANTEIL.
          Vorher standen sie mit festem Abstand nebeneinander — die dritte
          („204 Karten") lief dadurch aus dem Bild. Ein abgeschnittenes Wort in
          einem Beitrag, der geteilt wird, ist schlimmer als eine kleinere
          Schrift. Die Einheit steht jetzt in der Beschriftung, damit der Wert
          selbst kurz bleibt.
          Der Block sitzt unten am Rand (`marginTop: auto`), sonst klafft
          zwischen Kennzahl und Fußzeile eine leere Hälfte. */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          marginTop: 'auto',
          paddingTop: kompakt ? 24 : 48,
        }}
      >
        {[
          ['Marktbreite', `${Math.round(markt.breite)} %`],
          ['Temperatur', markt.temperatur],
          // formatCount, nicht die nackte Zahl: live stand hier „14985" ohne
          // Tausenderpunkt (Stolperstelle 26).
          [`Stichprobe · ${formatCount(markt.sets)} Sets`, formatCount(markt.karten)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', fontSize: kompakt ? 16 : 22, color: MUTED, letterSpacing: 2 }}>
              {k.toUpperCase()}
            </div>
            <div style={{ display: 'flex', fontSize: kompakt ? 34 : 54, marginTop: 8 }}>{v}</div>
          </div>
        ))}
      </div>
      <Fuss kompakt={kompakt} datenstand={datenstand} />
    </Buehne>
  );
}

/**
 * KARTE GEGEN MARKT — das Alleinstellungsmerkmal als Bild.
 *
 * Drei Zeilen auf derselben Nulllinie: Karte, Set, Index. Genau die Darstellung
 * der Kartenseite, nur größer.
 */
export function CardVsMarket({
  karte,
  cbi,
  format,
  datenstand,
}: {
  karte: MoverDaten;
  cbi: number;
  format: StoryFormat;
  datenstand: string;
}) {
  const kompakt = format === 'og';
  const zeilen: Array<[string, number]> = [
    [karte.name, karte.trend],
    ['CardBeacon Index', cbi],
  ];
  return (
    <Buehne kompakt={kompakt}>
      <Marke text="Karte gegen Markt · 30 Tage" kompakt={kompakt} />
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: kompakt ? 28 : 64 }}>
        {zeilen.map(([label, wert]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              paddingBottom: kompakt ? 18 : 30,
              marginBottom: kompakt ? 18 : 30,
              borderBottom: `2px solid ${LINIE}`,
            }}
          >
            <div style={{ display: 'flex', fontSize: kompakt ? 34 : 56 }}>{label}</div>
            <div style={{ display: 'flex', fontSize: kompakt ? 52 : 88, color: ton(wert) }}>
              {formatPercent(wert)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: kompakt ? 8 : 24 }}>
        <div style={{ display: 'flex', fontSize: kompakt ? 18 : 26, color: MUTED, letterSpacing: 3 }}>
          ABSTAND ZUM MARKT
        </div>
        <div style={{ display: 'flex', fontSize: kompakt ? 72 : 130, color: VIOLET, lineHeight: 1.05 }}>
          {formatPp(karte.trend - cbi)}
        </div>
      </div>
      <div style={{ display: 'flex', flexGrow: 1 }} />
      <Fuss kompakt={kompakt} datenstand={datenstand} />
    </Buehne>
  );
}
