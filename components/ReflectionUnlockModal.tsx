import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, TrendingUp } from 'lucide-react';

type ReflectionType = 'daily' | 'weekly' | 'monthly';

interface ReflectionUnlockModalProps {
    type: ReflectionType;
    onNavigate: () => void;
    onDismiss: () => void;
}

const REFLECTION_CONFIG: Record<ReflectionType, {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}> = {
    daily: {
        icon: <Sparkles className="w-8 h-8" />,
        title: 'Daily Reflection Unlocked!',
        description: 'You can now generate personalized summaries of your daily thoughts and patterns.',
        color: 'from-amber-500 to-orange-500'
    },
    weekly: {
        icon: <Calendar className="w-8 h-8" />,
        title: 'Weekly Reflection Unlocked!',
        description: 'See the bigger picture with insights from your entire week of journaling.',
        color: 'from-brand-teal to-emerald-500'
    },
    monthly: {
        icon: <TrendingUp className="w-8 h-8" />,
        title: 'Monthly Reflection Unlocked!',
        description: 'Discover long-term patterns and celebrate your growth over the past month.',
        color: 'from-purple-500 to-indigo-500'
    }
};

export const ReflectionUnlockModal: React.FC<ReflectionUnlockModalProps> = ({
    type,
    onNavigate,
    onDismiss
}) => {
    const config = REFLECTION_CONFIG[type];

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onDismiss}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-dark-surface rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon with gradient background */}
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-white`}>
                    {config.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold font-display text-white mb-2">
                    {config.title}
                </h2>

                {/* Description */}
                <p className="text-gray-400 mb-6">
                    {config.description}
                </p>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onNavigate}
                        className={`w-full py-3 px-6 rounded-full font-bold text-white bg-gradient-to-r ${config.color} hover:opacity-90 transition-opacity shadow-lg`}
                    >
                        Check it out
                    </button>
                    <button
                        onClick={onDismiss}
                        className="w-full py-2 px-6 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                        Maybe later
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
