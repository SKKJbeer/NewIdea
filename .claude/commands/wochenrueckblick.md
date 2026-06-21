# Wochenrückblick-Skill

Erstellt oder aktualisiert den Wochenrückblick für PokéMarket Intelligence.

## Stimme: Sachliche Marktanalyse

Neutraler Pokémon-TCG-Marktanalyst ohne Persona-Name. Schreibt leicht lesbar und unterhaltsam,
aber ohne persönliche Kaufempfehlungen — nur Beobachtungen, Fakten und Marktanalyse.
Alle Altersgruppen ab 10 Jahren, alles jugendfrei. Echte Zahlen, sachliche Einschätzungen, kein
Finanz-Geschwätz. Unbekannte Pokémon immer kurz in Klammern beschreiben
(z.B. "Umbreon (das schwarze Nacht-Pokémon mit den gelben Ringen)").

## Artikel-Struktur (4 Sektionen)

1. 🌍 **Was in der Pokémon-Welt passiert ist** — Anime-News, Turniere, Spiel-Ankündigungen,
   Community-Momente. Locker erzählt als wärst du dabei gewesen.

2. 📈 **Die Karte der Woche** — Eine Karte die aufgefallen ist. Preisbewegung + Grund + lustige
   Analogie. Pokémon kurz für Neulinge beschreiben.

3. 😅 **Der Fehler der Woche** — Typischer Anfänger- oder Fortgeschrittenen-Fehler. Humorvoll,
   aber mit echtem Lernwert.

4. 🔮 **Prognose für nächste Woche** — 1-2 konkrete Einschätzungen, ehrlich über Unsicherheiten.

## Pflichtregeln (aus globaler CLAUDE.md)

- **Boosterpack-Bild überall** wo Karten erwähnt werden → `BoosterPackImage`-Komponente
  - In Sektionen: über `section.highlight` (FeaturedCard mit setCode)
  - In Karten-Galerie: über `ArticleCardGallery`
- Karte der Woche und Featured Cards müssen exakte englische TCG-Namen haben
- Cardmarket-Preise in EUR, Trend in Prozent

## Automatisierung

| Was | Details |
|-----|---------|
| Cron-Endpoint | `GET /api/cron/weekly-recap` |
| Zeitplan | Montag 06:00 UTC (vercel.json) |
| Persistenz | Supabase `articles`-Tabelle (date, type, content JSONB) |
| Cache | `generateArticle()` prüft Supabase zuerst → sofortige Antwort bei erneuten Aufrufen |
| Archiv | Alle vergangenen Rückblicke auf `/artikel/YYYY-MM-DD` abrufbar (kein Zeitlimit) |

## Manuell triggern

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://pokemarketintelligence.com/api/cron/weekly-recap
```

## Supabase-Tabelle (falls noch nicht existiert)

```sql
CREATE TABLE IF NOT EXISTS articles (
  id         SERIAL PRIMARY KEY,
  date       DATE NOT NULL UNIQUE,
  type       TEXT,
  content    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
