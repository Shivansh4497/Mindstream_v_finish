-- ============================================================
-- Phase 6: Dead Code Elimination & Bug Fixes
-- Created: 2026-03-11
-- Purpose: Drop personalities table, secure soft-deletes (C1),
--          setup 30-day cron for hard delete (C5).
-- ============================================================

-- 1. Drop deprecated Personality System
DROP TABLE IF EXISTS personalities;
ALTER TABLE profiles DROP COLUMN IF EXISTS context_window_size;

-- 2. C5 Fix: Create a function to hard-delete soft-deleted rows older than 30 days
CREATE OR REPLACE FUNCTION delete_expired_soft_deletions()
RETURNS void AS $$
BEGIN
    -- Delete from all tables with a deleted_at column
    DELETE FROM entries WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM habits WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM habit_logs WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM intentions WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM reflections WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM chart_insights WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM proactive_nudges WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM analytics_events WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM correlation_snapshots WHERE deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- To fully automate this, the Supabase project must have the pg_cron extension enabled
-- and this cron job scheduled. 
-- Example (commented out as pg_cron requires superuser setup in some environments):
-- SELECT cron.schedule('hard_delete_weekly', '0 0 * * 0', 'SELECT delete_expired_soft_deletions()');

-- 3. C1 Fix: Ensure all materialized views explicitly filter out soft-deleted data.
-- The existing `daily_emotional_scores` already has `deleted_at IS NULL`.
-- Let's ensure any other new views or policies strictly enforce this.
-- (No schema changes needed here as the 20260311_phase1_eiv_score.sql view definition is correct).
