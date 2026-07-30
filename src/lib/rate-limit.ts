// Einfache Zugriffsbegrenzung für öffentlich erreichbare Endpunkte.
//
// ANLASS: `/api/newsletter` nahm unbegrenzt viele Anmeldungen entgegen. Ein
// einzelnes Skript konnte damit die Abonnentenliste mit Müll fluten oder den
// Newsletter-Anbieter als Versandwerkzeug für fremde Adressen missbrauchen.
//
// EHRLICHE EINSCHRÄNKUNG: Der Zähler liegt im Arbeitsspeicher der jeweiligen
// Serverinstanz. In einer serverlosen Umgebung gibt es mehrere davon, und sie
// werden regelmäßig neu gestartet — das hier stoppt keinen verteilten Angriff.
// Es stoppt das, was tatsächlich passiert: eine Schleife von einer Adresse.
// Eine belastbare Grenze bräuchte einen gemeinsamen Speicher (Supabase/Redis);
// das ist bewusst nicht der erste Schritt.

export interface RateLimitResult {
  allowed: boolean;
  /** Verbleibende Zugriffe im laufenden Zeitfenster. */
  remaining: number;
  /** Wartezeit in Sekunden, bis wieder etwas frei wird (0 wenn erlaubt). */
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  /** Erlaubte Zugriffe je Zeitfenster. */
  limit: number;
  /** Länge des Zeitfensters in Millisekunden. */
  windowMs: number;
  /** Obergrenze verwalteter Schlüssel — schützt vor unbegrenztem Wachstum. */
  maxKeys?: number;
}

export interface RateLimiter {
  (key: string, now?: number): RateLimitResult;
}

/**
 * Erzeugt eine Begrenzung mit gleitendem Zeitfenster.
 *
 * Gleitend statt fest, weil ein festes Fenster an der Grenze das Doppelte
 * durchlässt: 5 Zugriffe in der letzten Sekunde des einen Fensters und 5 in
 * der ersten des nächsten sind 10 innerhalb von zwei Sekunden.
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: RateLimitOptions): RateLimiter {
  const treffer = new Map<string, number[]>();

  return function pruefe(key: string, now: number = Date.now()): RateLimitResult {
    const grenze = now - windowMs;

    // Abgelaufene Schlüssel wegräumen, bevor neue dazukommen.
    if (treffer.size >= maxKeys) {
      for (const [k, zeiten] of treffer) {
        if (zeiten.every((t) => t <= grenze)) treffer.delete(k);
      }
      // Immer noch voll: ältesten Eintrag opfern statt unbegrenzt zu wachsen.
      if (treffer.size >= maxKeys) {
        const ältester = treffer.keys().next();
        if (!ältester.done) treffer.delete(ältester.value);
      }
    }

    const zeiten = (treffer.get(key) ?? []).filter((t) => t > grenze);

    if (zeiten.length >= limit) {
      const frueheste = zeiten[0];
      treffer.set(key, zeiten);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((frueheste + windowMs - now) / 1000)),
      };
    }

    zeiten.push(now);
    treffer.set(key, zeiten);
    return { allowed: true, remaining: limit - zeiten.length, retryAfterSeconds: 0 };
  };
}

/**
 * Ermittelt die Adresse des Aufrufers.
 *
 * Hinter Vercel steht die echte Adresse als erster Eintrag in
 * `x-forwarded-for`. Alles dahinter hat der Aufrufer möglicherweise selbst
 * gesetzt und wird deshalb verworfen.
 */
export function clientIp(request: Request): string {
  const weitergeleitet = request.headers.get('x-forwarded-for');
  if (weitergeleitet) {
    const erste = weitergeleitet.split(',')[0]?.trim();
    if (erste) return erste;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unbekannt';
}

/**
 * Prüft eine E-Mail-Adresse.
 *
 * Bewusst streng genug, um Unsinn abzuweisen, und bewusst nicht der Versuch,
 * RFC 5322 nachzubauen — das scheitert immer und weist echte Adressen ab.
 * Die einzige verlässliche Prüfung ist die Bestätigungsmail.
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (email.length < 6 || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(email);
}
