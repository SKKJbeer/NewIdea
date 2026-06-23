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
    version: '2.5.2',
    date: '23. Juni 2026',
    label: 'Datenintegrität: Archiv-Disclaimer, Persona-Bereinigung',
    isLatest: true,
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
  new:     { icon: Plus,       color: 'text-green-600',  bg: 'bg-green-50',  label: 'Neu' },
  changed: { icon: RefreshCw,  color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Geändert' },
  fixed:   { icon: Wrench,     color: 'text-orange-600', bg: 'bg-orange-50', label: 'Behoben' },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <header className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-10 pb-12">
          <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-xs mb-5 transition-colors">
            <ArrowLeft size={12} /> Zur Startseite
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <GitMerge size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Release-History</p>
              <h1 className="text-2xl font-black">Changelog</h1>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Alle Versionen von PokéMarket Intelligence — was wann hinzugekommen ist.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16 -mt-4 space-y-4">
        {RELEASES.map((release) => (
          <div key={release.version} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-gray-900 text-base">v{release.version}</span>
                  {release.isLatest && (
                    <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Aktuell
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-700">{release.label}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 pt-0.5">{release.date}</span>
            </div>

            <ul className="divide-y divide-gray-50">
              {release.changes.map((change, i) => {
                const style = TYPE_STYLE[change.type as keyof typeof TYPE_STYLE];
                const Icon = style.icon;
                return (
                  <li key={i} className="flex items-start gap-3 px-5 py-3">
                    <div className={`w-5 h-5 rounded-full ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={10} className={style.color} />
                    </div>
                    <span className="text-sm text-gray-700 leading-relaxed">{change.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pt-2">
          Vollständiger Verlauf: <a href="https://github.com/SKKJbeer/NewIdea/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-700 underline">CHANGELOG.md auf GitHub</a>
        </p>
      </main>
    </div>
  );
}
