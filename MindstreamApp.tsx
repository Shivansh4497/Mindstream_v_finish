
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { differenceInDays, isSameDay, parseISO } from 'date-fns';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { NavBar, View } from './components/NavBar';
import { Stream } from './components/Stream';
import { InputBar } from './components/InputBar';
import { LandingScreen } from './components/LandingScreen';
import { OnboardingWizard } from './components/OnboardingWizard';
import { SearchModal } from './components/SearchModal';
import { ChatView } from './components/ChatView';
import { ChatInputBar } from './components/ChatInputBar';
import { IntentionsView } from './components/IntentionsView';
import { IntentionsInputBar } from './components/IntentionsInputBar';
import { ReflectionsView } from './components/ReflectionsView';
import { ThematicModal } from './components/ThematicModal';
import { AIStatusBanner } from './components/AIStatusBanner';
import { SuggestionChips } from './components/SuggestionChips';
import { Toast } from './components/Toast';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { EditEntryModal } from './components/EditEntryModal';
import { EditHabitModal } from './components/EditHabitModal';
import { EditIntentionModal } from './components/EditIntentionModal';
import { HabitsView } from './components/HabitsView';
import { HabitsInputBar } from './components/HabitsInputBar';
import { SettingsView } from './components/SettingsView';
import { LifeAreaDashboard } from './components/LifeAreaDashboard';
import { InsightsView } from './components/InsightsView';
import { YearlyReview } from './components/YearlyReview';
import { InsightModal } from './components/InsightModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ReflectionUnlockModal } from './components/ReflectionUnlockModal';
import { InfoModal } from './components/InfoModal';
import { generateYearlyReview, YearlyReviewData } from './services/yearlyReviewService';

import { useAppLogic } from './hooks/useAppLogic';
import { useLocalStorage } from './hooks/useLocalStorage';
import * as gemini from './services/geminiService';
import * as reflections from './services/reflectionService';
import * as db from './services/dbService';
import type { Entry, IntentionTimeframe, Habit, HabitFrequency, Intention } from './types';

const LOADING_TIMEOUT_MS = 15000; // 15 seconds

// Onboarding states: 0 = not started, 1 = quick start chosen, 5 = guided complete
const ONBOARDING_NOT_STARTED = 0;
const ONBOARDING_QUICK_START = 1;
const ONBOARDING_GUIDED_COMPLETE = 5;

export const MindstreamApp: React.FC = () => {
    const { user } = useAuth();
    const { state, actions } = useAppLogic();

    const [view, setView] = useState<View>('stream');
    const [activeHabitFrequency, setActiveHabitFrequency] = useState<HabitFrequency>('daily');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [chatStarters, setChatStarters] = useState<string[]>([]);
    const [isGeneratingStarters, setIsGeneratingStarters] = useState(false);

    // Modals
    const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
    const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null);
    const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
    const [intentionToEdit, setIntentionToEdit] = useState<Intention | null>(null);
    const [showThematicModal, setShowThematicModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [thematicReflection, setThematicReflection] = useState<string | null>(null);
    const [isGeneratingThematic, setIsGeneratingThematic] = useState(false);
    const [yearlyReviewData, setYearlyReviewData] = useState<YearlyReviewData | null>(null);
    const [isGeneratingYearly, setIsGeneratingYearly] = useState(false);

    // Loading timeout state - MUST be declared before any early returns
    const [loadingTimedOut, setLoadingTimedOut] = useState(false);

    // Onboarding State
    // 0 = not started (show Landing), 1 = quick start (go to app), 5 = guided complete
    const onboardingKey = user ? `onboardingStep_${user.id}` : 'onboardingStep';
    const [onboardingStep, setOnboardingStep] = useLocalStorage<number>(onboardingKey, ONBOARDING_NOT_STARTED);
    const [legacyPrivacy] = useLocalStorage('hasSeenPrivacy', false);

    // Track if Quick Start user has seen their first insight
    const hasSeenInsightKey = user ? `hasSeenFirstInsight_${user.id}` : 'hasSeenFirstInsight';
    const [hasSeenFirstInsight, setHasSeenFirstInsight] = useLocalStorage<boolean>(hasSeenInsightKey, false);

    // Progressive disclosure: track if user has visited Insights tab after unlock
    const hasVisitedInsightsKey = user ? `hasVisitedInsights_${user.id}` : 'hasVisitedInsights';
    const [hasVisitedInsights, setHasVisitedInsights] = useLocalStorage<boolean>(hasVisitedInsightsKey, false);

    // Count real entries (exclude temp entries)
    const realEntryCount = state.entries.filter(e => !e.id.startsWith('temp-')).length;
    const insightsUnlocked = realEntryCount >= 5;

    // Progressive unlock thresholds for reflections
    const WEEKLY_UNLOCK = { days: 3, entries: 5 };
    const MONTHLY_UNLOCK = { days: 14, entries: 10 };

    // Track which reflection unlocks user has seen
    const seenDailyUnlockKey = user ? `seenDailyUnlock_${user.id}` : 'seenDailyUnlock';
    const seenWeeklyUnlockKey = user ? `seenWeeklyUnlock_${user.id}` : 'seenWeeklyUnlock';
    const seenMonthlyUnlockKey = user ? `seenMonthlyUnlock_${user.id}` : 'seenMonthlyUnlock';
    const [seenDailyUnlock, setSeenDailyUnlock] = useLocalStorage<boolean>(seenDailyUnlockKey, false);
    const [seenWeeklyUnlock, setSeenWeeklyUnlock] = useLocalStorage<boolean>(seenWeeklyUnlockKey, false);
    const [seenMonthlyUnlock, setSeenMonthlyUnlock] = useLocalStorage<boolean>(seenMonthlyUnlockKey, false);

    // Modal state for reflection unlock
    const [pendingUnlockType, setPendingUnlockType] = useState<'daily' | 'weekly' | 'monthly' | null>(null);

    // Calculate unlock status
    const unlockStatus = useMemo(() => {
        const now = new Date();
        const createdAt = state.accountCreatedAt ? new Date(state.accountCreatedAt) : now;
        const daysSinceInstall = differenceInDays(now, createdAt);

        // Daily: 5 entries (same as Insights tab unlock)
        const dailyUnlocked = realEntryCount >= 5;
        // Weekly: 3 days + 5 entries
        const weeklyUnlocked = daysSinceInstall >= WEEKLY_UNLOCK.days && realEntryCount >= WEEKLY_UNLOCK.entries;
        // Monthly: 14 days + 10 entries
        const monthlyUnlocked = daysSinceInstall >= MONTHLY_UNLOCK.days && realEntryCount >= MONTHLY_UNLOCK.entries;

        return { dailyUnlocked, weeklyUnlocked, monthlyUnlocked, daysSinceInstall };
    }, [state.accountCreatedAt, realEntryCount]);

    // Legacy migration: users who already saw privacy screen skip onboarding
    useEffect(() => {
        if (legacyPrivacy && onboardingStep === ONBOARDING_NOT_STARTED) {
            setOnboardingStep(ONBOARDING_GUIDED_COMPLETE);
        }
    }, [legacyPrivacy, onboardingStep]);

    // Loading timeout - shows retry button if loading takes too long
    useEffect(() => {
        if (!state.isDataLoaded) {
            const timeout = setTimeout(() => setLoadingTimedOut(true), LOADING_TIMEOUT_MS);
            return () => clearTimeout(timeout);
        }
    }, [state.isDataLoaded]);

    // Progressive disclosure: show toast when Insights tab unlocks
    useEffect(() => {
        if (insightsUnlocked && !hasVisitedInsights && user) {
            // Only show toast once - when they first hit 5 entries
            // The badge will persist until they visit the tab
            actions.setToast({ message: '🎉 Insights tab unlocked!', id: Date.now() });
            db.logEvent(user.id, 'insights_unlocked', {});
        }
    }, [insightsUnlocked]);

    // NOTE: Removed instant insight generation for Quick Start users
    // It was triggering on the welcome entry which is not useful

    // Chat Starters - Using the new reflectionService
    useEffect(() => {
        if (view === 'chat' && state.messages.length === 1 && chatStarters.length === 0 && state.aiStatus === 'ready') {
            setIsGeneratingStarters(true);
            reflections.generateChatStarters(state.entries)
                .then(res => setChatStarters(res.starters))
                .catch(console.error)
                .finally(() => setIsGeneratingStarters(false));
        }
    }, [view, state.messages, state.aiStatus]);

    // Reflection unlock notifications - show modal when first unlocked
    // IMPORTANT: Only run after user is loaded to ensure stable localStorage keys
    useEffect(() => {
        // Wait for user and data to be fully loaded
        if (!user || !state.isDataLoaded) return;

        // Don't show if already showing a modal
        if (pendingUnlockType !== null) return;

        // Check daily unlock (5 entries = same as insights tab)
        if (unlockStatus.dailyUnlocked && !seenDailyUnlock) {
            setPendingUnlockType('daily');
            return;
        }

        // Check weekly unlock (3 days + 5 entries)
        if (unlockStatus.weeklyUnlocked && !seenWeeklyUnlock) {
            setPendingUnlockType('weekly');
            return;
        }

        // Check monthly unlock (14 days + 10 entries)
        if (unlockStatus.monthlyUnlocked && !seenMonthlyUnlock) {
            setPendingUnlockType('monthly');
            return;
        }
    }, [unlockStatus, seenDailyUnlock, seenWeeklyUnlock, seenMonthlyUnlock, state.isDataLoaded, user, pendingUnlockType]);

    // Handle reflection unlock modal actions
    const handleReflectionUnlockNavigate = () => {
        if (!pendingUnlockType) return;

        // Mark as seen
        if (pendingUnlockType === 'daily') setSeenDailyUnlock(true);
        if (pendingUnlockType === 'weekly') setSeenWeeklyUnlock(true);
        if (pendingUnlockType === 'monthly') setSeenMonthlyUnlock(true);

        // Navigate to insights view (which contains reflections)
        setView('insights');

        // Log event
        if (user) {
            db.logEvent(user.id, 'reflection_generated', { type: pendingUnlockType, action: 'navigated_from_unlock' });
        }

        setPendingUnlockType(null);
    };

    const handleReflectionUnlockDismiss = () => {
        if (!pendingUnlockType) return;

        // Mark as seen so it doesn't show again
        if (pendingUnlockType === 'daily') setSeenDailyUnlock(true);
        if (pendingUnlockType === 'weekly') setSeenWeeklyUnlock(true);
        if (pendingUnlockType === 'monthly') setSeenMonthlyUnlock(true);

        setPendingUnlockType(null);
    };

    // Show Landing Screen for new users
    if (onboardingStep === ONBOARDING_NOT_STARTED && user) {
        return (
            <LandingScreen
                onQuickStart={() => {
                    setOnboardingStep(ONBOARDING_QUICK_START);
                    db.logEvent(user.id, 'onboarding_completed', { path: 'quick_start' });
                }}
                onGuidedSetup={async () => {
                    // BULLETPROOF: Reset all user data on guided setup to ensure clean slate
                    console.log('[Onboarding] Starting guided setup - resetting account data');
                    await db.resetAccountData(user.id);

                    // Refresh all state to reflect the clean slate
                    await actions.refreshAllData();

                    setOnboardingStep(2); // 2 = start guided wizard
                }}
            />
        );
    }

    // Show Guided Onboarding Wizard (steps 2-4 go through wizard)
    if (onboardingStep >= 2 && onboardingStep < ONBOARDING_GUIDED_COMPLETE && user) {
        return <OnboardingWizard userId={user.id} onComplete={(dest, context, q) => {
            console.log('[Onboarding] onComplete called:', { dest, context: context?.slice(0, 50), question: q?.slice(0, 50) });
            setOnboardingStep(ONBOARDING_GUIDED_COMPLETE);
            db.logEvent(user.id, 'onboarding_completed', { path: 'guided' });

            if (dest === 'chat' && context) {
                console.log('[Onboarding] Going to Chat with context');
                // Go to Chat with the user's elaboration as their first message
                // The AI will respond naturally - no need to add extra messages
                setView('chat');
                actions.handleSendMessage(context);
            } else {
                console.log('[Onboarding] Falling through to Stream. dest:', dest, 'context:', !!context, 'q:', !!q);
                // Default to Stream for all other cases (including 'stream' destination or missing context)
                setView('stream');
            }
        }} />;
    }

    if (!state.isDataLoaded) {
        return (
            <div className="h-screen w-screen bg-brand-indigo flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                {loadingTimedOut && (
                    <div className="text-center mt-4">
                        <p className="text-gray-400 mb-3">Taking longer than expected...</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal/20 text-brand-teal rounded-lg hover:bg-brand-teal/30 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="flex flex-col h-[100dvh] bg-brand-indigo overflow-hidden">
                <Header
                    onSearchClick={() => setShowSearchModal(true)}
                    onSettingsClick={() => setView('settings')}
                    onInfoClick={() => setShowInfoModal(true)}
                />
                <AIStatusBanner status={state.aiStatus} error={state.aiError} />

                <main className="flex-grow overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {view === 'stream' && (
                            <motion.div
                                key="stream"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <div className="flex-grow overflow-y-auto">
                                    <Stream
                                        entries={state.entries}
                                        intentions={state.intentions}
                                        insights={state.insights}
                                        autoReflections={state.autoReflections}
                                        nudges={state.nudges}
                                        onTagClick={(tag) => { setSelectedTag(tag); setShowThematicModal(true); }}
                                        onEditEntry={setEntryToEdit}
                                        onDeleteEntry={setEntryToDelete}
                                        onAcceptSuggestion={async (id, suggestion) => {
                                            const type = await actions.handleAcceptSuggestion(id, suggestion);
                                            if (type === 'reflection') setView('chat');
                                        }}
                                        onDismissInsight={actions.handleDismissInsight}
                                        onAcceptNudge={actions.handleAcceptNudge}
                                        onDismissNudge={actions.handleDismissNudge}
                                        onLoadMore={actions.handleLoadMore}
                                        hasMore={state.hasMore}
                                        isLoadingMore={state.isLoadingMore}
                                    />
                                </div>
                                <InputBar onAddEntry={actions.handleAddEntry} />
                            </motion.div>
                        )}


                        {view === 'habits' && (
                            <motion.div
                                key="habits"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <HabitsView
                                    habits={state.habits}
                                    todaysLogs={state.habitLogs}
                                    onToggle={actions.handleToggleHabit}
                                    onEdit={setHabitToEdit}
                                    onDelete={actions.handleDeleteHabit}
                                    onAddHabit={(name, _emoji) => actions.handleAddHabit(name, activeHabitFrequency)}
                                    activeFrequency={activeHabitFrequency}
                                    onFrequencyChange={setActiveHabitFrequency}
                                />
                                <HabitsInputBar
                                    onAddHabit={actions.handleAddHabit}
                                    isLoading={state.isAddingHabit}
                                    activeFrequency={activeHabitFrequency}
                                />
                            </motion.div>
                        )}

                        {view === 'goals' && (
                            <motion.div
                                key="goals"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <IntentionsView
                                    intentions={state.intentions}
                                    onToggle={actions.handleToggleIntention}
                                    onDelete={actions.handleDeleteIntention}
                                    onStarToggle={actions.handleToggleStar}
                                    onEdit={setIntentionToEdit}
                                    onAddIntention={(text) => actions.handleAddIntention(text, null, false)}
                                />
                                <IntentionsInputBar onAddIntention={actions.handleAddIntention} />
                            </motion.div>
                        )}


                        {view === 'insights' && (
                            <motion.div
                                key="insights"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <InsightsView
                                    // Reflections Props
                                    entries={state.entries}
                                    intentions={state.intentions}
                                    reflections={state.reflections}
                                    habits={state.habits}
                                    habitLogs={state.habitLogs}
                                    onGenerateDaily={async (date, dayEntries) => {
                                        actions.setIsGeneratingReflection(date);

                                        // Filter intentions: pending OR completed on this specific date
                                        const targetDate = parseISO(date);
                                        const dayIntentions = state.intentions.filter(i =>
                                            i.status === 'pending' ||
                                            (i.completed_at && isSameDay(parseISO(i.completed_at), targetDate))
                                        );

                                        // Filter habitLogs for this specific date only
                                        const dayHabitLogs = state.habitLogs.filter(l =>
                                            isSameDay(parseISO(l.completed_at), targetDate)
                                        );

                                        const res = await reflections.generateReflection(dayEntries, dayIntentions, state.habits, dayHabitLogs, date);
                                        const saved = await db.addReflection(user!.id, { ...res, date, type: 'daily' });
                                        actions.setReflections(prev => [...prev.filter(r => !(r.date === date && r.type === 'daily')), saved]);
                                        actions.setIsGeneratingReflection(null);
                                        if (user) db.logEvent(user.id, 'reflection_generated', { type: 'daily', date });
                                    }}
                                    onGenerateWeekly={async (weekId, weekEntries) => {
                                        actions.setIsGeneratingReflection(weekId);

                                        // Get week date range for filtering
                                        const { getWeekDateRange, isWithinRange } = await import('./utils/date');
                                        const weekRange = getWeekDateRange(weekId);

                                        // Filter intentions: created or completed in this week
                                        const weekIntentions = state.intentions.filter(i => {
                                            const createdAt = new Date(i.created_at);
                                            const completedAt = i.completed_at ? new Date(i.completed_at) : null;
                                            return i.status === 'pending' ||
                                                isWithinRange(createdAt, weekRange) ||
                                                (completedAt && isWithinRange(completedAt, weekRange));
                                        });

                                        // Filter habitLogs for this week
                                        const weekHabitLogs = state.habitLogs.filter(l =>
                                            isWithinRange(new Date(l.completed_at), weekRange)
                                        );

                                        const res = await reflections.generateWeeklyReflection(weekEntries, weekIntentions, state.habits, weekHabitLogs, 7);
                                        const saved = await db.addReflection(user!.id, { ...res, date: weekId, type: 'weekly' });
                                        actions.setReflections(prev => [...prev.filter(r => !(r.date === weekId && r.type === 'weekly')), saved]);
                                        actions.setIsGeneratingReflection(null);
                                        if (user) db.logEvent(user.id, 'reflection_generated', { type: 'weekly', week_id: weekId });
                                    }}
                                    onGenerateMonthly={async (monthId, monthEntries) => {
                                        actions.setIsGeneratingReflection(monthId);

                                        // Get month date range for filtering
                                        const { getMonthDateRange, isWithinRange } = await import('./utils/date');
                                        const monthRange = getMonthDateRange(monthId);
                                        const daysInMonth = Math.ceil((monthRange.end.getTime() - monthRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                                        // Filter intentions: created or completed in this month
                                        const monthIntentions = state.intentions.filter(i => {
                                            const createdAt = new Date(i.created_at);
                                            const completedAt = i.completed_at ? new Date(i.completed_at) : null;
                                            return i.status === 'pending' ||
                                                isWithinRange(createdAt, monthRange) ||
                                                (completedAt && isWithinRange(completedAt, monthRange));
                                        });

                                        // Filter habitLogs for this month
                                        const monthHabitLogs = state.habitLogs.filter(l =>
                                            isWithinRange(new Date(l.completed_at), monthRange)
                                        );

                                        const res = await reflections.generateMonthlyReflection(monthEntries, monthIntentions, state.habits, monthHabitLogs, daysInMonth);
                                        const saved = await db.addReflection(user!.id, { ...res, date: monthId, type: 'monthly' });
                                        actions.setReflections(prev => [...prev.filter(r => !(r.date === monthId && r.type === 'monthly')), saved]);
                                        actions.setIsGeneratingReflection(null);
                                        if (user) db.logEvent(user.id, 'reflection_generated', { type: 'monthly', month_id: monthId });
                                    }}
                                    onExploreInChat={(summary) => {
                                        setView('chat');
                                        actions.handleSendMessage(`I'd like to explore this reflection: "${summary}"`);
                                    }}
                                    isGenerating={state.isGeneratingReflection}
                                    onAddSuggestion={(s) => actions.handleAddIntention(s.text, null, false)}
                                    aiStatus={state.aiStatus}
                                    onDebug={() => reflections.getRawReflectionForDebug().then(res => actions.setToast({ message: "Debug check console", id: 1 }))}
                                    debugOutput={null}
                                    // Life Dashboard Props
                                    onOpenYearlyReview={async () => {
                                        if (!user) return;
                                        setIsGeneratingYearly(true);
                                        try {
                                            const data = await generateYearlyReview(user.id, new Date().getFullYear());
                                            setYearlyReviewData(data);
                                        } catch (e) {
                                            console.error(e);
                                            actions.setToast({ message: "Failed to generate yearly review", id: Date.now() });
                                        } finally {
                                            setIsGeneratingYearly(false);
                                        }
                                    }}
                                    isGeneratingYearly={isGeneratingYearly}
                                    accountCreatedAt={state.accountCreatedAt}
                                />
                            </motion.div>
                        )}

                        {view === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <ChatView
                                    messages={state.messages}
                                    isLoading={state.isChatLoading}
                                    onAddSuggestion={() => { }}
                                    userId={user?.id}
                                    entryPoint={onboardingStep === ONBOARDING_QUICK_START ? 'quick_start' : onboardingStep === ONBOARDING_GUIDED_COMPLETE ? 'guided' : 'organic'}
                                />
                                {state.messages.length === 1 && <SuggestionChips starters={chatStarters} isLoading={isGeneratingStarters} onStarterClick={actions.handleSendMessage} />}
                                <ChatInputBar onSendMessage={actions.handleSendMessage} isLoading={state.isChatLoading} />
                            </motion.div>
                        )}

                        {view === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="absolute inset-0 overflow-y-auto z-30 bg-brand-indigo"
                            >
                                <SettingsView onBack={() => setView('stream')} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {view !== 'settings' && (
                    <NavBar
                        activeView={view}
                        onViewChange={(newView) => {
                            // Clear Insights badge when user visits Insights tab
                            if (newView === 'insights' && !hasVisitedInsights) {
                                setHasVisitedInsights(true);
                            }
                            setView(newView);
                        }}
                        entryCount={realEntryCount}
                        showInsightsBadge={insightsUnlocked && !hasVisitedInsights}
                    />
                )}

                {/* Modals */}
                {showSearchModal && <SearchModal entries={state.entries} reflections={state.reflections} onClose={() => setShowSearchModal(false)} />}
                {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
                {state.toast && <Toast message={state.toast.message} onDismiss={() => actions.setToast(null)} />}
                {entryToDelete && <DeleteConfirmationModal onConfirm={() => { actions.handleDeleteEntry(entryToDelete); setEntryToDelete(null); }} onCancel={() => setEntryToDelete(null)} />}
                {entryToEdit && <EditEntryModal entry={entryToEdit} onSave={async (txt) => { await actions.handleEditEntry(entryToEdit, txt); setEntryToEdit(null); }} onCancel={() => setEntryToEdit(null)} />}
                {habitToEdit && <EditHabitModal habit={habitToEdit} onSave={async (name, emoji, category) => { await actions.handleEditHabit(habitToEdit.id, name, emoji, category); setHabitToEdit(null); }} onCancel={() => setHabitToEdit(null)} />}
                {intentionToEdit && <EditIntentionModal intention={intentionToEdit} onSave={async (updates) => { await db.updateIntention(intentionToEdit.id, updates); actions.setIntentions(state.intentions.map(i => i.id === intentionToEdit.id ? { ...i, ...updates } : i)); setIntentionToEdit(null); }} onCancel={() => setIntentionToEdit(null)} />}
                {showThematicModal && selectedTag && (
                    <ThematicModal
                        tag={selectedTag}
                        onClose={() => setShowThematicModal(false)}
                        onViewEntries={() => { setShowSearchModal(true); setShowThematicModal(false); }}
                        onGenerateReflection={async () => {
                            setIsGeneratingThematic(true);
                            const res = await reflections.generateThematicReflection(selectedTag, state.entries);
                            setThematicReflection(res);
                            setIsGeneratingThematic(false);
                        }}
                        isGenerating={isGeneratingThematic}
                        reflectionResult={thematicReflection}
                    />
                )}
                {yearlyReviewData && (
                    <YearlyReview
                        data={yearlyReviewData}
                        onClose={() => setYearlyReviewData(null)}
                    />
                )}

                {/* Insight Modal for Quick Start users */}
                <InsightModal
                    isOpen={!!state.pendingInsight}
                    insight={state.pendingInsight?.insight || ''}
                    followUpQuestion={state.pendingInsight?.followUpQuestion || ''}
                    suggestedHabit={state.pendingInsight?.suggestedHabit}
                    suggestedIntention={state.pendingInsight?.suggestedIntention}
                    onTrackHabit={() => {
                        const isFirstAction = !hasSeenFirstInsight;
                        setHasSeenFirstInsight(true);
                        actions.setPendingInsight(null);
                        setView('habits');
                        if (user) {
                            db.logEvent(user.id, 'insight_modal_action', { action: 'habit' });
                            if (isFirstAction) db.logEvent(user.id, 'first_action_taken', { type: 'habit' });
                        }
                        // The HabitsView has its own add flow - we could pre-fill but for now just navigate
                        if (state.pendingInsight?.suggestedHabit) {
                            actions.handleAddHabit(state.pendingInsight.suggestedHabit.name, 'daily');
                            actions.setToast({ message: `Added habit: ${state.pendingInsight.suggestedHabit.emoji} ${state.pendingInsight.suggestedHabit.name}`, id: Date.now() });
                        }
                    }}
                    onSetGoal={() => {
                        const isFirstAction = !hasSeenFirstInsight;
                        setHasSeenFirstInsight(true);
                        actions.setPendingInsight(null);
                        setView('intentions');
                        if (user) {
                            db.logEvent(user.id, 'insight_modal_action', { action: 'goal' });
                            if (isFirstAction) db.logEvent(user.id, 'first_action_taken', { type: 'goal' });
                        }
                        // Add the suggested intention
                        if (state.pendingInsight?.suggestedIntention) {
                            actions.handleAddIntention(state.pendingInsight.suggestedIntention, null, false);
                            actions.setToast({ message: 'Goal added!', id: Date.now() });
                        }
                    }}
                    onExploreChat={() => {
                        const isFirstAction = !hasSeenFirstInsight;
                        setHasSeenFirstInsight(true);
                        const insight = state.pendingInsight?.insight || '';
                        const followUp = state.pendingInsight?.followUpQuestion || '';
                        actions.setPendingInsight(null);
                        setView('chat');
                        if (user) {
                            db.logEvent(user.id, 'insight_modal_action', { action: 'chat' });
                            if (isFirstAction) db.logEvent(user.id, 'first_action_taken', { type: 'chat' });
                        }
                        // Seed chat with the insight context and let user explore via follow-up
                        if (insight && followUp) {
                            // First add the insight as AI message, then the follow-up as user's starting question
                            actions.setMessages(prev => [
                                ...prev,
                                { sender: 'ai', text: `"${insight}"\n\n${followUp}` }
                            ]);
                        }
                    }}
                    onDismiss={() => {
                        setHasSeenFirstInsight(true);
                        actions.setPendingInsight(null);
                        if (user) db.logEvent(user.id, 'insight_modal_action', { action: 'dismiss' });
                    }}
                />

                {/* Reflection Unlock Celebration Modal */}
                <AnimatePresence>
                    {pendingUnlockType && (
                        <ReflectionUnlockModal
                            type={pendingUnlockType}
                            onNavigate={handleReflectionUnlockNavigate}
                            onDismiss={handleReflectionUnlockDismiss}
                        />
                    )}
                </AnimatePresence>
            </div>
        </ErrorBoundary>
    );
};
