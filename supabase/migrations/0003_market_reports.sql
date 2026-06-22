create table if not exists public.market_reports (
  id           bigint generated always as identity primary key,
  week_start   date        not null unique,  -- Monday of the reporting week
  week_number  int         not null,
  report_text  text        not null,
  top_gainers  jsonb       not null default '[]',
  top_value    jsonb       not null default '[]',
  created_at   timestamptz default now()
);

create index if not exists idx_market_reports_week_start on public.market_reports (week_start desc);

alter table public.market_reports enable row level security;
