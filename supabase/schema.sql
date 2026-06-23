-- GymFlow AI Database Schema
-- Run this in your Supabase SQL editor after creating a new project

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  full_name text,
  age integer check (age > 0 and age < 120),
  gender text,
  height_cm decimal(5,2),
  weight_kg decimal(5,2),
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  fitness_goal text check (fitness_goal in ('build_muscle', 'lose_fat', 'gain_strength', 'general_fitness', 'athletic_performance')),
  available_days integer check (available_days >= 1 and available_days <= 7),
  workout_duration integer, -- in minutes
  equipment text check (equipment in ('full_gym', 'dumbbells_only', 'home_gym', 'bodyweight_only')),
  injury_notes text,
  priority_muscles text[] default '{}',
  depriority_muscles text[] default '{}',
  onboarding_completed boolean default false
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- PROGRAMS
-- ============================================
create table if not exists public.programs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  split_type text not null,
  days_per_week integer not null,
  rationale text,
  workout_days jsonb not null default '[]',
  is_active boolean default true
);

alter table public.programs enable row level security;

create policy "Users can manage own programs"
  on public.programs for all
  using (auth.uid() = user_id);

-- ============================================
-- WORKOUT LOGS
-- ============================================
create table if not exists public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date default current_date not null,
  workout_day_id text,
  workout_day_name text,
  exercises jsonb not null default '[]',
  duration_minutes integer,
  notes text,
  readiness_energy integer check (readiness_energy >= 1 and readiness_energy <= 5),
  readiness_soreness integer check (readiness_soreness >= 1 and readiness_soreness <= 5),
  readiness_sleep integer check (readiness_sleep >= 1 and readiness_sleep <= 5),
  readiness_motivation integer check (readiness_motivation >= 1 and readiness_motivation <= 5)
);

alter table public.workout_logs enable row level security;

create policy "Users can manage own workout logs"
  on public.workout_logs for all
  using (auth.uid() = user_id);

-- ============================================
-- BODY WEIGHT LOGS
-- ============================================
create table if not exists public.body_weight_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight_kg decimal(5,2) not null,
  date date default current_date not null
);

alter table public.body_weight_logs enable row level security;

create policy "Users can manage own body weight logs"
  on public.body_weight_logs for all
  using (auth.uid() = user_id);

-- ============================================
-- PERSONAL RECORDS
-- ============================================
create table if not exists public.personal_records (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  exercise_id text not null,
  weight_kg decimal(6,2) not null,
  reps integer not null,
  date date default current_date not null
);

alter table public.personal_records enable row level security;

create policy "Users can manage own PRs"
  on public.personal_records for all
  using (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- UPDATE TIMESTAMP FUNCTION
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
