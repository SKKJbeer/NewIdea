import type { Metadata } from 'next';

// Wie beim Portfolio: Client-Komponente, deshalb liegen die Metadaten hier.
export const metadata: Metadata = {
  title: 'Merkliste — beobachtete Pokémon-Karten | CardBeacon',
  description:
    'Behalte ausgewählte Pokémon-Karten im Blick: aktueller Marktpreis und Entwicklung deiner gemerkten Karten auf einen Blick.',
  alternates: { canonical: '/merkliste' },
};

export default function MerklisteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
