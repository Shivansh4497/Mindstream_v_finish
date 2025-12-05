
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { HabitsView } from './components/HabitsView';
import { HabitsInputBar } from './components/HabitsInputBar';
import { SettingsView } from './components/SettingsView';
import { LifeAreaDashboard } from './components/LifeAreaDashboard';
import { FocusView } from './components/FocusView';
import { InsightsView } from './components/InsightsView';
import { YearlyReview } from './components/YearlyReview';
import { InsightModal } from './components/InsightModal';
import { generateYearlyReview, YearlyReviewData } from './services/yearlyReviewService';

import { useAppLogic } from './hooks/useAppLogic';
import { useLocalStorage } from './hooks/useLocalStorage';
import * as gemini from './services/geminiService';
import * as reflections from './services/reflectionService';
import * as db from './services/dbService';
import type { Entry, IntentionTimeframe, Habit, HabitFrequency } from './types';

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
    const [showThematicModal, setShowThematicModal] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [thematicReflection, setThematicReflection] = useState<string | null>(null);
    const [isGeneratingThematic, setIsGeneratingThematic] = useState(false);
    const [yearlyReviewData, setYearlyReviewData] = useState<YearlyReviewData | null>(null);
    const [isGeneratingYearly, setIsGeneratingYearly] = useState(false);

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

    // Legacy migration: users who already saw privacy screen skip onboarding
    useEffect(() => {
        if (legacyPrivacy && onboardingStep === ONBOARDING_NOT_STARTED) {
            setOnboardingStep(ONBOARDING_GUIDED_COMPLETE);
        }
    }, [legacyPrivacy, onboardingStep]);

    // Progressive disclosure: show toast when Insights tab unlocks
    useEffect(() => {
        if (insightsUnlocked && !hasVisitedInsights) {
            // Only show toast once - when they first hit 5 entries
            // The badge will persist until they visit the tab
            actions.setToast({ message: '🎉 Insights tab unlocked!', id: Date.now() });
        }
    }, [insightsUnlocked]);

    // Generate insight for Quick Start users after their first entry
    useEffect(() => {
        // Only for Quick Start users who haven't seen an insight yet
        if (onboardingStep !== ONBOARDING_QUICK_START) return;
        if (hasSeenFirstInsight) return;
        if (state.aiStatus !== 'ready') return;

        // Check if there's a new entry (more than just temp entries)
        const realEntries = state.entries.filter(e => !e.id.startsWith('temp-'));
        if (realEntries.length === 0) return;

        // Generate insight for the first entry
        const firstEntry = realEntries[0];
        if (!firstEntry.text || firstEntry.text.length < 10) return;

        // Prevent multiple calls
        if (state.pendingInsight) return;

        // Generate the insight
        gemini.generateInstantInsight(
            firstEntry.text,
            firstEntry.primary_sentiment || 'Reflective',
            'Self', // Default life area
            'General' // Default trigger
        ).then(async (insightResult) => {
            // Generate suggested habit
            const suggestions = await gemini.generateEntrySuggestions(firstEntry.text).catch(() => null);
            const habitSuggestion = suggestions?.find(s => s.type === 'habit');
            const intentionSuggestion = suggestions?.find(s => s.type === 'intention');

            actions.setPendingInsight({
                insight: insightResult.insight,
                followUpQuestion: insightResult.followUpQuestion,
                entryText: firstEntry.text,
                suggestedHabit: habitSuggestion ? { name: habitSuggestion.text, emoji: habitSuggestion.emoji || '🎯' } : undefined,
                suggestedIntention: intentionSuggestion?.text,
            });
        }).catch(console.error);
    }, [state.entries, state.aiStatus, onboardingStep, hasSeenFirstInsight, state.pendingInsight]);

    // Chat Starters - Using the new reflectionService
    useEffect(() => {
        if (view === 'chat' && state.messages.length === 1 && chatStarters.length === 0 && state.aiStatus === 'ready') {
            setIsGeneratingStarters(true);
            reflections.generateChatStarters(state.entries, state.intentions)
                .then(res => setChatStarters(res.starters))
                .catch(console.error)
                .finally(() => setIsGeneratingStarters(false));
        }
    }, [view, state.messages, state.aiStatus]);

    // Show Landing Screen for new users
    if (onboardingStep === ONBOARDING_NOT_STARTED && user) {
        return (
            <LandingScreen
                onQuickStart={() => setOnboardingStep(ONBOARDING_QUICK_START)}
                onGuidedSetup={() => setOnboardingStep(2)} // 2 = start guided wizard
            />
        );
    }

    // Show Guided Onboarding Wizard (steps 2-4 go through wizard)
    if (onboardingStep >= 2 && onboardingStep < ONBOARDING_GUIDED_COMPLETE && user) {
        return <OnboardingWizard userId={user.id} onComplete={(dest, context, q) => {
            setOnboardingStep(ONBOARDING_GUIDED_COMPLETE);
            if (dest === 'chat' && context && q) {
                setView('chat');
                actions.handleSendMessage(context); // Seeding context
                actions.setMessages(prev => [...prev, { sender: 'ai', text: q }]);
            }
        }} />;
    }

    if (!state.isDataLoaded) {
        return <div className="h-screen w-screen bg-brand-indigo flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-brand-indigo overflow-hidden">
            <Header
                onSearchClick={() => setShowSearchModal(true)}
                onSettingsClick={() => setView('settings')}
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

                    {view === 'focus' && (
                        <motion.div
                            key="focus"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                            className="absolute inset-0 flex flex-col"
                        >
                            <FocusView
                                // Habits Props
                                habits={state.habits}
                                todaysLogs={state.habitLogs}
                                onToggleHabit={actions.handleToggleHabit}
                                onEditHabit={setHabitToEdit}
                                onDeleteHabit={actions.handleDeleteHabit}
                                onAddHabit={actions.handleAddHabit}
                                isAddingHabit={state.isAddingHabit}
                                activeHabitFrequency={activeHabitFrequency}
                                onHabitFrequencyChange={setActiveHabitFrequency}
                                // Intentions Props
                                intentions={state.intentions}
                                onToggleIntention={actions.handleToggleIntention}
                                onDeleteIntention={actions.handleDeleteIntention}
                                onAddIntention={actions.handleAddIntention}
                                onStarToggleIntention={actions.handleToggleStar}
                            />
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
                                    const res = await reflections.generateReflection(dayEntries, state.intentions, state.habits, state.habitLogs);
                                    const saved = await db.addReflection(user!.id, { ...res, date, type: 'daily' });
                                    actions.setReflections(prev => [...prev.filter(r => !(r.date === date && r.type === 'daily')), saved]);
                                    actions.setIsGeneratingReflection(null);
                                }}
                                onGenerateWeekly={async (weekId, weekEntries) => {
                                    actions.setIsGeneratingReflection(weekId);
                                    const res = await reflections.generateWeeklyReflection(weekEntries, state.intentions);
                                    const saved = await db.addReflection(user!.id, { ...res, date: weekId, type: 'weekly' });
                                    const reflectionForState = { ...saved, date: weekId };
                                    actions.setReflections(prev => [...prev.filter(r => !(r.date === weekId && r.type === 'weekly')), reflectionForState]);
                                    actions.setIsGeneratingReflection(null);
                                }}
                                onGenerateMonthly={async (monthId, monthEntries) => {
                                    actions.setIsGeneratingReflection(monthId);
                                    const res = await reflections.generateMonthlyReflection(monthEntries, state.intentions);
                                    const saved = await db.addReflection(user!.id, { ...res, date: monthId, type: 'monthly' });
                                    const reflectionForState = { ...saved, date: monthId };
                                    actions.setReflections(prev => [...prev.filter(r => !(r.date === monthId && r.type === 'monthly')), reflectionForState]);
                                    actions.setIsGeneratingReflection(null);
                                }}
                                onExploreInChat={(summary) => {
                                    setView('chat');
                                    actions.handleSendMessage(`I'd like to explore this reflection: "${summary}"`);
                                }}
                                isGenerating={state.isGeneratingReflection}
                                onAddSuggestion={(s) => actions.handleAddIntention(s.text, s.timeframe)}
                                aiStatus={state.aiStatus}
                                onDebug={() => reflections.getRawReflectionForDebug(state.entries, state.intentions).then(res => actions.setToast({ message: "Debug check console", id: 1 }))}
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
                            <ChatView messages={state.messages} isLoading={state.isChatLoading} onAddSuggestion={() => { }} />
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
            {state.toast && <Toast message={state.toast.message} onDismiss={() => actions.setToast(null)} />}
            {entryToDelete && <DeleteConfirmationModal onConfirm={() => { actions.handleDeleteEntry(entryToDelete); setEntryToDelete(null); }} onCancel={() => setEntryToDelete(null)} />}
            {entryToEdit && <EditEntryModal entry={entryToEdit} onSave={async (txt) => { await actions.handleEditEntry(entryToEdit, txt); setEntryToEdit(null); }} onCancel={() => setEntryToEdit(null)} />}
            {habitToEdit && <EditHabitModal habit={habitToEdit} onSave={async (name, emoji, category) => { await actions.handleEditHabit(habitToEdit.id, name, emoji, category); setHabitToEdit(null); }} onCancel={() => setHabitToEdit(null)} />}
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
                    setHasSeenFirstInsight(true);
                    actions.setPendingInsight(null);
                    setView('habits');
                    // The HabitsView has its own add flow - we could pre-fill but for now just navigate
                    if (state.pendingInsight?.suggestedHabit) {
                        actions.handleAddHabit(state.pendingInsight.suggestedHabit.name, 'daily');
                        actions.setToast({ message: `Added habit: ${state.pendingInsight.suggestedHabit.emoji} ${state.pendingInsight.suggestedHabit.name}`, id: Date.now() });
                    }
                }}
                onSetGoal={() => {
                    setHasSeenFirstInsight(true);
                    actions.setPendingInsight(null);
                    setView('intentions');
                    // Add the suggested intention
                    if (state.pendingInsight?.suggestedIntention) {
                        actions.handleAddIntention(state.pendingInsight.suggestedIntention, null, false);
                        actions.setToast({ message: 'Goal added!', id: Date.now() });
                    }
                }}
                onExploreChat={() => {
                    setHasSeenFirstInsight(true);
                    const entryText = state.pendingInsight?.entryText || '';
                    const followUp = state.pendingInsight?.followUpQuestion || '';
                    actions.setPendingInsight(null);
                    setView('chat');
                    // Seed the chat with context
                    if (entryText) {
                        actions.handleSendMessage(entryText);
                        setTimeout(() => {
                            actions.setMessages(prev => [...prev, { sender: 'ai', text: followUp }]);
                        }, 500);
                    }
                }}
                onDismiss={() => {
                    setHasSeenFirstInsight(true);
                    actions.setPendingInsight(null);
                }}
            />
        </div>
    );
};
