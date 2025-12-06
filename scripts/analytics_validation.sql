-- Analytics Validation Query
-- Run this in Supabase SQL Editor to verify events are flowing

-- 1. Count total events by type
SELECT 
    event_name,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(created_at) as last_event
FROM analytics_events
GROUP BY event_name
ORDER BY event_count DESC;

-- 2. Verify new MVP events exist
SELECT 
    event_name,
    COUNT(*) as count,
    MAX(created_at) as last_seen
FROM analytics_events
WHERE event_name IN (
    'first_insight_viewed',
    'first_action_taken', 
    'reflection_generated',
    'insight_modal_shown',
    'insight_modal_action',
    'error_event'
)
GROUP BY event_name;

-- 3. Recent events (last 24 hours)
SELECT 
    event_name,
    user_id,
    properties,
    created_at
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 4. User funnel: onboarding → entry → insight
SELECT
    COUNT(DISTINCT CASE WHEN event_name = 'onboarding_completed' THEN user_id END) as onboarding_completed,
    COUNT(DISTINCT CASE WHEN event_name = 'entry_created' THEN user_id END) as entry_created,
    COUNT(DISTINCT CASE WHEN event_name = 'first_insight_viewed' THEN user_id END) as first_insight,
    COUNT(DISTINCT CASE WHEN event_name = 'first_action_taken' THEN user_id END) as first_action
FROM analytics_events;

-- 5. Error rate check
SELECT 
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE event_name = 'error_event') as errors,
    COUNT(*) FILTER (WHERE event_name = 'entry_created') as entries,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE event_name = 'error_event') / 
        NULLIF(COUNT(*) FILTER (WHERE event_name = 'entry_created'), 0),
        2
    ) as error_rate_pct
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
