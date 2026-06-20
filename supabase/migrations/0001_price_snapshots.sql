-- Tägliche Preis-Schnappschüsse für echte Pokémon-Karten-Verläufe.
-- Einmal im Supabase SQL-Editor ausführen (Dashboard → SQL → New query).

create table if not exists public.price_snapshots (
  id          bigint generated always as identity primary key,
  card_id     text        not null,
  card_name   text,
  price       numeric(12,2) not null,
  source      text        default 'cardmarket',
  captured_on date        not null default current_date,
  created_at  timestamptz default now(),
  unique (card_id, captured_on)
);

-- Schneller Zugriff auf den Verlauf einer einzelnen Karte.
create index if not exists idx_price_snapshots_card
  on public.price_snapshots (card_id, captured_on desc);

-- Row Level Security: nur der Service-Role-Key (Server) darf schreiben/lesen.
-- Öffentliche Clients (anon) haben keinen Zugriff — die App liest serverseitig.
alter table public.price_snapshots enable row level security;
