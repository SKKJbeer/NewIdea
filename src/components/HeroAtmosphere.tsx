// DIE ATMOSPHAERE DES HERO — sieben Ebenen, wie vorgegeben.
//
// Der Hintergrund ist NICHT schwarz. Tiefe entsteht nicht aus einer Farbe,
// sondern daraus, dass mehrere sehr schwache Ebenen uebereinanderliegen und
// keine davon fuer sich auffaellt. Genau das laesst sich mit einem einzelnen
// Verlauf nicht erreichen — ein Verlauf sieht immer nach Verlauf aus.
//
//   1. Tiefes Mitternachtsblau als Grund
//   2. Grosse blaue Atmosphaere
//   3. Grosse violette Atmosphaere
//   4. Warmes goldenes Licht
//   5. Sehr feines holografisches Korn
//   6. Sehr zurueckhaltende diagonale Struktur
//   7. Die gepraegte Folie (Guilloche, berechnet)
//
// LICHT STATT FARBE: Die Hoefe sind unsichtbare Lichtquellen — oben links,
// Mitte, oben rechts, unten. Kein Neon, kein RGB, nur weiches Aufhellen.
//
// LEISTUNG: ausschliesslich CSS-Verlaeufe und SVG. Kein Bild, kein Video,
// keine Leinwand, kein WebGL, keine dauerhafte Animation. `aria-hidden`.

export function HeroAtmosphere({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* ── 1 · TIEFES MITTERNACHTSBLAU ──────────────────────────────────
          Kein Schwarz. Ein Blauschwarz, das nach oben hin minimal aufhellt —
          so, wie ein Raum nach oben hin heller wird. */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(178deg, #0b0d1f 0%, #080a18 46%, #06070f 100%)' }}
      />

      {/* ── 2 · GROSSE BLAUE ATMOSPHAERE ─────────────────────────────────
          Oben rechts, weit ueber den Rand hinaus. Die Quelle selbst bleibt
          unsichtbar; man sieht nur, dass es dort heller ist. */}
      <div
        className="absolute -right-[22%] -top-[38%] h-[125vh] w-[85vw] rounded-full blur-[170px]"
        style={{ background: 'radial-gradient(closest-side, rgba(42,86,190,0.34), transparent)' }}
      />

      {/* ── 3 · GROSSE VIOLETTE ATMOSPHAERE ──────────────────────────────
          Oben links und ein zweites Mal tief unten — die beiden halten die
          Komposition zusammen, ohne dass eine Mitte entsteht. */}
      <div
        className="absolute -left-[24%] -top-[30%] h-[110vh] w-[76vw] rounded-full blur-[165px]"
        style={{ background: 'radial-gradient(closest-side, rgba(96,58,206,0.32), transparent)' }}
      />
      <div
        className="absolute -bottom-[46%] left-[18%] h-[92vh] w-[70vw] rounded-full blur-[180px]"
        style={{ background: 'radial-gradient(closest-side, rgba(120,54,196,0.2), transparent)' }}
      />

      {/* ── 4 · WARMES GOLDENES LICHT ────────────────────────────────────
          Die einzige warme Quelle, links auf Hoehe der Ueberschrift. Sie ist
          der Grund, warum die Seite kostbar statt kuehl wirkt — ohne sie
          bleibt jedes Blau-Violett technisch. */}
      <div
        className="absolute left-[2%] top-[6%] h-[62vh] w-[48vw] rounded-full blur-[150px]"
        style={{ background: 'radial-gradient(closest-side, rgba(198,140,66,0.17), transparent)' }}
      />
      <div
        className="absolute left-[30%] top-[-14%] h-[46vh] w-[34vw] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(closest-side, rgba(232,186,120,0.09), transparent)' }}
      />

      {/* ── 5 · HOLOGRAFISCHES KORN ──────────────────────────────────────
          Zwei sehr feine, gegenlaeufige Punktraster. Sie nehmen den Verlaeufen
          die Glaette — ohne Korn sieht ein weicher Verlauf auf einem grossen
          Bildschirm nach Stufenbildung aus, nicht nach Material. */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.035) 0.5px, transparent 0.5px), radial-gradient(rgba(190,200,255,0.03) 0.5px, transparent 0.5px)',
          backgroundSize: '3px 3px, 5px 5px',
          backgroundPosition: '0 0, 1px 2px',
        }}
      />

      {/* ── 6 · DIAGONALE STRUKTUR ───────────────────────────────────────
          Flach gestellte Schlieren, wie auf einer gekippten Folienkarte.
          Weit auseinander und sehr schwach — sie sollen den Raum gliedern,
          nicht auffallen. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(112deg, transparent 0 96px, rgba(255,255,255,0.012) 96px 97px, transparent 97px 210px)',
        }}
      />
      <div
        className="absolute -left-[10%] -top-[16%] h-[150%] w-[46%] -rotate-[22deg]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(150,180,255,0.04) 40%, rgba(255,214,158,0.035) 62%, transparent)',
        }}
      />

      {/* ── 7 · DIE GEPRAEGTE FOLIE ─────────────────────────────────────
          Was hier VORHER stand, war ein Drachenkopf aus von Hand gesetzten
          Bezier-Punkten. Der Befund dazu lautete: „sieht aus wie von einem
          Kind gemalt" — und das lag nicht an zu wenig Muehe, sondern an der
          Technik. Anatomie entsteht aus tausenden Entscheidungen ueber Kontur,
          Volumen und Licht; als Zahlenreihe in eine Datei getippt ergibt sie
          Striche, keine Kreatur. Weitere Anlaeufe haetten daran nichts
          geaendert.

          JETZT: eine Guilloche — die verschlungene Linienrosette von
          Wertpapieren und den Rueckseiten veredelter Sammelkarten. Sie ist
          BERECHNET (`src/lib/foil-art.ts`), nicht gezeichnet, und kann deshalb
          gar nicht kindlich wirken. Und sie gehoert hierher: Die Bildsprache
          einer veredelten Karte ist die des Gegenstands, um den es auf dieser
          Seite geht.

          BEWUSST KEINE FIGUR. Eine erkennbare Pokemon-Gestalt waere eine
          Schutzrechtsverletzung — daran aendert auch eine gelockerte Hausregel
          nichts, und die Seite nennt sich selbst eine inoffizielle Fan-Seite.
          Muster, Licht und Folie sind frei.

          ALS EIGENE DATEI, nicht als SVG im Markup: Die Rosette besteht aus
          zehntausenden Koordinaten. Im Markup wuerde sie die Seitenantwort
          vervielfachen — und zwar doppelt, weil Next die Struktur zusaetzlich
          als RSC-Nutzlast mitschickt. So laedt sie einmal und wird
          zwischengespeichert. Erzeugt mit `npm run folie`. */}
      <div
        className="absolute inset-0 hidden opacity-[0.85] md:block"
        style={{
          backgroundImage: 'url(/hintergrund-folie.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'right top',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Abschluss nach unten: Der Hero endet nicht an einer Kante, sondern
          laeuft in den Seitengrund aus. */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[#070810]" />
    </div>
  );
}
