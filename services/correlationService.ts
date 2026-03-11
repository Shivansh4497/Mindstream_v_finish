/**
 * Correlation Service — the full pipeline from raw DB data to CorrelationResult.
 *
 * Two-stage architecture (non-negotiable):
 *   Stage 1 (this file): Pure TypeScript/SQL computation → verified numbers
 *   Stage 2 (narrationService): AI receives only numbers → produces language
 *
 * AI NEVER touches raw user entry text.
 * AI NEVER finds patterns.
 * AI ONLY narrates what these numbers already proved.
 */

import { pearsonR, applyHardGates, getConfidenceLabel, rankingScore } from '../utils/correlation';
import { getEIVDirection } from '../utils/eiv';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CorrelationResult {
    habitId: string;
    habitName: string;
    r: number;                              // Pearson r [-1.0, +1.0]
    n: number;                              // aligned data points used
    lagDays: 0 | 1;                         // 0 = same-day, 1 = next-day mood effect
    direction: 'positive' | 'negative';    // does habit completion → higher mood?
    avgEivWhenCompleted: number;            // mean mood on days habit was done
    avgEivWhenMissed: number;              // mean mood on days habit was skipped
    completedCount: number;                // days habit completed in window
    missedCount: number;                   // days habit missed in window
    confidenceLabel: 'moderate' | 'strong' | 'very strong';
    windowDays: number;                    // lookback window used
}

interface DailyEIVRow {
    score_date: string;   // 'YYYY-MM-DD'
    mean_eiv: number;
}

interface HabitLogRow {
    completion_date: string; // 'YYYY-MM-DD'
}

// ─────────────────────────────────────────────────────────────
// DB Queries — kept in this file to avoid touching dbService
// ─────────────────────────────────────────────────────────────

/**
 * Fetch daily mean EIV scores for a user over the last N days.
 * Queries entries directly (not the materialized view) for beta compatibility.
 * Phase 4 nightly job will populate the materialized view; this function
 * can be switched to query daily_emotional_scores at that point.
 */
const fetchDailyEIVScores = async (
    supabase: any,
    userId: string,
    windowDays: number
): Promise<DailyEIVRow[]> => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);

    // Use Postgres date_trunc via raw RPC — Supabase JS client doesn't support
    // GROUP BY on computed expressions, so we use a select with cast.
    // We fetch all scored entries in the window and aggregate in TypeScript.
    const { data, error } = await supabase
        .from('entries')
        .select('timestamp, eiv_score')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .not('eiv_score', 'is', null)
        .gte('timestamp', cutoff.toISOString())
        .order('timestamp', { ascending: true });

    if (error || !data) return [];

    // Aggregate by date in TypeScript (avoids GROUP BY limitation in JS client)
    const byDate: Record<string, number[]> = {};
    for (const row of data) {
        const date = row.timestamp.slice(0, 10); // 'YYYY-MM-DD'
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(row.eiv_score);
    }

    return Object.entries(byDate).map(([score_date, scores]) => ({
        score_date,
        mean_eiv: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));
};

/**
 * Fetch the calendar dates on which a habit was completed in the last N days.
 */
const fetchHabitCompletionDates = async (
    supabase: any,
    habitId: string,
    windowDays: number
): Promise<Set<string>> => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);

    const { data, error } = await (supabase as any)
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .is('deleted_at', null)
        .gte('completed_at', cutoff.toISOString());

    if (error || !data) return new Set();

    const dates = new Set<string>();
    for (const row of data) {
        dates.add(row.completed_at.slice(0, 10)); // 'YYYY-MM-DD'
    }
    return dates;
};

// ─────────────────────────────────────────────────────────────
// Core Pipeline
// ─────────────────────────────────────────────────────────────

/**
 * Compute Pearson correlation between habit completion and daily mood EIV.
 *
 * @param supabase    - Initialized Supabase client
 * @param userId      - Current user's ID
 * @param habitId     - Habit to correlate
 * @param habitName   - Display name for the insight card
 * @param lagDays     - 0: same-day, 1: does habit completion predict NEXT day mood?
 * @param windowDays  - Lookback window. Free tier: 30. Paid: 90.
 *
 * @returns CorrelationResult if both hard gates pass, null otherwise.
 *          null = no insight should be shown. A null is always correct.
 */
export const computeHabitCorrelation = async (
    supabase: any,
    userId: string,
    habitId: string,
    habitName: string,
    lagDays: 0 | 1 = 0,
    windowDays: number = 90
): Promise<CorrelationResult | null> => {
    // 1. Fetch data in parallel
    const [eivRows, completionDates] = await Promise.all([
        fetchDailyEIVScores(supabase, userId, windowDays),
        fetchHabitCompletionDates(supabase, habitId, windowDays),
    ]);

    if (eivRows.length === 0) return null;

    // 2. Build aligned pairs: (habit_completed: 0|1, eiv_score: number)
    //    Apply lag: if lagDays=1, we check whether habit completion PREDICTS
    //    the NEXT day's mood (shift EIV dates forward by 1 when matching).
    const eivByDate: Record<string, number> = {};
    for (const row of eivRows) {
        eivByDate[row.score_date] = row.mean_eiv;
    }

    const habitVector: number[] = [];
    const eivVector: number[] = [];
    const eivOnCompleted: number[] = [];
    const eivOnMissed: number[] = [];

    for (const row of eivRows) {
        // For lag=1: compare today's habit with TOMORROW's mood.
        // So we look up the date that is (lagDays) days before this EIV date.
        const checkDate = lagDays === 0
            ? row.score_date
            : getPreviousDateString(row.score_date, lagDays);

        // Skip days where we don't have a matching EIV score for the lagged date
        if (lagDays > 0 && !eivByDate[checkDate]) continue;

        const completed = completionDates.has(checkDate) ? 1 : 0;
        habitVector.push(completed);
        eivVector.push(row.mean_eiv);

        if (completed === 1) {
            eivOnCompleted.push(row.mean_eiv);
        } else {
            eivOnMissed.push(row.mean_eiv);
        }
    }

    // 3. HARD GATE 1: Minimum data points
    const n = habitVector.length;
    if (n < 14) return null; // MIN_DATA_POINTS — hardcoded intentionally for clarity

    // 4. Compute Pearson r
    const r = pearsonR(habitVector, eivVector);
    if (r === null) return null;

    // 5. HARD GATE 2: Minimum signal strength
    if (!applyHardGates(r, n)) return null;

    // 6. Descriptive statistics (for the insight card footnote and AI narration)
    const avgEivWhenCompleted = eivOnCompleted.length > 0
        ? eivOnCompleted.reduce((a, b) => a + b, 0) / eivOnCompleted.length
        : 0;

    const avgEivWhenMissed = eivOnMissed.length > 0
        ? eivOnMissed.reduce((a, b) => a + b, 0) / eivOnMissed.length
        : 0;

    return {
        habitId,
        habitName,
        r: parseFloat(r.toFixed(3)),
        n,
        lagDays,
        direction: getEIVDirection(r),
        avgEivWhenCompleted: parseFloat(avgEivWhenCompleted.toFixed(3)),
        avgEivWhenMissed: parseFloat(avgEivWhenMissed.toFixed(3)),
        completedCount: eivOnCompleted.length,
        missedCount: eivOnMissed.length,
        confidenceLabel: getConfidenceLabel(r),
        windowDays,
    };
};

// ─────────────────────────────────────────────────────────────
// Batch Runner
// ─────────────────────────────────────────────────────────────

/**
 * Run correlations for ALL of a user's active habits.
 * Tests both lag=0 (same-day) and lag=1 (next-day prediction).
 * Returns the top 3 results ranked by signal quality.
 *
 * This is the function called by:
 *   - The nightly compute Edge Function (Phase 4)
 *   - The on-demand trigger for beta testing
 */
export const runAllCorrelations = async (
    supabase: any,
    userId: string,
    windowDays: number = 90
): Promise<CorrelationResult[]> => {
    // Fetch all active habits for this user
    const { data: habits, error } = await supabase
        .from('habits')
        .select('id, name')
        .eq('user_id', userId)
        .is('deleted_at', null);

    if (error || !habits || habits.length === 0) return [];

    // Run all habit × lag combinations in parallel
    const tasks = habits.flatMap((h: { id: string; name: string }) => [
        computeHabitCorrelation(supabase, userId, h.id, h.name, 0, windowDays),
        computeHabitCorrelation(supabase, userId, h.id, h.name, 1, windowDays),
    ]);

    const results = await Promise.allSettled(tasks);

    // Collect non-null results, prefer lag=0 over lag=1 for same habit
    const valid: CorrelationResult[] = [];
    const seenHabits = new Set<string>();

    const allValid = results
        .filter((r): r is PromiseFulfilledResult<CorrelationResult | null> =>
            r.status === 'fulfilled' && r.value !== null
        )
        .map(r => r.value as CorrelationResult)
        .sort((a, b) => rankingScore(b.r, b.n) - rankingScore(a.r, a.n));

    // Deduplicate: one result per habit (best lag wins due to pre-sorting)
    for (const result of allValid) {
        if (!seenHabits.has(result.habitId)) {
            seenHabits.add(result.habitId);
            valid.push(result);
        }
    }

    // Return top 3 by ranking score
    return valid.slice(0, 3);
};

/**
 * Write a verified CorrelationResult to the correlation_snapshots table.
 * Only called AFTER both hard gates have passed.
 */
export const saveCorrelationSnapshot = async (
    supabase: any,
    userId: string,
    result: CorrelationResult
): Promise<void> => {
    const { error } = await (supabase as any)
        .from('correlation_snapshots')
        .upsert({
            user_id: userId,
            habit_id: result.habitId,
            habit_name: result.habitName,
            eiv_dimension: 'mean_eiv',
            r: result.r,
            n: result.n,
            lag_days: result.lagDays,
            direction: result.direction,
            avg_eiv_when_completed: result.avgEivWhenCompleted,
            avg_eiv_when_missed: result.avgEivWhenMissed,
            completed_count: result.completedCount,
            missed_count: result.missedCount,
            confidence_label: result.confidenceLabel,
            computed_at: new Date().toISOString(),
            insight_generated: false,
        }, {
            onConflict: 'user_id,habit_id,lag_days',
        });

    if (error) {
        console.error('[CorrelationService] Failed to save snapshot:', error);
    }
};

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

const getPreviousDateString = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
};
