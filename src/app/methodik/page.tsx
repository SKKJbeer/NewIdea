import Link from 'next/link';
import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { Reveal } from '@/components/Reveal';
import { ScrollText, ExternalLink } from 'lucide-react';
import {
  PMI_MIN_CARDS,
  FEAR_GREED_WEIGHTS,
  MAX_PLAUSIBLE_TREND,
  MAX_PLAUSIBLE_PRICE,
} from '@/lib/market-metrics';
import { MIN_POINTS_FOR_SCORE, MIN_POINTS_FOR_VOLATILITY, PERFORMANCE_WINDOWS } from '@/lib/card-metrics';
import { SECTION_LABEL } from '@/lib/ui';

// METHODIK-SEITE
//
// Zweck: Jede Kennzahl dieser Plattform muss nachvollziehbar sein. Eine Zahl,
// die niemand nachrechnen kann, ist eine Behauptung — und auf einer Seite, die
// Marktvertrauen aufbauen soll, ist das die teuerste Art von Fehler.
//
// WICHTIG: Die Schwellenwerte werden aus dem CODE importiert, nicht abgetippt.
// Eine Methodikseite, die etwas anderes sagt als die Berechnung, wäre schlimmer
// als gar keine. Ein Test prüft zusätzlich, dass beide zusammenpassen.

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Methodik — wie unsere Marktkennzahlen entstehen',
  description:
    'Offenlegung der Berechnung: CardBeacon Index (CBI), Markttemperatur, Markt-Score, Preisquellen, Aktualisierungsintervalle und die Grenzen der Datenlage.',
  alternates: { canonical: '/methodik' },
};

function Abschnitt({
  nummer,
  titel,
  children,
}: {
  nummer: number;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-black text-white">
          {nummer}
        </span>
        <h2 className="text-base font-black leading-snug text-slate-200">{titel}</h2>
      </div>
      <div className="space-y-3 pl-9 text-sm leading-relaxed text-slate-400">{children}</div>
    </Reveal>
  );
}

function Formel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#2a2a3a] bg-[#0f0f17] px-3.5 py-3 font-mono text-[12px] leading-relaxed text-slate-300">
      {children}
    </div>
  );
}

export default function MethodikPage() {
  const gewichte = FEAR_GREED_WEIGHTS;

  return (
    <div className="min-h-screen bg-[#070810] text-slate-200">
      <NavBar />

      {/* Kopf nach dem gemeinsamen Muster (DESIGN.md §2/§4): linksbündig,
          Abschnittsmarke statt Pille, keine Verlaufsfläche, keine
          Farbhervorhebung im Titel. */}
      <header className="border-b border-[#1c1c24]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
          <p className={SECTION_LABEL}>'Transparenz · CardBeacon'</p>
          <h1 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight text-slate-100">
            Methodik & Datenherkunft
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Wie die Kennzahlen entstehen, worauf sie beruhen — und wo ihre Grenzen liegen.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-6">
        <Abschnitt nummer={1} titel="Woher die Preise kommen">
          <p>
            Alle Preise stammen von <strong className="text-slate-300">Cardmarket</strong>, dem
            größten europäischen Marktplatz für Sammelkarten, und werden über die öffentliche
            Schnittstelle von pokemontcg.io bezogen. Angezeigt wird der{' '}
            <strong className="text-slate-300">Preis-Trend</strong> — der von Cardmarket ermittelte
            faire Marktwert bei gutem Zustand.
          </p>
          <p>
            Das ist bewusst nicht dasselbe wie „ab X €". Der Ab-Preis ist das günstigste
            Einzelangebot und betrifft oft schlechtere Zustände oder andere Sprachen; beide Werte
            können deutlich auseinanderliegen. Auf jeder Kartenseite stehen deshalb Trend,
            günstigstes Angebot, Ø Verkauf und Ø 30 Tage nebeneinander.
          </p>
          <p className="text-slate-500">
            Einschränkung: Die Quelle aktualisiert nicht für jede Karte täglich. Liegt der Datenstand
            mehr als 45 Tage zurück, weist die Kartenseite ausdrücklich darauf hin.
          </p>
        </Abschnitt>

        <Abschnitt nummer={2} titel="Wie oft die Daten aktualisiert werden">
          <ul className="list-inside list-disc space-y-1.5 marker:text-violet-500">
            <li>Startseite und Marktkennzahlen: stündlich neu erzeugt</li>
            <li>Kartenseiten: stündlich, dazu bei jedem Aufruf ein Tagesschnappschuss des Preises</li>
            <li>Tages-Schnappschüsse per Hintergrundlauf: täglich 08:00 UTC</li>
            <li>Set-Übersicht: täglich</li>
          </ul>
          <p>
            Die Tages-Schnappschüsse sind der Grund, warum die Preisverläufe mit der Zeit dichter
            werden: Jeder gespeicherte Tag bleibt erhalten.
          </p>
        </Abschnitt>

        <Abschnitt nummer={3} titel="Wie Preisänderungen berechnet werden">
          <p>
            Eine Veränderung ist immer der Vergleich des aktuellen Preises mit dem Preis am Anfang
            des Zeitraums:
          </p>
          <Formel>Veränderung = (aktuell − damals) ÷ damals × 100</Formel>
          <p>
            Auf Kartenseiten werden bis zu {PERFORMANCE_WINDOWS.length} Zeiträume angeboten (
            {PERFORMANCE_WINDOWS.map((w) => w.label).join(', ')}). Ein Zeitraum erscheint nur, wenn
            für ihn ein Messpunkt in vertretbarer Nähe vorliegt. Fehlt er, fehlt der Zeitraum —
            statt einer Null, die wie eine Messung aussieht.
          </p>
          <p className="text-slate-500">
            Zwischen zwei Messungen wird der zuletzt bekannte Preis fortgeschrieben. Es wird nichts
            interpoliert und keine Zwischenkurve erzeugt.
          </p>
        </Abschnitt>

        <Abschnitt nummer={4} titel="CardBeacon Index (CBI)">
          <p>
            Der CBI ist der <strong className="text-slate-300">preisgewichtete</strong>{' '}
            Durchschnittstrend aller ausgewerteten Karten über 30 Tage.
          </p>
          <Formel>CBI = Σ(Trend × Preis) ÷ Σ(Preis)</Formel>
          <p>
            Der CBI ist preisgewichtet. Dadurch erhalten höherpreisige Karten ein größeres
            Gewicht im Index, und eine große Anzahl sehr günstiger Karten dominiert die Kennzahl
            nicht. Die Gewichtung ist eine Entscheidung über den Aufbau des Index — sie besagt
            nicht, dass ein höherer Preis mit größerer Marktbedeutung oder häufigerem Handel
            einhergeht.
          </p>
          <p>
            <strong className="text-slate-300">Mindestdatenlage:</strong> Unter{' '}
            {PMI_MIN_CARDS} auswertbaren Karten wird <em>kein</em> Wert ausgewiesen, sondern der
            Hinweis „noch nicht genügend Marktdaten". Ein Index aus fünf Karten ist kein Index,
            sondern der Mittelwert von fünf Karten — sieht in einer Oberfläche aber genauso aus.
          </p>
          <p className="text-slate-500">
            An der Kennzahl stehen deshalb immer Kartenzahl, Anzahl der Sets, Zeitraum und
            Datenstand.
          </p>
        </Abschnitt>

        <Abschnitt nummer={5} titel="Markttemperatur">
          <p>Die Temperatur von 0 bis 100 entsteht aus drei Teilwerten:</p>
          <Formel>
            {Math.round(gewichte.breadth * 100)} % Marktbreite ·{' '}
            {Math.round(gewichte.momentum * 100)} % Momentum ·{' '}
            {Math.round(gewichte.ratio * 100)} % Gewinner-zu-Verlierer
          </Formel>
          <ul className="list-inside list-disc space-y-1.5 marker:text-violet-500">
            <li>
              <strong className="text-slate-300">Marktbreite</strong> — Anteil der Karten über ihrem
              30-Tage-Schnitt
            </li>
            <li>
              <strong className="text-slate-300">Momentum</strong> — der CBI, abgebildet von −15 %
              bis +15 % auf die Skala 0–100
            </li>
            <li>
              <strong className="text-slate-300">Gewinner zu Verlierer</strong> — wie viele Karten
              gestiegen sind, gemessen an allen bewegten Karten
            </li>
          </ul>
          <p>
            Auf der Startseite lassen sich alle drei Teilwerte samt Herkunft aufklappen. Die
            gewichtete Summe ergibt exakt den angezeigten Wert — er ist nachrechenbar.
          </p>
          <p className="text-slate-500">
            Unterhalb derselben Mindestdatenlage wie beim CBI wird auch hier kein Wert ausgewiesen.
          </p>

          <p className="pt-1 font-semibold text-slate-300">Was die Stufen bedeuten</p>
          <ul className="list-inside list-disc space-y-1.5 marker:text-violet-500">
            <li><strong className="text-slate-300">0–24 Kalt</strong> — breite Abwärtsbewegung über viele Karten hinweg</li>
            <li><strong className="text-slate-300">25–39 Abkühlend</strong> — mehr Karten fallen als steigen, die Bewegung lässt nach</li>
            <li><strong className="text-slate-300">40–59 Ruhig</strong> — steigende und fallende Karten halten sich weitgehend die Waage</li>
            <li><strong className="text-slate-300">60–74 Anziehend</strong> — mehr Karten steigen als fallen, die Bewegung nimmt zu</li>
            <li><strong className="text-slate-300">75–100 Heiß</strong> — breite Aufwärtsbewegung über viele Karten hinweg</li>
          </ul>
          <p>
            <strong className="text-slate-300">Kalt heißt nicht schlecht und heiß nicht gut.</strong>{' '}
            Die Skala misst, wie viel Bewegung im Markt ist — nicht, ob das für jemanden günstig
            ist. Für wen kaufen möchte, ist ein ruhiger Markt eher angenehm. Deshalb läuft die
            Farbskala von Blau über Grau nach Orange und nicht als Ampel: Grün und Rot bleiben auf
            dieser Seite ausschließlich der Richtung von Preisen vorbehalten.
          </p>
          <p className="text-slate-500">
            Diese Kennzahl hieß bis Juli 2026 „Angst &amp; Gier". Der Name stammte aus dem
            Krypto-Umfeld und beschrieb Gefühle, während gemessen ausschließlich Preisgrößen
            werden. Die Rechnung ist unverändert geblieben, nur die Bezeichnung nicht.
          </p>
        </Abschnitt>

        <Abschnitt nummer={6} titel="Markt-Score einer einzelnen Karte">
          <p>
            Der Score von 0 bis 100 ist der Mittelwert aus vier Faktoren, die alle aus der echten
            Preisreihe der Karte stammen:
          </p>
          <ul className="list-inside list-disc space-y-1.5 marker:text-violet-500">
            <li>
              <strong className="text-slate-300">Momentum</strong> — 30-Tage-Trend, abgebildet von
              −20 % bis +20 %
            </li>
            <li>
              <strong className="text-slate-300">Stabilität</strong> — je geringer die mittlere
              Tagesschwankung, desto höher
            </li>
            <li>
              <strong className="text-slate-300">Nachfrage</strong> — Abstand zum Höchstwert der
              vorliegenden Reihe
            </li>
            <li>
              <strong className="text-slate-300">Datenlage</strong> — wie viele echte Messpunkte
              hinter der Karte stehen
            </li>
          </ul>
          <p>
            <strong className="text-slate-300">Der Preis selbst fließt bewusst nicht ein.</strong>{' '}
            Eine frühere Fassung vergab Punkte nach Preisstufen („über 100 € = +20") und nach
            Seltenheitsnamen. Das ist eine Meinung in Zahlenform: Teuer wurde automatisch als besser
            bewertet.
          </p>
          <p>
            Unter {MIN_POINTS_FOR_SCORE} Messpunkten erscheint kein Score. Eine Schwankungsbreite
            wird erst ab {MIN_POINTS_FOR_VOLATILITY} Punkten berechnet.
          </p>
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 px-3.5 py-3">
            <p className="text-xs font-bold text-amber-400/80">
              Der Markt-Score ist eine datenbasierte Marktkennzahl und keine Anlageberatung.
            </p>
          </div>
        </Abschnitt>

        <Abschnitt nummer={7} titel="Datenprüfung vor jeder Kennzahl">
          <p>
            Ein einzelner fehlerhafter Datensatz verschiebt einen gewichteten Index spürbar — und
            zwar unbemerkt, weil die betroffene Karte in der Oberfläche nirgends auffällt. Vor jeder
            Berechnung wird deshalb geprüft und aussortiert:
          </p>
          <ul className="list-inside list-disc space-y-1.5 marker:text-violet-500">
            <li>Karten ohne Marktpreis oder ohne Bild</li>
            <li>doppelte Einträge derselben Karte</li>
            <li>Preise über {MAX_PLAUSIBLE_PRICE.toLocaleString('de-DE')} €</li>
            <li>30-Tage-Bewegungen über {MAX_PLAUSIBLE_TREND} %</li>
          </ul>
          <p className="text-slate-500">
            Aussortierte Datensätze werden serverseitig protokolliert, damit Auffälligkeiten
            nachvollziehbar bleiben statt still einzufließen.
          </p>
        </Abschnitt>

        <Abschnitt nummer={8} titel="Grenzen dieser Daten">
          <ul className="list-inside list-disc space-y-1.5 marker:text-violet-500">
            <li>
              Die Preishistorie beginnt mit dem Aufbau dieser Plattform. Ältere Verläufe existieren
              nicht — ein „Höchstwert" bezieht sich immer auf die vorliegende Reihe, nicht auf alle
              Zeiten.
            </li>
            <li>
              Nicht jede Karte hat eine tägliche Historie. Die Oberfläche nennt bei jeder Kurve, auf
              wie vielen echten Messpunkten sie beruht.
            </li>
            <li>
              Preise beziehen sich auf englischsprachige Karten in gutem Zustand, sofern nicht
              anders angegeben. Zustand, Sprache und Graduierung verändern den Wert erheblich.
            </li>
            <li>
              Die Kennzahlen beschreiben den ausgewerteten Datensatz, nicht den gesamten
              Pokémon-TCG-Markt.
            </li>
          </ul>
        </Abschnitt>

        <Abschnitt nummer={9} titel="Abstand zum Markt (Prozentpunkte)">
          <p>
            In den Bewegungen, in der Suche, im Set-Markt und auf jeder Kartenseite steht neben der
            Bewegung eine zweite Zahl: der Abstand zum CardBeacon Index.
          </p>
          <Formel>Abstand = Bewegung der Karte − CBI</Formel>
          <p>
            <strong className="text-slate-300">Die Einheit ist Prozentpunkt (pp), nicht Prozent.</strong>{' '}
            Eine Karte bei +22,2 % und ein Markt bei −0,2 % liegen 22,4 Prozentpunkte auseinander —
            nicht 22,4 Prozent. Die Verwechslung ist nicht sprachlich: Sie legt nahe, man könne den
            Abstand auf den Kartenpreis anwenden, und das ergäbe eine andere Zahl.
          </p>
          <p>
            <strong className="text-slate-300">Beide Seiten müssen denselben Zeitraum haben.</strong>{' '}
            Verglichen wird ausschließlich über 30 Tage gegen 30 Tage. Eine Karte über sieben Tage
            gegen einen Index über dreißig zu stellen wäre eine Zahl ohne Aussage.
          </p>
          <p>
            <strong className="text-slate-300">Fehlt eine Seite, entfällt der Vergleich.</strong>{' '}
            Ist die Karte nicht gemessen oder liegt kein belastbarer Indexwert vor, steht dort ein
            Strich. Ein Abstand gegen eine angenommene Null wäre eine erfundene Aussage.
          </p>
          <p className="text-slate-500">
            Was der Abstand NICHT sagt: dass eine Karte „besser" ist. Er sagt, dass sie sich anders
            bewegt hat als der Markt — mehr nicht. Die Ursache dieser Abweichung wird hier nicht
            gemessen und deshalb auch nicht behauptet.
          </p>
        </Abschnitt>

        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-4 text-center">
          <p className="text-xs font-bold text-amber-400/80">
            Keine Anlageberatung · Alle Preise ohne Gewähr
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-400/60">
            CardBeacon ist eine Informations- und Analyseplattform. Die dargestellten
            Kennzahlen sind keine Empfehlung zum Kauf oder Verkauf.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <a
            href="https://www.cardmarket.com/en/Pokemon"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a3a] px-4 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
          >
            Datenquelle Cardmarket <ExternalLink size={11} />
          </a>
          <Link
            href="/datenschutz"
            className="rounded-full border border-[#2a2a3a] px-4 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-violet-500/30 hover:text-white"
          >
            Datenschutz
          </Link>
        </div>
      </main>
    </div>
  );
}
