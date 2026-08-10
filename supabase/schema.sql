-- MindJournal database schema
-- Run against a Supabase project's SQL editor.

-- users table mirrors auth.users, extended with subscription info.
-- Row is created automatically by the trigger below when a new
-- auth.users row is inserted (Supabase Auth handles password_hash itself
-- inside auth.users; we don't duplicate it here).
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro', 'premium')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  themes jsonb not null default '[]'::jsonb,
  analysis_text text,
  created_at timestamptz not null default now()
);

create index entries_user_id_created_at_idx on public.entries (user_id, created_at desc);
create index insights_user_id_created_at_idx on public.insights (user_id, created_at desc);
create index insights_entry_id_idx on public.insights (entry_id);

-- Auto-create a public.users row whenever someone signs up via Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security: every table is private to its owning user.
alter table public.users enable row level security;
alter table public.entries enable row level security;
alter table public.insights enable row level security;

create policy "Users can view own row" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own row" on public.users
  for update using (auth.uid() = id);

create policy "Users can view own entries" on public.entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on public.entries
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own entries" on public.entries
  for delete using (auth.uid() = user_id);

create policy "Users can view own insights" on public.insights
  for select using (auth.uid() = user_id);
create policy "Users can insert own insights" on public.insights
  for insert with check (auth.uid() = user_id);
