/**
 * Pearson Correlation Engine — pure TypeScript, zero AI, zero external calls.
 *
 * This is the statistical core of the behavioral pattern engine.
 * The hard gates (n ≥ 14, |r| ≥ 0.30) are enforced in TypeScript, NEVER in a prompt.
 */

// ─────────────────────────────────────────────────────────────
// Hard Gate Constants (do not change without CTO approval)
// ─────────────────────────────────────────────────────────────

/** Minimum number of aligned data points required before computing a correlation. */
export const MIN_DATA_POINTS = 14;

/** Minimum absolute Pearson r required before surfacing an insight. */
export const MIN_CORRELATION_STRENGTH = 0.30;

// ─────────────────────────────────────────────────────────────
// Core Math
// ─────────────────────────────────────────────────────────────

/**
 * Compute the Pearson correlation coefficient between two numeric arrays.
 *
 * @returns r in [-1.0, +1.0], or null if:
 *   - Arrays have different lengths
 *   - Array length < 2 (can't compute std dev)
 *   - Standard deviation of either array is zero (constant array — no signal)
 */
export const pearsonR = (x: number[], y: number[]): number | null => {
    if (x.length !== y.length) return null;
    if (x.length < 2) return null;

    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        numerator += dx * dy;
        sumSqX += dx * dx;
        sumSqY += dy * dy;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);

    // Guard against division by zero (constant array = zero std dev = no signal)
    if (denominator === 0) return null;

    // Clamp to [-1, 1] to handle floating-point drift
    return Math.max(-1, Math.min(1, numerator / denominator));
};

// ─────────────────────────────────────────────────────────────
// Gate Enforcement
// ─────────────────────────────────────────────────────────────

/**
 * Apply both hard gates. Returns null if either gate fails.
 * This is the only function that should decide whether a correlation is surfaced.
 *
 * Gate 1: n ≥ MIN_DATA_POINTS (minimum signal size)
 * Gate 2: |r| ≥ MIN_CORRELATION_STRENGTH (minimum signal strength)
 */
export const applyHardGates = (r: number, n: number): boolean => {
    if (n < MIN_DATA_POINTS) return false;
    if (Math.abs(r) < MIN_CORRELATION_STRENGTH) return false;
    return true;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Confidence label based on |r| value.
 * Used in insight card statistical footnotes.
 */
export const getConfidenceLabel = (r: number): 'moderate' | 'strong' | 'very strong' => {
    const abs = Math.abs(r);
    if (abs >= 0.70) return 'very strong';
    if (abs >= 0.50) return 'strong';
    return 'moderate';
};

/**
 * Ranking score for sorting correlation results by quality.
 * Balances signal strength (|r|) against statistical confidence (log of n).
 * A weak r with many data points can outrank a strong r with few points.
 */
export const rankingScore = (r: number, n: number): number => {
    return Math.abs(r) * Math.log10(n);
};
