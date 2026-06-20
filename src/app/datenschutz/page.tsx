import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz — PokéMarket Intelligence',
  robots: { index: false },
};

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 text-sm mb-8"
        >
          <ArrowLeft size={16} />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-black text-gray-900 mb-8">Datenschutzerklärung</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-gray-900 mb-2">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO ist:<br />
              [Dein Vor- und Nachname]<br />
              [Straße und Hausnummer]<br />
              [PLZ Ort]<br />
              E-Mail: [deine@email.de]
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">2. Hosting</h2>
            <p>
              Diese Website wird bei <strong>Vercel Inc.</strong> (340 Pine Street, Suite 701, San Francisco,
              CA 94104, USA) gehostet. Beim Besuch dieser Website werden durch Vercel automatisch
              Server-Logfiles gespeichert, die deine IP-Adresse, Browsertyp, Betriebssystem und
              Zugriffszeit enthalten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an einem sicheren Betrieb der Website). Vercel ist nach dem EU-US Data Privacy
              Framework zertifiziert.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">3. Newsletter (Beehiiv)</h2>
            <p>
              Wenn du dich für unseren Newsletter anmeldest, wird deine E-Mail-Adresse an
              <strong> Beehiiv</strong> (Morning Brew LLC, USA) übermittelt und dort gespeichert.
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Du kannst deine
              Einwilligung jederzeit durch Klick auf den Abmeldelink im Newsletter widerrufen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">4. Kartenpreisdaten (Pokémon TCG API)</h2>
            <p>
              Kartendaten und Preise werden über die <strong>Pokémon TCG API</strong> (TCGdex) abgerufen.
              Dabei werden keine personenbezogenen Daten übertragen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">5. Affiliate-Links</h2>
            <p>
              Diese Website enthält Affiliate-Links zu Cardmarket, Amazon und weiteren Partnern.
              Wenn du auf einen Affiliate-Link klickst, wird dies durch den jeweiligen Anbieter
              per Cookie erfasst. Diese Cookie-Setzung liegt im Verantwortungsbereich des jeweiligen
              Anbieters. Bitte beachte die Datenschutzerklärungen der jeweiligen Anbieter.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">6. Deine Rechte (Art. 15–22 DSGVO)</h2>
            <p>Du hast das Recht auf:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Beschwerde bei der zuständigen Aufsichtsbehörde (Art. 77 DSGVO)</li>
            </ul>
            <p className="mt-2">
              Anfragen richten an: [deine@email.de]
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">7. Cookies</h2>
            <p>
              Diese Website verwendet keine eigenen Cookies zur Nachverfolgung oder Analyse.
              Affiliate-Links können durch externe Anbieter Cookies setzen (siehe Punkt 5).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">8. Keine Analysedienste</h2>
            <p>
              Diese Website verwendet kein Google Analytics, keine Tracking-Pixel und keine
              sozialen Plugins, die Daten an Dritte übermitteln.
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            Stand: Juni 2026 —
            Trage deine persönlichen Daten in die eckigen Klammern ein, bevor diese Seite live geht.
          </p>
        </div>
      </div>
    </div>
  );
}
