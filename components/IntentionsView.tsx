import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Intention } from '../types';
import { IntentionCard } from './IntentionCard';
import { EmptyIntentionsState } from './EmptyIntentionsState';
import { getUrgencyCategory, getUrgencyCategoryLabel, type UrgencyCategory } from '../utils/etaCalculator';

interface IntentionsViewProps {
    intentions: Intention[];
    onToggle: (id: string, currentStatus: Intention['status']) => void;
    onDelete: (id: string) => void;
    onStarToggle: (id: string, isStarred: boolean) => void;
}

const urgencyCategoryOrder: UrgencyCategory[] = ['overdue', 'today', 'this_week', 'this_month', 'later', 'life'];

export const IntentionsView: React.FC<IntentionsViewProps> = ({
    intentions,
    onToggle,
    onDelete,
    onStarToggle
}) => {
    const [showCompleted, setShowCompleted] = useState(false);
    const [isOverdueCollapsed, setIsOverdueCollapsed] = useState(true); // Default to collapsed

    const { pendingByCategory, allCompleted } = useMemo(() => {
        const pendingGroups: Record<UrgencyCategory, Intention[]> = {
            overdue: [],
            today: [],
            this_week: [],
            this_month: [],
            later: [],
            life: [],
        };
        const completedIntentions: Intention[] = [];

        intentions.forEach(intention => {
            if (intention.status === 'completed') {
                completedIntentions.push(intention);
            } else {
                const dueDate = intention.due_date ? new Date(intention.due_date) : null;
                const isLifeGoal = intention.is_life_goal || false;
                const category = getUrgencyCategory(dueDate, isLifeGoal);
                pendingGroups[category].push(intention);
            }
        });

        // Sort pending by Starred -> Due Date -> Created At
        Object.keys(pendingGroups).forEach(key => {
            const category = key as UrgencyCategory;
            pendingGroups[category].sort((a, b) => {
                // 1. Starred First
                if (a.is_starred && !b.is_starred) return -1;
                if (!a.is_starred && b.is_starred) return 1;

                // 2. Due Date (Ascending)
                if (a.due_date && b.due_date) {
                    const timeDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    if (timeDiff !== 0) return timeDiff;
                } else if (a.due_date && !b.due_date) {
                    return 1; // No due date goes to bottom
                } else if (!a.due_date && b.due_date) {
                    return -1;
                }

                // 3. Created At (Descending - Newest First)
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
        });

        // Sort completed by completion date (most recent first)
        completedIntentions.sort((a, b) => {
            if (!a.completed_at || !b.completed_at) return 0;
            return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
        });

        return { pendingByCategory: pendingGroups, allCompleted: completedIntentions };
    }, [intentions]);

    const hasAnyIntentions = intentions.length > 0;

    const getCategoryColor = (category: UrgencyCategory): string => {
        switch (category) {
            case 'overdue': return 'text-red-400';
            case 'today': return 'text-brand-teal';
            case 'this_week': return 'text-blue-400';
            case 'this_month': return 'text-purple-400';
            case 'later': return 'text-gray-400';
            case 'life': return 'text-amber-400';
        }
    };

    return (
        <div className="flex-grow flex flex-col overflow-hidden">
            <header className="flex-shrink-0 p-4 border-b border-white/10">
                <h1 className="text-2xl font-bold text-white font-display">Intentions</h1>
                <p className="text-sm text-gray-400 mt-1">What you want to achieve, organized by timeline</p>
            </header>

            <main className="flex-grow overflow-y-auto p-4">
                {!hasAnyIntentions && (
                    <EmptyIntentionsState />
                )}

                {/* Pending Intentions by Urgency */}
                {urgencyCategoryOrder.map(category => {
                    const pendingList = pendingByCategory[category];
                    if (pendingList.length === 0) return null;

                    // Special handling for Overdue section
                    if (category === 'overdue') {
                        return (
                            <div key={category} className="mb-6">
                                <button
                                    onClick={() => setIsOverdueCollapsed(!isOverdueCollapsed)}
                                    className="w-full flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className={`w-5 h-5 text-red-400 transition-transform ${isOverdueCollapsed ? '-rotate-90' : ''}`} />
                                        <h2 className="text-lg font-bold font-display text-red-400">Overdue</h2>
                                    </div>
                                    <span className="text-sm font-bold text-red-300 bg-red-500/20 px-2 py-0.5 rounded-full">
                                        {pendingList.length} items
                                    </span>
                                </button>

                                {!isOverdueCollapsed && (
                                    <div className="mt-3 pl-2 border-l-2 border-red-500/10 ml-4 animate-fade-in-down">
                                        {pendingList.map(intention => (
                                            <IntentionCard
                                                key={intention.id}
                                                intention={intention}
                                                onToggle={onToggle}
                                                onDelete={onDelete}
                                                onStarToggle={onStarToggle}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={category} className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className={`text-xl font-bold font-display ${getCategoryColor(category)}`}>
                                    {getUrgencyCategoryLabel(category)}
                                </h2>
                                <span className="text-sm text-gray-300">
                                    {pendingList.length}
                                </span>
                            </div>

                            {pendingList.map(intention => (
                                <IntentionCard
                                    key={intention.id}
                                    intention={intention}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                    onStarToggle={onStarToggle}
                                />
                            ))}
                        </div>
                    );
                })}

                {/* Completed Intentions (Collapsible) */}
                {allCompleted.length > 0 && (
                    <div className="mt-8 border-t border-white/10 pt-6">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="w-full flex items-center justify-between p-3 bg-dark-surface-light rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {showCompleted ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="text-lg font-medium text-gray-200">
                                    Completed
                                </span>
                            </div>
                            <span className="text-sm text-gray-300">
                                {allCompleted.length}
                            </span>
                        </button>

                        {showCompleted && (
                            <div className="mt-4 space-y-2">
                                {allCompleted.map(intention => (
                                    <IntentionCard
                                        key={intention.id}
                                        intention={intention}
                                        onToggle={onToggle}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
