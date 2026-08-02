import { hatZubehoer } from '@/lib/accessory-mentions';

// KENNZEICHNUNG DER KAUFLINKS.
//
// PFLICHT, KEINE HÖFLICHKEIT: Wer Kauflinks setzt, an denen er verdient, muss
// das kenntlich machen. Der Hinweis gehört deshalb an jede Seite, auf der ein
// solcher Link auftaucht.
//
// UND NUR DORT. Ein Beitrag über Grading erwähnt kein Zubehör und bekommt auch
// keinen Link — ein Hinweis darunter wäre dann eine Behauptung über etwas, das
// gar nicht da ist. Deshalb prüft diese Komponente denselben Text mit
// derselben Funktion wie die Anzeige und erscheint nur, wenn sie fündig wird.
//
// Bewusst klein und am Ende: Der Hinweis muss auffindbar sein, nicht auffallen.

export function AffiliateNote({ texte }: { texte: string[] }) {
  if (!hatZubehoer(texte)) return null;

  return (
    <p className="mt-6 text-[11px] leading-relaxed text-slate-600">
      Einzelne Zubehörbegriffe in diesem Text sind mit Kaufangeboten verknüpft
      (Affiliate-Links). Kommt darüber ein Kauf zustande, erhalten wir eine
      Provision — für dich ändert sich der Preis nicht. Die Auswahl der Themen
      und die Einschätzungen im Text bleiben davon unberührt.
    </p>
  );
}
