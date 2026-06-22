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

### Deploy-Checkliste (PFLICHT — jeder Schritt, jedes Mal!)

> **WICHTIG:** Vercel überspringt vitest (buildCommand = `next build`). Deshalb
> MÜSSEN Tests lokal laufen — sie sind die letzte Sicherheitslinie vor Production!

**Vor dem Commit:**

- [ ] **`npm test` lokal ausführen** — alle Tests müssen grün sein (kein Skip!)
      `npm test` → alle Suites bestanden, 0 Failures
- [ ] **`npm run build` lokal grün** — kein TypeScript-Fehler, alle Seiten gebaut
      (beinhaltet nochmals `npm test` + `next build` — beide müssen 0 Fehler haben)
- [ ] **Version in `package.json` erhöht** (patch x.x.+1 oder minor x.+1.0)
- [ ] **Git-Commit mit aussagekräftiger Nachricht** (was & warum, nicht nur was)

**Nach dem Commit:**

- [ ] **Beide Branches gepusht (PFLICHT — beide oder keiner):**
  - `git push -u origin claude/direct-push-main-lxluxu`
  - `git push origin HEAD:main`
- [ ] **GitHub Main-Branch verifiziert** — neueste SHA stimmt mit lokalem HEAD überein
  → `git log --oneline -1` mit GitHub MCP `list_commits sha:main` abgleichen
- [ ] **Vercel-Deployment abwarten** — ca. 1–2 Minuten nach Push auf main
- [ ] **Live-Seite verifizieren** — Footer zeigt `vX.Y.Z` (neue Version sichtbar?)
      Falls alte Version: Vercel Build-Log prüfen, ob der Deploy überhaupt gestartet hat
- [ ] **`CHANGELOG.md` aktualisieren** — neue Version mit Neu/Geändert/Behoben-Einträgen ganz oben eintragen
- [ ] **`/changelog`-Seite aktualisieren** — `RELEASES`-Array in `src/app/changelog/page.tsx` ergänzen,
      `isLatest: true` auf neue Version, `isLatest: false` auf bisherige neueste Version setzen
- [ ] **STATUS.md aktualisieren** — neue Version + Highlights eintragen
- [ ] **Pflicht-Kommunikation im Chat (IMMER am Ende der Deploy-Antwort):**
  - **Changelog-Summary:** 3–5 Stichpunkte was neu/geändert/behoben ist
  - **Deployment-Bestätigung:** GitHub-SHA bestätigen (`git log --oneline -1` ↔ MCP `list_commits sha:main`), dann explizit sagen: "Vercel-Deployment läuft — bitte Footer auf `vX.Y.Z` prüfen in ~1–2 Min."

### Versionierungsschema

| Typ | Wann | Beispiel |
|-----|------|---------|
| Patch `x.y.+1` | Bugfix, kleine Textänderung | 0.5.0 → 0.5.1 |
| Minor `x.+1.0` | Neues Feature, größere Änderung | 0.5.0 → 0.6.0 |
| Major `+1.0.0` | Kompletter Umbau | 0.9.0 → 1.0.0 |

Die Version wird **immer** im Deploy-Commit-Titel genannt: `v0.6.0 — ...`

### Release-Notes-Pflicht (IMMER bei jedem Deploy!)

Drei Dateien müssen synchron gehalten werden — keine Ausnahmen:

| Datei | Was eintragen |
|---|---|
| `CHANGELOG.md` | Neue Version ganz oben, Einträge als `### Neu / Geändert / Behoben` |
| `src/app/changelog/page.tsx` | Neues Objekt in `RELEASES[]` oben, `isLatest: true` auf neue, bisherige auf `false` |
| `STATUS.md` | Versions-Log-Tabelle ergänzen + "Was gebaut ist"-Tabelle aktualisieren |

**Warum:** Die `/changelog`-Seite ist öffentlich sichtbar — veraltete Release-Notes beschädigen die Glaubwürdigkeit der Plattform. Lückenlose Dokumentation ist Teil der Produktqualität.

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

- **Marktbeobachtungen**: Sachliche Einschätzungen ohne persönliche Kaufempfehlungen
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

**Tonalität:** Alle Artikel sind sachliche Marktanalysen ohne Persona-Namen ("Marco" wurde entfernt) und ohne persönliche Kaufempfehlungen. Nur Marktbeobachtungen, Preisanalyse und faktische Einschätzungen. Keine "Ich empfehle", "Pflichtkauf", "kaufenswert" etc.

---

## Content-Tonalität (PFLICHT — keine Kaufempfehlungen, kein Persona-Name!)

**REGEL:** Alle Inhalte sind sachliche, neutrale Marktanalysen und -berichte.

| Was verboten ist | Beispiele |
|---|---|
| Kaufempfehlungen | "kaufenswert", "Pflichtkauf", "sollte jetzt kaufen", "unter X € empfehlenswert" |
| Persönliche Ratschläge | "Ich empfehle", "Meine klare Meinung: kaufen", "würde ich kaufen" |
| Persona-Name | "Marco" oder irgendein Name — es gibt keinen Erzähler mit Namen |
| Erste Person Singular | "Ich habe", "Ich empfehle", "Meine Meinung", "Ich werde" |

| Was erlaubt ist | Beispiele |
|---|---|
| Preisbeobachtungen | "Die Karte notiert bei 130 €", "Der Markt hat diesen Preis als fair akzeptiert" |
| Historische Muster | "Sets nach Produktionsende steigen historisch", "4–8 Wochen nach Release ist der Tiefpunkt" |
| Faktische Analyse | "Angebotsmenge sinkt", "Nachfrage von Sammlern steigt", "Druckrate bei 1:120" |
| Neutrale Prognosen | "Das Angebotsniveau verdient Beobachtung", "Historisch folgte danach X" |

**Begründung:** Das ist eine Analyse- und Informationsplattform — keine Finanzberatung, keine Influencer-Empfehlungen. Nutzer sollen sich selbst ein Bild machen können.

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
| Karten-Detailseite Showcase | `h-48 w-auto drop-shadow-xl` | Groß, eigene Sektion "Aus diesem Booster-Set" |
| Kartenraster (CardGrid) | `h-5 w-auto` | Klein, inline neben Set-Name |
| Artikel/Guides | `h-14 object-contain drop-shadow-sm` | Mittel, unter Kartenbild |

**Fallback:** Wenn das Boosterpack-Bild nicht lädt (ältere Sets), fällt die Komponente automatisch auf das Set-Logo zurück — kein manueller Fallback nötig.

**WICHTIG:** Bei neuen Seiten/Komponenten die Karten zeigen → sofort `BoosterPackImage` einbauen. Kein Set-Name als reiner Text ohne Bild daneben!

### Boosterpack-Bilder immer mit Affiliate-Links verknüpfen (PENDING — sobald Links bereit)

**REGEL:** Jedes Boosterpack-Bild und jede Erwähnung eines Sets/Boosters MUSS mit einem Affiliate-Link verknüpft sein — damit Nutzer direkt zum Kauf gelangen und wir eine Provision erhalten.

**Aktueller Stand:** Auf der Karten-Detailseite gibt es bereits einen Amazon-Suchlink. Alle anderen Stellen warten auf die eigenen Affiliate-Links.

**Sobald `NEXT_PUBLIC_AMAZON_URL` und/oder `NEXT_PUBLIC_CARDMARKET_URL` in Vercel gesetzt sind:**

1. **Alle `BoosterPackImage`-Vorkommen** in einem `<a>`-Tag wrappen:
   ```tsx
   <a href={process.env.NEXT_PUBLIC_AMAZON_URL || `https://www.amazon.de/s?k=${encodeURIComponent(`Pokemon ${setName} Booster`)}`}
      target="_blank" rel="noopener noreferrer sponsored">
     <BoosterPackImage setCode={setCode} setName={setName} className="..." />
   </a>
   ```
2. **"Aus diesem Booster-Set"-Sektion** auf der Karten-Detailseite: Link auf eigene Affiliate-URL aktualisieren
3. **Artikel-Sektionen mit `section.highlight`**: Boosterpack-Bild dort ebenfalls verlinken
4. **CardGrid**: Kleines Boosterpack-Bild neben Set-Name mit Link versehen

**Bis die Links bereit sind:** Generic Amazon-Suche als Fallback (wie aktuell) — nie ohne irgendeinen Link lassen.

**Überall immer:** `rel="noopener noreferrer sponsored"` + `* Affiliate-Link`-Hinweis darunter (Pflicht per Gesetz).

### Zubehör-Links — `<AccessoryLink>` Komponente (PENDING — sobald Links bereit)

**REGEL:** Wenn in Artikeln oder Guides Zubehör erwähnt wird (Toploader, Sammelalbum/Binder, Sleeves, Aufbewahrungsboxen etc.), MUSS dieses Wort mit einem Affiliate-Link verknüpft sein.

**Komponente:** `src/components/AccessoryLink.tsx`

```tsx
import { AccessoryLink } from '@/components/AccessoryLink';

// Im Artikeltext:
<AccessoryLink type="toploader">Toploader</AccessoryLink>
<AccessoryLink type="binder">Sammelalbum</AccessoryLink>
<AccessoryLink type="sleeve">Sleeves</AccessoryLink>
<AccessoryLink type="storage">Aufbewahrungsbox</AccessoryLink>
```

**Verfügbare Typen:**
| Typ | Produkt | Fallback-Link |
|---|---|---|
| `toploader` | Toploader / Hartplastikhüllen | Amazon-Suche "pokemon karten toploader" |
| `binder` | Sammelalbum / Binder / Ringbuch | Amazon-Suche "pokemon sammelalbum karten binder" |
| `sleeve` | Kartenhüllen / Sleeves | Dragon Shield Webseite |
| `booster` | Booster-Packs (Set-spezifisch) | Amazon-Suche mit Set-Name |
| `storage` | Aufbewahrungsboxen / Kartenboxen | Amazon-Suche "pokemon karten aufbewahrungsbox" |

**Aktueller Stand:** Fallback-Links (generische Amazon/Dragon Shield-Suche) aktiv. Sobald eigene Affiliate-Links vorhanden:
1. Env-Vars in Vercel setzen (siehe unten)
2. Die `AccessoryLink`-Komponente nutzt sie automatisch — kein Code-Update nötig

**Texterwähnungen in Artikel-Content (static-articles.ts und fallbackArticle):** Sobald Affiliate-Links ready sind, Textstellen mit `<AccessoryLink>` wrappen — aktuell ist content reiner Text (kein JSX). Für KI-generierten Content: Prompt in `buildPrompt()` updaten, damit Claude AccessoryLink-Tags in den Text einbaut.

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

| Variable | Zweck | Was sich ändert wenn gesetzt |
|---|---|---|
| `BEEHIIV_API_KEY` | Newsletter automatisch versenden | Newsletter-Cron aktiv |
| `BEEHIIV_PUBLICATION_ID` | Newsletter automatisch versenden | Newsletter-Cron aktiv |
| `ELEVENLABS_API_KEY` | KI-Stimme für Videos | Video-Cron aktiv |
| `YOUTUBE_ACCESS_TOKEN` | Videos automatisch hochladen | Video-Cron aktiv |
| `BUFFER_ACCESS_TOKEN` | Social-Media-Posts planen | Social-Cron aktiv |
| `CARDMARKET_APP_TOKEN` | ⭐ Cardmarket OAuth App-Token | Sprachspezifische Preise (DE/JP/KR) im Portfolio |
| `CARDMARKET_APP_SECRET` | Cardmarket OAuth App-Secret | HMAC-SHA1-Signierung aller API-Requests |
| `CARDMARKET_USER_TOKEN` | Cardmarket OAuth User-Token | Vom eigenen Cardmarket-Account: API → Anwendungen |
| `CARDMARKET_USER_SECRET` | Cardmarket OAuth User-Secret | Alle 4 nötig — fehlt eine, Fallback auf EN-Preis |
| `NEXT_PUBLIC_AMAZON_URL` | ⭐ Eigener Amazon-Affiliate-Link (Booster) | **Alle Boosterpack-Bilder + Kauflinks auf diesen Link umstellen** |
| `NEXT_PUBLIC_CARDMARKET_URL` | ⭐ Eigener Cardmarket-Affiliate-Link | **Alle Cardmarket-Kauflinks auf diesen Link umstellen** |
| `NEXT_PUBLIC_TRADE_REPUBLIC_URL` | Eigener Trade Republic-Affiliate-Link | Trade Republic-Link sichtbar |
| `NEXT_PUBLIC_TOPLOADER_AFFILIATE_URL` | ⭐ Amazon-Affiliate für Toploader | `<AccessoryLink type="toploader">` nutzt diesen Link |
| `NEXT_PUBLIC_BINDER_AFFILIATE_URL` | ⭐ Amazon-Affiliate für Sammelalbum/Binder | `<AccessoryLink type="binder">` nutzt diesen Link |
| `NEXT_PUBLIC_SLEEVE_AFFILIATE_URL` | ⭐ Affiliate für Sleeves/Kartenhüllen | `<AccessoryLink type="sleeve">` nutzt diesen Link (Dragon Shield / Amazon) |
| `NEXT_PUBLIC_STORAGE_AFFILIATE_URL` | Amazon-Affiliate für Aufbewahrungsboxen | `<AccessoryLink type="storage">` nutzt diesen Link |

**⭐ = Hat direkten Einfluss auf Monetisierung** — sobald gesetzt, sofort alle betroffenen Stellen updaten (siehe UI-Design-Regeln → Boosterpack-Links).

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
10. **Vercel überspringt vitest** → `vercel.json` hat `"buildCommand": "next build"` (ohne vitest). Das war nötig weil vitest in Vercels Build-Umgebung fehlschlug (Supabase/Anthropic-Init). **Lokaler Build (`npm run build`) führt beide Schritte durch.** Tests müssen deshalb IMMER lokal grün sein vor dem Push — Vercel prüft sie nicht!
11. **Deployment scheinbar erfolgreich, aber alte Version live** → Vercel zeigt manchmal keinen Fehler, hat aber den Build gecancelt oder die Seite aus Cache bedient. Nach jedem Push: Footer auf der Live-Seite prüfen. Wenn noch alte Version → Vercel Build-Log kontrollieren.

---

## Monetisierungsstrategie & Business-Plan

### Einnahmequellen (geplant / in Umsetzung)

| Quelle | Status | Nächster Schritt |
|---|---|---|
| **Amazon Affiliate** (Booster-Packs) | 🔄 Generischer Link aktiv | Eigenen Affiliate-Link beantragen → `NEXT_PUBLIC_AMAZON_URL` setzen |
| **Cardmarket Affiliate** (Einzelkarten) | 🔄 Generischer Link aktiv | Eigenen Affiliate-Link beantragen → `NEXT_PUBLIC_CARDMARKET_URL` setzen |
| **Trade Republic Affiliate** | ⏳ Noch nicht aktiv | Link beantragen → `NEXT_PUBLIC_TRADE_REPUBLIC_URL` setzen |
| **Newsletter** (Beehiiv) | ⏳ API nicht konfiguriert | `BEEHIIV_API_KEY` setzen |

### Affiliate-Link-Strategie (PFLICHT wenn Links bereit)

**Kernprinzip:** Jeder Booster, jede Karte, jedes Set das auf der Seite erscheint, ist eine Kaufgelegenheit — und muss verlinkt sein.

**Umsetzungsreihenfolge sobald eigene Affiliate-Links vorliegen:**

1. `NEXT_PUBLIC_AMAZON_URL` in Vercel setzen (eigener Amazon-Affiliate-Tracking-Link)
2. `NEXT_PUBLIC_CARDMARKET_URL` in Vercel setzen (eigener Cardmarket-Affiliate-Link)
3. Alle Boosterpack-Bilder und Erwähnungen auf diese Links umstellen:
   - `BoosterPackImage`-Komponente: immer in `<a href={affiliateUrl}>` wrappen
   - "Aus diesem Booster-Set"-Sektion auf Karten-Detailseite: Link aktualisieren
   - CardGrid: Kleines Boosterpack-Bild mit Affiliate-Link versehen
   - Artikel-Sektionen mit Karten-Highlights: Booster-Link ergänzen
   - Kaufen-Buttons überall: auf Affiliate-URLs umleiten

**Rechtliches:**
- Immer `rel="noopener noreferrer sponsored"` auf Affiliate-Links
- Immer `* Affiliate-Link`-Hinweis in der Nähe (Kennzeichnungspflicht)
- Datenschutzerklärung enthält bereits entsprechenden Hinweis

### Content-Monetisierungsprinzip

Jeder Artikel, Wochenrückblick und Guide ist gleichzeitig Content UND Verkaufschance:
- Marco empfiehlt eine Karte → Kauflink zur Karte auf Cardmarket
- Marco erwähnt ein Set → Booster-Pack-Bild mit Amazon-Affiliate-Link
- Guide zu Lagerung → Links zu Dragon Shield / Ultra PRO / BCW (zukünftig Affiliate)

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
