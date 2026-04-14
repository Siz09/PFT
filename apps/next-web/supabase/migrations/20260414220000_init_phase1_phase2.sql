create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  icon text not null,
  color text not null,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  amount_cents integer not null check (amount_cents > 0),
  type text not null check (type in ('income', 'expense')),
  category_id text not null references public.categories(id) on delete restrict,
  merchant text,
  description text,
  transaction_date date not null,
  receipt_path text,
  ocr_confidence real check (ocr_confidence is null or (ocr_confidence >= 0 and ocr_confidence <= 1)),
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_date_idx on public.transactions (transaction_date desc);
create index if not exists transactions_category_idx on public.transactions (category_id);
create index if not exists transactions_type_idx on public.transactions (type);

insert into public.categories (id, name, icon, color, is_system)
values
  ('food', 'Food', 'utensils', '#22c55e', true),
  ('transport', 'Transport', 'car', '#3b82f6', true),
  ('health', 'Health', 'heart-pulse', '#ef4444', true),
  ('entertainment', 'Entertainment', 'film', '#f59e0b', true),
  ('utilities', 'Utilities', 'bolt', '#8b5cf6', true),
  ('shopping', 'Shopping', 'shopping-bag', '#ec4899', true),
  ('income', 'Income', 'wallet', '#10b981', true),
  ('other', 'Other', 'circle', '#6b7280', true)
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  color = excluded.color,
  is_system = excluded.is_system;
