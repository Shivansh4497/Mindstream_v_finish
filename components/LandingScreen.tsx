import React from 'react';
import { motion } from 'framer-motion';
import { LockIcon } from './icons/LockIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
// MindstreamLogo is now a static SVG file in public/

interface LandingScreenProps {
    onQuickStart: () => void;
    onGuidedSetup: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onQuickStart, onGuidedSetup }) => {
    return (
        <div className="h-screen w-screen bg-brand-indigo flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/20 via-brand-indigo to-brand-indigo" />

            {/* Floating orbs for ambiance */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-teal/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 text-center max-w-lg"
            >
                {/* Logo/Icon */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center justify-center w-24 h-24 bg-dark-surface/50 backdrop-blur-sm rounded-2xl mb-8 border border-white/5"
                >
                    <img src="/mindstream-logo.svg" alt="Mindstream" className="w-14 h-14 drop-shadow-[0_0_12px_rgba(45,212,191,0.6)]" />
                </motion.div>

                {/* Headline */}
                <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-4">
                    Your Private Sanctuary
                </h1>
                <p className="text-lg text-gray-300 mb-12 leading-relaxed">
                    Mindstream is an encrypted space for your unfiltered mind.
                    What you write here is seen only by you.
                </p>

                {/* Choice Cards */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Quick Start */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onQuickStart}
                        className="flex-1 group relative bg-brand-teal text-brand-indigo p-6 rounded-2xl text-left transition-all shadow-lg shadow-brand-teal/20 hover:shadow-brand-teal/30"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-brand-indigo/10 rounded-lg">
                                <ArrowRightIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">Quick Start</h3>
                                <p className="text-brand-indigo/70 text-sm">
                                    Jump straight to journaling. No setup needed.
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-brand-indigo/10 rounded text-xs font-bold uppercase">
                            Fast
                        </div>
                    </motion.button>

                    {/* Guided Setup */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onGuidedSetup}
                        className="flex-1 group relative bg-dark-surface/50 backdrop-blur-sm border border-white/10 text-white p-6 rounded-2xl text-left transition-all hover:border-brand-teal/50 hover:bg-dark-surface/70"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-brand-teal/10 rounded-lg">
                                <SparklesIcon className="w-6 h-6 text-brand-teal" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">Guided Setup</h3>
                                <p className="text-gray-400 text-sm">
                                    2-minute journey. Get personalized habits & insights.
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-brand-teal/10 text-brand-teal rounded text-xs font-bold uppercase">
                            Recommended
                        </div>
                    </motion.button>
                </div>

                {/* Privacy note */}
                <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
                    <LockIcon className="w-3 h-3" />
                    End-to-end encrypted. Your data never leaves your device unencrypted.
                </p>
            </motion.div>
        </div>
    );
};
