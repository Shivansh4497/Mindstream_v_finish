-- Migration: Chat Feedback Table
-- Purpose: Store opt-in shared conversations for AI quality improvement

CREATE TABLE IF NOT EXISTS chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation JSONB NOT NULL,            -- Full conversation (max 25 messages)
  personality TEXT,                        -- Which AI companion was active
  entry_point TEXT,                        -- 'quick_start', 'guided', 'organic'
  message_count INTEGER,                   -- Quick lookup for count display
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  reviewed BOOLEAN DEFAULT FALSE,
  notes TEXT                               -- For founder review notes
);

-- RLS: Enable row level security
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can INSERT their own chat feedback
CREATE POLICY "Users can share their own chats"
  ON chat_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can SELECT their own (for count display)
CREATE POLICY "Users can count their shared chats"
  ON chat_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can DELETE their own shared chats
CREATE POLICY "Users can delete their shared chats"
  ON chat_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can UPDATE their own shared chats
CREATE POLICY "Users can update their shared chats"
  ON chat_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_feedback_expires ON chat_feedback(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_user ON chat_feedback(user_id);

-- Comment for documentation
COMMENT ON TABLE chat_feedback IS 'Stores opt-in shared chat conversations for AI quality improvement. Auto-expires after 90 days.';
