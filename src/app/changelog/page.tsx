import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { ArrowLeft, GitMerge, Plus, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — PokéMarket Intelligence',
  description: 'Release-History und Versionsübersicht von PokéMarket Intelligence.',
  robots: { index: false },
};

const RELEASES = [
  {
    version: '0.4.0',
    date: '20. Juni 2026',
    label: 'Marktbericht & Blog',
    isLatest: true,
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
  new:     { icon: Plus,       color: 'text-green-600', bg: 'bg-green-50',  label: 'Neu' },
  changed: { icon: RefreshCw,  color: 'text-blue-600',  bg: 'bg-blue-50',   label: 'Geändert' },
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
