import Link from 'next/link';
import { Zap } from 'lucide-react';

const NAV_GROUPS: Array<{ label: string; links: Array<{ href: string; label: string }> }> = [
  {
    label: 'Markt',
    links: [
      { href: '/suche', label: 'Karten-Suche' },
      { href: '/sets', label: 'Sets' },
      { href: '/marktbericht', label: 'Marktbericht' },
    ],
  },
  {
    label: 'Wissen',
    links: [
      { href: '/artikel', label: 'Blog' },
      { href: '/guides', label: 'Guides' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    label: 'Tools',
    links: [
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/merkliste', label: 'Merkliste' },
    ],
  },
  {
    label: 'Rechtliches',
    links: [
      { href: '/impressum', label: 'Impressum' },
      { href: '/datenschutz', label: 'Datenschutz' },
    ],
  },
];

// Globaler Site-Footer — auf jeder Seite (layout.tsx). Interne Verlinkung für
// SEO + einheitlicher Abschluss. Seiten-spezifische Disclaimer-Boxen bleiben
// in den Seiten; die Legal-Links leben nur noch hier.
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#1e1e30] bg-[#0d0d18]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <Zap size={14} className="text-yellow-300 fill-yellow-300" />
              </div>
              <span className="font-black text-slate-200 text-sm">
                Pokémon<span className="text-violet-400">Market</span>
              </span>
            </Link>
            <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">
              Cardmarket-Preise, Markttrends und Sammler-Wissen für das Pokémon-TCG.
            </p>
          </div>

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">{group.label}</p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs text-slate-500 hover:text-violet-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-5 border-t border-[#1e1e30] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-slate-600 text-center sm:text-left leading-relaxed">
            Inoffizielle Fan-Seite · Kein offizielles Pokémon-Produkt · Keine Anlageberatung · Alle Preise ohne Gewähr.
            Pokémon ist eine Marke von Nintendo / Creatures Inc. / GAME FREAK Inc.
          </p>
          <p className="text-[10px] text-slate-700 font-mono shrink-0">
            v{process.env.npm_package_version}
          </p>
        </div>
      </div>
    </footer>
  );
}
