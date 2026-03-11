import { describe, it, expect } from 'vitest';
import {
    pearsonR,
    applyHardGates,
    getConfidenceLabel,
    rankingScore,
    MIN_DATA_POINTS,
    MIN_CORRELATION_STRENGTH,
} from '../utils/correlation';

// ─────────────────────────────────────────────────────────────
// pearsonR()
// ─────────────────────────────────────────────────────────────

describe('pearsonR', () => {
    it('returns 1.0 for perfect positive correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [1, 2, 3, 4, 5];
        const r = pearsonR(x, y);
        expect(r).not.toBeNull();
        expect(r!).toBeCloseTo(1.0, 5);
    });

    it('returns -1.0 for perfect negative correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [5, 4, 3, 2, 1];
        const r = pearsonR(x, y);
        expect(r).not.toBeNull();
        expect(r!).toBeCloseTo(-1.0, 5);
    });

    it('returns null for zero-variance data (constant y = no signal)', () => {
        // Constant EIV means no mood variation — undefined correlation, not zero
        const x = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
        const y = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
        expect(pearsonR(x, y)).toBeNull();
    });

    it('returns a real correlation for real-world-like data', () => {
        // Simulate: habit done on days 1,2,4,5,7 → mood tends to be positive those days
        const completions = [1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0];
        const moods = [0.7, 0.8, -0.3, 0.6, 0.9, -0.5, 0.7, -0.2, -0.4, 0.8, 0.7, -0.6, 0.6, 0.8, -0.3, 0.7, -0.2, 0.8, 0.7, -0.4];
        const r = pearsonR(completions, moods);
        expect(r).not.toBeNull();
        // Should show positive correlation (higher completions → higher mood)
        expect(r!).toBeGreaterThan(0.5);
    });

    it('returns null for mismatched array lengths', () => {
        expect(pearsonR([1, 2, 3], [1, 2])).toBeNull();
    });

    it('returns null for array length < 2', () => {
        expect(pearsonR([1], [1])).toBeNull();
        expect(pearsonR([], [])).toBeNull();
    });

    it('returns null for constant x array (zero std dev)', () => {
        // All completions the same → no variance → no correlation possible
        expect(pearsonR([1, 1, 1, 1, 1], [0.1, 0.5, -0.3, 0.8, -0.6])).toBeNull();
    });

    it('returns null for constant y array (zero std dev)', () => {
        expect(pearsonR([1, 0, 1, 0, 1], [0.5, 0.5, 0.5, 0.5, 0.5])).toBeNull();
    });

    it('result is always within [-1.0, +1.0]', () => {
        // Test with many random-ish arrays to check clamping
        const arrays = [
            [[1, 2, 3, 4, 5], [2, 4, 6, 8, 10]],
            [[5, 4, 3, 2, 1], [1, 2, 3, 4, 5]],
            [[0, 1, 0, 1, 0], [0.1, 0.9, -0.1, 0.8, 0.2]],
        ];
        arrays.forEach(([x, y]) => {
            const r = pearsonR(x, y);
            if (r !== null) {
                expect(r).toBeGreaterThanOrEqual(-1.0);
                expect(r).toBeLessThanOrEqual(1.0);
            }
        });
    });
});

// ─────────────────────────────────────────────────────────────
// applyHardGates()
// ─────────────────────────────────────────────────────────────

describe('applyHardGates', () => {
    it('passes when both gates are met', () => {
        expect(applyHardGates(0.45, 20)).toBe(true);
        expect(applyHardGates(-0.55, 30)).toBe(true);
    });

    it('fails when n < MIN_DATA_POINTS', () => {
        expect(applyHardGates(0.80, MIN_DATA_POINTS - 1)).toBe(false);
        expect(applyHardGates(0.99, 5)).toBe(false);
    });

    it('fails when |r| < MIN_CORRELATION_STRENGTH', () => {
        expect(applyHardGates(0.10, 50)).toBe(false);
        expect(applyHardGates(-0.15, 30)).toBe(false);
    });

    it('passes exactly at the minimum thresholds', () => {
        expect(applyHardGates(MIN_CORRELATION_STRENGTH, MIN_DATA_POINTS)).toBe(true);
        expect(applyHardGates(-MIN_CORRELATION_STRENGTH, MIN_DATA_POINTS)).toBe(true);
    });

    it('fails just below minimum thresholds', () => {
        expect(applyHardGates(MIN_CORRELATION_STRENGTH - 0.001, MIN_DATA_POINTS)).toBe(false);
        expect(applyHardGates(MIN_CORRELATION_STRENGTH, MIN_DATA_POINTS - 1)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────
// getConfidenceLabel()
// ─────────────────────────────────────────────────────────────

describe('getConfidenceLabel', () => {
    it('returns moderate for |r| in [0.30, 0.50)', () => {
        expect(getConfidenceLabel(0.30)).toBe('moderate');
        expect(getConfidenceLabel(0.49)).toBe('moderate');
        expect(getConfidenceLabel(-0.40)).toBe('moderate');
    });
    it('returns strong for |r| in [0.50, 0.70)', () => {
        expect(getConfidenceLabel(0.50)).toBe('strong');
        expect(getConfidenceLabel(0.65)).toBe('strong');
    });
    it('returns very strong for |r| >= 0.70', () => {
        expect(getConfidenceLabel(0.70)).toBe('very strong');
        expect(getConfidenceLabel(0.95)).toBe('very strong');
        expect(getConfidenceLabel(-0.80)).toBe('very strong');
    });
});

// ─────────────────────────────────────────────────────────────
// rankingScore()
// ─────────────────────────────────────────────────────────────

describe('rankingScore', () => {
    it('higher |r| scores higher (same n)', () => {
        expect(rankingScore(0.80, 30)).toBeGreaterThan(rankingScore(0.40, 30));
    });
    it('higher n scores higher (same r)', () => {
        expect(rankingScore(0.50, 100)).toBeGreaterThan(rankingScore(0.50, 14));
    });
    it('negative r ranks same as equivalent positive r', () => {
        expect(rankingScore(-0.60, 20)).toBeCloseTo(rankingScore(0.60, 20), 5);
    });
});
