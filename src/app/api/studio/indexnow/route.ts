import { NextResponse } from 'next/server';
import { isStudioAuthedFromRequest } from '@/lib/studio-auth';
import { meldeAnIndexNow } from '@/lib/indexnow';
import { kartenAnzahl, kartenTeil, teileFuer } from '@/lib/sitemap-karten';
import { ladeSetListe } from '@/lib/set-liste';
import { GUIDES } from '@/lib/guides';
import { siteUrl } from '@/lib/site';

// EINMALIGE VOLLMELDUNG AN INDEXNOW.
//
// Der Tages-Cron meldet nur, was sich heute geaendert hat. Beim ersten Mal
// muss aber ALLES gemeldet werden, sonst kennen Bing & Co. die meisten der
// ~20.000 Kartenseiten nicht. Das Protokoll erlaubt 10.000 Adressen je
// Meldung; `meldeAnIndexNow` teilt selbst auf.

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isStudioAuthedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const basis = siteUrl();
  if (!basis) return NextResponse.json({ error: 'Keine Produktionsadresse bekannt' }, { status: 503 });

  const urls: string[] = [
    '/', '/suche', '/einsteiger', '/methodik', '/sets', '/artikel', '/guides',
    '/marktbericht', '/marktbericht/archiv', '/portfolio', '/merkliste',
  ].map((p) => `${basis}${p}`);
  urls.push(...GUIDES.map((g) => `${basis}/guides/${g.slug}`));

  // Dieselbe abgesicherte Liste wie die Sitemap — live fiel sie am 03.10. aus (0 Sets).
  const sets = (await ladeSetListe(250).catch(() => null))?.sets ?? [];
  urls.push(...sets.map((s) => `${basis}/sets/${s.id}`));

  const teile = teileFuer(await kartenAnzahl());
  for (let t = 0; t < teile; t++) {
    const karten = await kartenTeil(t);
    urls.push(...karten.map((k) => `${basis}/karten/${encodeURIComponent(k.id)}`));
  }

  const ergebnis = await meldeAnIndexNow(urls);
  return NextResponse.json(
    { gesamt: urls.length, sets: sets.length, ...ergebnis },
    { status: ergebnis.fehler ? 502 : 200 },
  );
}
