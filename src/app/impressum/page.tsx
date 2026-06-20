import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum — PokéMarket Intelligence',
  robots: { index: false },
};

export default function Impressum() {
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

        <h1 className="text-3xl font-black text-gray-900 mb-8">Impressum</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-gray-900 mb-2">Angaben gemäß § 5 TMG</h2>
            <p>
              [Dein Vor- und Nachname]<br />
              [Straße und Hausnummer]<br />
              [PLZ Ort]
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Kontakt</h2>
            <p>E-Mail: [deine@email.de]</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
            <p>
              [Dein Vor- und Nachname]<br />
              [Straße und Hausnummer]<br />
              [PLZ Ort]
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Haftungsausschluss</h2>
            <h3 className="font-semibold mt-3 mb-1">Haftung für Inhalte</h3>
            <p>
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Die Inhalte
              stellen keine Anlageberatung dar und ersetzen diese nicht.
            </p>
            <h3 className="font-semibold mt-3 mb-1">Haftung für Links</h3>
            <p>
              Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">Affiliate-Hinweis</h2>
            <p>
              Diese Website enthält Affiliate-Links. Wenn du über diese Links einkaufst, erhalten
              wir eine kleine Provision — für dich entstehen dabei keine Mehrkosten.
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            Bitte trage deine persönlichen Kontaktdaten in die eckigen Klammern ein,
            bevor diese Seite live geht.
          </p>
        </div>
      </div>
    </div>
  );
}
