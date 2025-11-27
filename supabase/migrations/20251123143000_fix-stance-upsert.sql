-- Ensure stance upserts can target a concrete unique constraint
drop index if exists public.stances_law_user_unique;
drop index if exists public.stances_proposition_user_unique;

alter table public.stances
  add constraint stances_law_user_unique unique (law_id, user_id);

alter table public.stances
  add constraint stances_proposition_user_unique unique (proposition_id, user_id);

