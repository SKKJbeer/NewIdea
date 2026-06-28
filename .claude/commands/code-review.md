# Code-Review-Skill — PokéMarket Intelligence

Führt ein strukturiertes Code-Review der aktuellen Änderungen durch und behebt die Findings.
Verankert die Lehren aus dem v2.6.x-Review, damit dieselben Fehler nicht wiederkommen.

## Ablauf

1. **Diff ermitteln:** `git diff HEAD` (uncommitted) bzw. `git diff main...HEAD` (committed).
2. **Jede der 4 Kategorien unten prüfen** — pro Treffer: Datei + Zeile + konkretes Fehlerszenario.
3. **Findings beheben** (nicht nur auflisten), dann `npm run build` (vitest + next build) grün.
4. **Bei neuer Logik: Test ergänzen** in `src/__tests__/` (pure Funktionen in `src/lib/portfolio.ts` o.ä.).
5. **Deploy** nach Standard-Sequenz (siehe CLAUDE.md → Deployment-Prozess).

## Prüf-Kategorien

### 1. Sicherheit (Backend / API-Routes)

- **Timing-safe Vergleiche:** Secrets/Token NIE mit `===`. Immer `crypto.timingSafeEqual`
  (in try/catch wegen Längen). Referenz: `src/lib/studio-auth.ts` → `safeEqual()`.
- **Fail-closed in Prod:** Fehlt ein Secret in Production → sperren, nicht öffnen. Dev-Öffnung
  nur bei `NODE_ENV !== 'production'`. Nie `if (!secret) return true` ohne Dev-Guard.
- **Keine Fehler-Leaks:** In `catch` kein `String(error)`/Stacktrace/`partial` an den Client.
  Server-seitig `console.error`, Client bekommt `{ error: 'internal_error' }`.
- **Input-Sanitisierung:** Nutzereingaben für externe Query-APIs (TCG `name:"..."`) von
  Metazeichen befreien: `replace(/["*?:()\[\]{}^~\\+\-!&|]/g, '')`. Referenz: `searchCards()`.
- **Auth auf geschützten Routes:** `/api/monitoring`, `/api/status` prüfen `studio_session`-Cookie.
  Cron-Endpoints prüfen `Authorization: Bearer CRON_SECRET`.

### 2. Robustheit (externe Daten & Netzwerk)

- **Median statt Minimum:** Marktpreise via `median()` aus `src/lib/portfolio.ts` — nie `prices[0]`.
- **Timeouts:** Jeder externe `fetch` in einer Handler-Schleife braucht ein Timeout
  (`Promise.race` 8s oder `AbortSignal.timeout`). Referenz: `withTimeout()` in der prices-Route.
- **Model-ID per Env:** `process.env.ANTHROPIC_MODEL || 'claude-opus-4-8'` — nie verstreute Strings.
- **Graceful Fallbacks:** Supabase/Cardmarket nicht konfiguriert → App läuft weiter (null-Rückgaben).

### 3. Frontend (React / Client-Komponenten)

- **useEffect-Deps vollständig:** Stabilen `fetchKey` aus allen relevanten Feldern bauen
  (`cardId:language`), nicht `.length`. Sonst stale data bei Edits.
- **Keine stummen Fehler:** Kein `.catch(() => {})` ohne Error-State + UI-Hinweis. `if (!r.ok) throw`,
  Cleanup via `cancelled`-Flag.
- **Eine Quelle pro Komponente:** Keine Inline-Reimplementierung (z.B. `LangPicker`) — bestehende
  Komponente per Prop erweitern.

### 4. UI-Konsistenz (Dark Mode)

- Ausschließlich Design-Tokens aus CLAUDE.md → UI-Design-Regeln. Nie `bg-gray-*`/`text-gray-*`/
  `bg-white`. Trend-Farben: `#34d399` (up) / `#fb7185` (down) — konsistent in SVG und Tailwind.
- Jede Karten-Erwähnung → `<BoosterPackImage>`.

## Abschluss-Checkliste (vor Commit)

- [ ] Keine `===`-Vergleiche auf Secrets/Tokens
- [ ] Kein Fail-open ohne `NODE_ENV`-Dev-Guard
- [ ] Kein `String(error)`/`partial` in API-Error-Responses
- [ ] Externe Fetches in Schleifen haben Timeout
- [ ] Marktpreis = Median, nicht `prices[0]`
- [ ] `useEffect`-Deps via fetchKey, nicht `.length`
- [ ] Kein stummes `.catch(() => {})`
- [ ] Keine doppelten Komponenten, keine `gray-*`-Tokens
- [ ] `npm run build` grün (Tests + Build), neue Logik hat Tests
