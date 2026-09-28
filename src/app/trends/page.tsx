import type { Metadata } from 'next';
import Link from 'next/link';
import { Flame, Sparkles, Globe, CalendarClock, TrendingUp } from 'lucide-react';
import { AmbientBackdrop } from '@/components/AmbientBackdrop';
import { BoosterPackImage } from '@/components/BoosterPackImage';
import { SetMarket } from '@/components/MarketModules';
import { VersiegeltListe, KartenReihe, MehrdeutigListe, JapanBlock, tagDe, tageSeit } from '@/components/Themen';
import { leseNeuheiten, neuheitenAktuell, type NeuSet } from '@/lib/neuheiten';
import { setAusIndex, type IndexTreffer } from '@/lib/card-index';
import { getHomepageCards } from '@/lib/homepage-data';
import { getMarketBasis } from '@/lib/market-basis';
import { rankSets, computePmi, validateMarketData } from '@/lib/market-metrics';
import { SECTION_LABEL } from '@/lib/ui';
import { siteUrlOrLocal } from '@/lib/site';
import { LEGAL_NO_ADVICE } from '@/lib/brand';

// TRENDS & NEUHEITEN — was gerade relevant ist, aus Daten statt aus Behauptungen.
//
// Nutzer-Auftrag 28.09.2026: „bei den berichten und trends ist mir das zu
// steril … hypes, die wirklich relevant sind … auch upcoming". Quelle jedes
// Abschnitts ist eine Datei mit Stand (neuheiten.ts) bzw. der frische
// Kartenindex. Gibt eine Quelle zu einem Abschnitt nichts her, fehlt er —
// kein Platzhalter, keine Vermutung.

export const revalidate = 3600;

const SITE_URL = siteUrlOrLocal();

export const metadata: Metadata = {
  title: 'Trends & Neuheiten — Pokémon-Karten: Neuerscheinungen, 30 Jahre, Japan zuerst',
  description:
    'Neue Pokémon-TCG-Sets mit Cardmarket-Preisen ab dem ersten Tag: 30th Celebration, versiegelte Produkte, die teuersten Karten, japanische Sets vor der englischen Ausgabe und die Sets mit der stärksten Bewegung.',
  alternates: { canonical: `${SITE_URL}/trends` },
};

const istJubilaeum = (s: NeuSet) => /30th/i.test(s.name);

async function topKarten(setCodes: string[], max: number): Promise<IndexTreffer[]> {
  const listen = await Promise.all(setCodes.map((c) => setAusIndex(c).catch(() => [] as IndexTreffer[])));
  const jetzt = Date.now();
  return listen
    .flat()
    // Nur frische Preise (Quellstand ≤ 3 Tage), wie überall in Listen.
    .filter((k) => k.indexStand && jetzt - Date.parse(k.indexStand) <= 3 * 86_400_000)
    .sort((a, b) => (b.prices.market ?? 0) - (a.prices.market ?? 0))
    .slice(0, max);
}

function Abschnitt({ icon: Icon, label, titel, children, meta }: { icon: typeof Flame; label: string; titel: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#1c1c24] pt-8">
      <p className={`${SECTION_LABEL} flex items-center gap-1.5`}>
        <Icon size={12} className="text-violet-400" aria-hidden /> {label}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-black text-white">{titel}</h2>
        {meta && <span className="text-[11px] text-slate-500">{meta}</span>}
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export default async function TrendsPage() {
  const neuheiten = await leseNeuheiten();
  const aktuell = neuheitenAktuell(neuheiten);
  const sets = aktuell ? neuheiten!.sets : [];
  const jubilaeum = sets.filter(istJubilaeum);
  const weitere = sets.filter((s) => !istJubilaeum(s));

  const [jubilaeumKarten, weitereKarten, setBewegung] = await Promise.all([
    topKarten(jubilaeum.map((s) => s.setCode), 8),
    Promise.all(weitere.map((s) => topKarten([s.setCode], 4))),
    (async () => {
      try {
        const [cards, basis] = await Promise.all([getHomepageCards(250), getMarketBasis()]);
        const cbi = computePmi(validateMarketData(basis.karten).clean);
        return { sets: rankSets(validateMarketData(cards).clean, 10), cbi: cbi.sufficient ? cbi.value : null };
      } catch {
        return null;
      }
    })(),
  ]);

  const jubVersiegelt = jubilaeum.flatMap((s) => s.versiegelt).sort((a, b) => b.preis.trend - a.preis.trend);
  const jubMehrdeutig = jubilaeum.flatMap((s) => s.mehrdeutig).slice(0, 10);

  return (
    <div className="min-h-screen bg-[#070810] text-slate-200">
      <header className="relative border-b border-[#1c1c24]">
        <AmbientBackdrop mode="set" />
        <div className="relative max-w-4xl mx-auto px-4 pt-10 pb-12 sm:py-14">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
            <Flame size={11} /> Trends &amp; Neuheiten
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Was den Markt <span className="text-violet-400">gerade bewegt</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-400">
            Neue Sets ab dem ersten Handelstag, versiegelte Produkte, japanische Sets vor der englischen Ausgabe und die
            Sets mit der stärksten 30-Tage-Bewegung. Alle Preise stammen aus dem Cardmarket-Preisverzeichnis
            {aktuell ? `, Stand ${tagDe(neuheiten!.stand)}` : ''}.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16 space-y-10">
        {!aktuell && (
          <p className="mt-8 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-[12px] text-amber-400/80">
            Die Neuheiten-Daten sind gerade nicht aktuell. Angezeigt wird nur, was aus dem Kartenindex belegt ist.
          </p>
        )}

        {jubilaeum.length > 0 && (
          <Abschnitt
            icon={Sparkles}
            label="Im Fokus"
            titel="30 Jahre Pokémon TCG"
            meta={`${jubilaeum.map((s) => s.name).join(' · ')} · seit ${tageSeit(jubilaeum[0].datum)} Tagen im Handel`}
          >
            <div className="flex flex-wrap items-center gap-4">
              {jubilaeum.map((s) => (
                <Link key={s.setCode} href={`/sets/${s.setCode}`} className="flex items-center gap-3 rounded-xl border border-[#2a2a3a] bg-[#13131e] px-3 py-2 hover:border-violet-500/30">
                  <BoosterPackImage setCode={s.setCode} setName={s.name} className="h-10 w-auto object-contain" />
                  <span className="text-[12px]">
                    <span className="block font-semibold text-slate-200">{s.name}</span>
                    <span className="block text-slate-500">
                      {s.gesamt} Karten · {s.zugeordnet} mit Einzelpreis · erschienen {tagDe(s.datum)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            {jubVersiegelt.length > 0 && (
              <div>
                <p className={`${SECTION_LABEL} mb-2`}>Versiegelte Produkte (international)</p>
                <VersiegeltListe produkte={jubVersiegelt} max={10} />
              </div>
            )}
            {jubilaeumKarten.length > 0 && (
              <div>
                <p className={`${SECTION_LABEL} mb-2`}>Die teuersten Einzelkarten</p>
                <KartenReihe karten={jubilaeumKarten} />
              </div>
            )}
            <MehrdeutigListe eintraege={jubMehrdeutig} />
          </Abschnitt>
        )}

        {weitere.length > 0 && (
          <Abschnitt icon={TrendingUp} label="Neuerscheinungen" titel="Neue Sets der letzten Monate">
            {weitere.map((s, i) => (
              <div key={s.setCode} className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
                <Link href={`/sets/${s.setCode}`} className="flex items-center gap-3">
                  <BoosterPackImage setCode={s.setCode} setName={s.name} className="h-10 w-auto object-contain" />
                  <span>
                    <span className="block text-lg font-bold text-white">{s.name}</span>
                    <span className="block text-[11px] text-slate-500">
                      Erschienen am {tagDe(s.datum)} · vor {tageSeit(s.datum)} Tagen · {s.gesamt} Karten
                    </span>
                  </span>
                </Link>
                {s.versiegelt.length > 0 && <div className="mt-4"><VersiegeltListe produkte={s.versiegelt} max={4} /></div>}
                {weitereKarten[i].length > 0 && <div className="mt-4"><KartenReihe karten={weitereKarten[i]} max={4} /></div>}
              </div>
            ))}
          </Abschnitt>
        )}

        {aktuell && neuheiten!.japan.length > 0 && (
          <Abschnitt icon={Globe} label="Zuerst in Japan" titel="Schon in Japan erschienen">
            <p className="text-[13px] leading-relaxed text-slate-400">
              Japanische Sets erscheinen in der Regel vor der englischen Ausgabe. Diese hier führen unsere Quellen bisher
              nur auf Japanisch — die Preise gelten für die japanischen Karten.
            </p>
            {neuheiten!.japan.map((j) => <JapanBlock key={j.id} set={j} />)}
          </Abschnitt>
        )}

        <Abschnitt icon={CalendarClock} label="Kommend" titel="Angekündigte Sets">
          {aktuell && neuheiten!.kommend.length > 0 ? (
            <ul className="divide-y divide-[#1c1c24] rounded-xl border border-[#2a2a3a] bg-[#13131e]">
              {neuheiten!.kommend.map((k) => (
                <li key={k.setCode} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                  <span className="font-semibold text-slate-200">{k.name}</span>
                  <span className="text-slate-500">erscheint am {tagDe(k.datum)} · {k.gesamt} Karten</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-slate-500">
              Unsere Quellen führen derzeit kein englisches Set mit Erscheinungsdatum in der Zukunft. Sobald eines gelistet
              ist, steht es hier — bis dahin sind die japanischen Sets oben die belastbarste Vorschau.
            </p>
          )}
        </Abschnitt>

        {setBewegung && (
          <Abschnitt icon={Flame} label="Set-Bewegungen" titel="Welche Sets sich gerade bewegen" meta="Median der 30-Tage-Bewegung je Set">
            <SetMarket sets={setBewegung.sets} cbi={setBewegung.cbi} />
          </Abschnitt>
        )}

        <p className="pt-4 text-center text-[11px] text-slate-600">{LEGAL_NO_ADVICE}</p>
      </main>
    </div>
  );
}
