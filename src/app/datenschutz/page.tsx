import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz',
  robots: { index: false },
};

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-[#070810]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex min-h-[32px] items-center gap-2 text-violet-400 hover:text-violet-300 text-sm mb-8"
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
            <h2 className="font-bold text-slate-200 mb-2">3. Reichweitenmessung</h2>
            <p className="mb-3">
              Zur Messung der Seitennutzung setzen wir <strong>Vercel Web Analytics</strong> ein.
              Dieses Verfahren arbeitet <strong>ohne Cookies</strong> und ohne Speicherung auf deinem
              Endgerät: Besuche werden über einen anonymisierten, täglich wechselnden Hash gezählt,
              der keine Wiedererkennung über mehrere Tage oder Websites hinweg erlaubt. Es werden
              keine Nutzerprofile gebildet.
            </p>
            <p className="mb-3">
              Zusätzlich führen wir eine <strong>eigene Aufrufzählung</strong> auf unserem Server.
              Bei jedem Seitenaufruf wird eine Meldung an <code className="font-mono">/api/zaehler</code>{' '}
              gesendet, aus der ausschließlich diese Angaben gespeichert werden:
            </p>
            <ul className="mb-3 list-disc space-y-1 pl-5">
              <li>das Datum (tagesgenau, ohne Uhrzeit),</li>
              <li>die aufgerufene Seite (Pfad ohne Abfrageparameter),</li>
              <li>die Herkunft des Aufrufs: der <strong>Hostname</strong> der verweisenden Seite
                  (z.&nbsp;B. „google.com") beziehungsweise die Kampagnenangaben aus den
                  <code className="font-mono"> utm_</code>-Parametern der aufgerufenen Adresse,</li>
              <li>eine grobe Geräteklasse (mobil, Tablet oder Desktop), abgeleitet aus der
                  Fensterbreite.</li>
            </ul>
            <p className="mb-3">
              Je Aufruf entsteht zunächst ein Eintrag, der <strong>ausschließlich diese Angaben</strong>{' '}
              enthält; der Speicher vermerkt dabei technisch den Zeitpunkt des Anlegens, der nicht
              ausgewertet wird. <strong>Spätestens am Folgetag</strong> werden die Einträge eines Tages
              zu Zählerständen je Tag, Seite und Herkunftsweg zusammengefasst und die Einzeleinträge
              gelöscht.
              <strong> Es wird kein Cookie gesetzt, nichts auf deinem Endgerät gespeichert oder
              ausgelesen und kein Kennzeichen vergeben.</strong> Weder deine IP-Adresse noch deine
              Browserkennung werden gespeichert. Eine Wiedererkennung — auch innerhalb desselben
              Besuchs — ist damit technisch ausgeschlossen; wir können Aufrufe nicht zu Besuchern
              oder Personen zusammenführen.
            </p>
            <p>
              Weil dabei weder Informationen auf deinem Endgerät gespeichert noch von dort abgerufen
              werden, ist § 25 TDDDG nicht einschlägig und es ist keine Einwilligung erforderlich.
              Rechtsgrundlage der Verarbeitung ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
              an der statistischen Auswertung und Verbesserung des Angebots). Die verdichteten
              Zählerstände enthalten keinen Personenbezug.
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
            <h2 className="font-bold text-slate-200 mb-2">8a. Feedback-Formular</h2>
            <p>
              Über den Knopf „Feedback“ kannst du uns eine Rückmeldung schicken. Gespeichert werden
              ausschließlich: der eingegebene Text, die gewählte Art (Idee, Fehler, Lob, Sonstiges),
              die Seite, auf der du das Formular geöffnet hast, der Zeitpunkt und — nur wenn du sie
              freiwillig angibst — deine E-Mail-Adresse, damit wir antworten können. Keine IP-Adresse,
              keine Browserkennung, kein Cookie. Die IP-Adresse wird lediglich kurzzeitig im
              Arbeitsspeicher verwendet, um massenhafte automatische Einsendungen zu bremsen, und
              nicht gespeichert. Speicherort ist der Datenspeicher unseres Dienstleisters Supabase.
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
              Verbesserung des Angebots). Rückmeldungen werden spätestens nach 12 Monaten automatisch
              gelöscht, auf Wunsch sofort.
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
            Stand: Oktober 2026. Diese Erklärung wird angepasst, sobald sich der Funktionsumfang der
            Website ändert (z.B. Einführung eines Newsletters).
          </p>
        </div>
      </div>
    </div>
  );
}
