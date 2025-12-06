-- RLS Policy Audit Script
-- Run this in Supabase SQL Editor to verify Row Level Security is properly configured

-- 1. Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verify critical tables have RLS
SELECT 
    t.tablename,
    CASE WHEN t.rowsecurity THEN '✅ Enabled' ELSE '❌ DISABLED' END as rls_status,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.tablename IN (
    'entries',
    'habits', 
    'habit_logs',
    'intentions',
    'reflections',
    'analytics_events',
    'insight_cards',
    'proactive_nudges',
    'user_preferences',
    'profiles'
)
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 4. Test user isolation (replace USER_ID with an actual user ID to test)
-- This should return 0 rows if RLS is working (since we're not authenticated)
-- UNCOMMENT TO TEST:
-- SELECT COUNT(*) FROM entries WHERE user_id != 'YOUR_USER_ID_HERE';

-- 5. Verify all critical tables have SELECT policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND cmd = 'SELECT'
AND tablename IN ('entries', 'habits', 'habit_logs', 'intentions', 'reflections')
ORDER BY tablename;

-- 6. Summary check - tables that SHOULD have RLS but might not
SELECT 
    t.tablename as "Table",
    CASE 
        WHEN t.rowsecurity AND p.policy_count > 0 THEN '✅ SECURE'
        WHEN t.rowsecurity AND p.policy_count = 0 THEN '⚠️ RLS ON but NO POLICIES'
        ELSE '❌ RLS DISABLED'
    END as "Security Status"
FROM pg_tables t
LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT LIKE 'pg_%'
AND t.tablename NOT LIKE '_supabase%'
ORDER BY 
    CASE 
        WHEN t.rowsecurity AND p.policy_count > 0 THEN 2
        WHEN t.rowsecurity AND p.policy_count = 0 THEN 1
        ELSE 0
    END,
    t.tablename;
