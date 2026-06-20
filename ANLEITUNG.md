# 📖 PokéMarket Intelligence — Anleitung

Diese Anleitung erklärt dir Schritt für Schritt, wie alles funktioniert und wie du es steuerst.

---

## 🎯 Was ist das hier eigentlich?

Ein **vollautomatisiertes Pokémon-Karten-Portal**, das Geld über Affiliate-Links, Newsletter und YouTube/TikTok verdient. Die KI (Claude) erstellt automatisch:

- 📊 Wöchentliche Marktberichte
- 📧 Newsletter
- 🎬 YouTube-Videos + Shorts/TikTok (Skript + Stimme + Animation)
- 📱 Social-Media-Posts

**Dein Aufwand nach Setup:** ca. 1 Stunde pro Woche (nur Review + "Veröffentlichen" klicken).

---

## 🕹️ Deine Steuerzentrale

Nach dem Start erreichst du die Steuerung unter:

```
http://localhost:3000/studio
```

Dort siehst du:
1. **System-Status** — welche Dienste verbunden sind (grün/grau)
2. **Content erstellen** — Buttons, um Inhalte sofort generieren zu lassen
3. **Schnellzugriff** — Links zu allen wichtigen Diensten

Die **öffentliche Website** (für Besucher) läuft unter `http://localhost:3000`.

---

## 🚀 Erste Schritte (in dieser Reihenfolge)

### Schritt 1: Projekt lokal starten

```bash
npm install
npm run dev
```

Dann im Browser öffnen: `http://localhost:3000/studio`

### Schritt 2: Pflicht-API-Keys eintragen

Erstelle eine Datei `.env.local` (kopiere `.env.example`) und trage ein:

| Variable | Wo bekommen? | Kostenlos? |
|---|---|---|
| `POKEMON_TCG_API_KEY` | https://dev.pokemontcg.io/ | ✅ Ja |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ | 💳 Pay-per-use (sehr günstig) |
| `CRON_SECRET` | Selbst ausdenken (langer Zufallsstring) | ✅ Ja |

> **Nur mit diesen 3 läuft die Content-Erstellung bereits!**

### Schritt 3: Testen

Geh auf `/studio` → klicke "Marktbericht" → die KI erstellt in Sekunden einen Bericht. Funktioniert? 🎉 Grundsystem läuft.

### Schritt 4: Veröffentlichungs-Kanäle anschließen (optional, nach und nach)

| Kanal | Variable | Wo bekommen? |
|---|---|---|
| Newsletter | `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` | https://beehiiv.com/ (gratis bis 2.500 Abos) |
| Video-Stimme | `ELEVENLABS_API_KEY` | https://elevenlabs.io/ (gratis-Kontingent) |
| Social Media | `BUFFER_ACCESS_TOKEN` | https://buffer.com/ (ab ~6$/Monat) |
| YouTube | `YOUTUBE_ACCESS_TOKEN` | Google Cloud Console |

---

## 🔄 Wie die Vollautomatik funktioniert

Einmal pro Woche (jeden **Montag um 07:00 Uhr**) läuft automatisch die komplette Pipeline:

```
1. Aktuelle Kartenpreise holen
2. KI schreibt Marktbericht
3. KI erstellt Newsletter  →  als ENTWURF zu Beehiiv
4. KI erstellt YouTube-Skript + Stimme + Animation
5. KI erstellt Short/TikTok
6. KI erstellt Social-Posts  →  geplant via Buffer
```

Diese Automatik wird über `vercel.json` (Cron-Job) gesteuert und läuft, sobald das Projekt bei Vercel deployed ist.

### Wichtig: Review-Modus vs. Auto-Publish

Standardmäßig pusht das System Inhalte als **Entwurf / privat**, nicht direkt live. Das schützt deine Kanäle vor Fehlern.

➡️ Wenn du **echtes 100%-Auto-Publish** willst (Inhalte gehen ohne deinen Klick live), sag Bescheid — das ist eine kleine Änderung in der Pipeline.

---

## 💰 Wie verdient das Projekt Geld?

| Einnahmequelle | Wie? |
|---|---|
| **Cardmarket Affiliate** | Besucher kaufen Karten über deine Links → du bekommst Provision |
| **Amazon Affiliate** | Booster-Pakete über deine Links |
| **Broker Affiliate** (Trade Republic) | 30–80 € pro geworbenem Depot-Kunden |
| **Newsletter** | Später: Paid-Tier (5–9 €/Monat) |
| **YouTube AdSense** | Werbeeinnahmen ab 1.000 Abonnenten |

Trage deine persönlichen Affiliate-Links in `.env.local` ein (Variablen mit `AFFILIATE` im Namen).

---

## ❓ Häufige Fragen

**Muss ich programmieren können?**
Nein. Du steuerst alles über `/studio`. Code änderst nur du (oder ich) bei neuen Features.

**Was kostet der Betrieb?**
0–20 €/Monat. Hosting (Vercel) gratis, APIs größtenteils gratis. Nur Claude kostet pro Nutzung ein paar Cent.

**Ist das legal / brauche ich Impressum?**
Ja, brauchst du (Impressum + Datenschutz + Affiliate-Kennzeichnung). Siehe offene Tasks in `STATUS.md`.

---

👉 **Nächste Schritte & offene Aufgaben:** siehe [`STATUS.md`](./STATUS.md)
