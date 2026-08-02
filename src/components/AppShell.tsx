import Link from 'next/link';
import { Star, Briefcase } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { NavBar } from '@/components/NavBar';
import { SearchBox } from '@/components/SearchBox';

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

interface Props {
  datenstand: string;
  bestand: { karten: number; sets: number | null; punkte: number } | null;
  children: React.ReactNode;
}

export function AppShell({ datenstand, bestand, children }: Props) {
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
        <div className="relative z-30 hidden items-center gap-3 px-6 pt-5 lg:flex">
          <div className="max-w-[460px] flex-1">
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
      </div>
    </div>
  );
}
