import React from 'react';
import { X, Sparkles, BookOpen, Target, MessageCircle, TrendingUp, Zap, ArrowRight } from 'lucide-react';

interface InfoModalProps {
    onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-surface rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white/10">
                {/* Header */}
                <div className="sticky top-0 bg-dark-surface/95 backdrop-blur-sm p-6 pb-4 border-b border-white/10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <img src="/mindstream-logo.svg" alt="Mindstream" className="w-10 h-10" />
                        <div>
                            <h2 className="text-xl font-bold text-white font-display">How Mindstream Works</h2>
                            <p className="text-sm text-gray-400">Your emotional clarity engine</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* What is Mindstream */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-brand-teal" />
                            <h3 className="text-lg font-semibold text-white">What is Mindstream?</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Mindstream helps you understand the hidden patterns between{' '}
                            <span className="text-brand-coral font-medium">how you feel</span> and{' '}
                            <span className="text-brand-teal font-medium">how you behave</span>.
                        </p>
                        <p className="text-gray-400 text-sm leading-relaxed mt-2">
                            It quietly learns from your entries, habits, and goals — then reflects those patterns back as clear, actionable insight.
                            Not generic advice. <span className="text-white">Your data. Your life.</span>
                        </p>
                    </section>

                    {/* The Real Magic - MOVED UP for prominence */}
                    <section className="bg-gradient-to-r from-brand-teal/10 to-brand-coral/10 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-lg font-semibold text-white">The Real Magic</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Mindstream connects your <span className="text-white font-medium">emotions to your behavior</span> — automatically.
                            It surfaces patterns you would never notice manually:
                        </p>
                        <p className="text-brand-teal text-base mt-3 italic font-medium">
                            "You tend to feel stressed when you skip exercise for 3+ days."
                        </p>
                        <p className="text-gray-400 text-sm mt-3">
                            This is where awareness starts changing behavior.
                        </p>
                    </section>

                    {/* The 4 Pillars */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-brand-coral" />
                            <h3 className="text-lg font-semibold text-white">The 4 Core Pillars</h3>
                        </div>
                        <div className="grid gap-3">
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <BookOpen className="w-4 h-4 text-brand-teal" />
                                    <span className="font-medium text-white">Stream</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Capture thoughts anytime by voice or text. AI extracts mood, themes, and signals automatically.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-brand-coral" />
                                    <span className="font-medium text-white">Habits</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Track the small daily actions that shape your long-term state.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-4 h-4 text-yellow-400" />
                                    <span className="font-medium text-white">Goals</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Set intentions from today's tasks to long-term life goals.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageCircle className="w-4 h-4 text-purple-400" />
                                    <span className="font-medium text-white">Chat</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Think out loud with your AI companion. It remembers your history and responds with real context.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* How to Get the Most Value */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-3">🚀 How to Get the Most Value</h3>
                        <ol className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="text-brand-teal font-bold text-base">1.</span>
                                <div>
                                    <span className="text-white font-medium">Capture 2–3 thoughts a day</span>
                                    <span className="text-gray-400"> in Stream</span>
                                    <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                                        <ArrowRight className="w-3 h-3" />
                                        <span>This gives the AI enough signal to start learning you.</span>
                                    </div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-brand-teal font-bold text-base">2.</span>
                                <div>
                                    <span className="text-white font-medium">Maintain 1–2 simple habits</span>
                                    <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                                        <ArrowRight className="w-3 h-3" />
                                        <span>These become your behavior anchors.</span>
                                    </div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-brand-teal font-bold text-base">3.</span>
                                <div>
                                    <span className="text-white font-medium">Return for reflections</span>
                                    <span className="text-gray-400"> to see what's actually changing</span>
                                    <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                                        <ArrowRight className="w-3 h-3" />
                                        <span>You'll spot connections you never noticed.</span>
                                    </div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-brand-teal font-bold text-base">4.</span>
                                <div>
                                    <span className="text-white font-medium">Use Chat</span>
                                    <span className="text-gray-400"> when something feels stuck</span>
                                    <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                                        <ArrowRight className="w-3 h-3" />
                                        <span>It already knows your context.</span>
                                    </div>
                                </div>
                            </li>
                        </ol>
                        <p className="text-gray-500 text-xs mt-4 italic">
                            The more real your input, the sharper the insight.
                        </p>
                    </section>

                    {/* Privacy Note - FIXED */}
                    <section className="text-center text-xs text-gray-500 pt-3 border-t border-white/5">
                        <p>🔒 Your data is private and secure. Only you can see it.</p>
                        <p className="mt-1">You can export or delete everything anytime.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};
