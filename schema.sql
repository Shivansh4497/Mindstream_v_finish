-- ============================================
-- MINDSTREAM DATABASE SCHEMA
-- Last Updated: December 2024
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Custom Enums
create type intention_timeframe as enum ('daily', 'weekly', 'monthly', 'yearly', 'life');
create type intention_status as enum ('pending', 'completed');

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles Table
create table profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz default now()
);

-- Entries Table
create table entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  title text,
  type text, -- e.g., 'text', 'voice'
  audio_url text,
  timestamp timestamptz default now(),
  tags text[], -- Array of text
  primary_sentiment text,
  emoji text,
  secondary_sentiment text,
  suggestions jsonb
);

-- Reflections Table
create table reflections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  summary text,
  date date not null,
  timestamp timestamptz default now(),
  type text not null, -- 'daily', 'weekly', 'monthly'
  suggestions jsonb,
  auto_generated boolean default false
);

-- Habits Table
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  emoji text,
  frequency text not null, -- 'daily', 'weekly', 'monthly'
  current_streak int4 default 0,
  longest_streak int4 default 0,
  created_at timestamptz default now(),
  category text
);

-- Habit Logs Table
create table habit_logs (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  completed_at timestamptz default now()
);

-- Intentions Table
create table intentions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  timeframe intention_timeframe, -- Deprecated, use due_date instead
  status intention_status default 'pending',
  is_recurring bool default false,
  tags text[],
  target_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  due_date date, -- NEW: Deadline for intention
  is_life_goal boolean default false, -- NEW: True for ongoing life goals
  is_starred boolean default false, -- NEW: High priority toggle
  emoji text, -- NEW: AI-assigned emoji
  category text -- NEW: AI-assigned category (Health, Growth, Career, Finance, Connection, System)
);

-- ============================================
-- INSIGHTS & ANALYTICS TABLES
-- ============================================

-- Insight Cards Table (AI-generated insights for users)
create table insight_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- 'correlation', 'pattern', 'milestone', 'thematic'
  title text not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz default now(),
  dismissed boolean default false
);

-- Chart Insights Table (AI insights for charts/visualizations)
create table chart_insights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  correlation_insight text,
  sentiment_insight text,
  daily_pulse text,
  heatmap_insights text[],
  insight_date date
);

-- Analytics Events Table (User behavior tracking)
create table analytics_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_name text not null,
  properties jsonb,
  created_at timestamptz default now(),
  client_event_id text unique -- For idempotent event logging
);

-- ============================================
-- USER PREFERENCES & NUDGES
-- ============================================

-- User Preferences Table
create table user_preferences (
  user_id uuid references auth.users(id) on delete cascade not null primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  ai_personality text default 'coach', -- 'coach', 'therapist', 'friend', 'mentor'
  flags jsonb default '{}'::jsonb -- Feature flags and user settings
);

-- Proactive Nudges Table
create table proactive_nudges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pattern_type text not null, -- 'mood_decline', 'habit_abandonment', 'intention_stagnation', 'positive_reinforcement'
  message text not null,
  suggested_action text, -- 'chat_reflection', 'log_entry', 'review_goals'
  status text default 'pending', -- 'pending', 'accepted', 'dismissed'
  created_at timestamptz default now(),
  acted_on_at timestamptz
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- All tables have RLS enabled to ensure users can only access their own data.

-- Profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Entries
alter table entries enable row level security;
create policy "Users can view own entries" on entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on entries for update using (auth.uid() = user_id);
create policy "Users can delete own entries" on entries for delete using (auth.uid() = user_id);

-- Reflections
alter table reflections enable row level security;
create policy "Users can view own reflections" on reflections for select using (auth.uid() = user_id);
create policy "Users can insert own reflections" on reflections for insert with check (auth.uid() = user_id);
create policy "Users can update own reflections" on reflections for update using (auth.uid() = user_id);
create policy "Users can delete own reflections" on reflections for delete using (auth.uid() = user_id);

-- Habits
alter table habits enable row level security;
create policy "Users can view own habits" on habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on habits for delete using (auth.uid() = user_id);

-- Habit Logs (via habits table foreign key)
alter table habit_logs enable row level security;
create policy "Users can view own habit logs" on habit_logs for select using (
  exists (select 1 from habits where habits.id = habit_logs.habit_id and habits.user_id = auth.uid())
);
create policy "Users can insert own habit logs" on habit_logs for insert with check (
  exists (select 1 from habits where habits.id = habit_logs.habit_id and habits.user_id = auth.uid())
);
create policy "Users can delete own habit logs" on habit_logs for delete using (
  exists (select 1 from habits where habits.id = habit_logs.habit_id and habits.user_id = auth.uid())
);

-- Intentions
alter table intentions enable row level security;
create policy "Users can view own intentions" on intentions for select using (auth.uid() = user_id);
create policy "Users can insert own intentions" on intentions for insert with check (auth.uid() = user_id);
create policy "Users can update own intentions" on intentions for update using (auth.uid() = user_id);
create policy "Users can delete own intentions" on intentions for delete using (auth.uid() = user_id);

-- Insight Cards
alter table insight_cards enable row level security;
create policy "Users can view own insight cards" on insight_cards for select using (auth.uid() = user_id);
create policy "Users can insert own insight cards" on insight_cards for insert with check (auth.uid() = user_id);
create policy "Users can update own insight cards" on insight_cards for update using (auth.uid() = user_id);
create policy "Users can delete own insight cards" on insight_cards for delete using (auth.uid() = user_id);

-- Chart Insights
alter table chart_insights enable row level security;
create policy "Users can view own chart insights" on chart_insights for select using (auth.uid() = user_id);
create policy "Users can insert own chart insights" on chart_insights for insert with check (auth.uid() = user_id);
create policy "Users can update own chart insights" on chart_insights for update using (auth.uid() = user_id);
create policy "Users can delete own chart insights" on chart_insights for delete using (auth.uid() = user_id);

-- Analytics Events
alter table analytics_events enable row level security;
create policy "Users can view own analytics events" on analytics_events for select using (auth.uid() = user_id);
create policy "Users can insert own analytics events" on analytics_events for insert with check (auth.uid() = user_id);

-- User Preferences
alter table user_preferences enable row level security;
create policy "Users can view own preferences" on user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences" on user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences" on user_preferences for update using (auth.uid() = user_id);

-- Proactive Nudges
alter table proactive_nudges enable row level security;
create policy "Users can view own nudges" on proactive_nudges for select using (auth.uid() = user_id);
create policy "Users can insert own nudges" on proactive_nudges for insert with check (auth.uid() = user_id);
create policy "Users can update own nudges" on proactive_nudges for update using (auth.uid() = user_id);
create policy "Users can delete own nudges" on proactive_nudges for delete using (auth.uid() = user_id);
