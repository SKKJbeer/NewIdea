import Link from 'next/link';
import { Package, Sparkles, ArrowRight } from 'lucide-react';
import { CardThumb } from './CardThumb';
import { formatEur, formatPercent } from '@/lib/format';
import { SECTION_LABEL, toneClass } from '@/lib/ui';
import { bewegung30, ohneCases } from '@/lib/neuheiten-zuordnung';
import type { ProduktPreis, JapanSet, NeuheitenDatei } from '@/lib/neuheiten';
import type { IndexTreffer } from '@/lib/card-index';

// BAUSTEINE DER THEMEN-SEITE (/trends) — auch auf Startseite und im
// Marktbericht. Jede Zahl hier ist ein Cardmarket-Preis mit Stand; nirgends
// steht eine Aussage, die nicht aus diesen Daten folgt.

export const tagDe = (iso: string) => {
  const [j, m, t] = iso.slice(0, 10).split('-');
  return `${t}.${m}.${j}`;
};

export const tageSeit = (iso: string, jetzt = Date.now()) =>
  Math.max(0, Math.floor((jetzt - Date.parse(iso.slice(0, 10))) / 86_400_000));

/** Versiegelte Produkte: Name, Preis-Trend, Bewegung gegen Ø 30 (falls vorhanden). */
export function VersiegeltListe({ produkte, max = 8 }: { produkte: ProduktPreis[]; max?: number }) {
  if (produkte.length === 0) return null;
  return (
    <ul className="divide-y divide-[#1c1c24] rounded-xl border border-[#2a2a3a] bg-[#13131e]">
      {produkte.slice(0, max).map((p) => {
        const b = bewegung30(p.preis);
        return (
          <li key={p.produkt} className="flex items-center gap-3 px-4 py-2.5">
            <Package size={14} className="shrink-0 text-violet-400" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[13px] text-slate-300">{p.name}</span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="block text-[13px] font-semibold text-slate-100">{formatEur(p.preis.trend)}</span>
              {b !== null && <span className={`block text-[11px] ${toneClass(b)}`}>{formatPercent(b)} (30 T)</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Karten aus dem eigenen Index (frische Preise), als Reihe mit Bild. */
export function KartenReihe({ karten, max = 8 }: { karten: IndexTreffer[]; max?: number }) {
  if (karten.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {karten.slice(0, max).map((k) => {
        const preis = k.prices.market ?? 0;
        const t = typeof k.trendPercent === 'number' && k.realData ? k.trendPercent : null;
        return (
          <Link
            key={k.id}
            href={`/karten/${k.id}`}
            className="group rounded-xl border border-[#2a2a3a] bg-[#13131e] p-2.5 transition-all hover:border-violet-500/30 hover:bg-[#1a1a28]"
          >
            <span className="block aspect-[63/88] overflow-hidden rounded-md bg-[#0e0e13]">
              <CardThumb src={k.imageUrl} alt={k.name} width={160} height={224} className="h-full w-full object-contain" />
            </span>
            <span className="mt-2 block truncate text-[12px] font-semibold text-slate-200">{k.nameDe ?? k.name}</span>
            <span className="block truncate text-[10px] text-slate-600">{k.set}{k.number ? ` · ${k.number}` : ''}</span>
            <span className="mt-1 flex items-baseline justify-between gap-2 tabular-nums">
              <span className="text-[13px] font-bold text-white">{formatEur(preis)}</span>
              {t !== null && <span className={`text-[11px] ${toneClass(t)}`}>{formatPercent(t)}</span>}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Karten mit mehreren identisch benannten Drucken — alle Preise, keine Zuordnung. */
export function MehrdeutigListe({ eintraege }: { eintraege: Array<{ name: string; preise: number[] }> }) {
  if (eintraege.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
        Diese Karten gibt es in mehreren Drucken mit identischem Namen und identischen Attacken (z. B. normal und
        Illustration Rare). Cardmarket führt jeden Druck mit eigenem Preis — welcher Preis zu welchem Druck gehört,
        lässt sich aus dem Preisverzeichnis nicht eindeutig ablesen. Deshalb stehen hier alle Preise nebeneinander.
      </p>
      <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {eintraege.map((m) => (
          <li key={m.name} className="flex items-baseline justify-between gap-3 border-b border-[#1c1c24] py-1.5 text-[12px]">
            <span className="truncate text-slate-300">{m.name}</span>
            <span className="shrink-0 tabular-nums text-slate-400">{m.preise.map((p) => formatEur(p)).join(' · ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ein japanisches Set, das es in unseren Quellen noch nicht auf Englisch gibt. */
export function JapanBlock({ set }: { set: JapanSet }) {
  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-white">
          {set.nameEn ?? set.name}
          {set.nameEn && <span className="ml-2 text-[13px] font-normal text-slate-500">{set.name}</span>}
        </h3>
        <span className="text-[11px] text-slate-500">
          Set-Code {set.id} · in Japan erschienen am {tagDe(set.datum)} · {set.gesamt} Karten
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-600">
        Eine englische Ausgabe führen unsere Quellen noch nicht. Preise: Cardmarket, japanische Ausgabe.
      </p>
      {set.versiegelt.length > 0 && (
        <div className="mt-4">
          <VersiegeltListe produkte={set.versiegelt} max={3} />
        </div>
      )}
      <ul className="mt-4 divide-y divide-[#1c1c24]">
        {set.karten.slice(0, 6).map((k) => {
          const b = bewegung30(k.preis);
          return (
            <li key={k.id} className="flex items-center gap-3 py-2">
              {k.bild ? (
                <CardThumb src={k.bild} alt={k.nameEn ?? k.name} width={36} height={50} className="h-[50px] w-9 shrink-0 rounded-[3px] object-contain" />
              ) : (
                <span className="flex h-[50px] w-9 shrink-0 items-center justify-center rounded-[3px] border border-[#2a2a3a] text-[9px] text-slate-600">{k.nummer}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-slate-200">{k.nameEn ?? k.name}</span>
                <span className="block truncate text-[11px] text-slate-600">
                  {k.nameEn ? `${k.name} · ` : ''}{set.id} {k.nummer}{k.rarity ? ` · ${k.rarity}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="block text-[13px] font-bold text-white">{formatEur(k.preis.trend)}</span>
                {b !== null && <span className={`block text-[11px] ${toneClass(b)}`}>{formatPercent(b)} (30 T)</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Kurzfassung für Startseite und Marktbericht — nur, was die Datei belegt. */
export function ThemenTeaser({ neuheiten }: { neuheiten: NeuheitenDatei | null }) {
  if (!neuheiten) return null;
  const punkte: Array<{ titel: string; text: string }> = [];
  const jubilaeum = neuheiten.sets.find((s) => /30th/i.test(s.name) && s.versiegelt.length > 0);
  if (jubilaeum) {
    const etb = jubilaeum.versiegelt.find((p) => /^30th Celebration Elite Trainer Box$/i.test(p.name));
    const booster = jubilaeum.versiegelt.find((p) => /^30th Celebration Booster$/i.test(p.name));
    punkte.push({
      titel: '30 Jahre Pokémon TCG',
      text: `„${jubilaeum.name}“ seit ${tageSeit(jubilaeum.datum)} Tagen im Handel${
        etb ? ` · Elite Trainer Box ${formatEur(etb.preis.trend)}` : ''}${booster ? ` · Booster ${formatEur(booster.preis.trend)}` : ''}`,
    });
  }
  const neu = neuheiten.sets.find((s) => !/30th/i.test(s.name) && ohneCases(s.versiegelt, 1).length > 0);
  if (neu) {
    // Ohne Kartons: „6 Booster Box Case" ist kein Produkt, das Leser kaufen.
    const p = ohneCases(neu.versiegelt, 1)[0];
    punkte.push({ titel: `Neuerscheinung: ${neu.name}`, text: `Seit ${tageSeit(neu.datum)} Tagen · teuerstes versiegeltes Produkt ${p.name} ${formatEur(p.preis.trend)}` });
  }
  const jp = neuheiten.japan[0];
  if (jp && jp.karten[0]) {
    punkte.push({
      titel: `Zuerst in Japan: ${jp.nameEn ?? jp.name}`,
      text: `Erschienen am ${tagDe(jp.datum)} · teuerste Karte ${jp.karten[0].nameEn ?? jp.karten[0].name} ${formatEur(jp.karten[0].preis.trend)}`,
    });
  }
  if (punkte.length === 0) return null;
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-[#13131e] p-5">
      <p className={`${SECTION_LABEL} flex items-center gap-1.5`}>
        <Sparkles size={12} className="text-violet-400" aria-hidden /> Was den Markt gerade bewegt
      </p>
      <ul className="mt-3 space-y-3">
        {punkte.map((p) => (
          <li key={p.titel}>
            <p className="text-[14px] font-semibold text-slate-100">{p.titel}</p>
            <p className="text-[12px] leading-relaxed text-slate-400">{p.text}</p>
          </li>
        ))}
      </ul>
      <Link href="/trends" prefetch={false} className="mt-4 inline-flex min-h-[40px] items-center gap-1 text-[12px] font-semibold text-violet-400 hover:text-violet-300">
        Alle Trends &amp; Neuheiten <ArrowRight size={13} />
      </Link>
      <p className="mt-1 text-[10px] text-slate-600">Preise: Cardmarket-Preisverzeichnis, Stand {tagDe(neuheiten.stand)}</p>
    </div>
  );
}
