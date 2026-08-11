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

-- Premium task breakdowns. `steps` is a jsonb array of
-- {step: text, minutes: int, done: bool} — the steps of one breakdown are only
-- ever read and written together, so a child table would buy nothing but joins.
-- `completed_at` marks the whole breakdown finished and stays null for the many
-- that are never formally closed out; that's a normal end state, not missing data.
create table public.task_breakdowns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  task text not null,
  steps jsonb not null default '[]'::jsonb,
  encouragement text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Email preferences, one row per user, created on demand the first time we
-- consider emailing someone. `opted_in` is the master switch the unsubscribe
-- link flips, so a global opt-out survives someone later re-enabling one type.
create table public.email_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  opted_in boolean not null default true,
  weekly_digest boolean not null default true,
  accountability boolean not null default true,
  monthly_report boolean not null default true,
  -- Unsubscribe must work from a mail client with no session, so the token IS
  -- the credential. Rotate the column to revoke a leaked link.
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('weekly_digest', 'accountability', 'monthly_report', 'welcome')),
  status text not null check (status in ('success', 'failed', 'skipped')),
  error_message text,
  provider_message_id text,
  sent_at timestamptz not null default now()
);

create table public.accountability_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  response text not null check (response in ('good', 'mixed', 'struggled')),
  responded_at timestamptz not null default now()
);

create index entries_user_id_created_at_idx on public.entries (user_id, created_at desc);
create index email_logs_user_id_sent_at_idx on public.email_logs (user_id, sent_at desc);
create index accountability_responses_user_id_idx
  on public.accountability_responses (user_id, responded_at desc);
create index insights_user_id_created_at_idx on public.insights (user_id, created_at desc);
create index insights_entry_id_idx on public.insights (entry_id);
create index task_breakdowns_user_id_created_at_idx
  on public.task_breakdowns (user_id, created_at desc);

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
alter table public.task_breakdowns enable row level security;
alter table public.email_preferences enable row level security;
alter table public.email_logs enable row level security;
alter table public.accountability_responses enable row level security;

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

-- UPDATE is not optional here: ticking a step rewrites the steps array, and
-- under RLS a missing policy is a silent denial rather than an error.
create policy "Users can view own breakdowns" on public.task_breakdowns
  for select using (auth.uid() = user_id);
create policy "Users can insert own breakdowns" on public.task_breakdowns
  for insert with check (auth.uid() = user_id);
create policy "Users can update own breakdowns" on public.task_breakdowns
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own breakdowns" on public.task_breakdowns
  for delete using (auth.uid() = user_id);

create policy "Users can view own email preferences" on public.email_preferences
  for select using (auth.uid() = user_id);
create policy "Users can insert own email preferences" on public.email_preferences
  for insert with check (auth.uid() = user_id);
create policy "Users can update own email preferences" on public.email_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Logs and check-in answers are readable by their owner but written only by the
-- server via the service-role key, which bypasses RLS. The absence of an insert
-- policy is deliberate: a client must not be able to forge a delivery record.
create policy "Users can view own email logs" on public.email_logs
  for select using (auth.uid() = user_id);
create policy "Users can view own check-in responses" on public.accountability_responses
  for select using (auth.uid() = user_id);
