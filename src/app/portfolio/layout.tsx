import type { Metadata } from 'next';

// Die Portfolio-Seite ist eine Client-Komponente und kann selbst keine
// Metadaten exportieren — ohne dieses Layout stand sie ohne Titel und ohne
// Beschreibung im Index, obwohl sie in der Sitemap gelistet ist.
export const metadata: Metadata = {
  title: 'Portfolio — Sammlungswert & Entwicklung | PokéMarket Intelligence',
  description:
    'Trage deine Pokémon-Karten ein und verfolge Sammlungswert, Entwicklung, stärkste Positionen und die Aufteilung nach Set — mit echten Cardmarket-Preisen.',
  alternates: { canonical: '/portfolio' },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
