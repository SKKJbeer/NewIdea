'use client';

import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { STORY_FORMATE, type StoryFormat } from '@/lib/story-formats';

// MARKTBILDER IM STUDIO
//
// WARUM ES DIESES FELD GIBT: Die Bilder entstehen unter einer Adresse. Das
// genügt, um sie zu erzeugen, und nicht, um mit ihnen zu arbeiten — dafür
// müsste man Vorlagennamen und Formatkürzel auswendig kennen und die Adresse
// von Hand zusammensetzen. Ein Werkzeug, das man nur mit Vorwissen bedienen
// kann, wird nicht benutzt.
//
// WAS ES BEWUSST NICHT TUT: veröffentlichen. Der Schritt nach Instagram bleibt
// von Hand — nicht aus technischen Gründen, sondern weil ein Bild, das
// automatisch hinausgeht, niemand mehr ansieht. Bei Inhalten, die Marktzahlen
// behaupten, ist der Blick davor der eigentliche Schutz.

const VORLAGEN: Array<{ id: string; titel: string; erklaerung: string }> = [
  {
    id: 'market-state',
    titel: 'Marktstand',
    erklaerung: 'Der Index groß, darunter Marktbreite, Temperatur und Stichprobe.',
  },
  {
    id: 'big-mover',
    titel: 'Stärkste Bewegung',
    erklaerung: 'Die Karte mit der größten gemessenen Aufwärtsbewegung der Stichprobe.',
  },
  {
    id: 'card-vs-market',
    titel: 'Karte gegen Markt',
    erklaerung: 'Karte, Index und der Abstand dazwischen in Prozentpunkten.',
  },
  {
    id: 'set-battle',
    titel: 'Set gegen Set',
    erklaerung: 'Stärkstes gegen schwächstes Set — beide müssen gemessen sein.',
  },
];

const FORMAT_TEXT: Record<StoryFormat, string> = {
  post: 'Beitrag · 1080 × 1350',
  reel: 'Reel / Story · 1080 × 1920',
  og: 'Teilen-Vorschau · 1200 × 630',
};

export function StoryPanel() {
  const [format, setFormat] = useState<StoryFormat>('post');
  // WELCHE VORSCHAU GELADEN IST.
  //
  // BEFUND beim ersten Ausprobieren: Alle vier Vorschauen luden gleichzeitig —
  // vier PNGs mit je 1,4 Megapixeln, jedes aus einem eigenen Bildaufbau am
  // Server. Der Browser im Test ist dabei abgestürzt, und auf einem Telefon
  // wäre es dasselbe Bild: minutenlanges Warten für vier Bilder, von denen man
  // eines braucht.
  //
  // Jetzt lädt jede Vorschau erst auf Anforderung. Das Herunterladen geht
  // weiterhin ohne Vorschau — wer weiß, was er will, soll nicht erst
  // zusehen müssen.
  const [geladen, setGeladen] = useState<Set<string>>(new Set());
  // Zählt bei jedem Neuladen hoch und hängt sich an die Adresse. Ohne das
  // liefert der Browser dasselbe Bild aus seinem Zwischenspeicher, und man
  // glaubt, die Erneuerung habe nicht funktioniert.
  const [stand, setStand] = useState(0);

  const adresse = (id: string) => `/api/story/${id}?format=${format}&v=${stand}`;

  return (
    <section className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h2 className="text-sm font-bold text-slate-200">Marktbilder</h2>
        <p className="text-[11px] text-slate-500">
          Aus den aktuellen Marktdaten — dieselben Zahlen wie auf der Startseite.
        </p>
        <button
          type="button"
          onClick={() => {
            setStand((s) => s + 1);
            setGeladen(new Set());
          }}
          className="ml-auto inline-flex min-h-[32px] items-center gap-1.5 text-[11px] text-slate-500 transition-colors hover:text-violet-400"
        >
          <RefreshCw size={11} /> Neu erzeugen
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#1c1c24] pb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Format
        </span>
        {(Object.keys(STORY_FORMATE) as StoryFormat[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            className={`min-h-[32px] text-[12px] transition-colors ${
              format === f
                ? 'text-slate-100 underline underline-offset-4'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {FORMAT_TEXT[f]}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {VORLAGEN.map((v) => (
          <div key={v.id} className="flex flex-col">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] text-slate-200">{v.titel}</p>
              <a
                href={adresse(v.id)}
                download={`cardbeacon-${v.id}-${format}.png`}
                className="inline-flex min-h-[32px] items-center gap-1.5 text-[11px] text-slate-500 transition-colors hover:text-violet-400"
              >
                <Download size={11} /> Laden
              </a>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{v.erklaerung}</p>

            {/* Der Rahmen hat das Seitenverhältnis des gewählten Formats —
                sonst springt das Feld, sobald das Bild eintrifft. */}
            <div
              className="mt-3 w-full overflow-hidden rounded-lg border border-[#2a2a3a] bg-[#0a0a0f]"
              style={{
                aspectRatio: `${STORY_FORMATE[format].width} / ${STORY_FORMATE[format].height}`,
              }}
            >
              {geladen.has(v.id) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={`${v.id}-${format}-${stand}`}
                  src={adresse(v.id)}
                  alt={`${v.titel} als ${FORMAT_TEXT[format]}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setGeladen((g) => new Set(g).add(v.id))}
                  className="flex h-full w-full items-center justify-center text-[12px] text-slate-500 transition-colors hover:text-violet-400"
                >
                  Vorschau laden
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-slate-600">
        Die Bilder nehmen keinen Text entgegen — Zahlen und Namen stammen
        ausschließlich aus der Marktstichprobe. Reicht die Datenlage für eine
        Vorlage nicht, bleibt ihr Feld leer, statt einen Wert zu zeigen, den es
        nicht gibt.
      </p>
    </section>
  );
}
