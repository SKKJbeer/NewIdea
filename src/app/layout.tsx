import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemarketintelligence.com';
const SITE_NAME = 'PokéMarket Intelligence';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Pokémon Karten Preise & Investment`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Echtzeit-Preise von Cardmarket für Pokémon-Sammelkarten. Täglich aktualisierte Investment-Scores, Preistrends und Marktberichte. Kostenlos & auf Deutsch.',
  keywords: [
    'Pokémon Karten wert',
    'Pokémon TCG Preise',
    'Cardmarket Pokémon EUR',
    'Pokémon Karten Investment',
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
    title: `${SITE_NAME} — Pokémon Karten Preise & Investment`,
    description:
      'Echte Cardmarket-Preise, Investment-Scores und Markttrends für Pokémon-Sammelkarten. Täglich aktualisiert.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Pokémon Karten Preise`,
    description: 'Echte Cardmarket-Preise & Investment-Scores für Pokémon-Karten.',
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0f]">
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
