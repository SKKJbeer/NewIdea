import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/SiteFooter";
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
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
