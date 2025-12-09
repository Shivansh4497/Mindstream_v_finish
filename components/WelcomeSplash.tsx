import React, { useEffect, useState } from 'react';

interface WelcomeSplashProps {
    onComplete: () => void;
}

/**
 * First-time welcome splash screen that introduces the Mindstream clarity loop.
 * Shows only once per user (tracked in localStorage).
 * Auto-advances after animation completes (~3.5 seconds).
 */
export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'logo' | 'loop' | 'tagline' | 'fade'>('logo');

    useEffect(() => {
        // Phase timing: logo (0.8s) → loop (1.5s) → tagline (1s) → fade (0.5s)
        const timers = [
            setTimeout(() => setPhase('loop'), 800),
            setTimeout(() => setPhase('tagline'), 2300),
            setTimeout(() => setPhase('fade'), 3300),
            setTimeout(() => onComplete(), 3800),
        ];

        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    const loopSteps = [
        { label: 'Write', color: 'bg-brand-teal/20 text-brand-teal' },
        { label: 'Notice', color: 'bg-violet-500/20 text-violet-400' },
        { label: 'Act', color: 'bg-amber-500/20 text-amber-400' },
        { label: 'Reflect', color: 'bg-blue-500/20 text-blue-400' },
        { label: 'Adjust', color: 'bg-emerald-500/20 text-emerald-400' },
    ];

    return (
        <div
            className={`fixed inset-0 z-[100] bg-gradient-to-b from-brand-indigo via-dark-surface to-black flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'
                }`}
        >
            {/* Logo */}
            <div className={`transition-all duration-700 ${phase === 'logo' ? 'scale-100 opacity-100' : 'scale-90 opacity-100 -translate-y-4'
                }`}>
                <div className="flex items-center gap-3 mb-8">
                    <img
                        src="/mindstream-logo.svg"
                        alt="Mindstream"
                        className="w-14 h-14 drop-shadow-[0_0_12px_rgba(45,212,191,0.6)]"
                    />
                    <span className="text-3xl font-display font-bold text-white tracking-tight">
                        Mindstream
                    </span>
                </div>
            </div>

            {/* The Clarity Loop */}
            <div className={`transition-all duration-700 delay-100 ${phase === 'logo' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}>
                {/* Loop steps */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm mb-6 max-w-xs">
                    {loopSteps.map((step, index) => (
                        <React.Fragment key={step.label}>
                            <span
                                className={`${step.color} px-3 py-1.5 rounded-full font-medium transition-all duration-500`}
                                style={{
                                    transitionDelay: `${index * 150}ms`,
                                    opacity: phase !== 'logo' ? 1 : 0,
                                    transform: phase !== 'logo' ? 'scale(1)' : 'scale(0.8)'
                                }}
                            >
                                {step.label}
                            </span>
                            {index < loopSteps.length - 1 && (
                                <span
                                    className="text-gray-500 transition-opacity duration-300"
                                    style={{
                                        transitionDelay: `${index * 150 + 75}ms`,
                                        opacity: phase !== 'logo' ? 1 : 0
                                    }}
                                >
                                    →
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Tagline */}
                <p className={`text-center text-gray-400 text-sm transition-all duration-500 ${phase === 'tagline' || phase === 'fade' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}>
                    Your Second Brain for Clarity
                </p>
            </div>

            {/* Privacy note - subtle at bottom */}
            <div className={`absolute bottom-12 transition-all duration-500 ${phase === 'tagline' || phase === 'fade' ? 'opacity-100' : 'opacity-0'
                }`}>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <span>🔒</span>
                    <span>Private by design</span>
                </div>
            </div>
        </div>
    );
};
