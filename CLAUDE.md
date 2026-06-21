# CLAUDE.md — Arbeitsgedächtnis für Claude Code

Diese Datei ist das dauerhafte Gedächtnis für Claude Code in diesem Projekt.
Hier stehen alle Regeln, Prozesse und Erkenntnisse, die sitzungsübergreifend gelten.

---

## Deployment-Prozess (PFLICHT bei jedem Deploy)

### Das Problem das wir hatten
Pushes gingen nur auf den Feature-Branch `claude/direct-push-main-lxluxu`, aber
**nicht auf `main`**. Vercel watched `main` — deshalb gab es keine Deployments!

### Korrekte Deploy-Sequenz (immer beide Befehle!)

```bash
# 1. Feature-Branch aktualisieren
git push -u origin claude/direct-push-main-lxluxu

# 2. main auf denselben Stand bringen (löst Vercel-Deploy aus)
git push origin HEAD:main
```

**Ohne Schritt 2 passiert kein Vercel-Deployment.**

### Deploy-Checkliste

Vor jedem Commit + Push diese Liste abhaken:

- [ ] **Version in `package.json` erhöht** (patch x.x.+1 oder minor x.+1.0)
- [ ] **`npm run build` lokal grün** — kein TypeScript-Fehler, alle Seiten gebaut
- [ ] **Git-Commit mit aussagekräftiger Nachricht** (was & warum, nicht nur was)
- [ ] **Beide Branches gepusht:**
  - `git push -u origin claude/direct-push-main-lxluxu`
  - `git push origin HEAD:main`
- [ ] **GitHub Main-Branch verifiziert** — neueste SHA stimmt mit lokalem HEAD überein
  (per `git log --oneline -1` vs. GitHub MCP `list_commits sha:main`)
- [ ] **Vercel-Deployment abwarten** — ca. 1–2 Minuten nach Push auf main
- [ ] **Version auf der Live-Seite prüfen** — Footer zeigt `vX.Y.Z`
- [ ] **STATUS.md aktualisieren** — neue Version eintragen

### Versionierungsschema

| Typ | Wann | Beispiel |
|-----|------|---------|
| Patch `x.y.+1` | Bugfix, kleine Textänderung | 0.5.0 → 0.5.1 |
| Minor `x.+1.0` | Neues Feature, größere Änderung | 0.5.0 → 0.6.0 |
| Major `+1.0.0` | Kompletter Umbau | 0.9.0 → 1.0.0 |

Die Version wird **immer** im Deploy-Commit-Titel genannt: `v0.6.0 — ...`

---

## Projekt-Kontext

**Name:** PokéMarket Intelligence  
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Vercel  
**Repo:** `SKKJbeer/NewIdea` auf GitHub  
**Branch-Strategie:**
- Entwicklung: `claude/direct-push-main-lxluxu`
- Production: `main` (Vercel triggered)

**Sprache der UI:** Deutsch (Standard) + Englisch (via `lang`-Cookie umschaltbar)

---

## Architektur-Entscheidungen

| Entscheidung | Details |
|---|---|
| Preise | Cardmarket EUR via TCG-API (`tcgplayer.prices.cardmarket`) |
| Preis-Historie | 3 Stufen: Supabase DB-Schnappschüsse > Cardmarket-Interpolation > Beispielkurve |
| Übersetzungen | `src/lib/i18n.ts` + `getLang()` aus Cookie (`next/headers`) |
| Autocomplete | `/api/search/suggestions?q=` — debounce 320 ms im SearchBox-Client |
| SEO | JSON-LD auf Karten-Detailseiten (Product+Offer), ItemList auf Suchergebnissen |
| Supabase | Graceful: App läuft auch ohne Konfiguration (client gibt `null` zurück) |

---

## Env-Variablen (Vercel)

| Variable | Pflicht | Zweck |
|---|---|---|
| `POKEMON_TCG_API_KEY` | ✅ | TCG API Key |
| `ANTHROPIC_API_KEY` | ✅ | Artikel-Generierung |
| `CRON_SECRET` | ✅ | Absicherung der Cron-Endpoints |
| `SUPABASE_URL` | ⚠️ | Preis-Snapshots (ohne: kein DB-Verlauf) |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ | Supabase Schreibrecht (service role, nicht anon!) |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ | Täglicher Cron + SEO canonical URLs |
| `BEEHIIV_API_KEY` | optional | Newsletter |
| `BEEHIIV_PUBLICATION_ID` | optional | Newsletter |

**ACHTUNG:** Der Supabase-Service-Role-Key wurde in einer früheren Chat-Session
offengelegt. Der Nutzer wurde gebeten, ihn zu **rotieren** (Supabase Dashboard →
Settings → API → regenerate service_role key) und den neuen Wert in Vercel einzutragen.

---

## Bekannte Stolperstellen

1. **Deployment geht nicht** → Fast immer: `HEAD:main` nicht gepusht. Immer beide Branches!
2. **App lädt nicht auf Vercel** → `package-lock.json` committen schaltet Vercel auf `npm ci` um — das bricht bei abweichendem Lock-File. **Nie `package-lock.json` committen.**
3. **Keine Blog-Inhalte** → `ANTHROPIC_API_KEY` fehlt in Vercel. Fallback-Artikel greifen automatisch, aber echte KI-Artikel brauchen den Key.
4. **Supabase-Fehler** → Meist falscher Key-Typ. Vercel braucht den `sb_secret_...`-Key (service_role), nicht den `sb_publishable_...`-Key (anon).
5. **TCG-API 429/000** → Rate-Limit nach vielen schnellen Requests. Kurz warten (15–30 Sek).
6. **Kompletter Style-Verlust auf Vercel** → `import x from './package.json'` in `next.config.ts` crasht Vercels Turbopack-Build → keine CSS-Dateien. Fix: `process.env.npm_package_version` verwenden (npm setzt das bei jedem Build automatisch).
7. **Manuelles `<head>` in layout.tsx verboten** → Next.js injiziert CSS-Links in den Head. Ein zweites `<head>` in `layout.tsx` verhindert das → kein CSS. Niemals `<head>` in `layout.tsx` schreiben; stattdessen `metadata`-Export verwenden.
8. **`cookies()` macht Seiten voll-dynamisch (kein ISR-Cache)** → `cookies()` oder `headers()` in einem Server-Component macht die ganze Seite zu `ƒ Dynamic` — kein CDN-Cache, jeder Request trifft den Server. Für die Homepage wurde `getLang()` (das `cookies()` nutzt) entfernt → Seite ist wieder `○ Static` mit ISR. Sprachumschaltung nur in Client-Komponenten (NavBar) per Cookie, nicht im Server-Rendering.
9. **Externe Bilder** → `<img>` für externe URLs (pokemontcg.io) direkt nutzen, oder `next/image` mit `remotePatterns` in `next.config.ts` konfigurieren. Nicht konfigurierte Domains crashen den Build.

---

## Versions-Log

| Version | Datum | Highlights | Main-SHA |
|---|---|---|---|
| v0.1.0 | 20.06.2026 | Grundsystem: Homepage, Studio, Cron, KI, Newsletter, Video | — |
| v0.2.0 | 20.06.2026 | Impressum, Datenschutz, Karten-Detail, Preis-Chart | — |
| v0.3.0 | 20.06.2026 | Mobile-Optimierung, Studio-Überarbeitung | — |
| v0.4.0 | 20.06.2026 | Marktbericht, Blog, täglicher Cron, Artikel-Generator | — |
| v0.4.x | 20.06.2026 | Echte Cardmarket-Preise (EUR), deutsche Namen, Supabase-Preisverlauf, Startseiten-Redesign, MoverList | `6e5d725` |
| v0.5.0 | 21.06.2026 | i18n DE/EN, Suche-Autocomplete, Loading-Skeleton, Karten de-emphasized, SEO (JSON-LD, Sitemap, robots.txt), Version im Footer | `a3715e0` |
| v0.5.1 | 21.06.2026 | CLAUDE.md erstellt, STATUS.md aktualisiert | `952c580` |
| v0.5.2 | 21.06.2026 | BUGFIX: Kompletter Style-Verlust durch JSON-Import in next.config.ts | `bdceaf8` |
| v0.5.3 | 21.06.2026 | BUGFIX: CSS-Fix (<head>-Tag entfernt) + Homepage Static/ISR statt Dynamic + next/image überall | `b0a0cd0` |
