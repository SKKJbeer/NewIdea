import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { ArrowLeft, GitMerge, Plus, RefreshCw, Wrench } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — PokéMarket Intelligence',
  description: 'Release-History und Versionsübersicht von PokéMarket Intelligence.',
  robots: { index: false },
};

const RELEASES = [
  {
    version: '3.3.1',
    date: '30. Juli 2026',
    label: 'Nachtrag zur Sprachpruefung',
    isLatest: true,
    changes: [
      { type: 'fixed', text: 'Die neue Sprachpruefung schlug am eigenen Changelog-Eintrag an - der Verlauf ist jetzt ausgenommen, wie schon bei den uebrigen Begriffen' },
    ],
  },
  {
    version: '3.3.0',
    date: '30. Juli 2026',
    label: 'Datenbestand und Kennzahl sauber getrennt',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Ein Set mit einer einzigen Karte konnte die Set-Rangliste anfuehren - jetzt erst ab fuenf auswertbaren Karten und nach typischem Kartenpreis statt Mittelwert' },
      { type: 'fixed',   text: 'Die Angabe neben dem Marktindex las sich wie der gesamte Datenbestand, war aber die Stichprobe einer Kennzahl - und kam aus einer Begrenzung im Code, nicht aus der Datenlage' },
      { type: 'fixed',   text: 'Der Marktbericht sah nur ein einziges Set und nutzte eine andere Datenquelle als die Startseite' },
      { type: 'fixed',   text: 'Drei Routen trennten Gewinner und Verlierer noch nach der alten, fehlerhaften Regel' },
      { type: 'fixed',   text: 'Die Startseite versprach eine sekundengenaue Aktualisierung und nannte im selben Block die taegliche - die Formulierung entspricht jetzt der Datenlage' },
      { type: 'new',     text: 'Datenabdeckung getrennt ausgewiesen: Karten, Sets und gespeicherte Preispunkte des gesamten Bestands' },
      { type: 'changed', text: 'Die Score- und Insight-Bezeichnungen sind auf Marktanalyse umgestellt - Adressen bleiben unveraendert' },
    ],
  },
  {
    version: '3.2.6',
    date: '30. Juli 2026',
    label: 'Erfassung laeuft ohne Abriss durch',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Die Erfassung brach reproduzierbar nach fünf bis sechs Übergaben ab — bei Seite 20, 32 und 49 von 82, jedes Mal ohne Fehlermeldung. Die Arbeit läuft jetzt innerhalb der Anfrage statt danach' },
    ],
  },
  {
    version: '3.2.5',
    date: '30. Juli 2026',
    label: 'Erfassung verliert keinen Fortschritt mehr',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Der Stand wurde erst am Ende einer Runde gespeichert — eine vorzeitig beendete Runde verlor ihren gesamten Fortschritt und der Durchlauf kam über Seite 32 von 82 nicht hinaus' },
      { type: 'fixed', text: 'Die Arbeitszeit je Runde liegt wieder klar unter der kleinsten Laufzeitgrenze, damit die Fortsetzung zuverlässig angestoßen wird' },
    ],
  },
  {
    version: '3.2.4',
    date: '30. Juli 2026',
    label: 'Kürzere Kette in der Preiserfassung',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Die Erfassung blieb bei Seite 20 von 82 stehen, ohne einen Fehler zu melden — statt rund 40 Übergaben zwischen den Läufen sind es jetzt etwa fünf' },
    ],
  },
  {
    version: '3.2.3',
    date: '30. Juli 2026',
    label: 'Erfassung überlebt einen Aussetzer der Kartendatenbank',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Ein einzelner Abruffehler beendete den ganzen Durchlauf — die Fortsetzung hing an einem fehlerfreien ersten Häppchen, obwohl die Kartendatenbank regelmäßig Fehler liefert' },
    ],
  },
  {
    version: '3.2.2',
    date: '30. Juli 2026',
    label: 'Preiserfassung lief nach acht Seiten ins Leere',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Die Erfassung blieb nach 8 von 82 Seiten stehen — der Folgeaufruf ging an die noch nicht verbundene eigene Domain statt an die Adresse, unter der sie gerade selbst lief' },
      { type: 'fixed', text: 'Ein abgerissener Anstoß war unsichtbar: Der Stillstand sah aus wie ein langsamer Durchlauf. Er wird jetzt im Klartext vermerkt' },
    ],
  },
  {
    version: '3.2.1',
    date: '30. Juli 2026',
    label: 'Preiserfassung von Hand startbar',
    isLatest: false,
    changes: [
      { type: 'new', text: 'Knopf im Monitoring, der die Preiserfassung sofort startet statt bis zum nächsten Morgen zu warten — mit Stand und Fehlerursache im Klartext' },
    ],
  },
  {
    version: '3.2.0',
    date: '30. Juli 2026',
    label: 'Preise werden für alle Karten erfasst',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Die Preiserfassung deckt jetzt die gesamte Kartendatenbank ab (~20.500 Karten) statt nur die rund 80 des Tageslaufs plus die zufällig angeklickten' },
      { type: 'new',     text: 'Der Durchlauf arbeitet in Häppchen, merkt sich seinen Stand und setzt sich selbst fort, bis der Tag vollständig erfasst ist' },
      { type: 'changed', text: 'Gespeichert wird bei Preisänderung und mindestens einmal pro Woche je Karte — dieselbe Zahl täglich zu wiederholen bringt keine zusätzliche Aussage' },
      { type: 'new',     text: 'Der Stand der Erfassung ist im Monitoring sichtbar, inklusive Fehlerursache im Klartext' },
    ],
  },
  {
    version: '3.1.4',
    date: '30. Juli 2026',
    label: 'Richtigstellung im Changelog',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Der Eintrag zu v3.1.2 war zwischenzeitlich als Fehlschlag markiert — das war er nicht, die dort beschriebene Ursache stimmte' },
    ],
  },
  {
    version: '3.1.3',
    date: '30. Juli 2026',
    label: 'Versionsanzeige unabhängig vom Build-Befehl',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Die Versionsanzeige hing an einer Umgebungsvariable, die nur beim Bauen über npm existiert — ein geänderter Build-Befehl hätte sie jederzeit wieder verstummen lassen' },
      { type: 'changed', text: 'Die Version steht jetzt als Konstante im Code; ein Test hält sie mit package.json zusammen' },
    ],
  },
  {
    version: '3.1.2',
    date: '30. Juli 2026',
    label: 'Versionsanzeige in der Fußzeile',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'In der Fußzeile stand live ein nacktes „v" ohne Nummer — damit war nach einem Deployment nicht erkennbar, ob die neue Fassung überhaupt angekommen war' },
    ],
  },
  {
    version: '3.1.1',
    date: '30. Juli 2026',
    label: 'Marktbreite: zwei Zahlen, eine Wahrheit',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Auf der Startseite standen zwei verschiedene Marktbreiten: die Kachel zeigte „16 % · 8/50", die Erklärung darunter „16 von 50" (32 %)' },
      { type: 'fixed',   text: 'Als Zähler diente die auf acht Einträge gekürzte Gewinnerliste der Anzeige — ab neun gestiegenen Karten blieb er stehen, während der Nenner weiterwuchs' },
      { type: 'fixed',   text: 'Ein Aussetzer der Kartendatenbank konnte beim Erzeugen der Seiten das gesamte Deployment verhindern — auch für Änderungen, die mit Sets nichts zu tun haben' },
      { type: 'changed', text: 'Kachel, Erklärtext und Angst & Gier rechnen jetzt aus derselben Quelle' },
      { type: 'changed', text: 'Karten ohne gemessenen 30-Tage-Schnitt zählen nicht mehr als „nicht gestiegen" — eine Datenlücke ist keine Messung' },
    ],
  },
  {
    version: '3.1.0',
    date: '30. Juli 2026',
    label: 'QA-Durchlauf: Layout, Bedienbarkeit, Ladezeit',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Auf der Set-Übersicht blieben vier Logos leer — ein weiterer Bild-Host stand nicht in der Inhaltsrichtlinie. Läuft jetzt über die eigene Bild-Weiterleitung' },
      { type: 'fixed',   text: 'Auf Tablet-Breite ragte die Navigationsleiste über den Rand — waagerechtes Scrollen auf jeder Seite' },
      { type: 'fixed',   text: 'Bedienelemente waren mit 16–22 Pixel zu klein für einen Finger — jetzt durchgehend mindestens 32 Pixel' },
      { type: 'fixed',   text: 'Eine Karte mit genau 0 % Veränderung wurde rot dargestellt' },
      { type: 'fixed',   text: 'Portfolio und Merkliste hatten keinen Seitentitel, standen aber in der Sitemap' },
      { type: 'changed', text: 'Die Karten-Detailseite lädt 29 % weniger JavaScript — die Diagramm-Bibliothek wird nachgeladen' },
      { type: 'new',     text: 'Einstieg ins Portfolio auf der Startseite — ohne ihn endete die Seite bei der Analyse' },
    ],
  },
  {
    version: '3.0.0',
    date: '30. Juli 2026',
    label: 'Professionalisierung: Datenvertrauen & Methodik',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Die Rankings waren logisch falsch — Gewinner und Verlierer entstanden aus derselben Liste ohne Vorzeichenfilter. Bei einer gestiegenen Karte standen unter „Top Gewinner" gefallene Karten' },
      { type: 'fixed',   text: 'Der PMI wirkte belastbarer als er war: unter 20 Karten wird kein Wert mehr ausgewiesen, sonst stehen Kartenzahl, Sets, Zeitraum und Datenstand daneben' },
      { type: 'fixed',   text: 'Angst & Gier ist nachvollziehbar — drei offengelegte Teilwerte, die zusammen exakt den angezeigten Wert ergeben' },
      { type: 'fixed',   text: 'Fehlerhafte Datensätze werden vor jeder Berechnung aussortiert statt unbemerkt einzufließen' },
      { type: 'fixed',   text: 'Die Set-Übersicht konnte einen ganzen Tag als „nicht verfügbar" feststecken — jetzt mit Wiederholung, Fehler- und Ladezustand' },
      { type: 'fixed',   text: 'Der Investment-Score war eine Kaufempfehlung („Starkes Investment"). Ersetzt durch den PMI Score aus vier offengelegten Faktoren' },
      { type: 'new',     text: 'Karten-Detailseite: Wertentwicklung über fünf Zeiträume, Marktkennzahlen, PMI Score mit Faktoren, Kartennummer im Titel' },
      { type: 'new',     text: 'Portfolio: stärkste und schwächste Positionen, größte Posten, Aufteilung nach Set, Vergleich gegen den Markt' },
      { type: 'new',     text: 'Methodik-Seite unter /methodik — jede Kennzahl offengelegt, Schwellenwerte direkt aus dem Code' },
    ],
  },
  {
    version: '2.40.0',
    date: '30. Juli 2026',
    label: 'Startseite: Set-Bilder und Messbalken',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'In der Set-Tabelle fehlten die Bilder vollständig — jede Zeile zeigt jetzt ihr Set-Logo und führt zur Set-Seite' },
      { type: 'new',     text: 'Ø-Preis als Anteilsbalken je Set: aus einer Zahlenspalte wird eine Rangfolge, die man auf einen Blick erfasst' },
      { type: 'new',     text: 'PMI-Index mit Messbalken um die Nulllinie und Marktbreite als geteilter Balken statt nackter Prozentzahlen' },
      { type: 'new',     text: 'Investor Insights als Karten mit Kartenbild, großer Kennzahl und Verlinkung — statt vier Aufzählungspunkten' },
    ],
  },
  {
    version: '2.39.0',
    date: '30. Juli 2026',
    label: 'Grafiken bauen sich beim Scrollen auf',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Eine Linie kreuzte die erste Guides-Kachel — die halbtransparente Kachel ließ die Unterkante des Kopfbereichs durchscheinen' },
      { type: 'changed', text: 'Alle Datengrafiken bauen sich beim Hereinscrollen auf: Balken wachsen von null, Zeilen setzen versetzt ein, Kennzahlen zählen hoch' },
      { type: 'changed', text: 'Vertiefte Spuren, Farbverläufe, runde Enden und farbiger Schein statt flacher Balken; Preisrangliste nummeriert, Kennzahlen mit Verlaufsrahmen' },
      { type: 'changed', text: 'Das Hochzählen endet exakt auf dem gemessenen Wert — nie auf einem gerundeten Zwischenschritt' },
      { type: 'new',     text: 'Sichtbarkeits-Erkennung an einer Stelle; ohne JavaScript oder bei „weniger Bewegung" steht sofort alles da' },
    ],
  },
  {
    version: '2.38.0',
    date: '30. Juli 2026',
    label: 'Anschaulicher: neue Datengrafiken',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Das Preisdiagramm färbte einen Kursanstieg grau — die Balkenfarbe kam aus der Akzentfarbe des Artikeltyps. Steigend ist jetzt immer grün, fallend immer rot' },
      { type: 'fixed',   text: 'Kartennamen wurden auf 13 Zeichen gekürzt und der Preis stand nur im Tooltip. Die Balken liegen jetzt waagerecht, der Wert steht am Balken' },
      { type: 'fixed',   text: 'Unter jeder Karte stand dasselbe Set-Logo in voller Größe — jetzt einmal in der Kopfzeile, wenn alle aus einem Set stammen' },
      { type: 'fixed',   text: 'Der Marktbericht zeigte Listenlängen als Kennzahlen statt echter Marktzahlen' },
      { type: 'new',     text: 'Kennzahlen-Kacheln: stärkster Zuwachs, größter Rückgang, Preisspanne — aus echten Marktdaten, sonst gar nicht' },
      { type: 'new',     text: 'Marktbild-Grafik: Veränderungen als Balken beidseits einer Nulllinie — wer steigt und wer fällt, in einer Sekunde erfasst' },
      { type: 'new',     text: 'Kartenbilder im vollen Kartenformat mit Rahmen und Tiefe statt fester Höhe' },
    ],
  },
  {
    version: '2.37.0',
    date: '30. Juli 2026',
    label: 'Portfolio: Zukäufe sind kein Gewinn',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Zukäufe wurden als Wertsteigerung gezählt — an einem echten Bestand wies der Jahreswert +636,90 € aus statt der tatsächlichen +216,90 €. Die Wertentwicklung ist jetzt um Zukäufe bereinigt' },
      { type: 'fixed',   text: 'Das Portfolio nutzte nur die Cardmarket-Ankerpunkte (höchstens vier je Karte) — die zehntausenden echten Tages-Snapshots blieben ungenutzt. Beide Quellen laufen jetzt zusammen' },
      { type: 'fixed',   text: 'Positionen ohne geladenen Marktpreis zeigten „+0,00 € · 0,0 %" — nicht zu unterscheiden von einer Karte, die sich wirklich nicht bewegt hat' },
      { type: 'new',     text: 'Die Preise der Portfolio-Karten werden mitgeschrieben — ihre Tages-Historie wächst ab jetzt mit jedem Aufruf' },
      { type: 'new',     text: 'Die Kurve nennt die Zahl ihrer echten Messpunkte und markiert sie bei dünner Datenlage, statt eine lückenlose Messung vorzutäuschen' },
      { type: 'new',     text: 'Werteachse beschriftet — ohne Maßstab sieht eine Bewegung von 2 % aus wie eine von 60 %' },
    ],
  },
  {
    version: '2.36.0',
    date: '30. Juli 2026',
    label: 'Trade-Republic-Partnerlink aktiv',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Trade-Republic-Partnerlink eingesetzt — sofort live, weiterhin per Umgebungsvariable überschreibbar' },
      { type: 'new',     text: 'Kennzeichnungshinweis steht jetzt in der Partner-Leiste selbst und kann an neuen Stellen nicht mehr vergessen werden' },
      { type: 'fixed',   text: 'Der Trade-Republic-Eintrag war ein klickbarer Link ohne Ziel — sichtbar, aber wirkungslos' },
      { type: 'fixed',   text: 'Ein Cardmarket-Link im Archiv-Hinweis war nicht gekennzeichnet und nicht an die Affiliate-Variable gekoppelt' },
    ],
  },
  {
    version: '2.35.2',
    date: '30. Juli 2026',
    label: 'Die tatsächliche Ursache: eine Spalte, die es nicht gibt',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Der Artikel-Speicher schrieb in eine title-Spalte, die die Tabelle nicht hat. Der Titel wird jetzt aus dem gespeicherten Beitrag gelesen — kein SQL nötig' },
      { type: 'fixed',   text: 'Das Blog-Listing las dieselbe fehlende Spalte und bekam deshalb immer eine leere Liste' },
    ],
  },
  {
    version: '2.35.1',
    date: '30. Juli 2026',
    label: 'Artikel wurden nie gespeichert — und jeder Aufruf kostete neu',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Das Speichern der Artikel scheiterte still: zehn erzeugte Beiträge, null gespeicherte Zeilen, keine Meldung. Die Speicher-Funktion gibt jetzt die echte Ursache zurück' },
      { type: 'fixed',   text: 'Jeder Seitenaufruf erzeugte den Artikel neu — der Route fehlte generateStaticParams, wodurch die Zwischenspeicherung nie griff. Drei Abrufe lieferten drei verschiedene Titel' },
      { type: 'changed', text: 'Die Auslöse-Route meldet jetzt, ob wirklich gespeichert wurde, statt Erfolg zu behaupten' },
    ],
  },
  {
    version: '2.35.0',
    date: '30. Juli 2026',
    label: 'Sicherheitsdurchsicht: neun Befunde geschlossen',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Fremder Code über strukturierte Daten war möglich — JSON.stringify maskiert </script> nicht, und auf der Suchseite floss die Suchanfrage des Besuchers ungefiltert dorthin. Fünf Seiten betroffen, alle behoben' },
      { type: 'fixed',   text: 'Die Weiterleitung nach der Anmeldung ließ sich mit einem Rückstrich oder Tabulator auf eine fremde Seite umbiegen — der Baustein für Phishing' },
      { type: 'fixed',   text: 'Die Newsletter-Vorlage setzte Kartennamen, Texte und sogar Bildadressen ungeprüft in HTML ein' },
      { type: 'fixed',   text: 'Der Bild-Zwischenspeicher folgte Weiterleitungen blind — die Liste erlaubter Hosts galt nur für den ersten Sprung' },
      { type: 'fixed',   text: 'Die Schnittlänge der Video-Verarbeitung floss ungeprüft in die FFmpeg-Kommandozeile' },
      { type: 'fixed',   text: 'Die Newsletter-Anmeldung hatte keine Begrenzung und prüfte die Adresse nur auf ein @' },
      { type: 'fixed',   text: 'Next.js von 16.2.9 auf 16.2.12 — schließt neun Meldungen, darunter Anfragefälschung in Server Actions' },
      { type: 'new',     text: 'Sicherheits-Kopfzeilen auf jeder Antwort: Inhaltsrichtlinie, kein Einbetten in fremde Seiten, kein MIME-Raten' },
      { type: 'new',     text: '74 neue Prüfungen (521 insgesamt) — darunter dauerhafte Regeln, die jeden dieser Befunde beim Bauen abfangen' },
    ],
  },
  {
    version: '2.34.0',
    date: '30. Juli 2026',
    label: 'Kostenerfassung — und der Grund für das leere Guthaben',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Zwei Endpunkte lösten KI-Generierungen ohne Anmeldung aus — /api/market war ein GET, den jeder Crawler auslösen konnte' },
      { type: 'new',     text: 'KI-Verbrauch wird erfasst: Aufrufe, Token und Kosten der letzten 30 Tage nach Zweck gruppiert, im Monitoring sichtbar' },
      { type: 'new',     text: 'Ein Test verhindert die Wiederholung: Neue Routen mit KI-Aufruf brauchen einen Zugriffsschutz, sonst schlägt der Build fehl' },
      { type: 'changed', text: 'Auch gescheiterte Aufrufe werden erfasst — sonst sieht ein Ausfall aus, als sei nichts passiert' },
    ],
  },
  {
    version: '2.33.0',
    date: '30. Juli 2026',
    label: 'Ursache des Content-Ausfalls gefunden',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Das „Live!“ im Studio war eine reine Behauptung — die Veröffentlichung speicherte nichts und konnte gar nicht fehlschlagen. Jetzt wird wirklich gespeichert und das echte Ergebnis angezeigt' },
      { type: 'fixed',   text: 'Fehler der KI-Schnittstelle werden in Klartext übersetzt statt als rohes JSON angezeigt' },
      { type: 'fixed',   text: 'Der Artikel-Auslöser nennt jetzt die Ursache, statt nur „ist ein Ersatztext“ zu melden' },
      { type: 'changed', text: 'Die Veröffentlichung prüft serverseitig die Anmeldung' },
    ],
  },
  {
    version: '2.32.1',
    date: '29. Juli 2026',
    label: 'Anmeldung vorerst abgeschaltet',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Die Anmeldeknöpfe erscheinen erst nach expliziter Freischaltung — so lässt sich Supabase in Ruhe einrichten, ohne dass Besucher eine halb fertige Anmeldung sehen' },
    ],
  },
  {
    version: '2.32.0',
    date: '29. Juli 2026',
    label: 'Portfolio-Konto: Anmeldung mit Google und Apple',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Portfolio lässt sich mit Google oder Apple anmelden und bleibt dann dauerhaft erhalten — auch auf anderen Geräten' },
      { type: 'new',     text: 'Sichtbarer Hinweis, wo die Daten liegen: „Nur in diesem Browser“ oder „Im Konto gespeichert“' },
      { type: 'new',     text: 'Beim ersten Anmelden wird der vorhandene Browser-Bestand automatisch übernommen' },
      { type: 'changed', text: 'Änderungen werden weiterhin immer auch lokal gespeichert — ist das Konto nicht erreichbar, bleibt der Browser der Rückfall' },
    ],
  },
  {
    version: '2.31.0',
    date: '29. Juli 2026',
    label: 'Portfolio-Tests und Newsletter-Pflichten',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Portfolio tiefer abgesichert: 33 neue Prüfungen plus 18 Funktionstests der Preis-API — 364 statt 284 Tests' },
      { type: 'fixed',   text: 'Beschädigte gespeicherte Daten führten zu „NaN“ im Portfolio-Gesamtwert' },
      { type: 'fixed',   text: 'Newsletter: fehlende Affiliate-Kennzeichnung, tote Links für Abmelden/Datenschutz/Impressum, Kaufaufforderung und Emojis' },
      { type: 'fixed',   text: 'Cardmarket- und Instagram-Aufrufe liefen ohne Zeitlimit' },
    ],
  },
  {
    version: '2.30.0',
    date: '29. Juli 2026',
    label: 'Tiefere Tests: 135 neue Prüfungen, sieben gefundene Fehler',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Sieben neue Testdateien für Studio-Zugang, Preis-Wahrheitspflicht, Reel-Formate, Startseiten-Absicherung, Bild-Proxy und Übersetzungen — 284 statt 149 Tests' },
      { type: 'new',     text: 'Architektur-Regeln werden automatisch durchgesetzt: Zahlenformat, Dark-Mode-Farben, Auth auf Inhalts-Auslösern, keine internen Fehlerdetails nach außen' },
      { type: 'fixed',   text: 'Preise und Prozentwerte an sechs Stellen wieder englisch formatiert — Kartenraster, Chart-Achse, Set-Gesamtwert, Startseite, Studio, Social-Vorschaubild' },
      { type: 'fixed',   text: 'Reel-Formate wechselten mitten in der Woche: Die Wochenzählung lief ab 1. Januar statt ab Montag' },
      { type: 'fixed',   text: 'Zwei API-Antworten gaben interne Fehlerdetails preis; drei KI-Aufrufe verschluckten ihren Fehler stumm' },
    ],
  },
  {
    version: '2.29.0',
    date: '29. Juli 2026',
    label: 'Marktbericht und Artikel per Klick auslösen',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Monitoring hat jetzt Auslöser für Marktbericht und Artikel — bisher ging beides nur per Kommandozeile mit dem Studio-Passwort' },
      { type: 'new',     text: 'Der Artikel-Lauf prüft die letzten acht Termine und ersetzt nur Ersatztexte; echte Beiträge bleiben unangetastet' },
      { type: 'changed', text: 'Jede Kachel meldet das Ergebnis im Klartext statt eines bloßen „ok“' },
    ],
  },
  {
    version: '2.28.0',
    date: '29. Juli 2026',
    label: 'Reels mit Farbe: Kartenmotiv als Hintergrund',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Jedes Segment trägt die Farbstimmung seiner Karte: Das Kartenbild läuft zusätzlich stark unscharf im Hintergrund, der Text darüber bleibt scharf' },
      { type: 'new',     text: 'Angedeutetes Sammel-Motiv und schwebende Streuelemente auf Haken-, Einordnungs- und Abspann-Bild' },
      { type: 'changed', text: 'Karten liegen leicht geneigt, Platzierungsziffer mit Farbverlauf, Abdunklung an Ober- und Unterkante für sichere Lesbarkeit' },
      { type: 'fixed',   text: 'Abspann zeigte eine doppelte Aussage („Alle Preise / Preise täglich aktuell") — der fest verdrahtete Vorspann ist entfallen' },
    ],
  },
  {
    version: '2.27.0',
    date: '29. Juli 2026',
    label: 'Instagram-Konzept: vier Formate mit eigener Dramaturgie',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Vier Reel-Formate, die automatisch nach Kalenderwoche rotieren: Stärkste Bewegungen, Preis-Check (Quiz), Teuerste eines Sets, Preis gegen 30-Tage-Schnitt' },
      { type: 'new',     text: 'Durchgängige Dramaturgie: Haken zuerst, dann Karten, dann Einordnung, Marke zuletzt' },
      { type: 'changed', text: 'Das Marken-Intro am Anfang ist entfallen — dort steht jetzt der Haken' },
    ],
  },
  {
    version: '2.26.0',
    date: '29. Juli 2026',
    label: 'Reels im eigenen Look: lebendiger und hochwertiger',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Reels komplett neu gestaltet: Raster-Hintergrund, farbige Lichtstimmung nach Trendrichtung, Platzierung als große Ziffer, Karte mit farbigem Ring' },
      { type: 'changed', text: 'Der Trend ist jetzt die Hauptkennzahl — groß, farbig, mit Richtungspfeil; Marktwert als eigenes Feld' },
      { type: 'new',     text: 'Bewegung: Heranfahren mit wechselnder Richtung, weiche Blenden zwischen den Abschnitten, Fortschrittsanzeige' },
    ],
  },
  {
    version: '2.25.0',
    date: '29. Juli 2026',
    label: 'Instagram-Reels funktionieren erstmals',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Die Reel-Erstellung konnte technisch nie funktionieren: Der Videosoftware fehlt die Funktion zum Einblenden von Text, über die bisher jede Zeile lief' },
      { type: 'changed', text: 'Bilder werden jetzt fertig gestaltet und nur noch zusammengefügt — erstes vollständiges Reel aus echten Marktdaten erfolgreich erstellt' },
      { type: 'fixed',   text: 'Preise und Trends im Reel in deutscher Schreibweise' },
    ],
  },
  {
    version: '2.24.0',
    date: '29. Juli 2026',
    label: 'Gesamt-Audit: Preisdarstellung, Bilder, Ausfallsicherheit',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Preise erschienen im englischen Format („235.71 €" statt „235,71 €", ohne Tausenderpunkt) — an rund 15 Stellen quer über die Seite korrigiert' },
      { type: 'fixed',   text: 'Die Boosterpack-Bildquelle existiert nicht mehr und schlug bei jedem Kartenbild fehl — das Set-Logo ist jetzt die direkte Quelle' },
      { type: 'fixed',   text: 'Leere Startseite ohne Karten und Trends: Abrufe zur Kartendatenbank wiederholen jetzt automatisch und weichen auf andere Sets aus' },
      { type: 'fixed',   text: 'Ohne Datenlage wurde trotzdem eine Marktstimmung errechnet — jetzt erscheint ein ehrlicher Hinweis statt erfundener Kennzahlen' },
      { type: 'changed', text: 'Zahlenformatierung zentral an einer Stelle; doppelte Umsetzung aufgelöst' },
    ],
  },
  {
    version: '2.23.0',
    date: '29. Juli 2026',
    label: 'Marktbericht: Platzhalter entfernt, Erzeugung repariert',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Als Wochenanalyse stand ein Platzhalter aus Kalenderwoche 26 online — solche Texte werden jetzt weder angezeigt noch gespeichert' },
      { type: 'fixed',   text: 'Der Wochen-Cron meldete Erfolg, ohne das Speichern zu prüfen; die Ursache kommt jetzt im Klartext zurück' },
      { type: 'fixed',   text: 'Ein Fehler im Newsletter-Schritt verhinderte den ganzen Bericht — beide Schritte sind jetzt entkoppelt' },
      { type: 'new',     text: 'Qualitätsgate: zu kurze Berichte werden nicht veröffentlicht' },
      { type: 'new',     text: 'Wochenbericht lässt sich sofort manuell erzeugen statt auf Montag zu warten' },
    ],
  },
  {
    version: '2.22.0',
    date: '27. Juli 2026',
    label: 'Echte Artikel statt Ausweichtexte',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Kein Blog-Beitrag wurde tatsächlich aus Marktdaten erstellt — das Token-Limit war zu knapp, die Antwort brach ab und fiel still auf einen allgemeinen Ausweichtext zurück. Behoben, ebenso bei Guides und Marktbericht' },
      { type: 'fixed',   text: 'Lesezeit fehlte bei älteren Beiträgen („Min Lektüre" ohne Zahl) — wird jetzt bei Bedarf aus dem Text berechnet' },
      { type: 'fixed',   text: 'Wochenrückblick-Ausweichtext behauptete Wochen-Beobachtungen ohne Wochendaten — neu als zeitlose Marktmuster-Erklärung formuliert' },
      { type: 'changed', text: 'Der Wochen-Marktbericht folgt jetzt denselben Inhalts- und Stilregeln wie die Artikel und ist ausführlicher' },
      { type: 'new',     text: 'Gespeicherte Ausweichtexte lassen sich nachträglich durch echte, datenbasierte Beiträge ersetzen' },
    ],
  },
  {
    version: '2.21.0',
    date: '27. Juli 2026',
    label: 'Betriebszustand sichtbar: Guide-Pipeline repariert',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Automatische Guide-Erzeugung lief unbemerkt ins Leere — der Speicherfehler wurde still verschluckt. Ursache wird jetzt im Klartext gemeldet' },
      { type: 'new',     text: 'Monitoring zeigt den echten Betriebszustand: Anzahl und Datenstand von Preis-Schnappschüssen, Artikeln, Guides und Marktberichten' },
      { type: 'new',     text: 'Fehlt eine Datenbank-Tabelle, liefert das Monitoring die Fehlermeldung plus fertiges SQL zum Anlegen' },
      { type: 'new',     text: '„Jetzt testen"-Knopf für die Guide-Pipeline — Reparatur sofort überprüfbar statt Warten bis Dienstag/Freitag' },
    ],
  },
  {
    version: '2.20.0',
    date: '20. Juli 2026',
    label: 'Rich-Content: Guides & Berichte laden zum Lesen ein',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Neue Content-Darstellung: großzügige Typo mit Initialbuchstaben, hervorgehobene Kennzahlen, sanft einblendende Abschnitte und Lesefortschritts-Balken' },
      { type: 'changed', text: 'Guides magazinartig aufgewertet: Icon-Medaillon, Farbverlauf-Akzente, nummerierte Abschnitte — statt nüchterner Absätze' },
      { type: 'changed', text: 'Marktbericht und Artikel im gleichen lebendigen Look; gilt automatisch auch für künftig generierte Beiträge' },
    ],
  },
  {
    version: '2.19.8',
    date: '20. Juli 2026',
    label: 'Bugfix: Mobil-Navigation — fehlende Menüpunkte',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Auf dem Handy fehlten die meisten Menüpunkte (u.a. Sets, Einsteiger, Marktbericht, Merkliste) — sie waren fest auf Desktop-Breite ausgeblendet' },
      { type: 'fixed', text: 'Neues aufklappbares Mobil-Menü (Hamburger) mit allen Navigationspunkten, schließt automatisch beim Seitenwechsel' },
    ],
  },
  {
    version: '2.19.7',
    date: '20. Juli 2026',
    label: 'Set-Übersicht: professionelles Raster + verlässliche Logos',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Kaputte Bild-Platzhalter auf der Set-Übersicht behoben — verlässliche Fallback-Kette bis zum sauberen Icon-Platzhalter, nie wieder ein defektes Bild' },
      { type: 'fixed', text: 'Echtes Set-Logo aus der TCG-API statt geratener URL — deutlich mehr Sets zeigen ihr Logo' },
      { type: 'changed', text: 'Set-Karten neu gestaltet: einheitliche Logo-Fläche, klare Typo-Hierarchie, aufgeräumte Meta-Pillen (Datum, Kartenzahl)' },
    ],
  },
  {
    version: '2.19.6',
    date: '20. Juli 2026',
    label: 'Bugfix: Auto-Reel — FFmpeg-Binary fehlte im Bundle',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Auto-Reel scheiterte mit „spawn ffmpeg ENOENT" — die FFmpeg-Binary wurde nicht ins serverlose Bundle gepackt. Sie wird jetzt erzwungen mitgebündelt und robust ausführbar gemacht' },
    ],
  },
  {
    version: '2.19.5',
    date: '20. Juli 2026',
    label: 'Diagnose: echte Reel-Fehlerursache',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Auto-Reel zeigt bei Problemen jetzt die echte FFmpeg-Ursache (stderr) statt einer leeren Fehlermeldung' },
    ],
  },
  {
    version: '2.19.4',
    date: '20. Juli 2026',
    label: 'Bugfix: Auto-Reel-Generierung',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Auto-Reel-Generierung schlug fehl, weil FFmpeg auf Vercel keine Schriftart für die Texteinblendungen fand' },
      { type: 'fixed', text: 'Schriftart wird jetzt mitgeliefert — Auto-Reel und manueller Reel-Schnitt funktionieren' },
    ],
  },
  {
    version: '2.19.3',
    date: '19. Juli 2026',
    label: 'UI: Einsteiger-Banner & Kartenseite aufgeräumt',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Einsteiger-Banner auf der Startseite überlappte mit dem Dashboard — jetzt sauber eingepasst' },
      { type: 'changed', text: 'Karten-Detailseite: „Merken" ist die primäre Aktion, Kauf-Links dezent und klein — Funktion im Vordergrund statt großer Affiliate-Buttons' },
    ],
  },
  {
    version: '2.19.2',
    date: '19. Juli 2026',
    label: 'Preis-Transparenz: passt zu Cardmarket',
    isLatest: false,
    changes: [
      { type: 'new',   text: 'Cardmarket-Aufschlüsselung auf jeder Kartenseite: Trend, günstigstes Angebot (ab), Ø Verkauf, Ø 30 Tage — kein Widerspruch mehr zu Cardmarket' },
      { type: 'new',   text: 'Datenstand jeder Karte sichtbar; bei älteren Daten Hinweis, aktuelle Preise auf Cardmarket zu prüfen' },
      { type: 'fixed', text: 'Ausreißer-Schutz: ein einzelnes Fake-Listing verzerrt Preis und Verlauf nicht mehr' },
    ],
  },
  {
    version: '2.19.1',
    date: '19. Juli 2026',
    label: 'Preise: saubere, echte Verläufe',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Preisverläufe wirkten oft künstlich linear — jetzt echte Zeit-Achse mit proportionalen Abständen und nur echten Datenpunkten' },
      { type: 'fixed', text: 'Echte Tagespreise werden bei jedem Kartenaufruf gespeichert; der Verlauf wird Tag für Tag genauer' },
      { type: 'fixed', text: 'Synthetische Beispielkurve komplett entfernt — bei zu wenig Daten nur aktueller Preis statt erfundener Kurve' },
    ],
  },
  {
    version: '2.19.0',
    date: '19. Juli 2026',
    label: 'Einsteiger-Seite & Einsteiger-Freundlichkeit',
    isLatest: false,
    changes: [
      { type: 'new', text: 'Neue Einsteiger-Seite /einsteiger: freundlicher Start ohne Jargon, „Was ist meine Karte wert?", 3-Schritte-Onboarding, ikonische Karten, Guides' },
      { type: 'new', text: '„Neu hier?"-Einstieg auf der Startseite — holt Neulinge ab, ohne Fortgeschrittene zu stören' },
      { type: 'new', text: 'Einstieg in NavBar, Footer und Sitemap verlinkt' },
    ],
  },
  {
    version: '2.18.1',
    date: '19. Juli 2026',
    label: 'Social-Sharing: dynamische Vorschaubilder',
    isLatest: false,
    changes: [
      { type: 'new', text: 'Geteilte Links (WhatsApp, Discord, X, Facebook) zeigen jetzt ein attraktives Vorschaubild statt nacktem Text' },
      { type: 'new', text: 'Karten-Vorschau mit Kartenmotiv + Preis, Artikel-Vorschau mit Titel + Leitkarte + Level' },
    ],
  },
  {
    version: '2.18.0',
    date: '19. Juli 2026',
    label: 'Content-System: moderner, mit Einsteiger-Mix',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Modernes bild-reiches Artikel-Layout mit Hero-Bild der Leitkarte — visuell einladend statt reiner Text' },
      { type: 'new',     text: 'Level-Badge (Einstieg / Fortgeschritten / Profi) auf jedem Artikel — Neulinge finden sofort passende Beiträge' },
      { type: 'new',     text: '„Weiterlesen"-Sektion mit verwandten Beiträgen am Artikelende — natürliche Verknüpfung der Inhalte' },
      { type: 'changed', text: 'Texte werden als professioneller Content-Creator geschrieben: starker Einstieg, aktueller Bezug, roter Faden, Anknüpfung an frühere Beiträge' },
    ],
  },
  {
    version: '2.17.3',
    date: '19. Juli 2026',
    label: 'Artikel-Caching robuster, neutralere Darstellung',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Artikel wurden im Vorlagen-Fall bei jedem Aufruf neu erzeugt — jetzt wird jede Datumsseite nur einmal erzeugt und dann dauerhaft aus dem Speicher bedient' },
      { type: 'changed', text: 'Neutralere Außendarstellung: sachliche Begriffe statt Hinweisen auf automatische Generierung; rechtliche Hinweise bleiben erhalten' },
    ],
  },
  {
    version: '2.17.2',
    date: '19. Juli 2026',
    label: 'Bugfix: Startseite ohne Trends',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Startseite zeigte keine Trends/Mover mehr, wenn die TCG-API beim Seitenaufbau kurz ausfiel — leere Version wurde gecacht' },
      { type: 'fixed', text: 'Neuer Fallback auf den letzten gespeicherten Marktbericht: lieber leicht ältere echte Daten als eine leere Startseite' },
    ],
  },
  {
    version: '2.17.1',
    date: '19. Juli 2026',
    label: 'Bugfix: Kartenbilder luden nicht',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Kartenbilder blieben leer (Detailseite, Suche, Artikel-Highlight): der Bild-Proxy vertrug sich nicht mit dem next/image-Optimizer' },
      { type: 'fixed', text: 'Proxy jetzt nur noch bei einfachen Bildern; optimierte Bilder laden wieder direkt — Robustheit bleibt erhalten' },
    ],
  },
  {
    version: '2.17.0',
    date: '19. Juli 2026',
    label: 'Auto-Reel: Social-Media-Videos aus Marktdaten',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Auto-Reel-Generator im Studio: Ein Klick rendert ohne Videomaterial ein fertiges Hochformat-Reel aus den Top-Mover-Karten der Woche' },
      { type: 'new',     text: 'Automatische Caption mit UTM-Link zur Website — Social-Traffic wird in Vercel Analytics messbar' },
      { type: 'new',     text: 'Ein-Klick-Workflow: Generieren, Vorschau, Caption bearbeiten, herunterladen oder direkt auf Instagram posten' },
    ],
  },
  {
    version: '2.16.0',
    date: '19. Juli 2026',
    label: 'SEO-Ausbau, Lucide-Icons, Kartenbild-Korrekturen',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Falsche Kartenbilder korrigiert: 7 von 9 hardcodierten Karten-IDs zeigten andere Karten als im Text beschrieben — alle per TCG-API verifiziert' },
      { type: 'fixed',   text: 'Erfundene Karten aus Artikeln entfernt (z.B. "Pikachu ex SIR" im 151-Set existiert nicht) — ersetzt durch real existierende Karten' },
      { type: 'fixed',   text: 'SEO: Unterseiten deklarierten fälschlich die Homepage als Canonical — jetzt eigene URL pro Seite' },
      { type: 'changed', text: 'Emojis komplett durch professionelle Lucide-Icons ersetzt — in UI, Artikeln, Guides und Überschriften; als Regel dauerhaft verankert' },
      { type: 'new',     text: 'JSON-LD Article-Schema auf Artikel- und Guide-Seiten, Top-40-Karten in der Sitemap' },
    ],
  },
  {
    version: '2.15.0',
    date: '18. Juli 2026',
    label: 'Bilder API-unabhängig: Caching-Proxy',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Bild-Caching-Proxy /api/img: Bilder bleiben bis zu 1 Jahr aus dem CDN-Cache verfügbar, auch wenn die externen Bild-Hosts ausfallen' },
      { type: 'changed', text: 'Alle Kartenbilder, Set-Logos und Booster-Artworks laufen jetzt über den Proxy (Suche, Artikel, Guides, Portfolio, Merkliste, Startseite)' },
      { type: 'changed', text: 'Bild-Optimizer-Cache auf 31 Tage erhöht — weniger Abhängigkeit von der TCG-API' },
    ],
  },
  {
    version: '2.14.2',
    date: '18. Juli 2026',
    label: '404-Bug auf Kartenseiten behoben',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Karten-Klicks führten bei API-Ausfällen zu 404, obwohl die Karten existieren' },
      { type: 'fixed', text: 'Bei API-Fehlern erscheint jetzt eine "Daten nicht erreichbar"-Seite mit Retry statt 404' },
      { type: 'fixed', text: 'Build-Vorrendern für Karten/Sets entfernt — keine fest gebackenen 404s mehr' },
    ],
  },
  {
    version: '2.14.1',
    date: '18. Juli 2026',
    label: 'Impressum & Datenschutz: rechtssicher',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Impressum mit Betreiberdaten befüllt, auf § 5 DDG aktualisiert, Markenhinweis ergänzt' },
      { type: 'changed', text: 'Datenschutzerklärung komplett neu — beschreibt den echten Datenfluss (cookieloses Analytics, lokale Speicher, externe Bilder)' },
    ],
  },
  {
    version: '2.14.0',
    date: '18. Juli 2026',
    label: 'Vercel Analytics + globaler Site-Footer',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Vercel Analytics: Besucher und Seitenaufrufe werden ab jetzt gemessen' },
      { type: 'new',     text: 'Globaler Footer mit Navigation (Markt/Wissen/Tools/Rechtliches) auf jeder Seite' },
      { type: 'changed', text: 'Doppelte Legal-Link-Zeilen aus 7 Seiten-Footern entfernt' },
    ],
  },
  {
    version: '2.13.0',
    date: '18. Juli 2026',
    label: 'Automatisierte Guide-Pipeline mit Qualitäts-Gate',
    isLatest: false,
    changes: [
      { type: 'new', text: 'Guides werden automatisch generiert (Di + Fr) — aus 12 kuratierten Sammler-Themen' },
      { type: 'new', text: 'Qualitäts-Gate: regelwidrige KI-Ausgaben werden nicht veröffentlicht' },
      { type: 'new', text: 'Guide-Übersicht und Sitemap zeigen statische + generierte Guides zusammen' },
    ],
  },
  {
    version: '2.12.0',
    date: '18. Juli 2026',
    label: 'Vorrendern + Bild-Shimmer: keine Erstbesucher-Wartezeit',
    isLatest: false,
    changes: [
      { type: 'new',     text: '12 neueste Set-Seiten + Top-20-Karten werden beim Deploy vorgerendert — sofort aus dem CDN' },
      { type: 'new',     text: 'Kartenbilder: animierter Shimmer-Platzhalter, dann weiches Einblenden statt Aufpoppen' },
      { type: 'changed', text: 'Lade-Skeletons nutzen denselben Shimmer — durchgängiger Look' },
    ],
  },
  {
    version: '2.11.1',
    date: '18. Juli 2026',
    label: 'Performance & Feedback: kein "totes" Klicken mehr',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Sofortiges Lade-Skeleton bei jeder Navigation — Klicks wirken nie mehr eingefroren' },
      { type: 'fixed', text: 'Formgetreue Skeletons für Karten-Detail, Set-Seiten und Artikel (mit Generierungs-Hinweis)' },
      { type: 'fixed', text: 'Fehlende 8s-Timeouts in Suche und Karten-Detail ergänzt' },
      { type: 'fixed', text: 'Tap-Feedback auf Karten-Kacheln und Startseiten-Zeilen (Mobile)' },
    ],
  },
  {
    version: '2.11.0',
    date: '17. Juli 2026',
    label: 'Portfolio-Chart auf Finance-App-Niveau',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Scrubbing: Beim Ziehen über den Chart zeigt der Header Wert, Veränderung und Datum am Finger' },
      { type: 'new',     text: 'Gestrichelte Baseline auf Zeitraum-Startwert — Kurve grün/rot relativ dazu' },
      { type: 'new',     text: 'Kurve rechts vom Finger dimmt beim Scrubben ab; Live-Punkt pulsiert' },
      { type: 'changed', text: 'Tooltip-Kästchen entfernt — Wert wandert in den Header (mobile-freundlicher)' },
    ],
  },
  {
    version: '2.10.1',
    date: '17. Juli 2026',
    label: 'Portfolio-Chart: lückenlose Tagesserie statt Sprung-Kurve',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Performance-Kurve ohne falsche Einbrüche: jede Karte zählt an jedem Besitztag (Carry-Forward)' },
      { type: 'fixed', text: 'Kurvenende entspricht jetzt exakt dem angezeigten Gesamtwert (Live-Preis als Endpunkt)' },
      { type: 'fixed', text: 'Zeitraum-Filter (1D/1W/1M/3M/1Y) filtert nach echten Tagen statt Datenpunkten' },
    ],
  },
  {
    version: '2.10.0',
    date: '17. Juli 2026',
    label: 'Merkliste + Bild-Text-Kopplung in Artikeln',
    isLatest: false,
    changes: [
      { type: 'new',   text: 'Merkliste: Karten beobachten, Preisveränderung seit Vormerkung — Button auf jeder Kartenseite' },
      { type: 'new',   text: 'NavBar-Link "Merkliste"' },
      { type: 'fixed', text: 'Kartenbilder passen jetzt immer zum Artikeltext (kein Pikachu-Bild bei Glurak-Text mehr)' },
      { type: 'fixed', text: 'Artikel-Galerien werden nicht mehr mit unpassenden Trending-Karten aufgefüllt' },
    ],
  },
  {
    version: '2.9.0',
    date: '17. Juli 2026',
    label: 'Set-Landingpages: SEO-Einstiege für jedes TCG-Set',
    isLatest: false,
    changes: [
      { type: 'new',     text: '/sets — Übersicht der 24 aktuellsten TCG-Sets mit Boosterpack-Bildern' },
      { type: 'new',     text: '/sets/[setCode] — pro Set alle handelbaren Karten nach Marktwert, Kauf-Button, JSON-LD' },
      { type: 'new',     text: 'NavBar-Link "Sets" + alle Set-Seiten in der Sitemap' },
      { type: 'fixed',   text: 'Set-Codes aus der URL werden validiert (Injection-Schutz), Set-Fetches mit Timeout' },
    ],
  },
  {
    version: '2.8.1',
    date: '17. Juli 2026',
    label: 'Schreibstil-System: Texte klingen menschlich, nicht nach KI',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Schreibstil-Anleitung mit 12 verbotenen KI-Mustern und Faktendichte-Test verankert' },
      { type: 'new',     text: 'KI-Generierung bekommt Stilregeln in jedem Prompt (direkter Fakteneinstieg, variabler Satzrhythmus)' },
      { type: 'new',     text: 'KI-Floskel-Blockliste + Emoji-Verbot im Compliance-Test — Verstöße blockieren den Build' },
      { type: 'changed', text: 'Fallback-Artikel: Floskel-Opener durch direkte Fakteneinstiege ersetzt' },
    ],
  },
  {
    version: '2.8.0',
    date: '17. Juli 2026',
    label: 'Inhaltlicher Komplett-Review: Wahrheitspflicht & Neutralität erzwungen',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Alle Artikel & Guides bereinigt: keine Preiszahlen im Fließtext, keine erfundenen Markt-Events, keine Kaufempfehlungen oder Renditeversprechen' },
      { type: 'changed', text: '10 unerreichbare statische Artikel entfernt (lagen auf Nicht-Publish-Tagen)' },
      { type: 'changed', text: 'KI-Prompt gehärtet: Zahlen nur aus echten Daten, keine Anlageberatung, keine erfundenen Fakten' },
      { type: 'new',     text: 'Compliance-Test-Suite erzwingt die Content-Regeln maschinell bei jedem Build' },
      { type: 'changed', text: 'Changelog, Impressum, Datenschutz und Admin-Bereich auf Dark-Design umgestellt' },
      { type: 'fixed',   text: 'Artikel-Hinweistext korrigiert: Erscheinung sonntags + donnerstags statt "täglich"' },
    ],
  },
  {
    version: '2.7.3',
    date: '28. Juni 2026',
    label: 'Technisches Aufräumen: Crons, Sitemap, ISR',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Verwaiste Cron-Jobs entfernt (Mittwochs-Artikel war unerreichbar, Montags-Rückblick redundant)' },
      { type: 'changed', text: 'Sitemap um Guides, Artikel und Marktberichte erweitert — bessere SEO-Crawlbarkeit' },
      { type: 'changed', text: 'Karten-Detailseite auf ISR (1h) — weniger TCG-API-Last und redundante Snapshots' },
      { type: 'changed', text: 'STATUS.md auf aktuellen Stand gebracht' },
    ],
  },
  {
    version: '2.7.2',
    date: '28. Juni 2026',
    label: 'Suche: keine leeren Karten ohne Bild/Preis mehr',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Leere Preview-Karten (kein Bild/Preis) werden aus Suche & Ergebnissen gefiltert — zentral an einer Stelle' },
      { type: 'fixed',   text: 'Such-Dropdown auf Dark Mode umgestellt (war noch weiß)' },
      { type: 'changed', text: 'displayPrice()-Helper als Single Source für den Marktpreis; 73 Tests' },
    ],
  },
  {
    version: '2.7.1',
    date: '28. Juni 2026',
    label: 'Artikel-Generierung: Selbstheilung + 404-Fix',
    isLatest: false,
    changes: [
      { type: 'fixed', text: '404 auf der heutigen Artikel-Seite vor 12:00 UTC behoben (Datums-String-Vergleich statt Zeitstempel)' },
      { type: 'fixed', text: 'Artikel werden on-demand generiert, wenn der Cron sie nicht erzeugt hat — Seite selbstheilend' },
      { type: 'fixed', text: 'Daily-Cron revalidiert jetzt auch die Artikel-Detailseite (keine 24h-Leerversion mehr)' },
      { type: 'fixed', text: 'Publish-Day-Check vereinheitlicht — kein TZ-Auseinanderlaufen von Wochentag und Artikeltyp' },
    ],
  },
  {
    version: '2.7.0',
    date: '24. Juni 2026',
    label: 'Code-Review: Sicherheit, Robustheit & Architektur',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Timing-safe Auth-Vergleich (crypto.timingSafeEqual) + Fail-closed in Production' },
      { type: 'fixed',   text: 'API-Fehler leaken keine internen Details mehr; Suchquery wird sanitisiert' },
      { type: 'fixed',   text: 'Cardmarket-Preis nutzt Median statt Minimum — robuster gegen Fake-Listings' },
      { type: 'fixed',   text: 'Externe Preis-Fetches mit 8s-Timeout; Sprachwechsel lädt Preise korrekt neu' },
      { type: 'fixed',   text: 'Portfolio zeigt Fehler-Hinweis bei Preisabruf; LangPicker dark; Trend-Farbe vereinheitlicht' },
      { type: 'changed', text: 'CLAUDE.md + neuer /code-review-Skill verankern Architektur-Regeln; 65 Tests' },
    ],
  },
  {
    version: '2.6.2',
    date: '24. Juni 2026',
    label: 'Portfolio: P&L an Zeitraum gekoppelt',
    isLatest: false,
    changes: [
      { type: 'new',   text: 'P&L-Zahlen oben im Portfolio folgen dem gewählten Zeitraum (1D/1W/1M/3M/1Y)' },
      { type: 'new',   text: 'Sublabel zeigt Zeitraum + Startwert statt immer "seit Kauf"' },
      { type: 'new',   text: 'Linienfarbe des Charts passt sich ebenfalls dem Zeitraum an' },
    ],
  },
  {
    version: '2.6.1',
    date: '24. Juni 2026',
    label: 'Portfolio Dark Mode + Preis-Bug-Fix',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Portfolio: vollständig auf dunkles Design umgestellt (Seite, Karten, Modals, LangPicker)' },
      { type: 'changed', text: 'CTA-Buttons in Portfolio-Modals: Violet statt Schwarz' },
      { type: 'fixed',   text: 'Kaufpreis-Eingabe: negatives Vorzeichen wird auf iOS/Android jetzt blockiert' },
    ],
  },
  {
    version: '2.6.0',
    date: '23. Juni 2026',
    label: 'Einheitliches Dark Mode Design auf allen Seiten',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Bloomberg/TradingView-Design-System auf alle Seiten und Komponenten ausgerollt' },
      { type: 'changed', text: 'NavBar: dunkle Variante mit Disclaimer-Bar und Violet-Akzenten' },
      { type: 'changed', text: 'CardGrid, ArticleCardGallery, CardLangPrice, SearchResultsLang: vollständig dunkel' },
      { type: 'changed', text: 'Alle Seiten (Suche, Artikel, Guides, Marktbericht, Karten-Detail): einheitliche Dark-Palette' },
      { type: 'new',     text: 'NavBar auf Karten-Detailseite ergänzt (fehlte vorher)' },
      { type: 'changed', text: 'CLAUDE.md: Design-Token-Tabelle, Code-Patterns und Verbotsliste dauerhaft verankert' },
    ],
  },
  {
    version: '2.5.4',
    date: '23. Juni 2026',
    label: 'Newsletter global deaktiviert',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Newsletter-Formular von Guides, Marktbericht und Wochenberichten entfernt' },
      { type: 'changed', text: 'Ungenutzte Imports (NewsletterSignup, Suspense) aus betroffenen Seiten bereinigt' },
    ],
  },
  {
    version: '2.5.3',
    date: '23. Juni 2026',
    label: 'Datenintegrität: Guides + Fallback-Preise + CLAUDE.md-Absicherung',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'guides.ts: erfundene historische Preiszahlen durch qualitative Formulierungen ersetzt' },
      { type: 'changed', text: 'article-generator.ts fallbackArticle: alle hardcodierten Preiszahlen aus Fließtext entfernt' },
      { type: 'changed', text: 'static-articles.ts: unverifizierten Illustratoren-Attribution entfernt' },
      { type: 'changed', text: 'CLAUDE.md: 6 absolute Verbote mit Begründung, Beispielen und Commit-Checkliste verankert' },
    ],
  },
  {
    version: '2.5.2',
    date: '23. Juni 2026',
    label: 'Datenintegrität: Archiv-Disclaimer, Persona-Bereinigung',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Archiv-Disclaimer Banner auf statischen Artikeln — "Preisangaben können veraltet sein · Cardmarket prüfen"' },
      { type: 'new',     text: 'isStatic-Flag auf Article-Interface — kennzeichnet Archiv- und Fallback-Artikel' },
      { type: 'changed', text: 'Alle statischen Artikel: Ich-Perspektive und Persona-Stimme vollständig entfernt' },
      { type: 'changed', text: 'Umbreon VMAX Artikel: erfundene Zahlenreihe durch qualitative Marktbeschreibung ersetzt' },
      { type: 'changed', text: 'Shining Pikachu PSA-10-Preis: unbelegte Behauptung entfernt' },
      { type: 'changed', text: 'Kaufempfehlungs-Titel neutralisiert ("Jetzt kaufen..." → "Was Sammler im Blick haben sollten")' },
    ],
  },
  {
    version: '2.5.1',
    date: '23. Juni 2026',
    label: 'Sprachauswahl EN/DE/JP/KR für Kartenpreise in Suche + Detail',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Sprachauswahl EN/DE/JP/KR in der Suche — Cardmarket-Preise für die gewählte Kartensprache werden live geladen' },
      { type: 'new',     text: 'Sprachauswahl auf der Karten-Detailseite — Preis wechselt live beim Klick' },
      { type: 'new',     text: 'Sprach-Badge neben dem Preis im Kartengitter (DE/JP/KR sichtbar markiert)' },
      { type: 'new',     text: 'Fallback-Hinweis wenn Cardmarket OAuth nicht konfiguriert ist' },
    ],
  },
  {
    version: '2.5.0',
    date: '23. Juni 2026',
    label: 'Startseite Redesign: Bloomberg/TradingView Dark Mode',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Komplett neues Homepage-Design im Bloomberg Terminal / TradingView / CoinMarketCap Stil' },
      { type: 'new',     text: 'Dark Mode als Standard — schwarz-anthrazit Hintergrund auf der Startseite' },
      { type: 'new',     text: 'Ticker Strip mit echten Cardmarket-Preisen und Trends aller Top-Mover (horizontaler Scroll)' },
      { type: 'new',     text: '4 KPI-Karten: PMI (gewichteter Marktindex), Marktbreite, Marktstimmung, Fear & Greed Index' },
      { type: 'new',     text: 'Fear & Greed Meter — visueller Gradient-Balken aus echten Breadth- und Momentum-Daten' },
      { type: 'new',     text: 'Inline SVG Sparklines — serverseitig gerenderte Mini-Charts in Gewinner/Verlierer-Listen' },
      { type: 'new',     text: 'Trending Karten Tabelle (CoinMarketCap-Stil): Rang, Bild, Name, Preis, 30T%' },
      { type: 'new',     text: 'Investor Insights — automatisch generierte Datenpunkte aus echten API-Daten' },
      { type: 'new',     text: 'Top Sets Tabelle — aggregiert nach Set: Ø Preis, Ø Trend, Anzahl Karten' },
      { type: 'changed', text: 'Blog-Teaser aktualisiert auf korrekten Publish-Plan (So/Do statt täglich)' },
    ],
  },
  {
    version: '2.4.5',
    date: '23. Juni 2026',
    label: 'Blog: nur Sonntags + Donnerstags — 404-Fix, Newsletter entfernt',
    isLatest: false,
    changes: [
      { type: 'changed', text: 'Blog erscheint nur noch sonntags (Wochenrückblick) und donnerstags (rotierender Artikel)' },
      { type: 'changed', text: '"Heute neu"-Badge erscheint nur noch wenn heute wirklich ein Publish-Day ist' },
      { type: 'changed', text: 'Cron generiert Artikel nur an So/Do — andere Tage werden übersprungen' },
      { type: 'fixed',   text: '/artikel/[date] gibt 404 für Nicht-Publish-Tage — kein Zombie-State mehr' },
      { type: 'fixed',   text: 'Newsletter aus Artikel-Detailseite entfernt' },
    ],
  },
  {
    version: '2.4.4',
    date: '23. Juni 2026',
    label: 'Startseite: Error-Box entfernt, Newsletter deaktiviert',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Gelbe Error-Box "Kartendaten nicht verfügbar" dauerhaft entfernt — bei API-Ausfall zeigt die Seite einfach weniger, keine Fehlermeldung' },
      { type: 'fixed',   text: 'Graceful Degradation: error-State entfernt, Karten-Sektionen sind ohnehin schon cards.length > 0 bedingt' },
      { type: 'changed', text: 'Newsletter-Sektion auf der Startseite ausgeblendet (Funktion vorhanden, aber noch nicht aktiv)' },
    ],
  },
  {
    version: '2.4.3',
    date: '23. Juni 2026',
    label: 'BUGFIX: iOS-Zoom unterdrückt — font-size 16px auf allen Inputs',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'iOS-Zoom-Bug: alle Inputs in Modals haben jetzt font-size 16px — Safari zoomt nicht mehr automatisch rein beim Antippen' },
      { type: 'fixed',   text: 'Delete-Button auf Mobile versteckt (hidden sm:block) — war unsichtbar aber 30px breit und hat Holdings-Zeile gequetscht' },
      { type: 'fixed',   text: 'Metadaten-Zeile (Anzahl · Kaufpreis · Datum) mit truncate abgesichert — kein Überlauf bei langen Werten' },
    ],
  },
  {
    version: '2.4.2',
    date: '23. Juni 2026',
    label: 'BUGFIX: Mobile Modals Vollbild-Overlay — kein dvh, safe-area, Header immer sichtbar',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'AddCardModal + EditCardModal: Vollbild-Overlay statt Bottom-Sheet — Header fliegt nicht mehr aus dem Viewport wenn Tastatur öffnet' },
      { type: 'fixed',   text: 'EditCardModal: gleiche iOS-sichere Architektur wie AddCardModal (absolute inset-0, sm:static rounded-3xl)' },
      { type: 'fixed',   text: 'Header: env(safe-area-inset-top) für Notch / Dynamic Island' },
      { type: 'fixed',   text: 'Safe-area-bottom Spacer in beiden Modals (kein Inhalt hinter Home Indicator)' },
      { type: 'changed', text: 'Drag-Handle-Pill entfernt — passt nicht zu Vollbild-Overlay-Konzept' },
    ],
  },
  {
    version: '2.4.1',
    date: '22. Juni 2026',
    label: 'BUGFIX: Mobile Suche — Nested Scroll, Sticky Search, Touch-Targets',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Nested-Scroll entfernt — Vorschlagsliste scrollt jetzt im Modal-Body (iOS-kompatibel)' },
      { type: 'fixed',   text: 'Suchfeld sticky im Modal — bleibt sichtbar beim Scrollen der Ergebnisse' },
      { type: 'fixed',   text: 'Preis-Spalte min-width — wird bei langen Kartennamen nicht mehr gequetscht' },
      { type: 'fixed',   text: 'Kartennamen 2-zeilig (statt hard-truncate) für bessere Lesbarkeit auf Mobile' },
      { type: 'fixed',   text: 'WebkitOverflowScrolling: touch für iOS-Momentum-Scroll im Modal' },
    ],
  },
  {
    version: '2.4.0',
    date: '22. Juni 2026',
    label: 'Portfolio Premium-UI: Clean-Look, Segmented Control, Badges',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Segmented-Control für Zeitraum-Auswahl (iOS-Pill-Stil)' },
      { type: 'new',     text: 'Sprach-Badge [EN/DE/JP/KR] als kleiner Chip — kein Emoji-Freitext mehr' },
      { type: 'changed', text: 'Violett komplett entfernt — Grau-900 als einzige Akzentfarbe' },
      { type: 'changed', text: 'Chart: Y-Achsen-Labels entfernt für cleanen Look' },
      { type: 'changed', text: 'P&L-Zeile ohne Icons — reine Zahlen, Trade Republic-Stil' },
      { type: 'changed', text: '+ Karte → + Position als dunkles Pill-Button' },
    ],
  },
  {
    version: '2.3.0',
    date: '22. Juni 2026',
    label: 'Chart-Redesign (Custom SVG), Mobile-Modal-Fix, Portfolio-Tests',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Custom SVG Chart — kein Recharts, cubic-bezier, Gradient, Mouse+Touch-Crosshair' },
      { type: 'new',     text: 'src/lib/portfolio.ts — pure Business-Logic, vollständig testbar' },
      { type: 'new',     text: '59 Vitest-Tests für alle Portfolio-Kernfunktionen' },
      { type: 'new',     text: 'Mobile Modal: dvh-Viewport für Keyboard-bewusste Höhe' },
      { type: 'fixed',   text: 'Mobile: Modal wurde vom Keyboard überdeckt' },
      { type: 'fixed',   text: 'Mobile: Suchfeld-Attribute für korrekte Darstellung' },
      { type: 'changed', text: 'Recharts entfernt — schnelleres Rendering, kleinerer Bundle' },
    ],
  },
  {
    version: '2.2.0',
    date: '22. Juni 2026',
    label: 'Sprachspezifische Preise: EN / DE / JP / KR',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Cardmarket OAuth 1.0 API-Client — echte Preise für EN, DE, JP, KR' },
      { type: 'new',     text: 'Sprachauswahl beim Hinzufügen/Bearbeiten (🇬🇧 🇩🇪 🇯🇵 🇰🇷)' },
      { type: 'new',     text: 'Sprach-Flag-Badge auf jedem Karten-Bild in der Holdings-Liste' },
      { type: 'changed', text: '/api/portfolio/prices: neues Format { cards: [{id, language, name}] }' },
      { type: 'changed', text: 'Bestandsdaten in localStorage auf language: EN normalisiert (rückwärtskompatibel)' },
    ],
  },
  {
    version: '2.1.7',
    date: '22. Juni 2026',
    label: 'Portfolio-Chart: sofortige Anzeige, keine Animation',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Chart-Animation deaktiviert — reagiert sofort statt 1–2 Sek. Verzögerung bei jedem Update' },
      { type: 'fixed', text: 'Chart zeigt sofort Kaufpreis-Fallback bevor die API antwortet — kein leerer Zustand mehr' },
      { type: 'changed', text: 'RANGE_DAYS als Modul-Konstante (nicht bei jedem Render neu erzeugt)' },
    ],
  },
  {
    version: '2.1.6',
    date: '22. Juni 2026',
    label: 'Bugfix: Versionsnummer im Footer',
    isLatest: false,
    changes: [
      { type: 'fixed', text: 'Footer zeigte keine Version — NEXT_PUBLIC_APP_VERSION (nicht gesetzt) durch npm_package_version ersetzt' },
    ],
  },
  {
    version: '2.1.5',
    date: '22. Juni 2026',
    label: 'Portfolio: NavBar + Suche 20 Ergebnisse',
    isLatest: false,
    changes: [
      { type: 'new',   text: 'NavBar im Portfolio auf allen Zuständen — Nutzer nicht mehr eingeschlossen' },
      { type: 'new',   text: 'Suche im Karte-hinzufügen-Modal: bis zu 20 Ergebnisse (vorher 6)' },
      { type: 'new',   text: 'Ergebniszähler „X Karten gefunden" über der scrollbaren Liste (max-h-72)' },
      { type: 'fixed', text: '/api/search/suggestions: searchCards(q, 6) → searchCards(q, 20)' },
    ],
  },
  {
    version: '2.1.4',
    date: '22. Juni 2026',
    label: 'Lückenlose Release-Dokumentation',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'CHANGELOG.md: vollständige Historie v0.1.0 → v2.1.3' },
      { type: 'new',     text: '/changelog-Seite: alle 20 Versionen mit fixed-Badge (Wrench-Icon, orange)' },
      { type: 'new',     text: 'CLAUDE.md: Release-Notes-Pflicht — 3 Dateien müssen synchron sein' },
    ],
  },
  {
    version: '2.1.3',
    date: '22. Juni 2026',
    label: 'Portfolio: Edit-Modal, Chart-Fix, Y-Achse, Zeitbereiche',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Karten-Edit via Klick auf die Zeile — öffnet EditCardModal (Anzahl, Kaufpreis, Kaufdatum; "Karte entfernen" im Modal)' },
      { type: 'changed', text: 'Inline-Qty-Controls entfernt; Zeile zeigt kompakt "3× · à 45,00 € · 15.06.26"' },
      { type: 'fixed',   text: 'Chart startete 30 Tage in der Vergangenheit — jetzt zählt Preishistorie erst ab purchaseDate' },
      { type: 'new',     text: 'Y-Achse mit €-Werten im Gesamtchart (auto-skaliert, 4 Ticks)' },
      { type: 'new',     text: '5 Zeitbereiche: 1D · 1W · 1M · 3M · 1Y (immer sichtbar)' },
    ],
  },
  {
    version: '2.1.2',
    date: '22. Juni 2026',
    label: 'Portfolio: Reset-Button mit Bestätigungs-Dialog',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Trash-Icon neben Add-Button öffnet Confirmation-Modal vor dem Löschen' },
      { type: 'new',     text: 'Modal zeigt Anzahl der Positionen und warnt vor unwiderruflichem Löschen' },
      { type: 'new',     text: '"Alles löschen" leert localStorage + State; Klick auf Backdrop schließt ohne Aktion' },
    ],
  },
  {
    version: '2.1.1',
    date: '22. Juni 2026',
    label: 'Portfolio: Kaufdatum',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Pflichtfeld "Kaufdatum" im Karte-hinzufügen-Modal (default: heute, max: heute)' },
      { type: 'new',     text: 'Kaufdatum wird als purchaseDate in PortfolioHolding gespeichert und in der Liste angezeigt' },
    ],
  },
  {
    version: '2.1.0',
    date: '22. Juni 2026',
    label: 'Portfolio-Tracker (Finance-App-Style)',
    isLatest: false,
    changes: [
      { type: 'new',     text: '/portfolio — localStorage-basierter Karten-Portfolio-Tracker' },
      { type: 'new',     text: 'Finance-App-UI: großer Gesamtwert, grün/rot P&L, Recharts AreaChart mit dynamischem Gradient' },
      { type: 'new',     text: 'Zeitraumauswahl 1W / 1M — Chart aggregiert Cardmarket-Preishistorie aller Positionen' },
      { type: 'new',     text: 'Karte-hinzufügen-Modal: Suche (debounced 320ms), Quantity + Kaufpreis, Gesamteinstand-Vorschau' },
      { type: 'new',     text: '/api/portfolio/prices — Batch-Preisabruf (TCG API, 5min Cache)' },
      { type: 'new',     text: 'NavBar: "Portfolio" Link (Desktop + Mobile) mit BarChart3-Icon' },
    ],
  },
  {
    version: '2.0.1',
    date: '22. Juni 2026',
    label: 'Reels: Video-Preview + Custom Cut-Position',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Lokales Video-Preview sofort nach Auswahl (object URL, kein Upload nötig)' },
      { type: 'new',     text: 'Trim-Schritt: vollständige Wiedergabe des Originalvideos zum Scrubben' },
      { type: 'new',     text: '"Aktuelle Position übernehmen" — Button liest playback-Zeit aus → befüllt Start-Zeitfeld' },
      { type: 'new',     text: 'FFmpeg: Pre-Input-Seek + -t duration bei gesetztem startTime; Fallback auf -sseof' },
    ],
  },
  {
    version: '2.0.0',
    date: '22. Juni 2026',
    label: 'Instagram Reels Pipeline',
    isLatest: false,
    changes: [
      { type: 'new',     text: '/api/video/upload-url — signierte Supabase Upload-URL (umgeht Vercel-Body-Limit)' },
      { type: 'new',     text: '/api/video/process — FFmpeg: letzte N Sekunden, 9:16-Crop, Branding, Caption via Claude Haiku' },
      { type: 'new',     text: '/api/video/publish-instagram — 3-Schritt Meta Graph API (Container → Poll → Publish)' },
      { type: 'new',     text: 'ReelsStudio: Upload → Preview → Trim → Process → Vorschau + Caption → Instagram' },
      { type: 'new',     text: 'Studio: neuer Tab "Reels" mit ReelsStudio-Komponente' },
    ],
  },
  {
    version: '0.9.6',
    date: '21. Juni 2026',
    label: 'Server-Auth via HttpOnly-Cookie',
    isLatest: false,
    changes: [
      { type: 'new',     text: '/api/studio-auth — POST setzt HttpOnly-Cookie (SHA-256 von STUDIO_PASSWORD)' },
      { type: 'new',     text: '/api/monitoring + /api/status — prüfen studio_session-Cookie, 401 wenn fehlt' },
      { type: 'new',     text: '/monitoring — eigene Seite mit gleichem Auth-Gate wie /studio' },
      { type: 'changed', text: 'Logout: DELETE /api/studio-auth löscht Cookie (7 Tage Laufzeit)' },
    ],
  },
  {
    version: '0.9.5',
    date: '21. Juni 2026',
    label: 'Booster-Pack-Artwork + Blog-Listing',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'BoosterPackImage: Produktbilder von assets.pokemon.com CDN mit Fallback auf Set-Logo' },
      { type: 'new',     text: 'Blog-Listing zeigt echte Artikel-Titel (nicht mehr generisch)' },
    ],
  },
  {
    version: '0.9.4',
    date: '21. Juni 2026',
    label: 'Studio: Skills & Workflows-Sektion',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Monitoring-Seite: Skills & Workflows-Tab liest automatisch .claude/commands/' },
    ],
  },
  {
    version: '0.9.3',
    date: '21. Juni 2026',
    label: 'Booster-Set-Logo unter allen Karten',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Booster-Pack-Logo unter Karten in Artikeln und Guides (BoosterPackImage-Pflicht umgesetzt)' },
    ],
  },
  {
    version: '0.9.2',
    date: '21. Juni 2026',
    label: 'ArticleCardGallery + Guide-Kartenbilder',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'ArticleCardGallery: Recharts-Preischart in Artikel-Karten-Sektionen' },
      { type: 'fixed',   text: 'Guide-Karten zeigen echte Bilder statt 🃏-Emoji-Placeholder' },
    ],
  },
  {
    version: '0.9.1',
    date: '21. Juni 2026',
    label: 'NavBar-Hotfix',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'Bottom-Tab-Bar entfernt (zerstörte Layout auf Mobil) — zurück zur Single-Top-Bar' },
    ],
  },
  {
    version: '0.9.0',
    date: '21. Juni 2026',
    label: 'NavBar-Redesign + Blog-Fallback-Artikel',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'Fallback-Artikel mit echtem Marktanalyse-Inhalt (kein Marco-Persona-Name)' },
      { type: 'changed', text: 'NavBar-Redesign (anschließend in 0.9.1 revertiert)' },
    ],
  },
  {
    version: '0.8.0',
    date: '21. Juni 2026',
    label: 'Artikel-Bilder + Booster-Set-Logos in Guides',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'FeaturedCards-Komponente: echte Karten-Thumbnails in Artikeln' },
      { type: 'new',     text: 'ArticleGallery: Bild-Galeriesektion in Artikeln' },
      { type: 'new',     text: 'Booster-Set-Logos in Guide-Karten' },
    ],
  },
  {
    version: '0.5.3',
    date: '21. Juni 2026',
    label: 'CSS-Fix + Homepage Static/ISR',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'CSS-Verlust: <head>-Tag aus layout.tsx entfernt (Next.js injiziert CSS selbst)' },
      { type: 'fixed',   text: 'Homepage wieder ○ Static / ISR — cookies() aus Server-Component entfernt' },
      { type: 'changed', text: 'Alle externen Bilder via next/image mit remotePatterns konfiguriert' },
    ],
  },
  {
    version: '0.5.2',
    date: '21. Juni 2026',
    label: 'BUGFIX: Style-Verlust durch JSON-Import',
    isLatest: false,
    changes: [
      { type: 'fixed',   text: 'import x from "./package.json" crashte Vercels Turbopack-Build → kein CSS. Fix: process.env.npm_package_version' },
    ],
  },
  {
    version: '0.5.1',
    date: '21. Juni 2026',
    label: 'Dokumentation',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'CLAUDE.md erstellt — dauerhaftes Arbeitsgedächtnis für Claude Code' },
      { type: 'new',     text: 'STATUS.md aktualisiert' },
    ],
  },
  {
    version: '0.5.0',
    date: '21. Juni 2026',
    label: 'i18n, Autocomplete, SEO',
    isLatest: false,
    changes: [
      { type: 'new',     text: 'i18n DE/EN via lang-Cookie — NavBar-Umschalter' },
      { type: 'new',     text: 'Suche-Autocomplete: /api/search/suggestions mit debounce 320ms' },
      { type: 'new',     text: 'Loading-Skeleton auf Suchergebnisseite' },
      { type: 'new',     text: 'SEO: JSON-LD (Product+Offer, ItemList), Sitemap, robots.txt, OpenGraph' },
      { type: 'new',     text: 'Version im Footer (aus npm_package_version)' },
    ],
  },
  {
    version: '0.4.0',
    date: '20. Juni 2026',
    label: 'Marktbericht & Blog',
    isLatest: false,
    changes: [
      { type: 'new', text: '/marktbericht — Wöchentliche KI-Marktanalyse (ISR 7 Tage)' },
      { type: 'new', text: '/artikel — Blog-Index der letzten 14 Tage mit Featured-Card' },
      { type: 'new', text: '/artikel/[date] — 7 Artikel-Typen je Wochentag, ISR 24h' },
      { type: 'new', text: 'Täglicher Cron 08:00 — Artikel vorwärmen & Listing revalidieren' },
      { type: 'new', text: 'Studio: Veröffentlichen-Button mit Live-Feedback' },
      { type: 'new', text: 'NavBar: Marktbericht, Blog, Newsletter, Studio' },
      { type: 'new', text: 'Homepage: Blog-Teaser-Sektion' },
      { type: 'new', text: 'Newsletter: Strukturiertes HTML-Template statt freiem Claude-Output' },
      { type: 'changed', text: 'vercel.json: zweiter Cron 0 8 * * * für tägliches Artikel-Vorwärmen' },
    ],
  },
  {
    version: '0.3.0',
    date: '20. Juni 2026',
    label: 'Mobile & Studio-Überarbeitung',
    isLatest: false,
    changes: [
      { type: 'new', text: 'Studio: Schritt-für-Schritt Fortschrittsanzeige & Sekunden-Timer' },
      { type: 'new', text: 'Studio: Letzter Output bleibt nach Reload erhalten (localStorage)' },
      { type: 'new', text: 'Studio: Kopieren & Löschen Buttons' },
      { type: 'new', text: 'NavBar: Sticky mit Logo und Studio-Link' },
      { type: 'new', text: 'AffiliateBar: Snap-Scroll auf Mobil' },
      { type: 'new', text: 'NewsletterSignup: Perk-Liste & gelber CTA-Button' },
      { type: 'changed', text: 'Homepage: kompakterer Hero auf Mobil, Trust-Badges' },
    ],
  },
  {
    version: '0.2.0',
    date: '20. Juni 2026',
    label: 'Rechtliches & Karten-Details',
    isLatest: false,
    changes: [
      { type: 'new', text: '/impressum — Impressum (§ 5 TMG)' },
      { type: 'new', text: '/datenschutz — DSGVO-konforme Datenschutzerklärung' },
      { type: 'new', text: '/karten/[id] — Karten-Detailseite mit Investment-Score & Preis-Details' },
      { type: 'new', text: 'PriceChart-Komponente — 30-Tage-Verlauf (recharts)' },
      { type: 'changed', text: 'CardGrid: Jede Karte verlinkt auf /karten/[id]' },
      { type: 'changed', text: 'Footer: Impressum/Datenschutz-Links' },
    ],
  },
  {
    version: '0.1.0',
    date: '20. Juni 2026',
    label: 'Erstveröffentlichung',
    isLatest: false,
    changes: [
      { type: 'new', text: 'Next.js 16 App Router, TypeScript, Tailwind CSS v4' },
      { type: 'new', text: '/ — Startseite mit Kartenpreisen, Investment-Scores, Newsletter' },
      { type: 'new', text: '/studio — Content-Steuerzentrale (5 Content-Typen)' },
      { type: 'new', text: '/api/cron — Wöchentliche Pipeline (Mo 07:00)' },
      { type: 'new', text: 'KI-Engine: Marktbericht, Newsletter, Video-Skript, Social-Posts' },
      { type: 'new', text: 'Pokémon TCG API Integration' },
      { type: 'new', text: 'Beehiiv Newsletter-System' },
      { type: 'new', text: 'Remotion Video-Animationen (YouTube + Shorts)' },
      { type: 'new', text: 'Affiliate-Links: Cardmarket, Amazon, Trade Republic' },
    ],
  },
];

const TYPE_STYLE = {
  new:     { icon: Plus,       color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Neu' },
  changed: { icon: RefreshCw,  color: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'Geändert' },
  fixed:   { icon: Wrench,     color: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Behoben' },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      <NavBar />

      <header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
        <div className="max-w-2xl mx-auto px-4 pt-10 pb-12">
          <Link href="/" className="min-h-[32px] inline-flex items-center gap-1.5 text-slate-600 hover:text-violet-400 text-xs mb-5 transition-colors">
            <ArrowLeft size={12} /> Zur Startseite
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <GitMerge size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Release-History</p>
              <h1 className="text-2xl font-black text-white">Changelog</h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            Alle Versionen von PokéMarket Intelligence — was wann hinzugekommen ist.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16 pt-6 space-y-4">
        {RELEASES.map((release) => (
          <div key={release.version} className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e30] flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-white text-base">v{release.version}</span>
                  {release.isLatest && (
                    <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Aktuell
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-300">{release.label}</p>
              </div>
              <span className="text-xs text-slate-600 shrink-0 pt-0.5">{release.date}</span>
            </div>

            <ul className="divide-y divide-[#1e1e30]">
              {release.changes.map((change, i) => {
                const style = TYPE_STYLE[change.type as keyof typeof TYPE_STYLE];
                const Icon = style.icon;
                return (
                  <li key={i} className="flex items-start gap-3 px-5 py-3">
                    <div className={`w-5 h-5 rounded-full ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={10} className={style.color} />
                    </div>
                    <span className="text-sm text-slate-400 leading-relaxed">{change.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <p className="text-center text-xs text-slate-600 pt-2">
          Vollständiger Verlauf: <a href="https://github.com/SKKJbeer/NewIdea/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[32px] items-center text-violet-400 underline hover:text-violet-300">CHANGELOG.md auf GitHub</a>
        </p>
      </main>
    </div>
  );
}
