-- Proposition highlight infrastructure

create table if not exists public.proposition_interest_daily (
  id uuid primary key default gen_random_uuid(),
  proposition_id uuid not null references public.propositions(id) on delete cascade,
  day date not null,
  views integer not null default 0,
  favorites integer not null default 0,
  shares integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint proposition_interest_daily_unique unique (proposition_id, day)
);

create index if not exists proposition_interest_daily_day_idx
  on public.proposition_interest_daily (day desc);

alter table public.proposition_interest_daily enable row level security;

create policy "Anyone can read interest aggregates"
  on public.proposition_interest_daily
  for select
  using (true);

create table if not exists public.proposition_highlight_overrides (
  proposition_id uuid primary key references public.propositions(id) on delete cascade,
  priority integer not null default 0,
  reason text,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.proposition_highlight_overrides enable row level security;

create policy "Highlight overrides managed by admins"
  on public.proposition_highlight_overrides
  for all
  using (can_manage_laws())
  with check (can_manage_laws());

create or replace function public.increment_proposition_interest(
  p_proposition_id uuid,
  p_event text,
  p_amount integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := timezone('utc', now())::date;
  normalized_event text;
begin
  normalized_event := lower(p_event);
  if normalized_event not in ('view','favorite','share') then
    raise exception 'Evento inválido: %', p_event;
  end if;

  insert into public.proposition_interest_daily (
    proposition_id,
    day,
    views,
    favorites,
    shares
  )
  values (
    p_proposition_id,
    today,
    case when normalized_event = 'view' then coalesce(p_amount, 1) else 0 end,
    case when normalized_event = 'favorite' then coalesce(p_amount, 1) else 0 end,
    case when normalized_event = 'share' then coalesce(p_amount, 1) else 0 end
  )
  on conflict (proposition_id, day)
  do update
    set views = public.proposition_interest_daily.views + excluded.views,
        favorites = public.proposition_interest_daily.favorites + excluded.favorites,
        shares = public.proposition_interest_daily.shares + excluded.shares,
        updated_at = timezone('utc', now());
end;
$$;

create or replace view public.proposition_interest_windows as
with windowed as (
  select
    proposition_id,
    day,
    views,
    favorites,
    shares,
    case
      when day >= timezone('utc', now())::date - 6 then 'current'
      when day between timezone('utc', now())::date - 13 and timezone('utc', now())::date - 7
        then 'previous'
      else 'older'
    end as bucket
  from public.proposition_interest_daily
  where day >= timezone('utc', now())::date - 13
)
select
  proposition_id,
  sum(case when bucket = 'current' then views else 0 end) as views_last7,
  sum(case when bucket = 'previous' then views else 0 end) as views_prev7,
  sum(case when bucket = 'current' then favorites else 0 end) as favorites_last7,
  sum(case when bucket = 'previous' then favorites else 0 end) as favorites_prev7,
  sum(case when bucket = 'current' then shares else 0 end) as shares_last7,
  sum(case when bucket = 'previous' then shares else 0 end) as shares_prev7
from windowed
group by proposition_id;

