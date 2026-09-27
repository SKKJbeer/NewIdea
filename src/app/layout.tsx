import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/components/AppShell";
import { Seitenzaehler } from "@/components/Seitenzaehler";
import "./globals.css";
import { siteUrlOrLocal } from '@/lib/site';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Keine geratene Adresse — siehe site.ts.
const SITE_URL = siteUrlOrLocal();
const SITE_NAME = 'CardBeacon';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Pokémon Karten Preise & Marktanalyse`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Cardmarket-Preise für Pokémon-Sammelkarten. Täglich aktualisierte Markt-Scores, Preistrends und Marktberichte. Kostenlos & auf Deutsch.',
  keywords: [
    'Pokémon Karten wert',
    'Pokémon TCG Preise',
    'Cardmarket Pokémon EUR',
    'Pokémon Karten Marktanalyse',
    'Pokémon Karten Trend',
    'seltene Pokémon Karten Preis',
    'Pokémon Karten verkaufen Preis',
    'Charizard Karte Wert',
    'Pikachu Karte Preis',
    'Pokémon Sammelkarten Wertentwicklung',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    alternateLocale: ['en_US'],
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Pokémon Karten Preise & Marktanalyse`,
    description:
      'Echte Cardmarket-Preise, Markt-Scores und Markttrends für Pokémon-Sammelkarten. Täglich aktualisiert.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Pokémon Karten Preise`,
    description: 'Echte Cardmarket-Preise & Markt-Scores für Pokémon-Karten.',
  },
  // EIGENTUMSNACHWEIS FUER SUCHMASCHINEN-KONSOLEN.
  //
  // Auf einer vercel.app-Adresse gibt es keinen DNS-Zugang — der Weg ist das
  // HTML-Meta-Tag. Der Code kommt aus der Umgebung, damit fuer die Anmeldung
  // bei Google Search Console und Bing Webmaster Tools kein Code-Aenderung
  // noetig ist: Wert eintragen, neu deployen, in der Konsole bestaetigen.
  // Ohne Variable entsteht kein Tag (Next laesst leere Eintraege weg).
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  alternates: {
    // Relativ ('./') → löst pro Seite auf die eigene URL auf (mit metadataBase).
    // NIEMALS SITE_URL absolut setzen: das würde von JEDER Unterseite als
    // "Canonical = Homepage" vererbt und Unterseiten aus dem Index drängen.
    canonical: './',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#070810]">
        {/* DIE NAVIGATION GEHOERT INS GRUNDGERUEST, NICHT AUF EINE SEITE.
            Sie stand zuerst nur auf der Startseite — und verschwand damit,
            sobald jemand einen Reiter oeffnete. Navigation, die beim Navigieren
            weg ist, ist keine.

            Hier steht sie einmal und gilt fuer alle siebzehn Seiten. Unterhalb
            von `lg` bleibt es bei der Kopfleiste (`NavBar`, dort `lg:hidden`) —
            eine 236-px-Leiste neben 390 px Inhalt waere kein Menue, sondern
            ein Rand. */}
        <AppShell>{children}</AppShell>
        {/* ZAEHLUNG DER AUFRUFE — eigene Erfassung, siehe `src/lib/aufrufe.ts`.
            `<Analytics />` daneben ist keine Doppelung: Vercel zaehlt nur im
            eigenen Dashboard und beantwortet die Frage „ueber welchen Weg?"
            in der kostenlosen Stufe nicht.

            DIE SUSPENSE-GRENZE IST PFLICHT, nicht Vorsicht: `useSearchParams`
            ohne sie nimmt JEDE Seite aus der statischen Erzeugung heraus —
            dieselbe Falle wie `cookies()` in einem Server-Baustein
            (Stolperstelle 8). Ein Zaehler, der die ganze Seite langsamer
            macht, kostet mehr, als er misst. */}
        <Suspense fallback={null}>
          <Seitenzaehler />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
