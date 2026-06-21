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

## Content-Wahrheitspflicht (PFLICHT — kein erfundener Inhalt!)

**REGEL:** Alle Inhalte auf der Plattform — Artikel, Wochenrückblicke, Guides, Karten-Beschreibungen — dürfen **ausschließlich wahre, überprüfbare Informationen** enthalten. Nichts erfinden.

### Was nie erfunden werden darf

| Kategorie | Beispiel für VERBOTENEN Inhalt |
|---|---|
| Preise & Trends | "Charizard ex stieg diese Woche um 40 %" — ohne echte Daten |
| Events & Turniere | Spezifische Turnierergebnisse, Teilnehmer, Orte |
| Pokémon-News | Konkrete Ankündigungen der Pokémon Company ohne Quelle |
| Personen | Zitate, Aktionen oder Aussagen von echten Personen |
| Set-Daten | Druckraten, Erscheinungsdaten, Karten-IDs |

### Was erlaubt ist

- **Meinungen & Einschätzungen** von Marco: "Ich glaube diese Karte steigt" — klar als persönliche Meinung markiert
- **Allgemeine Marktprinzipien**: "Hype-Spikes normalisieren sich meist nach 4–8 Wochen" — belegbares Muster
- **Echte Karten & Sets**: Nur Namen und Set-Codes aus der echten TCG-Datenbank verwenden
- **Echte Preise**: Nur Werte aus der TCG API oder Cardmarket (über API geliefert)

### Quellen-Pflicht (IMMER!)

**Jeder Artikel und Beitrag MUSS direkte Quellenlinks enthalten.** Das `Article`-Interface hat ein `sources`-Feld:

```typescript
sources?: Array<{ label: string; url: string }>
```

Gute Quellen je nach Artikeltyp:
| Typ | Quellen |
|---|---|
| Marktanalyse, Preise | [Cardmarket](https://www.cardmarket.com/en/Pokemon) |
| Set-Info, Karten-Daten | [Bulbapedia](https://bulbapedia.bulbagarden.net) |
| Offizielle Produkte | [pokemon.com/de](https://www.pokemon.com/de/pokemon-tcg/) |
| Grading | [PSA](https://www.psacard.com/gradingstandards), [BGS](https://www.beckett.com/grading/services), [CGC](https://www.cgccards.com) |
| Turniere | [Limitless TCG](https://limitlesstcg.com/tournaments), [pokemon.com/events](https://www.pokemon.com/de/pokemon-events/) |
| Zubehör | [Dragon Shield](https://www.dragonshield.com), [Ultra PRO](https://www.ultrapro.com), [BCW](https://www.bcwsupplies.com) |
| USA-Preise | [TCGPlayer](https://www.tcgplayer.com/categories/trading-and-collectible-card-games/pokemon) |

### Review-Pflicht vor jedem Content-Commit

Vor jedem Commit der Artikel-Inhalte (static-articles.ts, Fallback-Artikel, etc.) prüfen:

- [ ] Alle genannten Pokémon-Karten existieren wirklich (Name + Set korrekt?)
- [ ] Alle genannten Preise basieren auf echten Daten oder sind explizit als Beispiel markiert
- [ ] Alle genannten Events/Turniere/Ankündigungen sind real oder klar als hypothetisch kenntlich
- [ ] Kein Satz behauptet eine Tatsache die ich nicht belegen kann
- [ ] `sources`-Array enthält mindestens eine direkte Quellenangabe

**Bei KI-generierten Artikeln (Marco-Persona):** Die KI darf Meinungen äußern und Trends erklären, aber niemals konkrete Zahlen, Daten oder Events erfinden. Das `buildPrompt()` in `article-generator.ts` enthält deshalb den Hinweis "Nutze echte Zahlen und Karten-Namen".

---

## UI-Design-Regeln (PFLICHT — immer einhalten!)

### Boosterpack-Bild überall dort wo Karten erwähnt werden

**REGEL:** Jedes Mal wenn eine Pokémon-Karte in der UI angezeigt oder erwähnt wird, MUSS das zugehörige Boosterpack-Produktbild (wie man es im Laden sieht) ebenfalls angezeigt werden — damit Nutzer sofort erkennen, aus welchem Set die Karte stammt und wo sie sie kaufen können.

**Umsetzung:** Immer die `<BoosterPackImage>` Komponente aus `@/components/BoosterPackImage` verwenden:
```tsx
import { BoosterPackImage } from '@/components/BoosterPackImage';

<BoosterPackImage
  setCode={card.setCode}   // z.B. "sv3pt5"
  setName={card.set}       // z.B. "Pokémon 151"
  className="h-24 ..."     // Größe je nach Kontext anpassen
/>
```

**Größenrichtlinien:**
| Kontext | Klasse | Beispiel |
|---|---|---|
| Karten-Detailseite | `h-24 w-auto drop-shadow-md` | Groß, rechts neben Kartenname |
| Kartenraster (CardGrid) | `h-5 w-auto` | Klein, inline neben Set-Name |
| Artikel/Guides | `h-14 object-contain drop-shadow-sm` | Mittel, unter Kartenbild |

**Fallback:** Wenn das Boosterpack-Bild nicht lädt (ältere Sets), fällt die Komponente automatisch auf das Set-Logo zurück — kein manueller Fallback nötig.

**WICHTIG:** Bei neuen Seiten/Komponenten die Karten zeigen → sofort `BoosterPackImage` einbauen. Kein Set-Name als reiner Text ohne Bild daneben!

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
| Boosterpack-Bild | Überall wo Karten erscheinen → `<BoosterPackImage>` Pflicht (siehe UI-Design-Regeln) |

---

## Env-Variablen (Vercel)

### Bereits konfiguriert — IN VERCEL GESETZT ✅

Diese Variablen hat der Nutzer bereits in Vercel eingetragen. Nie wieder so tun als wären sie unkonfiguriert!

| Variable | Status | Zweck |
|---|---|---|
| `POKEMON_TCG_API_KEY` | ✅ **Gesetzt** | TCG API Key — Kartenpreise & -daten |
| `ANTHROPIC_API_KEY` | ✅ **Gesetzt** | KI-Artikel-Generierung (Claude) |
| `CRON_SECRET` | ✅ **Gesetzt** | Absicherung der Cron-Endpoints |
| `SUPABASE_URL` | ✅ **Gesetzt** | Supabase Projekt-URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ **Gesetzt** | Supabase Schreibrecht (service role) |
| `NEXT_PUBLIC_SITE_URL` | ✅ **Gesetzt** | Canonical URLs + Cron-Warmup |
| `STUDIO_PASSWORD` | ✅ **Gesetzt** | Passwort-Schutz für /studio und /monitoring |

**Folge:** Der tägliche Cron (08:00 UTC) speichert echte Preisschnappschüsse in Supabase. Daten werden bereits gesammelt.

### Noch nicht konfiguriert (optional)

| Variable | Zweck |
|---|---|
| `BEEHIIV_API_KEY` | Newsletter automatisch versenden |
| `BEEHIIV_PUBLICATION_ID` | Newsletter automatisch versenden |
| `ELEVENLABS_API_KEY` | KI-Stimme für Videos |
| `YOUTUBE_ACCESS_TOKEN` | Videos automatisch hochladen |
| `BUFFER_ACCESS_TOKEN` | Social-Media-Posts planen |
| `NEXT_PUBLIC_CARDMARKET_URL` | Eigener Cardmarket-Affiliate-Link |
| `NEXT_PUBLIC_AMAZON_URL` | Eigener Amazon-Affiliate-Link |
| `NEXT_PUBLIC_TRADE_REPUBLIC_URL` | Eigener Trade Republic-Affiliate-Link |

### Sicherheitshinweis

Der Supabase-Service-Role-Key wurde in einer früheren Chat-Session versehentlich
offengelegt. Der Nutzer wurde gebeten, ihn zu **rotieren** (Supabase Dashboard →
Settings → API → regenerate service_role key). Neuen Wert danach in Vercel aktualisieren.

---

## Sicherheitsarchitektur (Studio / Monitoring)

**WICHTIG:** Der Nutzer hat alle relevanten Passwörter und Keys bereits gesetzt. Nie wieder fragen ob sie gesetzt sind.

| Bereich | Schutz |
|---|---|
| `/studio` | Client-seitiger Auth-Gate → POST `/api/studio-auth` → HttpOnly-Cookie |
| `/monitoring` | Eigene Seite, gleicher Auth-Gate wie /studio |
| `/api/monitoring` | Server-seitig: prüft `studio_session`-Cookie → 401 wenn fehlt |
| `/api/status` | Server-seitig: prüft `studio_session`-Cookie → 401 wenn fehlt |
| `/api/generate` | Kein Auth — wird nur intern aus Studio aufgerufen |
| `/api/cron` + `/api/cron/daily` | Geschützt via `Authorization: Bearer CRON_SECRET` |

**Cookie-Details:**
- Name: `studio_session`
- Wert: SHA-256 von `"pokemarket:studio:" + STUDIO_PASSWORD`
- Flags: `HttpOnly`, `Secure` (Prod), `SameSite=Strict`
- Laufzeit: 7 Tage
- Logout: DELETE `/api/studio-auth` löscht Cookie

**Niemals** `sessionStorage` oder `localStorage` für Auth-State nutzen — das ist in Devtools umgehbar.

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
| v0.8.0 | 21.06.2026 | Marco-Skill (/artikel-schreiben), Artikel-Bilder (FeaturedCards + Gallery), Booster-Set-Logos in Guides | — |
| v0.9.0 | 21.06.2026 | NavBar-Redesign (rückgängig gemacht in 0.9.1), Blog-Fallback-Artikel mit echtem Marco-Inhalt | — |
| v0.9.1 | 21.06.2026 | NavBar auf Single-Top-Bar zurückgesetzt (Bottom-Tab-Bar hat Layout zerstört) | — |
| v0.9.2 | 21.06.2026 | ArticleCardGallery (Recharts-Preischart), Guide-Karten mit echten Bildern (kein 🃏-Emoji mehr) | — |
| v0.9.3 | 21.06.2026 | Booster-Set-Logo unter allen Karten (Artikel + Guides), Skill-Datei erweitert | — |
| v0.9.4 | 21.06.2026 | Studio/Monitoring: Skills & Workflows-Sektion (auto-liest .claude/commands/) | `6d3bb95` |
| v0.9.5 | 21.06.2026 | Booster-Pack-Artwork (assets.pokemon.com CDN + Fallback), Blog-Listing mit echten Titeln | `0a5888c` |
| v0.9.6 | 21.06.2026 | Server-Auth via HttpOnly-Cookie, /api/monitoring + /api/status geschützt, /monitoring eigene Seite | `c72c0b0` |
