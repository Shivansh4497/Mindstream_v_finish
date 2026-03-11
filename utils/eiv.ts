import type { GranularSentiment } from '../types';

/**
 * EIV (Emotional Intensity Vector) — static mapping of GranularSentiment to numeric score.
 *
 * Range: [-1.0, +1.0]
 * Positive = emotional wellbeing signal
 * Negative = emotional distress signal
 *
 * Values are STATIC and DETERMINISTIC — never AI-generated.
 * This makes every EIV score auditable and reproducible.
 *
 * Canonical values approved by the product architecture doc.
 * Do NOT change values without explicit CTO approval — changes
 * invalidate all historical correlation snapshots.
 */
export const EIV_MAP: Record<GranularSentiment, number> = {
    // Positive spectrum
    Joyful: +0.90,
    Grateful: +0.80,
    Proud: +0.75,
    Hopeful: +0.65,
    Content: +0.50,

    // Neutral / observational spectrum
    Reflective: +0.10,
    Inquisitive: +0.05,
    Observational: 0.00,

    // Negative spectrum
    Confused: -0.20,
    Anxious: -0.60,
    Frustrated: -0.65,
    Sad: -0.70,
    Overwhelmed: -0.80,
};

/**
 * Compute the Emotional Intensity Vector score for a given sentiment label.
 *
 * @param sentiment - A GranularSentiment label from the entry, or null/undefined if unscored.
 * @returns A float in [-1.0, +1.0], or null if the sentiment is missing.
 *          null means "exclude from aggregation" — do NOT default to 0.
 *          Including 0 for missing sentiments would bias correlations toward neutral.
 */
export const computeEIV = (sentiment: GranularSentiment | null | undefined): number | null => {
    if (!sentiment) return null;
    const score = EIV_MAP[sentiment];
    // Guard: if a new sentiment value is added to the type but not the map,
    // return null rather than undefined (which would corrupt numeric aggregations).
    return score !== undefined ? score : null;
};

/**
 * Returns a human-readable label for a given EIV score range.
 * Used in UI and AI narration context.
 */
export const getEIVLabel = (score: number): string => {
    if (score >= 0.70) return 'very positive';
    if (score >= 0.40) return 'positive';
    if (score >= 0.05) return 'slightly positive';
    if (score >= -0.05) return 'neutral';
    if (score >= -0.40) return 'slightly negative';
    if (score >= -0.65) return 'negative';
    return 'very negative';
};

/**
 * Returns the EIV direction string for AI narration.
 * 'positive' | 'negative' — used in correlation insight templates.
 */
export const getEIVDirection = (r: number): 'positive' | 'negative' => {
    return r >= 0 ? 'positive' : 'negative';
};
