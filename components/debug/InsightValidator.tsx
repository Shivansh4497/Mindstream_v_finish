
import React, { useState } from 'react';
import { generateInstantInsight } from '../../services/geminiService';
import {
    TEST_CASES,
    runFullEvaluation,
    EvaluationResult,
    EvaluationSummary,
    setJudgeConfig,
    JudgeModel
} from '../../services/insightEvaluator';

const MODEL_OPTIONS: { value: JudgeModel; label: string; placeholder: string; description: string }[] = [
    {
        value: 'gpt-4',
        label: 'GPT-4 (OpenAI)',
        placeholder: 'sk-...',
        description: 'Most objective evaluation. Requires OpenAI API credits.'
    },
    {
        value: 'claude',
        label: 'Claude (Anthropic)',
        placeholder: 'sk-ant-...',
        description: 'Strong alternative. Requires Anthropic API credits.'
    },
    {
        value: 'gemini',
        label: 'Gemini (Google)',
        placeholder: 'AIza...',
        description: 'Free option. Uses your existing Gemini key (less objective since same model).'
    },
];

export const InsightValidator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedModel, setSelectedModel] = useState<JudgeModel>('gemini');
    const [apiKey, setApiKey] = useState<string>('');
    const [results, setResults] = useState<EvaluationResult[]>([]);
    const [summary, setSummary] = useState<EvaluationSummary | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({ completed: 0, total: TEST_CASES.length });
    const [error, setError] = useState<string | null>(null);

    const currentModelOption = MODEL_OPTIONS.find(m => m.value === selectedModel)!;

    const runValidation = async () => {
        if (!apiKey.trim()) {
            setError('Please enter your API key');
            return;
        }

        // Set the judge configuration
        setJudgeConfig({
            model: selectedModel,
            apiKey: apiKey.trim()
        });

        setIsRunning(true);
        setResults([]);
        setSummary(null);
        setError(null);
        setProgress({ completed: 0, total: TEST_CASES.length });

        try {
            const evalSummary = await runFullEvaluation(
                generateInstantInsight,
                (completed, total) => {
                    setProgress({ completed, total });
                }
            );

            setSummary(evalSummary);
            setResults([...evalSummary.bestCases, ...evalSummary.worstCases]);
        } catch (e: any) {
            setError(e.message || 'Evaluation failed');
        } finally {
            setIsRunning(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 4.5) return 'text-green-400';
        if (score >= 4.0) return 'text-teal-400';
        if (score >= 3.0) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getPassBadge = (passed: boolean) => {
        return passed
            ? <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-bold">PASS</span>
            : <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-bold">FAIL</span>;
    };

    return (
        <div className="fixed inset-0 bg-mindstream-bg-primary z-50 overflow-y-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Insight Quality Evaluator</h1>
                        <p className="text-gray-400 text-sm">AI-powered evaluation of Gemini insights</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
                </div>

                {/* Model Selector */}
                <div className="bg-mindstream-bg-surface rounded-xl p-4 mb-4 border border-gray-800">
                    <label className="block text-gray-400 text-sm mb-2">Select Judge Model</label>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {MODEL_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedModel(option.value)}
                                className={`p-3 rounded-lg border transition-all text-left ${selectedModel === option.value
                                        ? 'border-brand-teal bg-brand-teal/10 text-white'
                                        : 'border-gray-700 bg-mindstream-bg-elevated text-gray-400 hover:border-gray-500'
                                    }`}
                            >
                                <div className="font-medium text-sm">{option.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* API Key Input */}
                <div className="bg-mindstream-bg-surface rounded-xl p-4 mb-6 border border-gray-800">
                    <label className="block text-gray-400 text-sm mb-2">
                        {currentModelOption.label} API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={currentModelOption.placeholder}
                        className="w-full bg-mindstream-bg-elevated border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                    <p className="text-gray-500 text-xs mt-2">Your key is only stored in memory and never sent to our servers.</p>
                </div>

                {/* Controls */}
                <div className="mb-8 flex gap-4 items-center">
                    <button
                        onClick={runValidation}
                        disabled={isRunning || !apiKey}
                        className={`px-6 py-3 rounded-lg font-bold ${isRunning || !apiKey ? 'bg-gray-700 text-gray-400' : 'bg-brand-teal text-black hover:bg-teal-400'}`}
                    >
                        {isRunning ? `Running (${progress.completed}/${progress.total})...` : '🔬 Run Full Evaluation'}
                    </button>
                    <span className="text-gray-500 text-sm">
                        {TEST_CASES.length} test cases • ~{Math.ceil(TEST_CASES.length * 2 / 60)} min
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-8">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Summary Dashboard */}
                {summary && (
                    <div className="bg-mindstream-bg-surface rounded-xl p-6 mb-8 border border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">📊 Evaluation Summary</h2>
                            <span className="text-sm text-gray-400 bg-mindstream-bg-elevated px-3 py-1 rounded-full">
                                Judge: {summary.judgeModel.toUpperCase()}
                            </span>
                        </div>

                        {/* Overall Status */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-mindstream-bg-elevated p-4 rounded-lg text-center">
                                <div className={`text-3xl font-bold ${getScoreColor(summary.averageScore)}`}>
                                    {summary.averageScore.toFixed(2)}
                                </div>
                                <div className="text-gray-400 text-sm">Average Score</div>
                            </div>
                            <div className="bg-mindstream-bg-elevated p-4 rounded-lg text-center">
                                <div className={`text-3xl font-bold ${summary.passedCases >= summary.totalCases * 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {summary.passedCases}/{summary.totalCases}
                                </div>
                                <div className="text-gray-400 text-sm">Cases Passed</div>
                            </div>
                            <div className="bg-mindstream-bg-elevated p-4 rounded-lg text-center">
                                <div className={`text-3xl font-bold ${summary.averageScore >= 4.0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {summary.averageScore >= 4.0 ? '✅' : '❌'}
                                </div>
                                <div className="text-gray-400 text-sm">Gate Status</div>
                            </div>
                            <div className="bg-mindstream-bg-elevated p-4 rounded-lg text-center">
                                <div className="text-3xl font-bold text-gray-300">
                                    {Object.keys(summary.failureModes).length}
                                </div>
                                <div className="text-gray-400 text-sm">Failure Modes</div>
                            </div>
                        </div>

                        {/* Scores by Criterion */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">Scores by Criterion</h3>
                            <div className="grid grid-cols-5 gap-2">
                                {Object.entries(summary.scoresByCriterion).map(([criterion, score]) => (
                                    <div key={criterion} className="bg-mindstream-bg-elevated p-3 rounded text-center">
                                        <div className={`text-xl font-bold ${getScoreColor(score as number)}`}>
                                            {(score as number).toFixed(1)}
                                        </div>
                                        <div className="text-gray-500 text-xs capitalize">
                                            {criterion.replace('_', ' ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scores by Category */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">Scores by Category</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(summary.scoresByCategory).map(([category, score]) => (
                                    <div key={category} className="bg-mindstream-bg-elevated px-4 py-2 rounded-full flex items-center gap-2">
                                        <span className="text-gray-400 text-sm capitalize">{category.replace('_', ' ')}</span>
                                        <span className={`font-bold ${getScoreColor(score as number)}`}>{(score as number).toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Failure Modes */}
                        {Object.keys(summary.failureModes).length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-red-400 mb-3">⚠️ Detected Failure Modes</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(summary.failureModes).map(([mode, count]) => (
                                        <div key={mode} className="bg-red-900/30 border border-red-500/30 px-3 py-1 rounded-full text-red-300 text-sm">
                                            {mode}: {count}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Results List */}
                {results.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">📋 Detailed Results (Best & Worst)</h2>
                        <div className="space-y-4">
                            {results.map((res, idx) => (
                                <div key={idx} className={`bg-mindstream-bg-surface p-4 rounded-lg border ${res.passed ? 'border-green-800/50' : 'border-red-800/50'}`}>
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {getPassBadge(res.passed)}
                                            <span className="text-sm text-gray-400">
                                                {res.testCase.category} • {res.testCase.sentiment}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg font-bold ${getScoreColor(res.averageScore)}`}>
                                                {res.averageScore.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-gray-500">{res.latencyMs}ms</span>
                                        </div>
                                    </div>

                                    {/* Entry */}
                                    <p className="text-white mb-3 p-3 bg-mindstream-bg-elevated rounded italic">
                                        "{res.testCase.entry.slice(0, 200)}{res.testCase.entry.length > 200 ? '...' : ''}"
                                    </p>

                                    {/* Insight & Question */}
                                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                                        <div className="bg-mindstream-bg-elevated p-3 rounded border-l-4 border-brand-teal">
                                            <span className="text-xs text-brand-teal uppercase font-bold block mb-1">Insight</span>
                                            <p className="text-gray-200 text-sm">{res.insight.insight}</p>
                                        </div>
                                        <div className="bg-mindstream-bg-elevated p-3 rounded border-l-4 border-purple-500">
                                            <span className="text-xs text-purple-400 uppercase font-bold block mb-1">Follow-up</span>
                                            <p className="text-gray-200 text-sm">{res.insight.followUpQuestion}</p>
                                        </div>
                                    </div>

                                    {/* Scores */}
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {Object.entries({
                                            relevance: res.scores.relevance,
                                            specificity: res.scores.specificity,
                                            actionability: res.scores.actionability,
                                            empathy: res.scores.empathy,
                                            follow_up: res.scores.follow_up_quality
                                        }).map(([key, val]) => (
                                            <div
                                                key={key}
                                                className={`px-2 py-1 rounded ${val.score >= 4 ? 'bg-green-900/30 text-green-400' : val.score >= 3 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}
                                                title={val.reasoning}
                                            >
                                                {key.replace('_', ' ')}: {val.score}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Failure Mode */}
                                    {res.scores.failure_mode && (
                                        <div className="mt-2 text-red-400 text-sm">
                                            ⚠️ Failure mode: <strong>{res.scores.failure_mode}</strong>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
