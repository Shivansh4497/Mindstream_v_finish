import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

interface InsightModalProps {
    isOpen: boolean;
    insight: string;
    followUpQuestion: string;
    suggestedHabit?: { name: string; emoji: string };
    suggestedIntention?: string;
    onTrackHabit: () => void;
    onSetGoal: () => void;
    onExploreChat: () => void;
    onDismiss: () => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({
    isOpen,
    insight,
    followUpQuestion,
    suggestedHabit,
    suggestedIntention,
    onTrackHabit,
    onSetGoal,
    onExploreChat,
    onDismiss,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onDismiss}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-4 bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 max-w-lg mx-auto bg-mindstream-bg-surface border border-white/10 rounded-2xl p-6 z-50 shadow-2xl max-h-[85vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-brand-teal/10 rounded-lg">
                                <SparklesIcon className="w-5 h-5 text-brand-teal" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Instant Insight</h2>
                        </div>

                        {/* Insight */}
                        <p className="text-gray-200 text-lg leading-relaxed mb-3">
                            "{insight}"
                        </p>

                        {/* Why This Insight - Evidence for trust */}
                        <p className="text-xs text-gray-500 italic mb-4 flex items-center gap-1">
                            <span>💡</span>
                            <span>Based on what you just shared</span>
                        </p>

                        {/* Follow-up Question */}
                        <div className="bg-mindstream-bg-elevated rounded-xl p-4 mb-6 border-l-4 border-brand-teal">
                            <p className="text-sm text-gray-400 mb-1">Something to reflect on:</p>
                            <p className="text-white font-medium">{followUpQuestion}</p>
                        </div>

                        {/* Action Prompt */}
                        <p className="text-gray-400 text-sm mb-4 text-center">
                            What would help you with this?
                        </p>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {/* Track Habit */}
                            <button
                                onClick={onTrackHabit}
                                className="flex flex-col items-center gap-2 p-4 bg-mindstream-bg-elevated hover:bg-white/5 border border-white/5 hover:border-brand-teal/50 rounded-xl transition-all group"
                            >
                                <span className="text-2xl">🎯</span>
                                <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Track Habit</span>
                                {suggestedHabit && (
                                    <span className="text-xs text-brand-teal truncate max-w-full px-1">
                                        {suggestedHabit.emoji} {suggestedHabit.name}
                                    </span>
                                )}
                            </button>

                            {/* Set Goal */}
                            <button
                                onClick={onSetGoal}
                                className="flex flex-col items-center gap-2 p-4 bg-mindstream-bg-elevated hover:bg-white/5 border border-white/5 hover:border-purple-500/50 rounded-xl transition-all group"
                            >
                                <span className="text-2xl">⭐</span>
                                <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Set a Goal</span>
                                {suggestedIntention && (
                                    <span className="text-xs text-purple-400 truncate max-w-full px-1">
                                        {suggestedIntention.slice(0, 20)}...
                                    </span>
                                )}
                            </button>

                            {/* Explore in Chat */}
                            <button
                                onClick={onExploreChat}
                                className="flex flex-col items-center gap-2 p-4 bg-mindstream-bg-elevated hover:bg-white/5 border border-white/5 hover:border-blue-500/50 rounded-xl transition-all group"
                            >
                                <ChatBubbleIcon className="w-6 h-6 text-blue-400" />
                                <span className="text-xs text-gray-400 group-hover:text-white transition-colors">Explore</span>
                            </button>
                        </div>

                        {/* Dismiss */}
                        <button
                            onClick={onDismiss}
                            className="w-full text-center text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
                        >
                            Maybe later
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
