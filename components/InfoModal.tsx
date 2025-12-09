import React from 'react';
import { X, Sparkles, BookOpen, Target, MessageCircle, TrendingUp, Zap } from 'lucide-react';

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
                            <h2 className="text-xl font-bold text-white font-display">How It Works</h2>
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
                            Mindstream connects <span className="text-brand-coral">how you feel</span> to{' '}
                            <span className="text-brand-teal">what you do</span>.
                            It's your private AI companion that helps you understand patterns
                            between your emotions, habits, and goals.
                        </p>
                    </section>

                    {/* The 4 Pillars */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-brand-coral" />
                            <h3 className="text-lg font-semibold text-white">The 4 Pillars</h3>
                        </div>
                        <div className="grid gap-3">
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <BookOpen className="w-4 h-4 text-brand-teal" />
                                    <span className="font-medium text-white">Stream</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Capture thoughts via voice or text. AI extracts mood, tags, and insights instantly.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-brand-coral" />
                                    <span className="font-medium text-white">Habits</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Track daily patterns. See how they correlate with your mood over time.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <Target className="w-4 h-4 text-yellow-400" />
                                    <span className="font-medium text-white">Goals</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Set intentions from daily tasks to life goals. Get nudged when you mention them.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageCircle className="w-4 h-4 text-purple-400" />
                                    <span className="font-medium text-white">Chat</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Talk to your AI companion. It knows your history and gives personalized guidance.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* The Magic */}
                    <section className="bg-gradient-to-r from-brand-teal/10 to-brand-coral/10 rounded-xl p-4 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-2">✨ The Magic</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            AI connects your entries, habits, and goals to surface patterns you wouldn't see yourself.
                        </p>
                        <p className="text-brand-teal text-sm mt-2 italic">
                            "You tend to feel stressed when you skip exercise for 3+ days."
                        </p>
                    </section>

                    {/* How to Start */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-3">🚀 How to Start</h3>
                        <ol className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-brand-teal font-bold">1.</span>
                                <span>Capture 3 thoughts in Stream (voice or text)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-brand-teal font-bold">2.</span>
                                <span>Add 1-2 habits you want to track</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-brand-teal font-bold">3.</span>
                                <span>Check back tomorrow for your first AI reflection</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-brand-teal font-bold">4.</span>
                                <span>Use Chat anytime to explore what's on your mind</span>
                            </li>
                        </ol>
                    </section>

                    {/* Privacy Note */}
                    <section className="text-center text-xs text-gray-500 pt-2 border-t border-white/5">
                        <p>🔒 Your data is private. End-to-end encrypted. Only you can see it.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};
