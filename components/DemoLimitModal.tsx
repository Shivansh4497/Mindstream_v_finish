import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DemoLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DemoLimitModal: React.FC<DemoLimitModalProps> = ({ isOpen, onClose }) => {
    const { logout } = useAuth();

    const handleSignUp = async () => {
        // Log out the anonymous demo user, which returns them to the login screen
        await logout();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-dark-surface rounded-2xl max-w-md w-full shadow-2xl border border-white/10 overflow-hidden"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header with gradient accent */}
                        <div className="relative p-6 pb-4">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/10 to-brand-coral/10" />
                            <div className="relative flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-teal to-brand-coral flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white font-display">
                                            Demo Complete!
                                        </h2>
                                        <p className="text-sm text-gray-400">
                                            You've explored all your demo AI calls
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 pt-2 space-y-5">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                You've used all your demo AI interactions. To continue using Mindstream
                                with <span className="text-white font-medium">unlimited AI insights</span>,
                                create a free account — it only takes a few seconds.
                            </p>

                            {/* What you keep */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <h3 className="text-sm font-semibold text-white mb-2">
                                    With a free account you get:
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <span className="text-brand-teal">✓</span>
                                        Unlimited AI-powered journaling
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-brand-teal">✓</span>
                                        Personalized reflections & insights
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-brand-teal">✓</span>
                                        AI chat that knows your context
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-brand-teal">✓</span>
                                        Full habit & goal tracking
                                    </li>
                                </ul>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={handleSignUp}
                                className="w-full py-3 px-6 bg-gradient-to-r from-brand-teal to-brand-coral text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
                            >
                                Create Free Account
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            {/* Dismiss option */}
                            <button
                                onClick={onClose}
                                className="w-full text-center text-sm text-gray-500 hover:text-gray-400 transition-colors"
                            >
                                Continue exploring without AI
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
