# CLAUDE.md — Arbeitsgedächtnis für Claude Code

Diese Datei ist das dauerhafte Gedächtnis für Claude Code in diesem Projekt.
Hier stehen alle Regeln, Prozesse und Erkenntnisse, die sitzungsübergreifend gelten.

---

## Kommunikationsstil im Chat (NUR Chat — niemals Seiteninhalte!)

Steffen mag im **Chat** einen lockeren, selbstironischen, intelligenten Ton — gern mit sparsamen Analogien rund um Bier/Braukunst als Running Gag (ein Feature „reift", ein Bugfix ist eine „neue Rezeptur", eine schnelle Patch-Serie ist ein „Brauvorgang"). Sparsam einsetzen, als Würze, nicht als ganze Maß. Selbstironische Anspielungen auf unsere Zusammenarbeit sind willkommen — aber nur, wenn sie durch die dokumentierte Projekthistorie gedeckt sind (z. B. die „linearen" Preis-Charts, die 7-von-9-falschen Kartenbilder, die Patch-Serie v2.17.1–.3).

**ZAPFSPERRE (unbedingt):** Dieser Humor gilt AUSSCHLIESSLICH für Chat-Antworten an Steffen. Er darf NIEMALS in Seiteninhalte, Artikel, Guides, Marktberichte, UI-Texte, Commit-Messages, Changelog oder irgendein veröffentlichtes Artefakt gelangen. Dort gelten unverändert die strengen Regeln: sachliche Marktanalyse, keine Persona, keine erste Person, kein Bier. Ein Braukunst-Vergleich in einem Pokémon-Marktartikel wäre der GAU.

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

## Aktueller Stand & Richtung (v2.16.0 — 19. Juli 2026)

**Technischer Stand:** Plattform stabil und deployt. Bilder API-unabhängig (Caching-Proxy `/api/img`, stale-if-error 1 Jahr). SEO-Basis komplett (Canonicals pro Seite, JSON-LD Article, Sitemap inkl. Top-40-Karten). Alle Karten-IDs API-verifiziert, Emojis vollständig durch Lucide-Icons ersetzt (ContentIcon). 110 Tests grün.

**Offene Nutzer-Aufgaben (nur Steffen kann sie erledigen):**
- Google Search Console anmelden (SEO-Basis ist bereit)
- Amazon PartnerNet + Cardmarket-Affiliate beantragen → Env-Vars setzen
- Supabase service_role Key rotieren (falls noch offen)
- Vercel Analytics im Dashboard aktivieren

**Aktueller Fokus (seit 19.07.2026): Social-Media-Reichweite → Website.**
Ziel: Automatisiert Reels aus Live-Marktdaten generieren (ohne manuelles Videomaterial), Captions mit UTM-Links zur Seite, Ein-Klick-Workflow im Studio.

**Umgesetzt (v2.17.0):** Auto-Reel-Generator — `src/lib/reel-generator.ts` (FFmpeg-Rendering: Intro → Top-Mover-Segmente → Outro/CTA), `/api/video/auto-reel` (Studio-Auth), `AutoReelPanel` im Reels-Tab. Caption endet mit `?utm_source=instagram&utm_medium=reel&utm_campaign=top-mover`. Reels landen in Supabase Storage `videos/auto-reels/`.

**Nächste Schritte für diese Richtung:**
- Sobald `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID` (Meta Graph API, Business-Account) in Vercel gesetzt sind, ist der „Auf Instagram posten"-Button live — bis dahin greift der Download-Weg.
- Danach: Cron-Anbindung (z.B. wöchentlich Do nach Marktanalyse) für vollautomatisches Reel + Publish.
- Optional: TikTok/YouTube-Shorts-Publishing (gleiche MP4-Datei, andere Upload-API).

Bestehende Bausteine: ReelsStudio (manueller Upload→Trim→Brand→Publish), `/api/video/*`, FFmpeg via ffmpeg-static, Supabase Storage Bucket `videos`.

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

## Blog-Veröffentlichungsplan (PFLICHT — nie ändern ohne explizite Freigabe!)

**Artikel erscheinen NUR an diesen zwei Wochentagen:**

| Tag | Inhalt | Code |
|---|---|---|
| **Sonntag** | Wochenrückblick | `rueckblick` |
| **Donnerstag** | Rotierender Artikel (Markt / Karte im Fokus / Strategie / Set-Analyse / Ausblick / Guide) | rotating |

**Was das bedeutet:**
- Der Daily-Cron generiert Artikel NUR an Sonntag (0) und Donnerstag (4)
- Die Blog-Listing-Seite `/artikel` zeigt AUSSCHLIESSLICH So/Do-Einträge — keine anderen Wochentage
- `/artikel/[date]` gibt 404 zurück wenn der Datums-Wochentag nicht So oder Do ist
- Der Tages-Badge "Heute neu" erscheint nur wenn heute ein So oder Do ist
- NIEMALS auf tägliche Artikel umstellen — der Nutzer will gezielten, hochwertigen Content

**Code-Verankert in:**
- `src/lib/article-generator.ts` → `PUBLISH_DAYS = new Set([0, 4])` und `getArticleType(dateStr)`
- `src/app/artikel/page.tsx` → `getPublishDates()` filtert nur So/Do
- `src/app/artikel/[date]/page.tsx` → `if (!type) notFound()`
- `src/app/api/cron/daily/route.ts` → nur wenn `PUBLISH_DAYS.has(dayOfWeek)`

---

## Außendarstellung: keine Hinweise auf Auto-/KI-Generierung (PFLICHT)

**REGEL:** Öffentliche Content-Seiten (Artikel, Marktbericht, Guides, Startseite) dürfen NICHT sichtbar machen, dass Inhalte automatisiert oder per KI erzeugt werden. Keine Labels wie „KI-Analyse", „KI-Marktbericht", „automatisch von KI generiert", „bei der ersten Generierung …". Stattdessen sachliche Begriffe: „Marktanalyse", „Marktbericht", „datenbasiert".

**Was BLEIBT (rechtlich/inhaltlich Pflicht):** Disclaimer „keine Anlageberatung/Finanzberatung", „Inoffizielle Fan-Seite", Markenhinweis (Nintendo/Creatures/GAME FREAK), „Preise ohne Gewähr", Archiv-Disclaimer (`isStatic`, betrifft Preis-Aktualität — nicht KI).

**Begründung:** Der Inhalt ist echte, faktengeprüfte Marktanalyse (Compliance-Gate). Wie bei jeder Redaktion ist die Produktionsweise keine Pflichtangabe — sichtbare „KI-generiert"-Labels beschädigen unnötig die Glaubwürdigkeit gegenüber Medien/Besuchern. Ausnahme: interne Seiten `/studio` + `/monitoring` (passwortgeschützt) und `/changelog` (noindex, Entwickler-Historie) dürfen die Technik benennen.

**Verankert seit v2.17.3.** Betroffene Stellen bei neuen Features prüfen: Ladehinweise, Seiten-Header, Footer-Disclaimer, Empty-States, Metadaten-Descriptions.

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

---

### ⛔ ABSOLUT VERBOTEN in `static-articles.ts` und `article-generator.ts` (fallbackArticle)

Diese Regeln wurden nach konkreten Verstößen eingeführt. Sie gelten ohne Ausnahme:

#### 1. Keine spezifischen Preiszahlen im Fließtext

**VERBOTEN:**
```
"notiert bei 120–140 €"
"nach Release bei 80–90 €"
"PSA-10-Exemplare bei 250–350 €"
"kostet mittlerweile stabil über 120 €"
```

**ERLAUBT:**
```
"Aktuelle Preise direkt auf Cardmarket prüfen"
"notiert auf einem stabilen Niveau"
"Das Preismuster zeigt langfristig aufwärts"
"erzielen ein Vielfaches gegenüber beschädigten Exemplaren"
```

**Warum:** Hardcodierte Preise veralten sofort nach dem Commit. Werden sie nicht als veraltet erkennbar gemacht, sehen Nutzer 6 Monate alte Zahlen als aktuelle Marktdaten. Einzige Ausnahme: das `price:`-Feld in `highlight`-Objekten — die sind durch den `isStatic`-Disclaimer auf der Seite gedeckt.

#### 2. Keine erfundenen historischen Preistrajektorien

**VERBOTEN:**
```
"2021: 80€ → 2022: 58€ → 2023: 75€ → heute: 120–140€"
"ist seit 2021 von 5€ auf über 1.000€ gestiegen"
```

**ERLAUBT:**
```
"Das Muster dieser Karte zeigt langfristig steigendes Preisniveau — ausgelaufenes Set, schrumpfendes Angebot"
"Historisch haben Karten dieses Typs nach Set-Abschluss zugelegt"
```

**Warum:** Konkrete Jahrespreise für vergangene Jahre sind erfunden, wenn sie nicht aus echten Datenbankeinträgen (Cardmarket-Historie, Supabase-Snapshots) stammen.

#### 3. Keine Illustratoren-Attributionen ohne Quellennachweis

**VERBOTEN:**
```
"Illustriert von Mitsuhiro Arita"
"Dieselbe Künstlerin wie beim Base Set Charizard"
```

**ERLAUBT:**
```
"Ein Artwork das weit über TCG-Standard liegt"
"Herausragende Illustrationsqualität"
```

**Nachweis-Quelle:** Bulbapedia-Kartenseite (z.B. `https://bulbapedia.bulbagarden.net/wiki/Umbreon_VMAX_(Evolving_Skies_215)`) — nur wenn dort explizit der Illustrator genannt ist, darf es in den Text.

#### 4. Keine unverifizierten spezifischen Auction/Markt-Events

**VERBOTEN:**
```
"Hat auf Cardmarket neue Höchstpreise von über 200€ für PSA-10-Exemplare erzielt"
"Diese Woche auf 75€ gestiegen"
```

**ERLAUBT:**
```
"Zeigt zunehmende Sammlernachfrage"
"Rückt wieder in den Blickpunkt"
```

#### 5. `isStatic: true` MUSS auf jedem statischen/Fallback-Artikel gesetzt sein

- `readArticle()` bei `STATIC_ARTICLES`-Treffer → `isStatic: true` ✅ (bereits implementiert)
- `generateArticle()` bei `STATIC_ARTICLES`-Treffer → `isStatic: true` ✅ (bereits implementiert)
- `fallbackArticle()` Rückgabe → `isStatic: true` ✅ (bereits implementiert)
- **Niemals** `isStatic` auf `false` setzen oder weglassen bei diesen Pfaden

**Warum:** Der Archiv-Disclaimer auf der Seite ist der einzige Schutz vor veralteten Preisangaben. Fällt er weg, sehen Nutzer möglicherweise 12 Monate alte Zahlen als aktuelle Marktdaten.

#### 6. Keine Erste-Person-Singular-Stimme in statischen Artikeln

**VERBOTEN:** `"Ich erkläre heute"` · `"Für mich ist das"` · `"Ich nenne den Namen nicht"` · `"ich hab zu spät gedrückt"`

**ERLAUBT:** Impersonale Marktanalyse · `"Der Markt zeigt"` · `"Die Daten bestätigen"` · `"Marktbeobachtung:"` · `"Historisch hat sich gezeigt"`

**Warum:** CLAUDE.md-Regel seit v0.9.x — es gibt keinen Erzähler mit Namen, keine Persona, keine erste Person Singular.

---

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

Vor jedem Commit der Artikel-Inhalte (static-articles.ts, article-generator.ts, guides.ts) prüfen:

- [ ] **Keine spezifischen Preiszahlen im Fließtext** (siehe Regel 1 oben) — "120–140 €" im Text = STOP
- [ ] **Keine erfundenen Preistrajektorien** (siehe Regel 2) — Jahr-für-Jahr-Kurven ohne echte Daten = STOP
- [ ] **Keine Illustratoren-Attributionen ohne Bulbapedia-Nachweis** (siehe Regel 3) = STOP
- [ ] **Keine spezifischen Auktions-/Markt-Events ohne Beleg** (siehe Regel 4) = STOP
- [ ] **`isStatic: true` gesetzt** bei static/fallback Pfaden (siehe Regel 5) = PFLICHT
- [ ] **Keine Erste Person Singular** (siehe Regel 6) = STOP
- [ ] Alle genannten Pokémon-Karten existieren wirklich (Name + Set korrekt?)
- [ ] **Karten-IDs/Bild-URLs API-verifiziert**: Jede hardcodierte `images.pokemontcg.io/{set}/{nr}.png`-URL MUSS per `GET api.pokemontcg.io/v2/cards/{set}-{nr}` geprüft werden — stimmt `name` mit dem Text überein? (v2.16.0-Fund: 7 von 9 IDs zeigten falsche Karten — z.B. „Charizard ex" war Alakazam, „Pokéball Gold" war eine Psycho-Energie. Bild ≠ Text zerstört Glaubwürdigkeit!)
- [ ] Alle genannten Events/Turniere/Ankündigungen sind real oder klar als hypothetisch kenntlich
- [ ] `sources`-Array enthält mindestens eine direkte Quellenangabe

**Tonalität:** Alle Artikel sind sachliche Marktanalysen ohne Persona-Namen und ohne persönliche Kaufempfehlungen. Nur Marktbeobachtungen, Preisanalyse und faktische Einschätzungen. Keine "Ich empfehle", "Pflichtkauf", "kaufenswert" etc.

---

## Guide-Pipeline (automatisierte Evergreen-Guides)

**Ablauf:** Daily-Cron generiert **dienstags + freitags** (versetzt zu Artikel-Tagen So/Do) den
nächsten Guide aus der Themen-Warteschlange `src/lib/guide-topics.ts`.

| Baustein | Datei | Aufgabe |
|---|---|---|
| Themen-Queue | `src/lib/guide-topics.ts` | Kuratierte Themen mit Slug, Brief (Such-Intention), Outline — Reihenfolge = Priorität |
| Generator | `src/lib/guide-generator.ts` | Claude-Generierung mit GUIDE_RULES + **Qualitäts-Gate** `validateGuide()` |
| Regeln | `src/lib/content-rules.ts` | EINE Regex-Quelle für Build-Tests UND Laufzeit-Gate |
| Storage | `src/lib/guide-storage.ts` | Supabase-Tabelle `generated_guides` (slug PK, content JSONB) |
| Anzeige | `/guides` + `/guides/[slug]` | Statische GUIDES + generierte zusammengeführt, Sitemap inklusive |

**Qualitäts-Gate (nicht verhandelbar):** Verletzt die KI-Ausgabe eine Content-Regel
(Preiszahl im Text, Ich-Form, Kaufempfehlung, KI-Floskel, Emoji im Fließtext), wird der Guide
**NICHT gespeichert** — Status `rejected_quality`, neuer Versuch am nächsten Guide-Tag.
Lieber kein Guide als ein regelwidriger.

**Supabase-Tabelle (einmalig anlegen, SQL-Editor):**
```sql
CREATE TABLE IF NOT EXISTS generated_guides (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Neue Themen:** Unten an `GUIDE_TOPICS` anhängen — Slug-Kollision mit statischen Guides
wird vom Test `guide-pipeline.test.ts` abgefangen. Briefs müssen Such-Intention nennen
und die Wahrheits-/Neutralitätsregeln respektieren.

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

## Schreibstil (PFLICHT — Texte dürfen NICHT nach KI klingen!)

**Vollständige Anleitung:** `.claude/commands/schreibstil.md` (Skill `/schreibstil`) — vor JEDEM Content-Schreiben lesen.

Kurzfassung der verbotenen KI-Muster:
1. **Floskel-Opener** („Hier ein Überblick", „In der heutigen Zeit", „Tauchen wir ein") → direkt mit Fakt/Beobachtung/Kontrast einsteigen
2. **Aufgeblasene Adjektive** (atemberaubend, revolutionär, bahnbrechend, faszinierend, episch, spektakulär) → das konkrete Detail nennen
3. **Meta-Kommentare** („In diesem Artikel...", „Zusammenfassend...", „Fazit:") → weglassen
4. **Symmetrie-Zwang** (immer 3 Punkte, gleichlange Absätze) → Ungleichgewicht zulassen
5. **Gleichförmiger Satzrhythmus** → kurze Sätze einstreuen (3–6 Wörter)
6. **Doppelpunkt-Konstruktionen** („Der Grund: ...") → max. 1 pro Text
7. **Emojis KOMPLETT verboten** → nirgendwo, auch nicht in Überschriften/Tips — visuelle Anker liefern ausschließlich Lucide-Icons (siehe UI-Design-Regeln → Icon-Regel)
8. **Absatz-Schlusssätze die sich selbst zusammenfassen** → Absatz endet mit dem letzten Fakt

**Faktendichte-Test:** Jeder Satz beantwortet Was/Wann/Wie viel/Warum/Woher — sonst streichen.

**Durchsetzung:** `content-compliance.test.ts` (AI_PHRASES-Blockliste + Emoji-Regex) schlägt bei Verstößen fehl.
Die KI-Generierung bekommt `STYLE_RULES` (article-generator.ts) in jedem Prompt.

---

## UI-Design-Regeln (PFLICHT — immer einhalten!)

### ⛔ Icon-Regel: NUR Lucide-Icons, NIEMALS Emojis (seit v2.16.0)

**REGEL:** In der gesamten UI und in allen Inhalten (Artikel, Guides, Überschriften, Tips, Badges, Empty-States, Monitoring) sind Emojis verboten. Visuelle Anker kommen ausschließlich aus `lucide-react`.

| Kontext | Umsetzung |
|---|---|
| Content-Datenmodelle (Guides, ARTICLE_META, GUIDE_TOPICS) | Feld `icon: string` mit Icon-Key, gerendert über `<ContentIcon name={...}>` (`src/components/ContentIcon.tsx`) — neue Keys dort zentral ergänzen |
| Icon-Chip-Pattern (Listen/Cards) | `<div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400"><ContentIcon name={icon} size={18} /></div>` |
| Bild-Fallbacks | `<ImageOff>` statt 🃏 |
| Warnhinweise | `<TriangleAlert>` / `<CircleAlert>` statt ⚠️/🔴 |
| Sentiment/Status | Farbiger Punkt (`h-5 w-5 rounded-full bg-emerald-400/amber/rose`) statt 🟢🟡🔴 |

**Erlaubte Ausnahmen (KEINE Emojis im Sinne der Regel):**
- Typografische Zeichen: `→ ← ✓ ·` 
- Karten-Fachzeichen: `● ◆ ★` (Seltenheitssymbole)
- Sprach-Flaggen `🇬🇧 🇩🇪 🇯🇵 🇰🇷` NUR als funktionale Sprachindikatoren (LangPicker, Preissprache)
- Social-Media-Captions (Instagram etc.) — dort sind Emojis Plattform-Konvention

**Durchsetzung:** `EMOJI`-Regex in `src/lib/content-rules.ts` gilt für ALLE Content-Felder (auch Überschriften/Tips) — `content-compliance.test.ts` bricht den Build, `validateGuide()` verwirft KI-Guides. Alte in Supabase gespeicherte Guides mit Emoji-Feld fallen in `<ContentIcon>` auf ein Default-Icon zurück.

### ⛔ Dark Mode — Bloomberg/TradingView-Design (GLOBAL BINDEND — keine Ausnahmen!)

**REGEL:** Die gesamte Plattform verwendet ein einheitliches dunkles Design im Bloomberg/TradingView-Stil. Kein Weiß, kein Hellgrau, kein `bg-gray-50`, kein `bg-white` auf Seiten oder Cards.

#### Design-Token (IMMER diese Werte verwenden)

| Token | Klasse | Verwendung |
|---|---|---|
| Seiten-Hintergrund | `bg-[#0a0a0f]` | Jede Seite: `<div className="min-h-screen bg-[#0a0a0f] text-slate-200">` |
| Ticker/Sub-Header | `bg-[#0d0d18]` | Schmale Streifen, NavBar-Hintergrund |
| Card-Hintergrund | `bg-[#13131e]` | Panels, Cards, Sektionen |
| Hover-Hintergrund | `bg-[#1a1a28]` | Hover-States auf Cards und Rows |
| Card-Border | `border-[#2a2a3a]` | Rahmen aller Cards/Panels |
| Divider | `border-[#1e1e30]` | Trennlinien zwischen Sektionen |
| Text primär | `text-slate-200` / `text-white` | Haupttext, Überschriften |
| Text sekundär | `text-slate-400` | Beschreibungen, Fließtext |
| Text muted | `text-slate-600` | Labels, Metadaten |
| Text sehr muted | `text-slate-700` | Footer-Links inaktiv |
| Akzent | `text-violet-400` / `text-violet-500` | Links, aktive States, Icons |
| Positiv/Up | `text-emerald-400` | Kursgewinne, positive Trends |
| Negativ/Down | `text-rose-400` | Kursverluste, negative Trends |
| Warnung | `text-amber-400/80` · `bg-amber-500/5` · `border-amber-500/10` | Disclaimer-Boxen |
| Section-Label | `text-[10px] font-bold uppercase tracking-widest text-slate-600` | Beschriftungen über Sektionen |
| Divider-Linie | `h-px flex-1 bg-[#1e1e30]` | Horizontale Trennlinie mit Label |

#### Header-Pattern (IMMER für Seiten-Header verwenden)

```tsx
<header className="border-b border-[#1e1e30] bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]">
  <div className="max-w-3xl mx-auto px-4 pt-10 pb-14 sm:py-16 text-center">
    <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-400">
      <Icon size={10} /> Label
    </div>
    <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white">
      Titel <span className="text-violet-400">Akzent</span>
    </h1>
  </div>
</header>
```

#### Card-Pattern

```tsx
<div className="rounded-2xl border border-[#2a2a3a] bg-[#13131e] p-5">
  ...
</div>
```

#### Hover-Row-Pattern (Tabellen, Listen)

```tsx
<div className="hover:bg-[#1a1a28] transition-colors">
```

#### Card-Hover-Pattern

```tsx
<div className="border border-[#2a2a3a] bg-[#13131e] hover:border-violet-500/30 hover:bg-[#1a1a28] transition-all">
```

#### NavBar

NavBar ist permanent dunkel: `bg-[#0d0d18]/95 border-[#1e1e30]`. Aktive Links: `text-violet-400 bg-violet-500/10`. Inaktive Links: `text-slate-500 hover:text-violet-400`.

#### Disclaimer/Footer-Box

```tsx
<div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-center">
  <p className="text-xs font-bold text-amber-400/80">...</p>
  <p className="text-[10px] text-amber-400/60">...</p>
</div>
```

#### Was VERBOTEN ist

| Verboten | Stattdessen |
|---|---|
| `bg-white` auf Cards/Seiten | `bg-[#13131e]` |
| `bg-gray-50` als Seiten-BG | `bg-[#0a0a0f]` |
| `text-gray-900` als Primärtext | `text-slate-200` oder `text-white` |
| `text-gray-400` als Sekundärtext | `text-slate-400` |
| `border-gray-100` auf Cards | `border-[#2a2a3a]` |
| `hover:border-violet-200` | `hover:border-violet-500/30` |
| `text-green-600` für Trends | `text-emerald-400` |
| `text-red-500` für Trends | `text-rose-400` |
| Helles Gradient-Header | `bg-gradient-to-b from-[#0f0f1c] to-[#0a0a0f]` |

**Betroffene Dateien — ALLE müssen dark bleiben:**
- Alle `src/app/*/page.tsx` (Seiten)
- `src/components/NavBar.tsx`
- `src/components/CardGrid.tsx`
- `src/components/SearchResultsLang.tsx`
- `src/components/ArticleCardGallery.tsx`
- `src/components/CardLangPrice.tsx`
- `src/components/AffiliateBar.tsx`
- `src/app/suche/loading.tsx`

---

### ⛔ Rich-Content-Render-Ebene (PFLICHT für ALLE Lese-Inhalte — seit v2.20.0)

**REGEL:** Content-Seiten (Artikel, Guides, Marktberichte — und jede künftige Lese-Fläche)
dürfen NICHT steril/nüchtern wirken. Sie sollen zum Lesen einladen: großzügige Typo,
visuelle Anker, Bilder, dezente Animationen. Das erreichen wir NICHT durch Handarbeit pro
Beitrag, sondern über eine gemeinsame Render-Ebene — dadurch bekommt auch jeder
**automatisch generierte** Beitrag dieselbe Anmutung, ohne dass die Text-Erzeugung etwas
davon wissen muss.

| Baustein | Datei | Aufgabe |
|---|---|---|
| `<Prose>` | `src/components/Prose.tsx` | Rohtext → großzügige Absätze, optionaler Drop-Cap (`dropcap`), Aufzählungen mit Punkten, hervorgehobene Kennzahlen (€/%). **Fließtext IMMER durch `<Prose>` rendern**, nie als nacktes `<p>{text}</p>` oder `whitespace-pre-wrap`. |
| `<Reveal>` | `src/components/Reveal.tsx` | Sanftes Einblenden beim Scrollen (Fade + Aufsteigen). Sektions-Karten in `<Reveal>` wrappen. Robust: ohne JS / bei Reduced-Motion sofort sichtbar (Text nie versteckt). |
| `<ReadingProgress>` | `src/components/ReadingProgress.tsx` | Lesefortschritts-Balken oben. Auf jeder langen Lese-Seite direkt nach `<NavBar>` einsetzen. |

**Pflicht-Muster pro Content-Seite:**
- Header mit Ambient-Glow (`animate-floaty`-Blob) + großem Icon-Medaillon als visuellem Anker
- Intro als `<Prose … dropcap>` (Magazin-Initial)
- Jede Sektion in `<Reveal>`, mit Gradient-Accent-Bar (`from-violet-600 via-fuchsia-500`) + nummeriertem/ikonischem Medaillon
- Karten/Set-Bilder wo immer möglich (siehe `BoosterPackImage`-Regel unten)

**Durchsetzung:** Neue Content-Flächen NIE mit rohem `<p>`/`whitespace-pre-wrap` bauen —
immer die drei Bausteine oben verwenden. So bleibt „lädt zum Lesen ein" der Default, nicht
die Ausnahme.

---

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
| Preis-Historie | NUR echte Daten: Supabase-Tages-Snapshots (record-on-view + Daily-Cron) gemerged mit echten Cardmarket-Ankern (Ø 30/7/1 + Trend). KEINE Interpolation, KEINE synthetische Kurve. Zu wenig Punkte → kein Chart, nur aktueller Preis (v2.19.1) |
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

## Code-Qualität & Architektur-Regeln (PFLICHT — aus Code-Review v2.6.x verankert)

Diese Regeln entstanden aus konkreten Review-Findings. Sie verhindern, dass dieselben
Fehler erneut eingebaut werden. Vor jedem Commit gegen diese Liste prüfen.

### Sicherheit (Backend / API)

1. **Auth-Vergleiche immer timing-safe** — Session-Token/Secrets NIE mit `===` vergleichen
   (Timing-Oracle). Stattdessen `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))`
   in einem `try/catch` (unterschiedliche Längen werfen). Siehe `src/lib/studio-auth.ts` → `safeEqual()`.

2. **Auth fail-closed in Production** — Fehlt ein Secret (`STUDIO_PASSWORD`) in Production,
   muss der Zugang **gesperrt** sein, nicht offen. Nur in `NODE_ENV !== 'production'` darf
   ohne Passwort geöffnet werden. Niemals `if (!secret) return true` ohne Dev-Guard.

3. **Keine internen Fehlerdetails in API-Responses** — In `catch`-Blöcken NIE `String(error)`,
   Stacktraces oder `partial`-State an den Client zurückgeben (leakt Pfade, Keys, Architektur).
   Stattdessen: `console.error(...)` server-seitig loggen + generische Antwort
   `{ error: 'internal_error' }` mit passendem Status.

4. **Nutzereingaben für externe Query-APIs sanitisieren** — Suchbegriffe, die in eine
   Query-Sprache (Lucene/TCG-API `name:"..."`) interpoliert werden, müssen Metazeichen
   entfernen: `replace(/["*?:()\[\]{}^~\\+\-!&|]/g, '')`. Sonst Query-Injection / Enumeration.
   Siehe `src/lib/pokemon-api.ts` → `searchCards()`.

### Robustheit (externe Daten & Netzwerk)

5. **Marktpreise immer als Median, nie als Minimum** — Bei Cardmarket/TCG-Listings den
   **Median** der Preise verwenden (`median()` aus `src/lib/portfolio.ts`). Ein einzelnes
   Fake-/Schaden-Listing (Cent-Preise von Bots) verfälscht sonst den ganzen Portfoliowert.

6. **Externe Fetches immer mit Timeout** — Jeder `fetch` zu TCG/Cardmarket/Anthropic, der
   in einer Request-Handler-Schleife läuft, braucht ein Timeout (z.B. `Promise.race` mit
   8s oder `AbortSignal.timeout(8000)`). Sonst hängt die Funktion bis zum Vercel-Hardlimit.
   Siehe `src/app/api/portfolio/prices/route.ts` → `withTimeout()`.

7. **Model-ID per Env-Var überschreibbar** — Anthropic-Model-IDs NIE als nackten String
   verstreuen. Zentral `process.env.ANTHROPIC_MODEL || 'claude-opus-4-8'`. Siehe
   `src/lib/ai-generator.ts` (`MODEL`) und `src/lib/article-generator.ts`.

### Frontend (React / Client-Komponenten)

8. **`useEffect`-Dependencies müssen ALLE preisrelevanten Felder erfassen** — Nicht
   `holdings.length` als Dependency nutzen, wenn sich auch Sprache/ID ändern können.
   Stattdessen einen stabilen `fetchKey` bauen: `holdings.map(h => \`${h.cardId}:${h.language}\`).join('|')`.
   Sonst werden Änderungen (z.B. Sprachwechsel im Edit-Modal) nie neu gefetcht (stale data).

9. **Fetch-Fehler NIE stumm schlucken** — Kein `.catch(() => {})` ohne UI-Rückmeldung.
   Bei fehlgeschlagenem Live-Preis-Abruf einen `priceError`-State setzen und dem Nutzer
   einen Hinweis zeigen ("Live-Preise konnten nicht geladen werden — Kaufpreise angezeigt").
   Außerdem `if (!r.ok) throw` und Cleanup via `cancelled`-Flag im Effect.

10. **Eine Quelle pro UI-Komponente** — Keine zweite Inline-Implementierung einer bereits
    existierenden Komponente (z.B. `LangPicker`). Wenn eine Variante (Layout/Größe) nötig ist,
    die bestehende Komponente per Prop erweitern. Shared Components nutzen ausschließlich
    die Dark-Mode-Tokens aus den UI-Design-Regeln — nie `bg-gray-*`/`text-gray-*`.

### Review-Pflicht vor Code-Commits (nicht Content)

Vor jedem Commit von Logik-/Komponenten-Code:
- [ ] Keine `===`-Vergleiche auf Secrets/Tokens
- [ ] Kein `if (!secret) return true` ohne `NODE_ENV`-Dev-Guard
- [ ] Kein `String(error)`/`partial` in API-Error-Responses
- [ ] Externe Fetches in Schleifen haben ein Timeout
- [ ] Marktpreis = Median, nicht `prices[0]`
- [ ] `useEffect`-Deps erfassen alle relevanten Felder (fetchKey statt `.length`)
- [ ] Kein stummes `.catch(() => {})` ohne Error-State
- [ ] Keine doppelten Komponenten-Implementierungen, keine `gray-*`-Tokens

---

## Preise: absolute Wahrheitspflicht (PFLICHT — Herzstück der Seite)

**REGEL:** Preise und Preisverläufe sind das Wichtigste auf der Seite. Es dürfen NIEMALS erfundene, zufällige oder linear-interpolierte Preise als echte Daten dargestellt werden.

- **Aktueller Preis:** Cardmarket `trendPrice` (Cardmarket-Marktpreis) > `averageSellPrice` > `avg7` > `avg30`, sonst TCGplayer. Median-Logik bei Roh-Listings (Bot-Cent-Preise verfälschen sonst).
- **Verlauf = nur echte Quellen:**
  1. **Supabase-Tages-Snapshots** — `recordPriceSnapshot` bei JEDEM Kartenaufruf (`after()`), plus Daily-Cron (~80 Top-Karten). Wächst zu echter Tages-Historie.
  2. **Cardmarket-Anker** — `buildCardmarketHistory` gibt NUR die realen Ø-Felder (30/7/1 Tage + Trend) als datierte Punkte zurück. KEINE Interpolation dazwischen.
  3. **Merge:** echte Snapshots gewinnen pro Datum gegen Anker.
- **Chart:** `PriceChart` nutzt eine ZEIT-Achse (Timestamp, proportionale Abstände) — nie eine Kategorie-Achse (die staucht ungleiche Datumslücken zu geraden Segmenten = „linear"-Look).
- **Zu wenige Punkte (<2):** KEIN Chart. Nur aktuellen Preis + „Verlauf wird aufgebaut" zeigen. Niemals eine Beispiel-/Zufallskurve.
- **Verboten:** eine Funktion wie das alte `generatePriceHistory` (Random-Walk) — wurde v2.19.1 entfernt. Nie wieder einführen.

### Transparenz statt einer einzigen Zahl (seit v2.19.2)
Cardmarket zeigt mehrere Preise; der Nutzer sieht oft die „ab X €" (günstigstes Angebot), die Seite zeigt aber den Trend (Marktwert) — das kann 30–100 % auseinanderliegen (echtes Beispiel: Mew ex Trend 16,63 € vs. ab 8,95 €). Deshalb:
- Kartenseite zeigt die volle Cardmarket-Aufschlüsselung wie im Original: **Preis-Trend (Marktwert) · Günstigstes Angebot (ab) · Ø Verkauf · Ø 30 Tage** (`card.cmPrices`), plus einen Satz, was „ab" bedeutet. So gibt es keinen Widerspruch mehr zu Cardmarket.
- **Datenstand anzeigen:** `cardmarket.updatedAt` aus der API. Die pokemontcg.io-Quelle aktualisiert NICHT täglich — viele Karten sind Monate alt. Bei >45 Tagen Hinweis „kann veraltet sein". 
- **avg1 (Ø gestern) ist verrauscht** — nie als „aktueller Preis" nutzen; in der Historie nur, wenn kein grober Ausreißer (>3× / <⅓ des Ø7/Ø30). Ein Fake-Listing (z.B. Base-Glurak avg1 = 14.950 €) darf nichts verzerren.
- **Echte Live-Cardmarket-Preise** (tagesaktuell, sprachspezifisch) gibt es nur mit den `CARDMARKET_*`-OAuth-Keys — noch nicht gesetzt. Bis dahin ist pokemontcg.io die Quelle (mit Datenstand-Hinweis).

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
12. **Artikel „noch nicht verfügbar" trotz Publish-Day** → `/artikel/[date]` darf NIE nur `readArticle()` (reiner Speicher-Lesezugriff) aufrufen. Läuft/scheitert der Cron, bleibt die Seite leer. **Lösung: bei `null` on-demand `generateArticle(type, date)` als Fallback** — generiert (auch ohne API-Key vollwertigen Fallback), persistiert, ISR cached. Seite ist damit selbstheilend, unabhängig vom Cron.
13. **404 auf der heutigen Artikel-Seite vor 12:00 UTC** → Datum NIE mit `T12:00:00`-Anker + Zeitstempel-Differenz gegen `now` vergleichen (`daysDiff < 0`). Vor 12:00 UTC liegt das geparste „heute" in der Zukunft → fälschlich 404. **Stattdessen reiner Datums-String-Vergleich** (`if (date > todayStr) notFound()`), beide UTC `toISOString().split('T')[0]`.
14. **Cron generiert, aber Seite zeigt weiter Leerstand** → Nach `generateArticle` im Daily-Cron MUSS die Detailseite revalidiert werden: `revalidatePath(\`/artikel/${today}\`)` — nicht nur `/artikel` (Listing). Sonst bleibt die gecachte Leer-Version bis zum ISR-Intervall (24h) stehen.
15. **Publish-Day-Check inkonsistent zu Artikeltyp** → `dayOfWeek` und Artikeltyp IMMER aus derselben Datums-Basis ableiten. Nicht `new Date().getDay()` (roh) für den Check und `getArticleType(today)` (T12:00-Parse) für den Typ mischen — kann an TZ-Grenzen auseinanderlaufen. Einfach `getArticleType(today)` als Single Source nutzen: `null` ⇒ kein Publish-Day.
16. **404 auf existierenden Karten-/Set-Seiten** → API-Fehler (Timeout/429/5xx) NIEMALS als `notFound()` behandeln — sonst wird eine existierende Seite als 404 gecacht (ISR) oder sogar beim Build fest eingebacken (generateStaticParams!). **Regeln:** (a) `fetchCardById` gibt `null` NUR bei echtem HTTP 404, transiente Fehler → 1 Retry, dann throw; (b) Seiten fangen den Throw und rendern `<ApiErrorState>` statt `notFound()`; (c) KEIN `generateStaticParams` auf Routen, deren Seiteninhalt von der TCG-API abhängt — On-Demand + ISR + Loading-Skeleton ist robuster.
17. **Leere Karten (kein Bild/Preis) in Suche & Ergebnissen** → Die TCG-Datenbank enthält unveröffentlichte/Preview-Karten (künftige Sets) ohne Bild und ohne Preis — sie erscheinen sonst als leere Platzhalter-Zeilen. **Lösung: zentral in `mapAndFilter()` (src/lib/pokemon-api.ts) via `isDisplayableCard()` filtern** — eine Karte wird nur angezeigt, wenn `displayPrice(card) > 0 && card.imageUrl`. ALLE listenliefernden Funktionen (`searchCards`, `fetchTrendingCards`, `fetchCardsBySet`, `fetchTopValueCards`) nutzen diese eine Stelle. `fetchCardById` (Detailseite per Direktlink) filtert NICHT — Einzelaufruf soll immer funktionieren. Marktpreis IMMER über `displayPrice(card)` lesen, nie `card.prices.market || ...` duplizieren.

20. **FFmpeg `drawtext` schlägt auf Vercel fehl (Video/Reel „internal_error")** → Vercels serverlose Umgebung hat KEINE System-Schriftarten. Jeder `drawtext`-Filter OHNE explizite `fontfile=` scheitert („Cannot find a valid font") → das ganze Rendering wirft. **Lösung:** Eine TTF (Liberation Sans, frei) liegt in `src/assets/fonts/reel-font.ttf`, wird via `outputFileTracingIncludes` (next.config.ts) ins Function-Bundle gepackt, und JEDES `drawtext` bekommt `fontfile=${join(process.cwd(),'src/assets/fonts/reel-font.ttf')}`. Gilt für `reel-generator.ts` UND `api/video/process`. Nie wieder `drawtext` ohne `fontfile`.

19. **Startseite ohne Trends/Marktdaten (leere Mover-Listen)** → Die Startseite (`○ Static`, ISR 1h) leitet Gewinner/Verlierer/PMI aus `fetchTopValueCards()` ab. Schlägt der TCG-Abruf beim Generieren fehl (Rate-Limit/Timeout/Down — z.B. während eines Deploys), gibt die Funktion `[]` zurück und die LEERE Seite wird bis zu 1h (oder bis zum nächsten Deploy) gecacht. **Lösung: `getHomepageCards()` (src/lib/homepage-data.ts)** — Live-Abruf mit Fallback auf den letzten in Supabase gespeicherten Marktbericht (`loadLatestMarketReport()`, vom Wochen-Cron befüllt, echte Karten mit Bild+Trend). Startseite NIE direkt `fetchTopValueCards()` aufrufen, immer `getHomepageCards()`. Merke: Viele schnelle Deploys hintereinander erhöhen das Risiko, dass ein Build genau in ein TCG-Rate-Limit fällt.

18. **Kartenbild lädt nicht (grauer Platzhalter) trotz existierender Karte** → `cachedImg()` (Bild-Proxy `/api/img?u=...`) darf NIEMALS in `next/image` (`<Image>`) verwendet werden. Der Next-Image-Optimizer lehnt lokale Proxy-URLs mit verschachteltem Query mit **HTTP 400 (INVALID_IMAGE_OPTIMIZE_REQUEST)** ab — das Bild bleibt leer. (v2.15.0-Regression: das große Kartenbild auf `/karten/[id]` verschwand komplett.) **Regel:** `cachedImg()` NUR für einfache `<img>`-Tags (die den Optimizer umgehen). `next/image`-Komponenten (CardImage, SearchBox-Dropdown, Artikel-Highlight) geben die ROHE Upstream-URL an — `images.pokemontcg.io` ist in `remotePatterns`, der Optimizer cacht selbst 31 Tage (`minimumCacheTTL`). Test: `curl "$BASE/_next/image?url=<enc>&w=640&q=75"` muss 200 liefern, nicht 400.

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
