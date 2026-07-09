-- ============================================================
-- AlphaEdge — COMPLETE Supabase Schema (v1.0)
-- Includes: profiles, subscriptions, signals, watchlist,
--           trader_profiles (onboarding), triggers, helpers
-- Run this ONCE in your Supabase SQL Editor on a fresh project.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ── Subscriptions ────────────────────────────────────────
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('weekly', 'monthly')) not null,
  status text check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')) not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

create policy "Service role full access on subscriptions"
  on public.subscriptions for all using (true) with check (true);

-- ── Trader profiles (onboarding answers) ─────────────────
create table public.trader_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  trade_style text check (trade_style in ('scalp', 'swing', 'position')) not null,
  profit_target text check (profit_target in ('quick', 'moderate', 'home_run')) not null,
  risk_tolerance text check (risk_tolerance in ('conservative', 'balanced', 'aggressive')) not null,
  completed_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trader_profiles enable row level security;

create policy "Users manage own trader profile"
  on public.trader_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Service role reads all trader profiles"
  on public.trader_profiles for select using (true);

-- ── Signals cache ────────────────────────────────────────
create table public.signals (
  id uuid default uuid_generate_v4() primary key,
  ticker text not null,
  market text check (market in ('stock', 'crypto', 'forex')) not null,
  signal_type text check (signal_type in ('buy', 'sell', 'watch')) not null,
  confidence integer check (confidence between 0 and 100) not null,
  price numeric(18, 8) not null,
  entry_low numeric(18, 8),
  entry_high numeric(18, 8),
  target_price numeric(18, 8),
  stop_loss numeric(18, 8),
  rsi numeric(5, 2),
  macd_signal text,
  volume_ratio numeric(6, 2),
  ai_reasoning text not null,
  generated_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '1 hour')
);

alter table public.signals enable row level security;

create policy "Active subscribers can read signals"
  on public.signals for select
  using (
    exists (
      select 1 from public.subscriptions
      where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Service role can insert signals"
  on public.signals for insert with check (true);

-- ── Watchlist ────────────────────────────────────────────
create table public.watchlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ticker text not null,
  market text check (market in ('stock', 'crypto', 'forex')) not null,
  added_at timestamptz default now(),
  unique (user_id, ticker)
);

alter table public.watchlist enable row level security;

create policy "Users manage own watchlist"
  on public.watchlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Auth trigger: auto-create profile row on signup ──────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Helper: is user subscribed? ───────────────────────────
create or replace function public.is_subscribed(user_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
    and status = 'active'
    and current_period_end > now()
  );
$$ language sql security definer;
