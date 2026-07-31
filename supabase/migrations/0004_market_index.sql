-- Täglicher Stand des CardBeacon Index (CBI).
-- Einmal im Supabase SQL-Editor ausführen (Dashboard → SQL → New query).
--
-- Zweck 1: Kartenseiten brauchen den Indexwert für den Marktkontext. Ohne
-- gespeicherten Stand werden dafür 250 Karten neu geholt — gemessen 9 bis 17
-- Sekunden für EINE Zahl, und zwar bei jedem kalten Serverstart erneut.
--
-- Zweck 2 (langfristig der wichtigere): Aus den Tagesständen entsteht eine echte
-- Indexhistorie. Der Marktkopf zeigt heute die Verteilung der Messwerte statt
-- einer Kurve, weil es keine gespeicherten Tagesstände gibt. Ab jetzt sammeln
-- sie sich an.

create table if not exists public.market_index (
  captured_on date        primary key,
  value       numeric     not null,
  card_count  int         not null,
  set_count   int         not null,
  window_days int         not null default 30,
  updated_at  timestamptz default now()
);

-- captured_on ist DATE, nicht TIMESTAMPTZ: Der Index ist eine Tagesgröße, und
-- der Code schreibt und liest ihn als reines Datum (YYYY-MM-DD). Ein
-- Zeitstempel würde beim Zurücklesen eine andere Zeichenkette liefern und die
-- Altersberechnung des Standes verfälschen.

-- Row Level Security: nur der Service-Role-Key (Server) darf schreiben/lesen.
alter table public.market_index enable row level security;
