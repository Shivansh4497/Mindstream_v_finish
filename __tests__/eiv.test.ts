import { describe, it, expect } from 'vitest';
import { computeEIV, EIV_MAP, getEIVLabel, getEIVDirection } from '../utils/eiv';
import type { GranularSentiment } from '../types';

// ─────────────────────────────────────────────────────────────
// computeEIV() — the core scoring function
// ─────────────────────────────────────────────────────────────

describe('computeEIV', () => {
    it('returns correct score for every positive GranularSentiment', () => {
        expect(computeEIV('Joyful')).toBe(0.90);
        expect(computeEIV('Grateful')).toBe(0.80);
        expect(computeEIV('Proud')).toBe(0.75);
        expect(computeEIV('Hopeful')).toBe(0.65);
        expect(computeEIV('Content')).toBe(0.50);
    });

    it('returns correct score for neutral/observational GranularSentiment', () => {
        expect(computeEIV('Reflective')).toBe(0.10);
        expect(computeEIV('Inquisitive')).toBe(0.05);
        expect(computeEIV('Observational')).toBe(0.00);
    });

    it('returns correct score for every negative GranularSentiment', () => {
        expect(computeEIV('Confused')).toBe(-0.20);
        expect(computeEIV('Anxious')).toBe(-0.60);
        expect(computeEIV('Frustrated')).toBe(-0.65);
        expect(computeEIV('Sad')).toBe(-0.70);
        expect(computeEIV('Overwhelmed')).toBe(-0.80);
    });

    it('returns null for null sentiment — null means exclude, not neutral', () => {
        expect(computeEIV(null)).toBeNull();
    });

    it('returns null for undefined sentiment', () => {
        expect(computeEIV(undefined)).toBeNull();
    });

    it('all returned scores are within [-1.0, +1.0] range', () => {
        const allSentiments = Object.keys(EIV_MAP) as GranularSentiment[];
        allSentiments.forEach((sentiment) => {
            const score = computeEIV(sentiment);
            expect(score).not.toBeNull();
            expect(score!).toBeGreaterThanOrEqual(-1.0);
            expect(score!).toBeLessThanOrEqual(1.0);
        });
    });

    it('EIV_MAP covers all 13 GranularSentiment values', () => {
        const allSentiments: GranularSentiment[] = [
            'Joyful', 'Grateful', 'Proud', 'Hopeful', 'Content',
            'Reflective', 'Inquisitive', 'Observational',
            'Confused', 'Anxious', 'Frustrated', 'Sad', 'Overwhelmed',
        ];
        allSentiments.forEach((sentiment) => {
            expect(EIV_MAP[sentiment]).toBeDefined();
        });
    });
});

// ─────────────────────────────────────────────────────────────
// getEIVLabel() — human-readable label bands
// ─────────────────────────────────────────────────────────────

describe('getEIVLabel', () => {
    it('labels very positive scores correctly', () => {
        expect(getEIVLabel(0.90)).toBe('very positive');
        expect(getEIVLabel(0.70)).toBe('very positive');
    });

    it('labels positive scores correctly', () => {
        expect(getEIVLabel(0.65)).toBe('positive');
        expect(getEIVLabel(0.40)).toBe('positive');
    });

    it('labels slightly positive correctly', () => {
        expect(getEIVLabel(0.10)).toBe('slightly positive');
    });

    it('labels neutral correctly', () => {
        expect(getEIVLabel(0.00)).toBe('neutral');
    });

    it('labels negative scores correctly', () => {
        expect(getEIVLabel(-0.60)).toBe('negative');
    });

    it('labels very negative scores correctly', () => {
        expect(getEIVLabel(-0.80)).toBe('very negative');
    });
});

// ─────────────────────────────────────────────────────────────
// getEIVDirection()
// ─────────────────────────────────────────────────────────────

describe('getEIVDirection', () => {
    it('returns positive for positive r', () => {
        expect(getEIVDirection(0.45)).toBe('positive');
    });

    it('returns positive for zero r (convention: zero is positive direction)', () => {
        expect(getEIVDirection(0)).toBe('positive');
    });

    it('returns negative for negative r', () => {
        expect(getEIVDirection(-0.42)).toBe('negative');
    });
});
