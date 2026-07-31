import { BRAND } from '@/lib/brand';

// WORTMARKE
//
// Bewusst KEIN Bildzeichen im üblichen Sinn. Ein Logo, das ein Kartenspiel
// abbildet (Pokéball, Kartenfächer, Blitz), wäre in dem Moment falsch, in dem
// ein zweiter Markt dazukommt — und es sähe aus wie das Produkt, von dem sich
// CardBeacon unterscheiden soll.
//
// Das Zeichen ist ein Leuchtfeuer, auf seinen Kern reduziert: ein Punkt und
// zwei Bögen, die von ihm ausgehen. Es funktioniert einfarbig, bei 16 px, in
// Schwarzweiß und neben jedem Kartenspiel-Namen.
//
// Kein Verlauf. Verläufe sind das Erkennungszeichen automatisch erzeugter
// Logos, und genau danach soll das hier nicht aussehen.

export function BeaconMark({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Der Kern — das Signal selbst. */}
      <circle cx="4" cy="8" r="2" fill="currentColor" />
      {/* Zwei Bögen nach rechts: die Ausbreitung. Unterschiedliche Deckkraft
          erzeugt Tiefe ohne Verlauf. */}
      <path
        d="M8 4.2a5 5 0 0 1 0 7.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M11.4 2a8.6 8.6 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

/**
 * Die Wortmarke.
 *
 * `Card` in normaler Stärke, `Beacon` kräftiger — der Ton liegt auf dem Teil,
 * der die Marke trägt. Kein Farbwechsel innerhalb des Wortes: Zweifarbige
 * Wortmarken („Poké**Market**") sind das Muster, das jede zweite Sammel-App
 * verwendet.
 */
export function Wordmark({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const text = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-[13px]' : 'text-sm';
  const mark = size === 'lg' ? 20 : size === 'sm' ? 14 : 16;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <BeaconMark size={mark} className="text-slate-300" />
      <span className={`${text} tracking-tight text-slate-200`}>
        <span className="font-normal">Card</span>
        <span className="font-semibold">Beacon</span>
      </span>
      <span className="sr-only">{BRAND}</span>
    </span>
  );
}
