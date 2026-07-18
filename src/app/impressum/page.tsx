import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum — PokéMarket Intelligence',
  robots: { index: false },
};

export default function Impressum() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm mb-8"
        >
          <ArrowLeft size={16} />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-black text-slate-200 mb-8">Impressum</h1>

        <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-6 space-y-6 text-slate-400 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-slate-200 mb-2">Angaben gemäß § 5 DDG</h2>
            <p>
              Steffen Karjoth<br />
              Corelliweg 28<br />
              70195 Stuttgart<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">Kontakt</h2>
            <p>E-Mail: bierfinanzen@gmail.com</p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
            <p>
              Steffen Karjoth<br />
              Corelliweg 28<br />
              70195 Stuttgart
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">Haftungsausschluss</h2>
            <h3 className="font-semibold mt-3 mb-1 text-slate-300">Haftung für Inhalte</h3>
            <p>
              Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die
              Richtigkeit, Vollständigkeit und Aktualität der Inhalte — insbesondere der angezeigten
              Marktpreise — wird keine Gewähr übernommen. Die Inhalte stellen keine Anlageberatung
              dar und ersetzen diese nicht.
            </p>
            <h3 className="font-semibold mt-3 mb-1 text-slate-300">Haftung für Links</h3>
            <p>
              Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
              Anbieter verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">Affiliate-Hinweis</h2>
            <p>
              Diese Website enthält Affiliate-Links (gekennzeichnet). Wenn du über diese Links
              einkaufst, erhalten wir eine Provision — für dich entstehen dabei keine Mehrkosten.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">Markenhinweis</h2>
            <p>
              Pokémon und alle zugehörigen Namen und Abbildungen sind Marken von Nintendo,
              Creatures Inc. und GAME FREAK Inc. Diese Website ist ein inoffizielles Fan-Projekt
              und steht in keiner Verbindung zu diesen Unternehmen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
