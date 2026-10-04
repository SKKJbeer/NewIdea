import { NextResponse } from 'next/server';
import { addSubscriber } from '@/lib/newsletter';
import { createRateLimiter, clientIp, isValidEmail } from '@/lib/rate-limit';
import { herkunftErlaubt, leseJsonBegrenzt, textSaeubern } from '@/lib/annahme-schutz';

// Fünf Anmeldungen je Adresse und Stunde. Wer sich anmelden will, braucht
// einen Versuch; alles darüber ist kein Interessent.
const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  // Fremde Seiten dürfen keine Anmeldungen auslösen — sonst ließe sich jede
  // beliebige Adresse mit Willkommens-Mails zuschütten.
  if (!herkunftErlaubt(request)) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 403 });
  const grenze = limiter(clientIp(request));
  if (!grenze.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.' },
      { status: 429, headers: { 'Retry-After': String(grenze.retryAfterSeconds) } },
    );
  }

  try {
    const gelesen = await leseJsonBegrenzt(request, 2_048);
    if (!gelesen.ok) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: gelesen.status });
    const body = gelesen.daten as { email?: unknown; name?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    // Der Name landet in fremden Systemen und in E-Mails — gekappt und ohne
    // Steuerzeichen, damit daraus keine Kopfzeilen-Manipulation wird.
    const name =
      typeof body?.name === 'string'
        ? textSaeubern(body.name).replace(/[\r\n\t]/g, ' ').slice(0, 80)
        : undefined;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
    }

    const success = await addSubscriber(email, name);
    // Ehrlich: Ohne eingerichteten Versanddienst wird NICHTS gespeichert. Die
    // frühere Antwort „Anmeldung gespeichert!" behauptete das Gegenteil.
    if (!success) {
      return NextResponse.json({ error: 'Die Anmeldung ist gerade nicht möglich. Bitte später erneut versuchen.' }, { status: 503 });
    }
    return NextResponse.json({ message: 'Erfolgreich angemeldet!' });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 500 });
  }
}
