import { NextResponse } from 'next/server';
import { addSubscriber } from '@/lib/newsletter';
import { createRateLimiter, clientIp, isValidEmail } from '@/lib/rate-limit';

// Fünf Anmeldungen je Adresse und Stunde. Wer sich anmelden will, braucht
// einen Versuch; alles darüber ist kein Interessent.
const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  const grenze = limiter(clientIp(request));
  if (!grenze.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.' },
      { status: 429, headers: { 'Retry-After': String(grenze.retryAfterSeconds) } },
    );
  }

  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    // Der Name landet in fremden Systemen und in E-Mails — gekappt und ohne
    // Steuerzeichen, damit daraus keine Kopfzeilen-Manipulation wird.
    const name =
      typeof body?.name === 'string'
        ? body.name.replace(/[\r\n\t]/g, ' ').trim().slice(0, 80)
        : undefined;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
    }

    const success = await addSubscriber(email, name);
    return NextResponse.json({ message: success ? 'Erfolgreich angemeldet!' : 'Anmeldung gespeichert!' });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 500 });
  }
}
