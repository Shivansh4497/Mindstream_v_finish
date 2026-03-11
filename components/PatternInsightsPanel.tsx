import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, BarChart2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { runAllCorrelations, type CorrelationResult } from '../services/correlationService';
import { runNarrationPipeline, type NarratedInsight } from '../services/narrationService';
import type { Habit, Entry, HabitLog } from '../types';

interface PatternInsightsPanelProps {
    habits: Habit[];
    entries: Entry[];
    habitLogs: HabitLog[];
}

type PipelineStatus = 'idle' | 'computing' | 'narrating' | 'done' | 'insufficient_data' | 'error';

const MIN_ENTRIES_TO_RUN = 14;

export const PatternInsightsPanel: React.FC<PatternInsightsPanelProps> = ({
    habits, entries,
}) => {
    const { user } = useAuth();
    const [status, setStatus] = useState<PipelineStatus>('idle');
    const [insights, setInsights] = useState<NarratedInsight[]>([]);
    const [rawResults, setRawResults] = useState<CorrelationResult[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Count entries with EIV scores — these are the "signal" we can use for correlation
    const scoredEntryCount = entries.filter(e => e.eiv_score !== null && e.eiv_score !== undefined).length;
    const hasEnoughData = scoredEntryCount >= MIN_ENTRIES_TO_RUN && habits.length >= 1;

    const handleRunAnalysis = useCallback(async () => {
        if (!user || !supabase) return;
        setStatus('computing');
        setInsights([]);
        setRawResults([]);
        setErrorMessage(null);

        try {
            // Stage 1: Pure TypeScript correlation math
            const correlations = await runAllCorrelations(supabase, user.id, 90);

            if (correlations.length === 0) {
                setStatus('insufficient_data');
                return;
            }

            setRawResults(correlations);
            setStatus('narrating');

            // Stage 2: AI narrates the verified numbers
            const narrated = await runNarrationPipeline(supabase, user.id, correlations);
            setInsights(narrated);
            setStatus('done');
        } catch (err: any) {
            console.error('[PatternInsightsPanel] Pipeline failed:', err);
            setErrorMessage(err?.message || 'Analysis failed. Please try again.');
            setStatus('error');
        }
    }, [user]);

    const directionIcon = (direction: 'positive' | 'negative') =>
        direction === 'positive'
            ? <TrendingUp className="w-4 h-4 text-brand-teal" />
            : <TrendingDown className="w-4 h-4 text-red-400" />;

    const confidenceColor = (label: 'moderate' | 'strong' | 'very strong') => {
        if (label === 'very strong') return 'text-brand-teal';
        if (label === 'strong') return 'text-blue-400';
        return 'text-gray-400';
    };

    // ─── Not enough data state ─────────────────────────────────────────────────
    if (!hasEnoughData) {
        return (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-teal/10 flex items-center justify-center">
                    <BarChart2 className="w-7 h-7 text-brand-teal/60" />
                </div>
                <div>
                    <h3 className="text-white font-semibold mb-1">Building Your Baseline</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {habits.length === 0
                            ? 'Add at least one habit to track.'
                            : `${scoredEntryCount} of ${MIN_ENTRIES_TO_RUN} mood entries needed. Keep journaling — pattern analysis unlocks automatically.`}
                    </p>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
                    <div
                        className="bg-brand-teal/60 h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (scoredEntryCount / MIN_ENTRIES_TO_RUN) * 100)}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500">{scoredEntryCount}/{MIN_ENTRIES_TO_RUN} mood entries scored</p>
            </div>
        );
    }

    // ─── Idle state ────────────────────────────────────────────────────────────
    if (status === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    <Zap className="w-8 h-8 text-brand-teal" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg mb-2">Find Your Patterns</h3>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                        Analyze {scoredEntryCount} mood entries across {habits.length} habit{habits.length > 1 ? 's' : ''} to discover statistically verified behavioral correlations.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-left w-full max-w-xs">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">How it works</p>
                    <div className="space-y-1.5">
                        {['TypeScript math finds real patterns (Pearson r)', 'Hard gates: n ≥ 14 days, |r| ≥ 0.30', 'AI narrates only verified findings'].map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="text-brand-teal text-xs mt-0.5">✓</span>
                                <span className="text-gray-400 text-xs">{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleRunAnalysis}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-brand-indigo font-bold rounded-xl hover:bg-brand-teal/90 active:scale-95 transition-all"
                >
                    <BarChart2 className="w-4 h-4" />
                    Run Pattern Analysis
                </button>
            </div>
        );
    }

    // ─── Loading states ────────────────────────────────────────────────────────
    if (status === 'computing' || status === 'narrating') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-brand-teal/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-white font-semibold">
                        {status === 'computing' ? 'Computing correlations...' : 'Narrating findings...'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        {status === 'computing'
                            ? `Analyzing ${scoredEntryCount} mood data points`
                            : `AI received only statistics — no journal text`}
                    </p>
                </div>
            </div>
        );
    }

    // ─── Error state ───────────────────────────────────────────────────────────
    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <div>
                    <p className="text-white font-semibold">Analysis failed</p>
                    <p className="text-gray-400 text-sm mt-1">{errorMessage}</p>
                </div>
                <button
                    onClick={() => setStatus('idle')}
                    className="text-sm text-brand-teal underline underline-offset-2"
                >
                    Try again
                </button>
            </div>
        );
    }

    // ─── Insufficient data after computation ───────────────────────────────────
    if (status === 'insufficient_data') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                <BarChart2 className="w-10 h-10 text-gray-500" />
                <div>
                    <p className="text-white font-semibold">No significant patterns yet</p>
                    <p className="text-gray-400 text-sm mt-1 max-w-xs">
                        The math didn't find correlations strong enough to surface (r &lt; 0.30 or n &lt; 14).
                        Keep tracking — patterns emerge over time.
                    </p>
                </div>
                <button onClick={() => setStatus('idle')} className="text-sm text-brand-teal underline underline-offset-2">
                    Run again
                </button>
            </div>
        );
    }

    // ─── Done state — show results ─────────────────────────────────────────────
    return (
        <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Verified Patterns</p>
                    <p className="text-white font-semibold">{insights.length} insight{insights.length !== 1 ? 's' : ''} found</p>
                </div>
                <button
                    onClick={handleRunAnalysis}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-colors border border-white/10"
                >
                    <RefreshCw className="w-3 h-3" />
                    Re-run
                </button>
            </div>

            <AnimatePresence>
                {insights.map((insight, i) => {
                    const r = insight.correlationResult;
                    return (
                        <motion.div
                            key={`${r.habitId}-${r.lagDays}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="rounded-2xl border border-white/10 bg-gray-800/50 overflow-hidden"
                        >
                            {/* Card header */}
                            <div className="p-4 pb-3 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{insight.emoji}</span>
                                    <div>
                                        <p className="text-white font-semibold text-sm leading-snug">{insight.title}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{r.habitName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {directionIcon(r.direction)}
                                    <span className={`text-xs font-bold ${r.direction === 'positive' ? 'text-brand-teal' : 'text-red-400'}`}>
                                        {r.direction === 'positive' ? '+' : ''}{((r.avgEivWhenCompleted - r.avgEivWhenMissed) * 100).toFixed(0)}pts
                                    </span>
                                </div>
                            </div>

                            {/* The AI-narrated sentence */}
                            <div className="px-4 pb-3">
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {insight.insight}
                                </p>
                            </div>

                            {/* Statistical footnote */}
                            <div className="px-4 py-2.5 bg-black/20 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">
                                        r = <span className="text-gray-300 font-mono">{r.r > 0 ? '+' : ''}{r.r}</span>
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        n = <span className="text-gray-300 font-mono">{r.n}</span> days
                                    </span>
                                    {r.lagDays === 1 && (
                                        <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">next-day</span>
                                    )}
                                </div>
                                <span className={`text-xs font-medium capitalize ${confidenceColor(r.confidenceLabel)}`}>
                                    {r.confidenceLabel}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Raw results without narration — show if narration partially failed */}
            {rawResults.length > insights.length && (
                <div className="mt-2 p-3 bg-white/3 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500">
                        {rawResults.length - insights.length} additional pattern{rawResults.length - insights.length > 1 ? 's' : ''} detected but narration is unavailable right now.
                    </p>
                </div>
            )}
        </div>
    );
};
