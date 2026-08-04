// VERSION DER ANWENDUNG — eine Konstante, kein Kunststück.
//
// VORGESCHICHTE: In der Fußzeile stand live ein nacktes „v" ohne Nummer, und
// zwar durchgehend. Damit war der Pflicht-Schritt „Live-Seite verifizieren:
// Fußzeile zeigt vX.Y.Z" auf Produktion nie durchführbar — man sah einem
// Deployment schlicht nicht an, ob es angekommen war.
//
// URSACHE WAR: `process.env.npm_package_version`. Diese Variable setzt npm beim
// Ausführen eines Skripts — der Build-Befehl auf Vercel lautete aber `next
// build` und lief an npm vorbei. Die Anzeige war also an eine Bedingung
// geknüpft, die man dem Code nicht ansieht und die ein geänderter Build-Befehl
// jederzeit wieder verletzt.
//
// Eine Konstante kennt diese Bedingung nicht: Sie steht im Bündel, egal wer wie
// baut. Der Preis ist, dass sie zur Version in package.json passen muss — genau
// das prüft `qa-regressionen.test.ts` und bricht den Build, wenn beim
// Versionssprung eine der beiden Stellen vergessen wird.
export const APP_VERSION = '5.6.0';
