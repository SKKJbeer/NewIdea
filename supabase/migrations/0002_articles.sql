-- KI-generierte Blog-Artikel persistent speichern.
-- Einmal im Supabase SQL-Editor ausführen (Dashboard → SQL → New query).

create table if not exists public.articles (
  id          bigint generated always as identity primary key,
  date        date        not null unique,
  type        text        not null,
  title       text,
  content     jsonb       not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_articles_date on public.articles (date desc);

-- Automatisch updated_at setzen wenn Artikel aktualisiert wird.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger articles_updated_at
  before update on public.articles
  for each row execute procedure public.set_updated_at();

-- Row Level Security: nur Service-Role-Key (Server) darf schreiben/lesen.
alter table public.articles enable row level security;
