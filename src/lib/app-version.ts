// VERSION DER ANWENDUNG — eine Konstante, kein Kunststück.
//
// VORGESCHICHTE: In der Fußzeile stand live ein nacktes „v" ohne Nummer, und
// zwar durchgehend. Damit war der Pflicht-Schritt „Live-Seite verifizieren:
// Fußzeile zeigt vX.Y.Z" auf Produktion nie durchführbar — man sah einem
// Deployment schlicht nicht an, ob es angekommen war.
//
// Zwei Versuche über die Umgebung sind gescheitert, beide lautlos:
//   1. `process.env.npm_package_version` — npm setzt das nur im Build-Prozess
//      selbst; der Server, der die Seite später ausliefert, kennt es nicht.
//   2. `env: { NEXT_PUBLIC_APP_VERSION }` in next.config.ts — Werte mit diesem
//      Präfix behandelt Next.js über einen eigenen Weg und ersetzt sie hier
//      nicht. Auch ohne Präfix bleibt der Wert unter Turbopack leer.
//
// Beide Male sah der Code richtig aus und lieferte nichts. Eine Konstante kann
// das nicht: Sie steht im Bündel, egal wer baut. Der Preis ist, dass sie zur
// Version in package.json passen muss — genau das prüft
// `qa-regressionen.test.ts` und bricht den Build, wenn beim Versionssprung
// eine der beiden Stellen vergessen wird.
export const APP_VERSION = '3.1.3';
