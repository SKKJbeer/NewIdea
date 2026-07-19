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
    version: '2.18.1',
    date: '19. Juli 2026',
    label: 'Social-Sharing: dynamische Vorschaubilder',
    isLatest: true,
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
      { type: 'new',     text: 'Ticker Strip mit echten Echtzeit-Preisen und Trends aller Top-Mover (horizontaler Scroll)' },
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
          <Link href="/" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-violet-400 text-xs mb-5 transition-colors">
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
          Vollständiger Verlauf: <a href="https://github.com/SKKJbeer/NewIdea/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline">CHANGELOG.md auf GitHub</a>
        </p>
      </main>
    </div>
  );
}
