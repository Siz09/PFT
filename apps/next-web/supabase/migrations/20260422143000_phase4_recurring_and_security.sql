create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount_cents integer not null check (amount_cents > 0),
  category_id text not null references public.categories(id) on delete restrict,
  merchant text,
  description text,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  next_due date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_rules_next_due_idx on public.recurring_rules (next_due, active);

-- Personal project baseline: keep app usable with service role routes.
-- RLS enabled for future auth hardening without blocking current local-first workflows.
alter table if exists public.categories enable row level security;
alter table if exists public.transactions enable row level security;
alter table if exists public.app_settings enable row level security;
alter table if exists public.ai_summaries enable row level security;
alter table if exists public.budgets enable row level security;
alter table if exists public.goals enable row level security;
alter table if exists public.recurring_rules enable row level security;

drop policy if exists categories_read_all on public.categories;
create policy categories_read_all on public.categories for select to authenticated using (true);

drop policy if exists transactions_rw_all on public.transactions;
create policy transactions_rw_all on public.transactions for all to authenticated using (true) with check (true);

drop policy if exists app_settings_rw_all on public.app_settings;
create policy app_settings_rw_all on public.app_settings for all to authenticated using (true) with check (true);

drop policy if exists ai_summaries_rw_all on public.ai_summaries;
create policy ai_summaries_rw_all on public.ai_summaries for all to authenticated using (true) with check (true);

drop policy if exists budgets_rw_all on public.budgets;
create policy budgets_rw_all on public.budgets for all to authenticated using (true) with check (true);

drop policy if exists goals_rw_all on public.goals;
create policy goals_rw_all on public.goals for all to authenticated using (true) with check (true);

drop policy if exists recurring_rules_rw_all on public.recurring_rules;
create policy recurring_rules_rw_all on public.recurring_rules for all to authenticated using (true) with check (true);
