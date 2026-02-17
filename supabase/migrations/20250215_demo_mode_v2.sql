-- ============================================
-- DEMO MODE V2: Schema Changes
-- Adds demo-specific columns to profiles table
-- ============================================

-- Add demo flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Track remaining AI calls for demo sessions (default 15)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_ai_calls_remaining integer DEFAULT 15;

-- Track when demo was created (for cleanup scheduling)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_created_at timestamptz;

-- Index for cleanup queries: find old demo profiles efficiently
CREATE INDEX IF NOT EXISTS idx_profiles_demo_cleanup 
  ON profiles (is_demo, demo_created_at) 
  WHERE is_demo = true;

-- ============================================
-- RLS: Anonymous users need the same access as regular users
-- Existing policies already use auth.uid() = id / user_id,
-- which works for anonymous auth sessions too.
-- No RLS changes needed.
-- ============================================
