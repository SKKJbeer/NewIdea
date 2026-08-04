import Link from 'next/link';
import { Star, Briefcase } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { NavBar } from '@/components/NavBar';
import { SearchBox } from '@/components/SearchBox';
import { SiteFooter } from '@/components/SiteFooter';
import { getDataCoverage } from '@/lib/data-coverage';

// DIE ANWENDUNGSHUELLE — Seitenleiste plus Kopfzeile, nach der Vorlage.
//
// AB `lg` die Leiste links, darunter die bestehende Kopfleiste. Beides
// gleichzeitig waere doppelte Navigation; keins von beidem waere keine.
//
// ZWEI BEWUSSTE ABWEICHUNGEN VON DER VORLAGE, beide aus demselben Grund:
//
//   1. KEINE GLOCKE MIT ZAEHLER. Die Vorlage zeigt „3" ungelesene Meldungen.
//      Es gibt kein Benachrichtigungssystem — die Zahl waere erfunden, und
//      eine erfundene Zahl in einer Oberflaeche, deren ganzer Zweck geprüfte
//      Zahlen sind, ist der teuerste denkbare Fehler.
//   2. KEIN BENUTZERBILD „JD". Es gibt keine angemeldete Person; ein Kuerzel
//      dort behauptet ein Konto, das niemand hat.
//
// An ihrer Stelle stehen zwei Wege, die es WIRKLICH gibt: Merkliste und
// Portfolio. Die Anordnung der Vorlage bleibt damit erhalten — Suchfeld
// links, runde Schaltflaechen rechts.

/**
 * Die Huelle holt ihre eigenen Daten.
 *
 * Frueher reichte die Startseite `datenstand` und `bestand` herein — und damit
 * gab es die Seitenleiste nur dort. Siebzehn Seiten dieselben zwei Werte
 * durchreichen zu lassen waere siebzehn Gelegenheiten, es zu vergessen. Der
 * Abruf ist eine einzige Datenbankabfrage und faellt bei einem Fehler
 * lautlos auf „keine Angabe" zurueck: Eine Seitenleiste ohne Bestandskarte ist
 * brauchbar, eine Seite ohne Navigation nicht.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const abdeckung = await getDataCoverage().catch(() => null);
  const bestand = abdeckung
    ? { karten: abdeckung.cards, sets: abdeckung.sets, punkte: abdeckung.pricePoints }
    : null;
  const datenstand = new Date().toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#070810] text-slate-300">
      <AppSidebar datenstand={datenstand} bestand={bestand} />

      {/* Kopfleiste nur auf schmalen Bildschirmen — dort ersetzt sie die
          Seitenleiste vollstaendig. */}
      <div className="lg:hidden">
        <NavBar />
      </div>

      {/* `overflow-x-clip`, NICHT `hidden`: Die Lichthoefe der Panels reichen
          bewusst ueber deren Rand hinaus (`-inset-6`) — genau das laesst sie
          schweben. Auf dem Telefon steht ein Panel aber am Seitenrand, und der
          Hof schob die Seite dadurch acht Pixel waagerecht. `clip` schneidet
          ab, ohne einen Scrollbereich zu erzeugen; `hidden` wuerde einen
          erzeugen und damit `position: sticky` im Inhalt brechen. */}
      <div className="overflow-x-clip lg:pl-[236px]">
        {/* OBERE LEISTE. In der Vorlage schwebt sie ueber dem Hintergrund,
            ohne eigene Flaeche — deshalb kein Balken, nur die Bedienelemente. */}
        {/* WAAGERECHTE AUSRICHTUNG: dieselben Innenabstaende wie der
            Seiteninhalt darunter (`px-6 sm:px-10 lg:px-14 xl:px-16`). Vorher
            stand die Leiste bei festen 24 Pixeln, der Inhalt auf einem breiten
            Bildschirm aber bei 56 bis 64 — das Suchfeld hing dadurch sichtbar
            links neben allem anderen.

            BREITE: 460 Pixel in einer 1300 Pixel breiten Flaeche lassen das
            Feld gestrandet wirken. 640 entsprechen der Textbreite der
            Startseite; die Leiste liest sich damit als eine Zeile, nicht als
            zwei Inseln mit Leere dazwischen. */}
        <div className="relative z-30 hidden items-center gap-3 px-6 pt-5 sm:px-10 lg:flex lg:px-14 xl:px-16">
          <div className="max-w-[640px] flex-1">
            <SearchBox placeholder="Suche Karten, Sets, …" searchBtn="Suchen" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/merkliste"
              aria-label="Merkliste"
              title="Merkliste"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.03] text-slate-400 backdrop-blur-md transition-colors hover:border-white/[0.16] hover:text-violet-300"
            >
              <Star size={17} />
            </Link>
            <Link
              href="/portfolio"
              aria-label="Portfolio"
              title="Portfolio"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.03] text-slate-400 backdrop-blur-md transition-colors hover:border-white/[0.16] hover:text-violet-300"
            >
              <Briefcase size={17} />
            </Link>
          </div>
        </div>

        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
