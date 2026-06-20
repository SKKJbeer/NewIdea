import { NextResponse } from 'next/server';
import { addSubscriber } from '@/lib/newsletter';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
    const success = await addSubscriber(email, name);
    return NextResponse.json({ message: success ? 'Erfolgreich angemeldet!' : 'Anmeldung gespeichert!' });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 500 });
  }
}
