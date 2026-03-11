import { computeEIV } from '../utils/eiv';
import type { GranularSentiment } from '../types';

/**
 * EIV Backfill Service
 *
 * Scores all existing entries that have a sentiment label but no eiv_score.
 * Runs silently on app load after the user's data is fetched.
 *
 * Design decision: runs client-side (not server-side) during beta
 * to avoid requiring a privileged Edge Function invocation.
 * Migrates to the nightly compute job in Phase 4.
 *
 * Constraints:
 * - Batches updates in chunks of 50 to respect Supabase free tier
 * - Only updates entries WHERE eiv_score IS NULL (idempotent)
 * - Never updates entries without a sentiment label (null stays null)
 * - Fire-and-forget from useAppLogic — never blocks the UI
 */

interface EntryForScoring {
    id: string;
    primary_sentiment?: GranularSentiment | null;
    eiv_score?: number | null;
}

/**
 * Score a batch of entries and persist the eiv_score to Supabase.
 * This function is called once per session, silently, after initial data load.
 *
 * @param supabase - The initialized Supabase client
 * @param userId   - The current user's ID (used for logging only; RLS scopes writes)
 * @param entries  - The entries already loaded into app state
 */
export const backfillEIVScores = async (
    supabase: any,
    userId: string,
    entries: EntryForScoring[]
): Promise<number> => {
    // Filter: only entries with a sentiment but without a score
    const unscored = entries.filter(
        (e) => e.primary_sentiment && (e.eiv_score === null || e.eiv_score === undefined)
    );

    if (unscored.length === 0) return 0;

    console.log(`[EIV Backfill] Found ${unscored.length} unscored entries for user ${userId}`);

    // Compute scores in memory first (pure TS, no DB calls)
    const scored = unscored
        .map((e) => ({
            id: e.id,
            eiv_score: computeEIV(e.primary_sentiment),
        }))
        .filter((e) => e.eiv_score !== null) as { id: string; eiv_score: number }[];

    if (scored.length === 0) return 0;

    // Batch updates in chunks of 50 to be free-tier respectful
    const CHUNK_SIZE = 50;
    let updatedCount = 0;

    for (let i = 0; i < scored.length; i += CHUNK_SIZE) {
        const chunk = scored.slice(i, i + CHUNK_SIZE);

        // Update each entry individually (Supabase JS client doesn't support
        // bulk update with different values per row without upsert)
        const results = await Promise.allSettled(
            chunk.map((entry) =>
                supabase
                    .from('entries')
                    .update({ eiv_score: entry.eiv_score })
                    .eq('id', entry.id)
            )
        );

        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        updatedCount += succeeded;

        const failed = results.length - succeeded;
        if (failed > 0) {
            console.warn(`[EIV Backfill] ${failed} entries failed to update in chunk ${i / CHUNK_SIZE + 1}`);
        }
    }

    console.log(`[EIV Backfill] Complete. Scored ${updatedCount}/${scored.length} entries.`);
    return updatedCount;
};
