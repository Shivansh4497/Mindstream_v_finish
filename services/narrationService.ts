/**
 * Narration Service — Stage 2 of the two-stage behavioral pattern engine.
 *
 * ARCHITECTURE BOUNDARY (non-negotiable):
 *   Stage 1 (correlationService): TypeScript/SQL computes verified numbers.
 *   Stage 2 (this file): AI receives ONLY those numbers → produces language.
 *
 * What the AI sees in narrate-correlation:
 *   ✅ habitName, r, n, direction, confidenceLabel, lag
 *   ✅ avgEivWhenCompleted, avgEivWhenMissed, completedCount, missedCount
 *   ❌ Raw journal entry text — NEVER
 *   ❌ Pattern detection — NEVER (patterns are found by Stage 1)
 *   ❌ Statistical claims the math didn't prove — NEVER
 */

import { callAIProxy } from './geminiClient';
import type { CorrelationResult } from './correlationService';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface NarratedInsight {
    title: string;
    insight: string;   // One human-readable sentence
    emoji: string;
    correlationResult: CorrelationResult; // Source of truth preserved
}

interface NarrationAIResponse {
    title: string;
    insight: string;
    emoji: string;
}

// ─────────────────────────────────────────────────────────────
// Core Narration
// ─────────────────────────────────────────────────────────────

/**
 * Narrate a single verified correlation result.
 *
 * @param result - A CorrelationResult that has already passed both hard gates.
 * @returns A NarratedInsight with the AI-generated sentence, or null on failure.
 *
 * This function is deliberately simple: one result in, one narrated insight out.
 * Retry and batch logic belongs in the caller.
 */
export const narrateCorrelation = async (
    result: CorrelationResult
): Promise<NarratedInsight | null> => {
    try {
        const response = await callAIProxy<NarrationAIResponse>('narrate-correlation', {
            habitName: result.habitName,
            r: result.r,
            n: result.n,
            direction: result.direction,
            confidenceLabel: result.confidenceLabel,
            lagDays: result.lagDays,
            avgEivWhenCompleted: result.avgEivWhenCompleted,
            avgEivWhenMissed: result.avgEivWhenMissed,
            completedCount: result.completedCount,
            missedCount: result.missedCount,
        });

        if (!response?.insight || !response?.title) {
            console.warn('[NarrationService] AI returned incomplete narration:', response);
            return null;
        }

        return {
            title: response.title,
            insight: response.insight,
            emoji: response.emoji || '📊',
            correlationResult: result,
        };
    } catch (error) {
        console.error('[NarrationService] Failed to narrate correlation:', error);
        return null;
    }
};

// ─────────────────────────────────────────────────────────────
// Persist to insight_cards
// ─────────────────────────────────────────────────────────────

/**
 * Save a narrated insight to the insight_cards table and mark the
 * correlation_snapshot as having generated an insight.
 *
 * @param supabase - Initialized Supabase client
 * @param userId   - Current user's ID
 * @param narrated - The output from narrateCorrelation()
 * @param snapshotId - The correlation_snapshots.id to mark as narrated
 */
export const saveInsightCard = async (
    supabase: any,
    userId: string,
    narrated: NarratedInsight,
    snapshotId?: string
): Promise<void> => {
    const r = narrated.correlationResult;

    // Write the insight card
    const { error: insertError } = await supabase
        .from('insight_cards')
        .insert({
            user_id: userId,
            type: 'correlation',
            title: `${narrated.emoji} ${narrated.title}`,
            content: narrated.insight,
            metadata: {
                habit_id: r.habitId,
                habit_name: r.habitName,
                pearson_r: r.r,
                n: r.n,
                lag_days: r.lagDays,
                direction: r.direction,
                confidence_label: r.confidenceLabel,
                avg_eiv_when_completed: r.avgEivWhenCompleted,
                avg_eiv_when_missed: r.avgEivWhenMissed,
            },
            dismissed: false,
        });

    if (insertError) {
        console.error('[NarrationService] Failed to insert insight_card:', insertError);
    }

    // Mark the snapshot as narrated (so we don't re-narrate on next run)
    if (snapshotId) {
        const { error: updateError } = await supabase
            .from('correlation_snapshots')
            .update({ insight_generated: true })
            .eq('id', snapshotId);

        if (updateError) {
            console.warn('[NarrationService] Failed to mark snapshot as narrated:', updateError);
        }
    }
};

// ─────────────────────────────────────────────────────────────
// Batch Narration Pipeline
// ─────────────────────────────────────────────────────────────

/**
 * Full pipeline: take top correlation results, narrate each one, and save.
 * This is called either by:
 *   - The on-demand trigger (Phase 3 beta)
 *   - The nightly compute Edge Function (Phase 4)
 *
 * @returns The narrated insights that were successfully saved.
 */
export const runNarrationPipeline = async (
    supabase: any,
    userId: string,
    correlationResults: CorrelationResult[]
): Promise<NarratedInsight[]> => {
    if (correlationResults.length === 0) return [];

    console.log(`[NarrationService] Narrating ${correlationResults.length} verified correlations...`);

    // Narrate sequentially to avoid hammering the AI proxy
    const narrated: NarratedInsight[] = [];

    for (const result of correlationResults) {
        const insight = await narrateCorrelation(result);
        if (!insight) continue;

        await saveInsightCard(supabase, userId, insight);
        narrated.push(insight);

        // Small delay between calls to be respectful to rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`[NarrationService] Pipeline complete. ${narrated.length}/${correlationResults.length} insights generated.`);
    return narrated;
};
