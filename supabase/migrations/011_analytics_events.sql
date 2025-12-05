-- Analytics Events Table
-- Tracks user behavior for retention and engagement analysis

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_time ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_event ON analytics_events(user_id, event_name);

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
    ON analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can read their own events (optional - for debugging)
CREATE POLICY "Users can read own events"
    ON analytics_events FOR SELECT
    USING (auth.uid() = user_id);

-- Comment documenting event types
COMMENT ON TABLE analytics_events IS 'Tracks user behavior events:
- onboarding_completed: { path: "quick_start" | "guided" }
- entry_created: { word_count, sentiment, voice }
- insight_modal_action: { action: "habit" | "goal" | "chat" | "dismiss" }
- habit_completed: { habit_name }
- insights_unlocked: {}
- app_opened: { entries_count }
- chat_message_sent: { word_count }
- voice_input_used: { context: "stream" | "chat" | "onboarding" }';
