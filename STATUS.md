# 📊 Projekt-Status & Aufgaben — PokéMarket Intelligence

**Stand:** 20. Juni 2026
**Branch:** `claude/side-project-monetization-srmacs`

Diese Datei ist unser **gemeinsames Logbuch**: Was ist entschieden, was ist gebaut, was ist offen.

---

## ✅ Was bereits gebaut & fertig ist

| Bereich | Status | Details |
|---|---|---|
| Web-Dashboard (öffentlich) | ✅ Fertig | Startseite mit Kartenpreisen, Investment-Scores, Newsletter-Anmeldung |
| **Steuerzentrale `/studio`** | ✅ Fertig | Status-Übersicht + Content-Generierung auf Knopfdruck |
| KI-Content-Engine | ✅ Fertig | Marktbericht, Newsletter, Video-Skript, Social-Posts |
| Kartendaten-Anbindung | ✅ Fertig | Pokémon TCG API |
| Newsletter-System | ✅ Fertig (Code) | Beehiiv — pusht als Entwurf |
| Video-Animationen | ✅ Fertig (Code) | Remotion: YouTube (16:9) + Shorts (9:16) |
| Video-Stimme | ✅ Fertig (Code) | ElevenLabs KI-Sprecher |
| Social-Media-Planung | ✅ Fertig (Code) | Buffer: Insta/TikTok/Twitter |
| Wöchentliche Vollautomatik | ✅ Fertig (Code) | Cron-Job montags 07:00 |
| Affiliate-Integration | ✅ Fertig (Code) | Cardmarket, Amazon, Trade Republic |

> "Fertig (Code)" = programmiert und einsatzbereit, braucht aber noch deinen API-Key, um live zu gehen.

---

## 🎯 Unsere Entscheidungen (Logbuch)

Damit wir immer nachvollziehen können, WARUM wir was machen:

1. **Projektrichtung:** Pokémon-Investment-Portal (statt reiner Finanzblog) — wegen deiner Leidenschaft + bestehender Content-Erfahrung + schnellerer Community-Reaktion.
2. **Maximale Automatisierung:** KI übernimmt die gesamte Content-Erstellung. Du steuerst & gibst frei.
3. **Review-Modus als Standard:** Inhalte gehen erst als Entwurf raus (Schutz vor Qualitätsproblemen). Auto-Publish ist optional zuschaltbar.
4. **Tech-Stack:** Next.js + Vercel + Claude + Remotion — kostengünstig (0–20 €/Monat).
5. **Einkommensziel:** 100–500 €/Monat in 6–12 Monaten über Affiliate + Newsletter + AdSense.

---

## 📋 Offene Aufgaben — von dir abzuarbeiten

### 🔴 Priorität 1 — Damit überhaupt etwas läuft

- [ ] **Pokémon TCG API-Key** holen → https://dev.pokemontcg.io/
- [ ] **Claude API-Key** holen → https://console.anthropic.com/
- [ ] `.env.local` anlegen (Vorlage: `.env.example`) und beide Keys eintragen
- [ ] `npm install && npm run dev` → `/studio` öffnen → "Marktbericht" testen

### 🟠 Priorität 2 — Online gehen

- [ ] **Vercel-Account** erstellen → https://vercel.com/ (mit GitHub einloggen)
- [ ] Repo bei Vercel importieren → deployen
- [ ] Alle Env-Vars in Vercel-Einstellungen eintragen
- [ ] Domain wählen (kostenlos: `dein-projekt.vercel.app`, oder eigene ~10 €/Jahr)

### 🟡 Priorität 3 — Geld verdienen aktivieren

- [ ] **Cardmarket-Affiliate** anmelden → deinen Link in `.env.local` eintragen
- [ ] **Amazon PartnerNet** anmelden → Link eintragen
- [ ] **Trade Republic Affiliate** (oder anderer Broker) → Link eintragen

### 🟢 Priorität 4 — Reichweite & Publishing

- [ ] **Beehiiv-Account** (Newsletter) → API-Key + Publication-ID eintragen
- [ ] **ElevenLabs-Account** (Video-Stimme) → API-Key eintragen
- [ ] **YouTube-Kanal** erstellen + YouTube Data API einrichten (OAuth)
- [ ] **Buffer-Account** für Social-Media-Planung (kostenpflichtig)

### ⚪ Priorität 5 — Rechtliches (Pflicht in Deutschland!)

- [ ] **Impressum** erstellen (Pflicht für Websites)
- [ ] **Datenschutzerklärung** (DSGVO)
- [ ] **Affiliate-Kennzeichnung** prüfen (ist im Code vorbereitet)
- [ ] Hinweis: Keine Anlageberatung — nur Information (rechtlich wichtig bei Finanz-Content)

---

## 🔮 Geplante Features (Backlog — kommt später)

Ideen für die Zukunft, noch nicht gebaut. Hier können wir jederzeit ergänzen:

- [ ] **Preis-Historie speichern** (echte Datenbank statt simulierter Trends) — Supabase ist vorbereitet
- [ ] **Einzelne Karten-Detailseiten** mit Preis-Charts
- [ ] **Auto-Publish-Modus** (echtes 100% ohne deinen Klick)
- [ ] **Thumbnail-Generator** für YouTube (automatisch)
- [ ] **Paid-Newsletter-Tier** (Premium-Analysen 5–9 €/Monat)
- [ ] **A/B-Tests** für Betreffzeilen & Titel
- [ ] **Analytics-Dashboard** (Einnahmen, Klicks, Conversions)
- [ ] **Mehr Affiliate-Partner** (eBay, lokale Kartenshops)

---

## 📈 Realistischer Fahrplan

| Zeitraum | Ziel | Erwartetes Einkommen |
|---|---|---|
| Monat 1–2 | Setup, erste Inhalte, online gehen | 0 € |
| Monat 3–4 | Erste Abonnenten, erste Affiliate-Klicks | 10–50 € |
| Monat 5–6 | 50–200 Newsletter-Abos, YouTube wächst | 100–300 € |
| Monat 7–12 | Skalierung, AdSense aktiv | 300–800 € |

---

## 💬 Wie wir zusammenarbeiten

- **Diese Datei (`STATUS.md`)** ist unser Logbuch — ich aktualisiere sie bei jeder Änderung.
- **Du hakst ab**, was du erledigt hast — oder sagst mir Bescheid, dann mache ich es.
- **Neue Ideen?** Sag sie mir, ich trage sie ins Backlog ein.
- **Etwas unklar?** Frag jederzeit — ich erkläre es.

---

*Zuletzt aktualisiert von Claude — Content Studio & Dokumentation hinzugefügt.*
