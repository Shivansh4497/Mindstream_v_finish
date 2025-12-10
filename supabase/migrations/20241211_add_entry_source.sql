-- Migration: Add source tracking for entry provenance
-- This enables Chat Takeaways and other entry sources

-- Add source column to track where entries come from
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
-- Values: 'manual' (typed), 'voice' (transcribed), 'chat_takeaway' (AI-generated from chat)

-- Add source_meta for debugging, iteration, and quality scoring
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS source_meta JSONB DEFAULT '{}';
-- Structure for chat_takeaway:
-- {
--   "prompt_version": "chat-summary-v1",
--   "ai_model": "gemini-2.0-flash",
--   "generation_id": "uuid",
--   "message_count": 8,
--   "user_word_count": 45,
--   "generated_at": "2025-12-11T00:30:00Z",
--   "quality_score": null  -- Founder fills: 1-5 or "good"/"bad"
-- }

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_entries_source ON entries(source);

COMMENT ON COLUMN entries.source IS 'Entry origin: manual, voice, chat_takeaway';
COMMENT ON COLUMN entries.source_meta IS 'Provenance metadata for debugging and quality tracking';
