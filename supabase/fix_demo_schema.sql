-- ============================================
-- FIX SCRIPT: Demo Mode & General Schema
-- Run this in Supabase SQL Editor to fix missing columns
-- ============================================

-- 1. Fix 'profiles' table for Demo Mode
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_ai_calls_remaining integer DEFAULT 15;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_created_at timestamptz;

-- Index for cleanup performance
CREATE INDEX IF NOT EXISTS idx_profiles_demo_cleanup 
  ON profiles (is_demo, demo_created_at) 
  WHERE is_demo = true;

-- 2. Fix 'insight_cards' table (Fixes 400 Bad Request errors)
ALTER TABLE insight_cards ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. Fix 'user_preferences' table (Just in case, saw 406 errors)
-- (Add if missing, usually strictly defined but good to ensure)
-- ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS ... (Skipping for now unless specific error found)

-- 4. Verify RLS (Optional but recommended)
-- Ensure 'anon' role can insert/select
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON TABLE profiles TO anon;
GRANT ALL ON TABLE entries TO anon;
GRANT ALL ON TABLE habits TO anon;
GRANT ALL ON TABLE habit_logs TO anon;
GRANT ALL ON TABLE intentions TO anon;
GRANT ALL ON TABLE reflections TO anon;
-- Note: RLS policies still apply and restrict to 'auth.uid() = user_id'
