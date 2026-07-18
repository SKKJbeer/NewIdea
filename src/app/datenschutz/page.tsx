import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz — PokéMarket Intelligence',
  robots: { index: false },
};

export default function Datenschutz() {
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

        <h1 className="text-3xl font-black text-slate-200 mb-8">Datenschutzerklärung</h1>

        <div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-6 space-y-6 text-slate-400 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-slate-200 mb-2">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO ist:<br />
              Steffen Karjoth<br />
              Corelliweg 28<br />
              70195 Stuttgart<br />
              E-Mail: bierfinanzen@gmail.com
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">2. Hosting (Vercel)</h2>
            <p>
              Diese Website wird bei <strong>Vercel Inc.</strong> (440 N Barranca Ave #4133, Covina,
              CA 91723, USA) gehostet. Beim Aufruf der Website verarbeitet Vercel automatisch
              technisch notwendige Daten in Server-Logs: IP-Adresse, Datum und Uhrzeit des Zugriffs,
              aufgerufene Seite, Browsertyp und Betriebssystem. Diese Daten sind für die Auslieferung
              und den sicheren Betrieb der Website erforderlich. Rechtsgrundlage ist
              Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren, stabilen Betrieb).
              Vercel ist unter dem EU-US Data Privacy Framework zertifiziert; mit Vercel besteht ein
              Auftragsverarbeitungsvertrag (Data Processing Agreement).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">3. Reichweitenmessung (Vercel Web Analytics)</h2>
            <p>
              Zur Messung der Seitennutzung setzen wir <strong>Vercel Web Analytics</strong> ein.
              Dieses Verfahren arbeitet <strong>ohne Cookies</strong> und ohne Speicherung auf deinem
              Endgerät: Besuche werden über einen anonymisierten, täglich wechselnden Hash gezählt,
              der keine Wiedererkennung über mehrere Tage oder Websites hinweg erlaubt. Es werden
              keine Nutzerprofile gebildet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse an der statistischen Auswertung und Verbesserung des Angebots).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">4. Cookies und lokale Speicherung</h2>
            <p>
              Diese Website verwendet <strong>keine Tracking- oder Werbe-Cookies</strong>. Zum Einsatz
              kommen ausschließlich technisch erforderliche Speicherungen:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Sprach-Cookie</strong> („lang"): speichert deine gewählte Sprache (DE/EN),
                wenn du die Sprachumschaltung nutzt.
              </li>
              <li>
                <strong>Portfolio &amp; Merkliste (localStorage)</strong>: Karten, die du in Portfolio
                oder Merkliste einträgst, werden ausschließlich <strong>lokal in deinem Browser</strong>{' '}
                gespeichert. Diese Daten verlassen dein Gerät nicht und sind für uns nicht einsehbar.
                Zum Abruf aktueller Preise werden lediglich Karten-Kennungen (z.B. „sv3pt5-201") ohne
                Personenbezug an unseren Server übermittelt.
              </li>
              <li>
                <strong>Admin-Sitzungs-Cookie</strong> („studio_session"): dient ausschließlich dem
                Login in den passwortgeschützten Verwaltungsbereich und betrifft normale Besucher nicht.
              </li>
            </ul>
            <p className="mt-2">
              Diese Speicherungen sind für die von dir ausdrücklich gewünschten Funktionen erforderlich
              (§ 25 Abs. 2 Nr. 2 TDDDG) und benötigen daher keine Einwilligung.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">5. Externe Inhalte (Kartenbilder)</h2>
            <p>
              Kartenbilder und Set-Logos werden von externen Servern geladen
              (<strong>images.pokemontcg.io</strong> der Pokémon TCG API sowie{' '}
              <strong>assets.pokemon.com</strong>). Beim Laden dieser Bilder wird deine IP-Adresse
              technisch bedingt an den jeweiligen Server übermittelt — das ist für die Anzeige der
              Bilder erforderlich. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an der Darstellung der Karteninhalte). Weitere personenbezogene Daten werden
              dabei nicht übertragen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">6. Preisdaten</h2>
            <p>
              Kartenpreise und Marktdaten beziehen wir serverseitig über die Pokémon TCG API
              (Cardmarket-Preisdaten). Dabei werden keine personenbezogenen Daten von Besuchern
              übertragen oder gespeichert. Unsere Preisdatenbank (Supabase) enthält ausschließlich
              Kartenpreise und -kennungen, keine Besucherdaten.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">7. Affiliate-Links</h2>
            <p>
              Diese Website enthält gekennzeichnete Affiliate-Links (z.B. zu Amazon und Cardmarket).
              Beim Klick auf einen solchen Link verlässt du diese Website; der jeweilige Anbieter kann
              auf seiner Seite Cookies setzen, um die Vermittlung zuzuordnen. Diese Verarbeitung liegt
              im Verantwortungsbereich des jeweiligen Anbieters — es gelten dessen
              Datenschutzbestimmungen. Auf dieser Website selbst werden dafür keine Cookies gesetzt.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">8. Kontakt per E-Mail</h2>
            <p>
              Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine Angaben (E-Mail-Adresse,
              Inhalt der Nachricht) zur Bearbeitung der Anfrage. Rechtsgrundlage ist
              Art. 6 Abs. 1 lit. f DSGVO bzw. lit. b DSGVO, sofern die Anfrage auf einen Vertrag
              abzielt. Die Daten werden gelöscht, sobald sie für die Bearbeitung nicht mehr
              erforderlich sind.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">9. Deine Rechte (Art. 15–22 DSGVO)</h2>
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
              Anfragen richtest du an: bierfinanzen@gmail.com. Zuständige Aufsichtsbehörde ist der
              Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg
              (LfDI BW), Lautenschlagerstraße 20, 70173 Stuttgart.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-200 mb-2">10. SSL-Verschlüsselung</h2>
            <p>
              Diese Website nutzt aus Sicherheitsgründen eine SSL/TLS-Verschlüsselung (erkennbar an
              „https://" in der Adresszeile). Damit sind übertragene Daten für Dritte nicht mitlesbar.
            </p>
          </section>

          <p className="text-xs text-slate-600 pt-4 border-t border-[#1e1e30]">
            Stand: Juli 2026. Diese Erklärung wird angepasst, sobald sich der Funktionsumfang der
            Website ändert (z.B. Einführung eines Newsletters).
          </p>
        </div>
      </div>
    </div>
  );
}
