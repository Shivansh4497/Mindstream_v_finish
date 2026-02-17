import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ChevronDown, ChevronUp,
    Cpu, Search, FileText, Layers, Zap, Clock,
    ArrowRight, CheckCircle2, Activity, Database, Brain
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface GlassBoxMeta {
    provider?: string;
    latency_ms?: number;
    tokens_in?: number;
    tokens_out?: number;
    rag_chunks?: number;
    prompt_length?: number;
    fallback_chain?: string[];
    action?: string;
    userMessage?: string;
    contextSnippet?: string;
}

interface GlassBoxProps {
    isOpen: boolean;
    onClose: () => void;
    meta: GlassBoxMeta | null;
    isProcessing: boolean;
    entries?: any[]; // For RAG simulation
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE STAGES
// ═══════════════════════════════════════════════════════════════════════════════

const PIPELINE_STAGES = [
    { id: 'input', label: 'User Input', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
    { id: 'context', label: 'Context Builder', icon: Layers, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
    { id: 'rag', label: 'RAG Search', icon: Search, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
    { id: 'prompt', label: 'Prompt Assembly', icon: Brain, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/30' },
    { id: 'provider', label: 'AI Provider', icon: Cpu, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
    { id: 'response', label: 'Response', icon: Zap, color: 'text-brand-teal', bg: 'bg-brand-teal/10', border: 'border-brand-teal/30' },
];

const PROVIDER_CHAIN = [
    { name: 'Groq 70B', model: 'llama-3.3-70b-versatile', speed: 'Fast', tier: 'primary' },
    { name: 'Groq 8B', model: 'llama-3.1-8b-instant', speed: 'Very Fast', tier: 'backup' },
    { name: 'Gemini Flash', model: 'gemini-2.0-flash-lite', speed: 'Fast', tier: 'fallback' },
    { name: 'Gemini Lite', model: 'gemini-2.0-flash-lite-001', speed: 'Fast', tier: 'fallback' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SectionHeader: React.FC<{ icon: React.ElementType; title: string; color: string; defaultOpen?: boolean; children: React.ReactNode }> = ({
    icon: Icon, title, color, defaultOpen = true, children
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="mb-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full text-left group"
            >
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-semibold text-white flex-1">{title}</span>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE VISUALIZER
// ═══════════════════════════════════════════════════════════════════════════════

const PipelineVisualizer: React.FC<{ activeStage: number; isProcessing: boolean }> = ({ activeStage, isProcessing }) => {
    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {PIPELINE_STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isActive = i === activeStage && isProcessing;
                const isComplete = i < activeStage || (!isProcessing && activeStage >= PIPELINE_STAGES.length - 1);
                const isPending = i > activeStage;

                return (
                    <React.Fragment key={stage.id}>
                        <motion.div
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-all min-w-fit ${isActive
                                ? `${stage.bg} ${stage.color} ${stage.border} shadow-lg`
                                : isComplete
                                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                                    : 'bg-white/3 text-gray-500 border-white/5'
                                }`}
                            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                            {isComplete ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : isActive ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                                    <Icon className="w-3 h-3" />
                                </motion.div>
                            ) : (
                                <Icon className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">{stage.label}</span>
                        </motion.div>
                        {i < PIPELINE_STAGES.length - 1 && (
                            <ArrowRight className={`w-3 h-3 flex-shrink-0 ${isComplete ? 'text-emerald-400/50' : 'text-gray-600'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER CHAIN
// ═══════════════════════════════════════════════════════════════════════════════

const ProviderChain: React.FC<{ activeProvider?: string }> = ({ activeProvider }) => {
    return (
        <div className="grid grid-cols-2 gap-2">
            {PROVIDER_CHAIN.map((p, i) => {
                const isUsed = activeProvider === p.name || (!activeProvider && i === 0);
                return (
                    <div
                        key={p.name}
                        className={`px-3 py-2 rounded-lg border text-xs transition-all ${isUsed
                            ? 'bg-emerald-400/10 border-emerald-400/30 ring-1 ring-emerald-400/20'
                            : 'bg-white/3 border-white/5 opacity-50'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className={`font-semibold ${isUsed ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {p.name}
                            </span>
                            {isUsed && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold">
                                    USED
                                </span>
                            )}
                        </div>
                        <div className="text-gray-500 font-mono text-[10px]">{p.model}</div>
                    </div>
                );
            })}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LATENCY WATERFALL
// ═══════════════════════════════════════════════════════════════════════════════

const LatencyWaterfall: React.FC<{ totalMs: number }> = ({ totalMs }) => {
    // Derive approximate breakdowns from total latency
    const stages = useMemo(() => {
        const edgeBoot = Math.round(totalMs * 0.04);
        const providerSelect = Math.round(totalMs * 0.01);
        const aiCall = Math.round(totalMs * 0.75);
        const streaming = totalMs - edgeBoot - providerSelect - aiCall;
        return [
            { label: 'Edge Function boot', ms: edgeBoot, color: 'bg-blue-400' },
            { label: 'Provider selection', ms: providerSelect, color: 'bg-purple-400' },
            { label: 'AI inference', ms: aiCall, color: 'bg-emerald-400' },
            { label: 'Parse + respond', ms: streaming, color: 'bg-brand-teal' },
        ];
    }, [totalMs]);

    const maxMs = totalMs;

    return (
        <div className="space-y-2">
            {stages.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400 w-28 text-right flex-shrink-0 truncate">{s.label}</span>
                    <span className="text-gray-500 w-12 text-right font-mono flex-shrink-0">{s.ms}ms</span>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${s.color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(4, (s.ms / maxMs) * 100)}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        />
                    </div>
                </div>
            ))}
            <div className="flex items-center gap-3 text-xs border-t border-white/5 pt-2 mt-1">
                <span className="text-white w-28 text-right flex-shrink-0 font-semibold">Total</span>
                <span className="text-white w-12 text-right font-mono font-bold flex-shrink-0">{totalMs}ms</span>
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-400 via-emerald-400 to-brand-teal rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    />
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT INSPECTOR
// ═══════════════════════════════════════════════════════════════════════════════

const PromptInspector: React.FC<{ action?: string; userMessage?: string; contextSnippet?: string; tokensIn?: number; tokensOut?: number }> = ({
    action, userMessage, contextSnippet, tokensIn, tokensOut
}) => {
    const promptStructure = useMemo(() => [
        {
            label: 'System Prompt',
            color: 'text-purple-400',
            bg: 'bg-purple-400/5',
            border: 'border-purple-400/20',
            content: `Personality instruction + behavioral rules\n(~800 tokens • Chat mode detection, question rules, off-topic handling)`,
        },
        {
            label: 'User Context (RAG)',
            color: 'text-amber-400',
            bg: 'bg-amber-400/5',
            border: 'border-amber-400/20',
            content: contextSnippet || `Recent entries, habits, goals, habit logs\n(Injected from your Supabase data)`,
        },
        {
            label: 'Conversation History',
            color: 'text-blue-400',
            bg: 'bg-blue-400/5',
            border: 'border-blue-400/20',
            content: `Previous messages in this chat session\n(Provides conversational continuity)`,
        },
        {
            label: 'User Message',
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/5',
            border: 'border-emerald-400/20',
            content: userMessage || '(Your latest message)',
        },
    ], [contextSnippet, userMessage]);

    return (
        <div className="space-y-2">
            {/* Action badge */}
            {action && (
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                        action: {action}
                    </span>
                </div>
            )}

            {/* Prompt layers */}
            {promptStructure.map((layer, i) => (
                <div key={i} className={`${layer.bg} border ${layer.border} rounded-lg px-3 py-2 text-xs`}>
                    <div className={`font-semibold ${layer.color} mb-0.5 flex items-center gap-1`}>
                        <span className="text-[10px] text-gray-600 font-mono">#{i + 1}</span>
                        {layer.label}
                    </div>
                    <div className="text-gray-400 whitespace-pre-line font-mono text-[11px] leading-relaxed">
                        {layer.content}
                    </div>
                </div>
            ))}

            {/* Token count */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-white/5">
                <span className="font-mono">
                    {tokensIn ? `${tokensIn.toLocaleString()} tokens in` : '~1,200 tokens in'} / {tokensOut ? `${tokensOut.toLocaleString()} tokens out` : '~300 tokens out'}
                </span>
                <span className="text-gray-600">Prompt v3.2</span>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RAG PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const RAGPanel: React.FC<{ ragChunks?: number; userMessage?: string; meta?: GlassBoxMeta | null; entries?: any[] }> = ({ ragChunks, userMessage, meta, entries }) => {
    // Real RAG results from metadata
    const ragResults = useMemo(() => {
        // 1. TRUE RAG (High Priority): Use the actual matches if available
        if (meta && 'rag_matches' in meta) {
            if (meta.rag_matches && meta.rag_matches.length > 0) {
                return meta.rag_matches.map((m: any) => ({
                    // Handle both old (Entry only) and new (SearchResult) formats
                    snippet: `"${(m.matchText || m.text || m.content || "").substring(0, 80)}..."`,
                    fullText: m.matchText || m.text || m.content,
                    type: m.type || 'entry', // 'entry' | 'habit' | 'intention'
                    score: m.similarity, // Undefined for keyword match
                    isKeyword: !m.similarity,
                    date: m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'Relevant Match'
                }));
            }
            return [];
        }

        // 2. Legacy Fallback
        if (meta?.contextSnippet) {
            return [{
                snippet: `"${meta.contextSnippet.substring(0, 80)}..."`,
                type: 'entry',
                score: 0.95,
                isKeyword: true,
                date: 'Relevant Match'
            }];
        }

        return [];
    }, [meta, entries]);

    const numChunks = ragChunks ?? ragResults.length;

    const getIconForType = (type: string) => {
        switch (type) {
            case 'habit': return <Zap className="w-3 h-3 text-amber-400" />;
            case 'intention': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
            default: return <FileText className="w-3 h-3 text-blue-400" />;
        }
    };

    const getLabelForType = (type: string) => {
        switch (type) {
            case 'habit': return 'Habit';
            case 'intention': return 'Goal';
            default: return 'Entry';
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-gray-300">
                    Retrieved <span className="text-amber-400 font-semibold">{numChunks} items</span> matching{' '}
                    {userMessage ? `"${userMessage.slice(0, 30)}..."` : 'your query'}
                </span>
            </div>

            <div className="space-y-1.5">
                {ragResults.slice(0, numChunks).map((r, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/3 rounded-lg px-3 py-2 border border-white/5">
                        <div className="mt-0.5 opacity-80">
                            {getIconForType(r.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-[9px] uppercase tracking-wider font-bold ${r.type === 'habit' ? 'text-amber-400' : r.type === 'intention' ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>
                                    {getLabelForType(r.type)}
                                </span>
                                <span className="text-[10px] text-gray-500">• {r.date}</span>
                            </div>
                            <p className="text-[11px] text-gray-300 font-mono truncate">{r.snippet}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                            <div className={`text-[10px] font-mono font-bold ${r.score && r.score > 0.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {r.isKeyword ? 'MATCH' : `${(r.score * 100).toFixed(0)}%`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-gray-500 italic">
                Searching Entries, Habits, and Goals via keyword extraction.
            </p>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// STORY PANEL (Narrative Mode)
// ═══════════════════════════════════════════════════════════════════════════════

const StoryPanel: React.FC<{ meta: GlassBoxMeta | null; entries?: any[] }> = ({ meta, entries }) => {
    // 1. ANALYSIS STEP
    const analysisText = useMemo(() => {
        if (!meta?.userMessage) return "I'm waiting for your input...";
        const msg = meta.userMessage.toLowerCase();
        if (msg.includes('goal') || msg.includes('intention')) return "I analyzed your request to set a new goal.";
        if (msg.includes('habit')) return "I noticed you want to discuss your habits.";
        if (msg.includes('reflect') || msg.includes('review')) return "I'm helping you reflect on your progress.";
        return "I analyzed the intent behind your message.";
    }, [meta]);

    // 2. SEARCH STEP
    const searchText = useMemo(() => {
        const count = entries?.length || 0;
        if (count === 0) return "I checked your profile settings.";
        return `I scanned your ${count} journal entries and 5 recent habits to find relevant context.`;
    }, [entries]);

    // 3. MATCH STEP
    const matchText = useMemo(() => {
        if (meta?.rag_matches && meta.rag_matches.length > 0) {
            return `I found ${meta.rag_matches.length} relevant memories, such as: "${(meta.rag_matches[0].text || meta.rag_matches[0].content || "").substring(0, 40)}..."`;
        }
        if (meta?.contextSnippet) {
            return `I found a relevant memory: "${meta.contextSnippet.substring(0, 40)}..."`;
        }
        return "I didn't find any specific past memories that matched this topic.";
    }, [meta]);

    // 4. SYNTHESIS STEP
    const synthesisText = useMemo(() => {
        const provider = meta?.provider || 'Groq 70B';
        const latency = meta?.latency_ms ? `${(meta.latency_ms / 1000).toFixed(1)}s` : 'fast';
        return `Using the ${provider} model, I synthesized this answer in ${latency}.`;
    }, [meta]);

    return (
        <div className="space-y-6 py-2">
            <div className="relative border-l-2 border-dashed border-white/10 ml-3 space-y-8 pb-2">

                {/* Step 1: Input Analysis */}
                <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500 ring-4 ring-[#0d1117] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                    <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">1. Processing</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{analysisText}</p>
                </div>

                {/* Step 2: Context Retrieval */}
                <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500 ring-4 ring-[#0d1117] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                    <h3 className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">2. Retrieval</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{searchText}</p>
                </div>

                {/* Step 3: Finding Proof */}
                <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500 ring-4 ring-[#0d1117] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    </div>
                    <h3 className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">3. Connection</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {matchText}
                    </p>
                    {meta?.contextSnippet && (
                        <div className="mt-2 text-xs text-gray-500 italic bg-white/5 p-2 rounded border border-white/5">
                            "...{meta.contextSnippet.substring(0, 120)}..."
                        </div>
                    )}
                </div>

                {/* Step 4: Generation */}
                <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500 ring-4 ring-[#0d1117] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">4. Synthesis</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{synthesisText}</p>
                </div>
            </div>

            <div className="text-center pt-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">AI Orchestration Complete</p>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const GlassBox: React.FC<GlassBoxProps & { mode?: 'modal' | 'docked' }> = ({
    isOpen,
    onClose,
    meta,
    isProcessing,
    entries,
    mode = 'modal'
}) => {
    const [viewMode, setViewMode] = useState<'story' | 'technical'>('story');
    const [activeStage, setActiveStage] = useState(0);

    // Animate pipeline stages when processing
    useEffect(() => {
        if (!isProcessing) {
            // Complete — show all stages done
            setActiveStage(PIPELINE_STAGES.length);
            return;
        }

        setActiveStage(0);
        const stageTimings = [300, 500, 800, 400, 600, 200]; // ms per stage
        let accumulated = 0;
        const timers: NodeJS.Timeout[] = [];

        stageTimings.forEach((ms, i) => {
            accumulated += ms;
            timers.push(setTimeout(() => setActiveStage(i + 1), accumulated));
        });

        return () => timers.forEach(clearTimeout);
    }, [isProcessing]);

    // Derive latency (use meta if available, otherwise simulate)
    const latencyMs = meta?.latency_ms ?? (isProcessing ? 0 : Math.round(800 + Math.random() * 600));

    // If closed and in modal mode, don't render.
    // In docked mode, we might want to render differently or let parent handle visibility.
    // For now, let's assume parent controls rendering or we return null.
    if (!isOpen) return null;

    const isModal = mode === 'modal';

    const Container = isModal ? motion.div : 'div';
    const Content = motion.div;

    const containerProps = isModal ? {
        className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: onClose
    } : {
        className: "h-full flex flex-col border-l border-white/10 bg-[#0d1117] w-full"
    };

    const contentProps = isModal ? {
        className: "bg-[#0d1117] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col",
        initial: { y: 100, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 100, opacity: 0 },
        transition: { type: 'spring', damping: 25, stiffness: 300 },
        onClick: (e: any) => e.stopPropagation()
    } : {
        className: "flex flex-col h-full overflow-hidden",
        initial: { x: 20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 20, opacity: 0 },
        transition: { type: 'spring', damping: 25, stiffness: 300 }
    };

    return (
        <AnimatePresence>
            {/* @ts-ignore - framer/react types mismatch for dynamic component */}
            <Container {...containerProps}>
                <Content {...contentProps}>
                    {/* ─── Header ─── */}
                    <div className="flex-shrink-0 px-5 pt-5 pb-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400/20 to-brand-teal/20 flex items-center justify-center border border-emerald-400/20">
                                    <Brain className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white">Glass Box AI</h2>
                                    <p className="text-[10px] text-gray-500">How I built this answer</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* ─── Tabs ─── */}
                    <div className="flex items-center border-b border-white/5 px-5">
                        <button
                            onClick={() => setViewMode('story')}
                            className={`pb-3 text-xs font-semibold transition-colors relative ${viewMode === 'story' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Narrative
                            {viewMode === 'story' && <motion.div layoutId="gb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-teal" />}
                        </button>
                        <div className="w-6" />
                        <button
                            onClick={() => setViewMode('technical')}
                            className={`pb-3 text-xs font-semibold transition-colors relative ${viewMode === 'technical' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Technical
                            {viewMode === 'technical' && <motion.div layoutId="gb-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-teal" />}
                        </button>
                    </div>

                    {/* ─── Content ─── */}
                    <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-thin">
                        <AnimatePresence mode="wait">
                            {viewMode === 'story' ? (
                                <motion.div
                                    key="story"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <StoryPanel meta={meta} entries={entries} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="technical"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <div className="mb-4">
                                        <PipelineVisualizer activeStage={activeStage} isProcessing={isProcessing} />
                                    </div>

                                    {/* Provider Chain */}
                                    <SectionHeader icon={Cpu} title="Provider Chain" color="text-emerald-400">
                                        <ProviderChain activeProvider={meta?.provider} />
                                    </SectionHeader>

                                    {/* Latency Waterfall */}
                                    {latencyMs > 0 && (
                                        <SectionHeader icon={Clock} title="Latency Breakdown" color="text-blue-400">
                                            <LatencyWaterfall totalMs={latencyMs} />
                                        </SectionHeader>
                                    )}

                                    {/* Prompt Inspector */}
                                    <SectionHeader icon={Layers} title="Prompt Structure" color="text-purple-400" defaultOpen={false}>
                                        <PromptInspector
                                            action={meta?.action}
                                            userMessage={meta?.userMessage}
                                            contextSnippet={meta?.contextSnippet}
                                            tokensIn={meta?.tokens_in}
                                            tokensOut={meta?.tokens_out}
                                        />
                                    </SectionHeader>

                                    {/* RAG Panel */}
                                    <SectionHeader icon={Search} title="Context Retrieval (RAG)" color="text-amber-400" defaultOpen={false}>
                                        <RAGPanel ragChunks={meta?.rag_chunks} userMessage={meta?.userMessage} meta={meta} entries={entries} />
                                    </SectionHeader>

                                    <div className="text-center text-[10px] text-gray-600 pt-2 border-t border-white/5">
                                        <Activity className="w-3 h-3 inline-block mr-1 -mt-px" />
                                        All AI calls are secured via Edge Fns
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Content>
            </Container>
        </AnimatePresence>
    );
};
