# PokéMarket Intelligence

> Vollautomatisiertes Pokémon-Karten-Investment-Portal — KI generiert täglich Content, du steuerst & verdienst.

**Aktuelle Version:** `v0.4.0` · **Stand:** 20. Juni 2026 · **Branch:** `main`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Was ist das?

Ein vollautomatisches Portal für Pokémon-Karten-Investoren mit:
- **Täglichen KI-Artikeln** — 7 verschiedene Typen je Wochentag
- **Wöchentlichem Marktbericht** — KI-Analyse aktueller Kartenpreise
- **Newsletter** — Automatisch generiert & via Beehiiv versendet
- **Content Studio** — Deine Steuerzentrale für alle Inhalte
- **Affiliate-Monetarisierung** — Cardmarket, Amazon, Trade Republic

## Seiten

| Route | Beschreibung | Cache |
|---|---|---|
| `/` | Startseite mit Kartenpreisen & Investment-Scores | 1h |
| `/marktbericht` | Wöchentliche KI-Marktanalyse | 7 Tage |
| `/artikel` | Blog-Index, letzte 14 Tage | 1h |
| `/artikel/[date]` | Tagesartikel (7 verschiedene Typen) | 24h |
| `/karten/[id]` | Karten-Detailseite mit Preis-Chart | dynamisch |
| `/studio` | Content Steuerzentrale (nicht öffentlich) | — |
| `/changelog` | Release-History | statisch |
| `/impressum` | Impressum (§ 5 TMG) | statisch |
| `/datenschutz` | Datenschutzerklärung (DSGVO) | statisch |

## Automatisierung

```
Montag 07:00  →  /api/cron       Vollpipeline: Marktbericht + Newsletter + Video + Social
Täglich 08:00 →  /api/cron/daily Artikel vorwärmen + /artikel revalidieren
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, ISR)
- **KI:** Anthropic Claude (claude-opus-4-8)
- **Hosting:** Vercel (Hobby/Free-Tier ausreichend)
- **Newsletter:** Beehiiv
- **Kartendaten:** Pokémon TCG API
- **Video:** Remotion + ElevenLabs
- **Social:** Buffer
- **Styles:** Tailwind CSS v4

## Schnellstart

```bash
npm install
cp .env.example .env.local  # Keys eintragen
npm run dev
# → http://localhost:3000/studio
```

Pflicht-Keys: `POKEMON_TCG_API_KEY` · `ANTHROPIC_API_KEY` · `CRON_SECRET`

## Dokumentation

- [Anleitung](./ANLEITUNG.md) — Wie alles funktioniert
- [Deployment](./DEPLOYMENT.md) — Schritt-für-Schritt zu Vercel
- [Status & Aufgaben](./STATUS.md) — Was offen ist
- [Changelog](./CHANGELOG.md) — Release-History

## Einkommensziel

100–500 €/Monat über Affiliate-Provisionen, Newsletter-Sponsoring und YouTube AdSense.
Realistischer Zeitraum: 6–12 Monate.

---

*Zuletzt aktualisiert: v0.4.0 — 20. Juni 2026*
