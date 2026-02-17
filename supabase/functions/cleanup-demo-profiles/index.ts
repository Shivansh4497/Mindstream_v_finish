import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// CLEANUP DEMO PROFILES
// Run daily via Supabase cron to clean up stale demo user data.
//
// Strategy: "Soft Retention"
//   - KEEP: profiles row + analytics_events (for metrics)
//   - DELETE: entries, habits, habit_logs, intentions, reflections (bulk data)
//   - Condition: is_demo = true AND created_at < now() - 7 days
// =============================================================================

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const adminClient = createClient(supabaseUrl, supabaseKey);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString();

        console.log(`[Cleanup] Starting demo profile cleanup. Cutoff: ${cutoffDate}`);

        // 1. Find stale demo profiles
        const { data: staleProfiles, error: fetchError } = await adminClient
            .from('profiles')
            .select('id')
            .eq('is_demo', true)
            .lt('created_at', cutoffDate);

        if (fetchError) {
            throw new Error(`Failed to fetch stale profiles: ${fetchError.message}`);
        }

        if (!staleProfiles || staleProfiles.length === 0) {
            console.log('[Cleanup] No stale demo profiles found.');
            return new Response(JSON.stringify({ success: true, cleaned: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const userIds = staleProfiles.map((p: any) => p.id);
        console.log(`[Cleanup] Found ${userIds.length} stale demo profiles to clean.`);

        // 2. Delete bulk data in order (respecting FK constraints)

        // Delete habit_logs first (FK → habits)
        const { data: userHabits } = await adminClient
            .from('habits')
            .select('id')
            .in('user_id', userIds);

        if (userHabits && userHabits.length > 0) {
            const habitIds = userHabits.map((h: any) => h.id);
            const { error: logsError } = await adminClient
                .from('habit_logs')
                .delete()
                .in('habit_id', habitIds);
            if (logsError) console.error('[Cleanup] habit_logs error:', logsError.message);
            else console.log(`[Cleanup] ✓ Cleaned habit_logs for ${habitIds.length} habits`);
        }

        // Delete habits
        const { error: habitsError } = await adminClient
            .from('habits')
            .delete()
            .in('user_id', userIds);
        if (habitsError) console.error('[Cleanup] habits error:', habitsError.message);
        else console.log('[Cleanup] ✓ Cleaned habits');

        // Delete entries
        const { error: entriesError } = await adminClient
            .from('entries')
            .delete()
            .in('user_id', userIds);
        if (entriesError) console.error('[Cleanup] entries error:', entriesError.message);
        else console.log('[Cleanup] ✓ Cleaned entries');

        // Delete intentions
        const { error: intentionsError } = await adminClient
            .from('intentions')
            .delete()
            .in('user_id', userIds);
        if (intentionsError) console.error('[Cleanup] intentions error:', intentionsError.message);
        else console.log('[Cleanup] ✓ Cleaned intentions');

        // Delete reflections
        const { error: reflectionsError } = await adminClient
            .from('reflections')
            .delete()
            .in('user_id', userIds);
        if (reflectionsError) console.error('[Cleanup] reflections error:', reflectionsError.message);
        else console.log('[Cleanup] ✓ Cleaned reflections');

        // 3. Log cleanup event (keep analytics_events and profiles intact)
        await adminClient.from('analytics_events').insert({
            user_id: userIds[0], // Use first ID as representative
            event_name: 'demo_cleanup_batch',
            properties: {
                cleaned_at: new Date().toISOString(),
                profiles_cleaned: userIds.length,
                cutoff_date: cutoffDate,
            },
            client_event_id: `cleanup_${Date.now()}`,
        });

        console.log(`[Cleanup] ✅ Cleaned ${userIds.length} stale demo profiles.`);

        return new Response(JSON.stringify({
            success: true,
            cleaned: userIds.length,
            cutoff: cutoffDate,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('[Cleanup] Critical error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
