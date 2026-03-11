-- ============================================================
-- Phase 1: EIV Score Column + Correlation Infrastructure
-- Created: 2026-03-11
-- Purpose: Add eiv_score to entries, create daily_emotional_scores
--          materialized view, and correlation_snapshots table.
-- 
-- POLICY: Additive only. Safe to run against live production DB.
-- All operations use IF NOT EXISTS / no destructive changes.
-- ============================================================

-- ============================================================
-- 1. Add eiv_score to entries table
-- ============================================================
-- eiv_score: float in [-1.0, +1.0], NULL means "not yet scored"
-- Nullable intentionally — we exclude unscored entries from correlation math.
-- Do NOT default to 0 (0 is a real score meaning Observational sentiment).
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS eiv_score float8;

-- Index for fast time-series queries in correlation engine:
-- "give me all (date, eiv_score) pairs for this user in the last 90 days"
CREATE INDEX IF NOT EXISTS idx_entries_eiv_lookup
  ON entries (user_id, timestamp, eiv_score)
  WHERE deleted_at IS NULL AND eiv_score IS NOT NULL;

-- ============================================================
-- 2. Create daily_emotional_scores materialized view
-- ============================================================
-- One row per user per calendar day: mean EIV across all scored entries.
-- This is the Y-axis for all Pearson correlation computations.
-- Refresh strategy: nightly compute job calls REFRESH MATERIALIZED VIEW.
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_emotional_scores AS
  SELECT
    user_id,
    DATE(timestamp AT TIME ZONE 'UTC') AS score_date,
    AVG(eiv_score)::float8             AS mean_eiv,
    COUNT(*)::integer                  AS entry_count
  FROM entries
  WHERE
    deleted_at IS NULL
    AND eiv_score IS NOT NULL
  GROUP BY
    user_id,
    DATE(timestamp AT TIME ZONE 'UTC')
WITH NO DATA;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
-- (concurrent refresh avoids locking the view during nightly compute)
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_emotional_scores_pk
  ON daily_emotional_scores (user_id, score_date);

-- ============================================================
-- 3. Create correlation_snapshots table
-- ============================================================
-- Stores verified Pearson correlation results before AI narration.
-- Written by the nightly compute job (or on-demand for beta).
-- insight_generated = true once the result has been narrated + written to insight_cards.
CREATE TABLE IF NOT EXISTS correlation_snapshots (
  id                    uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id              uuid          NOT NULL,
  habit_name            text          NOT NULL,
  eiv_dimension         text          NOT NULL DEFAULT 'mean_eiv',  -- expandable in future
  r                     float8        NOT NULL,   -- Pearson r in [-1.0, +1.0]
  n                     integer       NOT NULL,   -- number of data points used
  lag_days              integer       NOT NULL DEFAULT 0, -- 0 = same-day, 1 = next-day
  direction             text          NOT NULL,   -- 'positive' | 'negative'
  avg_eiv_when_completed float8,                 -- mean mood on days habit was done
  avg_eiv_when_missed    float8,                 -- mean mood on days habit was skipped
  completed_count       integer,                 -- days habit was completed in window
  missed_count          integer,                 -- days habit was missed in window
  confidence_label      text,                    -- 'moderate' | 'strong' | 'very strong'
  computed_at           timestamptz   NOT NULL DEFAULT NOW(),
  insight_generated     boolean       NOT NULL DEFAULT false,
  deleted_at            timestamptz   -- soft delete
);

-- RLS: Users can only read their own snapshots
ALTER TABLE correlation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own correlation snapshots"
  ON correlation_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role (used by nightly compute Edge Function) bypasses RLS automatically.

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_correlation_snapshots_user
  ON correlation_snapshots (user_id, computed_at DESC)
  WHERE deleted_at IS NULL;

-- Unique constraint to prevent duplicate snapshots per habit+lag on the same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_correlation_snapshots_unique
  ON correlation_snapshots (user_id, habit_id, lag_days, DATE(computed_at));

COMMENT ON TABLE correlation_snapshots IS
  'Verified Pearson correlation results computed by TypeScript engine. Never written by AI. AI only reads these to narrate them.';

COMMENT ON COLUMN correlation_snapshots.r IS
  'Pearson correlation coefficient. Hard gates: |r| >= 0.30 AND n >= 14 before any row is written.';
