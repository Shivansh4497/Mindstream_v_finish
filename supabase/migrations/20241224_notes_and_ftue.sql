-- Migration: Add notes field to intentions for goal context
-- Also add ftue_completed to profiles for in-app tour

-- Notes on Goals
ALTER TABLE intentions ADD COLUMN IF NOT EXISTS notes TEXT;

-- FTUE tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ftue_completed BOOLEAN DEFAULT FALSE;
