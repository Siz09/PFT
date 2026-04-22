create table if not exists public.app_settings (
  id text primary key default 'default',
  currency text not null default 'USD',
  profile_name text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, currency, profile_name)
values ('default', 'USD', null)
on conflict (id) do nothing;

create table if not exists public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  period_type text not null check (period_type in ('weekly', 'monthly')),
  period_start date not null,
  period_end date not null,
  summary_json jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists ai_summaries_period_idx on public.ai_summaries (period_type, period_start, period_end);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories(id) on delete cascade,
  month text not null,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists budgets_category_month_idx on public.budgets (category_id, month);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount_cents integer not null check (target_amount_cents > 0),
  current_amount_cents integer not null default 0 check (current_amount_cents >= 0),
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
