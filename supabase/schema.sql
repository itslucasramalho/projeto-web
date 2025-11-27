-- Citizen Engagement Platform schema
-- Run inside Supabase SQL editor or via `supabase db push`

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Profiles --------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  cpf text not null unique,
  state text,
  display_name text,
  role text not null default 'citizen' check (role in ('citizen','admin','verified')),
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cpf_value text;
  state_value text;
  display_name_value text;
  role_value text;
begin
  cpf_value := coalesce(new.raw_user_meta_data->>'cpf', '');
  state_value := new.raw_user_meta_data->>'state';
  display_name_value := new.raw_user_meta_data->>'display_name';
  role_value := coalesce(new.raw_user_meta_data->>'role', 'citizen');

  if role_value not in ('citizen','admin','verified') then
    role_value := 'citizen';
  end if;

  if cpf_value = '' then
    raise exception 'CPF é obrigatório para concluir o cadastro.';
  end if;

  insert into public.profiles (id, cpf, state, display_name, role)
  values (new.id, cpf_value, state_value, display_name_value, role_value)
  on conflict (id) do update
    set cpf = excluded.cpf,
        state = excluded.state,
        display_name = excluded.display_name,
        role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

-- Helper function to check if current user is admin ---------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role = 'admin'
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.is_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role = 'verified'
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.can_manage_laws()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role in ('admin','verified')
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner or admin"
  on public.profiles
  for select
  using (auth.uid() = id or is_admin());

create policy "Users insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users update their own profile; admins update all"
  on public.profiles
  for update
  using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());

-- Laws ------------------------------------------------------------------------
create table if not exists public.laws (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  number text,
  origin text,
  state text,
  category text,
  status text not null check (status in ('draft','discussion','approved','rejected')),
  source_url text,
  file_path text,
  content_text text,
  ai_summary text,
  ai_summary_updated_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.laws enable row level security;

create policy "Anyone can read laws"
  on public.laws
  for select
  to public
  using (true);

create policy "Admins and verified users manage laws"
  on public.laws
  for all
  using (can_manage_laws())
  with check (can_manage_laws());

-- Propositions -----------------------------------------------------------------
create table if not exists public.propositions (
  id uuid primary key default gen_random_uuid(),
  camara_id integer not null unique,
  type text not null check (type in ('PL','PEC','MP','PLP')),
  sigla_tipo text not null,
  number integer not null,
  year integer not null,
  title text not null,
  ementa text,
  ementa_detalhada text,
  keywords text[],
  presentation_date date not null,
  status text not null,
  status_situation text,
  status_code integer,
  status_date timestamptz,
  origin text,
  author text,
  author_party text,
  author_state text,
  theme text,
  source_url text,
  full_text_url text,
  tramitacao_url text,
  house text not null default 'camara',
  ai_summary text,
  ai_summary_updated_at timestamptz,
  fetched_range_start timestamptz,
  fetched_range_end timestamptz,
  fetched_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists propositions_type_date_idx
  on public.propositions (type, presentation_date desc);
create index if not exists propositions_status_date_idx
  on public.propositions (status, status_date desc);
create index if not exists propositions_updated_idx
  on public.propositions (updated_at desc);

alter table public.propositions enable row level security;

create policy "Anyone can read propositions"
  on public.propositions
  for select
  to public
  using (true);

create policy "Admins and verified users manage propositions"
  on public.propositions
  for all
  using (can_manage_laws())
  with check (can_manage_laws());

-- Proposition interest tracking -------------------------------------------------
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

-- Comments --------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  law_id uuid references public.laws(id) on delete cascade,
  proposition_id uuid references public.propositions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint comments_target_not_null check (law_id is not null or proposition_id is not null)
);

create index if not exists comments_law_id_idx on public.comments (law_id);
create index if not exists comments_user_id_idx on public.comments (user_id);

alter table if exists public.comments
  alter column law_id drop not null;

alter table if exists public.comments
  add column if not exists proposition_id uuid references public.propositions(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_target_not_null'
  ) then
    alter table public.comments
      add constraint comments_target_not_null
        check (law_id is not null or proposition_id is not null);
  end if;
end;
$$;

create index if not exists comments_proposition_id_idx
  on public.comments (proposition_id);

alter table public.comments enable row level security;

create policy "Authenticated users can read comments"
  on public.comments
  for select
  to authenticated
  using (true);

create policy "Users insert their own comments"
  on public.comments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments; admins delete all"
  on public.comments
  for delete
  using (auth.uid() = user_id or is_admin());

-- Comment summaries -----------------------------------------------------------
create table if not exists public.comment_summaries (
  id uuid primary key default gen_random_uuid(),
  law_id uuid references public.laws(id) on delete cascade,
  proposition_id uuid references public.propositions(id) on delete cascade,
  total_comments integer not null default 0,
  last_comment_id uuid references public.comments(id),
  summary_text text,
  sentiment jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint comment_summaries_target_not_null check (law_id is not null or proposition_id is not null)
);

create index if not exists comment_summaries_law_id_updated_idx
  on public.comment_summaries (law_id, updated_at desc);

alter table if exists public.comment_summaries
  alter column law_id drop not null;

alter table if exists public.comment_summaries
  add column if not exists proposition_id uuid references public.propositions(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comment_summaries_target_not_null'
  ) then
    alter table public.comment_summaries
      add constraint comment_summaries_target_not_null
        check (law_id is not null or proposition_id is not null);
  end if;
end;
$$;

create index if not exists comment_summaries_proposition_id_idx
  on public.comment_summaries (proposition_id, updated_at desc);

alter table public.comment_summaries enable row level security;

create policy "Authenticated users read summaries"
  on public.comment_summaries
  for select
  to authenticated
  using (true);

create policy "Summaries managed by admins or service role"
  on public.comment_summaries
  using (is_admin() or auth.role() = 'service_role')
  with check (is_admin() or auth.role() = 'service_role');

-- Stances (poll) --------------------------------------------------------------
create table if not exists public.stances (
  id uuid primary key default gen_random_uuid(),
  law_id uuid references public.laws(id) on delete cascade,
  proposition_id uuid references public.propositions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stance text not null check (stance in ('for','against','neutral')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint stances_target_not_null check (law_id is not null or proposition_id is not null)
);

alter table if exists public.stances
  add column if not exists id uuid default gen_random_uuid();

alter table if exists public.stances
  alter column id set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'stances_pkey'
      and conrelid = 'public.stances'::regclass
  ) then
    alter table public.stances drop constraint stances_pkey;
  end if;
end;
$$;

alter table public.stances
  add constraint stances_pkey primary key (id);

alter table if exists public.stances
  alter column law_id drop not null;

alter table if exists public.stances
  add column if not exists proposition_id uuid references public.propositions(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stances_target_not_null'
  ) then
    alter table public.stances
      add constraint stances_target_not_null
        check (law_id is not null or proposition_id is not null);
  end if;
end;
$$;

alter table if not exists public.stances
  add constraint stances_law_user_unique unique (law_id, user_id);
alter table if not exists public.stances
  add constraint stances_proposition_user_unique unique (proposition_id, user_id);

alter table public.stances enable row level security;

create policy "Authenticated users read stances"
  on public.stances
  for select
  to authenticated
  using (true);

create policy "Users upsert their stance"
  on public.stances
  for insert
  with check (auth.uid() = user_id);

create policy "Users update their stance"
  on public.stances
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins delete any stance"
  on public.stances
  for delete
  using (is_admin());

-- Forum ------------------------------------------------------------------------
create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  law_id uuid references public.laws(id) on delete set null,
  proposition_id uuid references public.propositions(id) on delete set null,
  title text not null,
  content text not null,
  status text not null default 'open' check (status in ('open','locked','archived')),
  is_pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists forum_topics_user_id_idx on public.forum_topics (user_id);
create index if not exists forum_topics_law_id_idx on public.forum_topics (law_id);

alter table if exists public.forum_topics
  add column if not exists proposition_id uuid references public.propositions(id) on delete set null;

create index if not exists forum_topics_proposition_id_idx
  on public.forum_topics (proposition_id);

alter table public.forum_topics enable row level security;

create policy "Anyone can read forum topics"
  on public.forum_topics
  for select
  using (true);

create policy "Authenticated users insert forum topics"
  on public.forum_topics
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owners or admins update forum topics"
  on public.forum_topics
  for update
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

create policy "Owners or admins delete forum topics"
  on public.forum_topics
  for delete
  using (auth.uid() = user_id or is_admin());

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists forum_comments_topic_id_idx on public.forum_comments (topic_id);
create index if not exists forum_comments_user_id_idx on public.forum_comments (user_id);

alter table public.forum_comments enable row level security;

create policy "Anyone can read forum comments"
  on public.forum_comments
  for select
  using (true);

create policy "Authenticated users insert forum comments"
  on public.forum_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owners or admins update forum comments"
  on public.forum_comments
  for update
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

create policy "Owners or admins delete forum comments"
  on public.forum_comments
  for delete
  using (auth.uid() = user_id or is_admin());

create table if not exists public.forum_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.forum_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint forum_comment_likes_comment_user_unique unique (comment_id, user_id)
);

create index if not exists forum_comment_likes_comment_id_idx on public.forum_comment_likes (comment_id);
create index if not exists forum_comment_likes_user_id_idx on public.forum_comment_likes (user_id);

alter table public.forum_comment_likes enable row level security;

create policy "Anyone can read comment likes"
  on public.forum_comment_likes
  for select
  using (true);

create policy "Authenticated users insert comment likes"
  on public.forum_comment_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owners or admins delete comment likes"
  on public.forum_comment_likes
  for delete
  using (auth.uid() = user_id or is_admin());

