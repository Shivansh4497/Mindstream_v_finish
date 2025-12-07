import React, { useState, useMemo, useEffect } from 'react';
import type { Entry, Intention, Reflection, AISuggestion, Habit, HabitLog } from '../types';
import { DailyReflections } from './DailyReflections';
import { WeeklyReflections } from './WeeklyReflections';
import { MonthlyReflections } from './MonthlyReflections';
import { SentimentTimeline } from './SentimentTimeline';
import { AIStatus } from '../types';
import { supabase } from '../services/supabaseClient';
import { DailyPulse } from './DailyPulse';
import { generateChartInsights } from '../services/chartInsightsService';
import { subDays, differenceInDays } from 'date-fns';
import { Lock } from 'lucide-react';

type ReflectionTimeframe = 'daily' | 'weekly' | 'monthly' | 'insights';

// Progressive unlock thresholds
const WEEKLY_UNLOCK = { days: 3, entries: 5 };
const MONTHLY_UNLOCK = { days: 14, entries: 10 };

interface ReflectionsViewProps {
  entries: Entry[];
  intentions: Intention[];
  reflections: Reflection[];
  habits: Habit[];
  habitLogs: HabitLog[];
  onGenerateDaily: (date: string, entriesForDay: Entry[]) => void;
  onGenerateWeekly: (weekId: string, entriesForWeek: Entry[]) => void;
  onGenerateMonthly: (monthId: string, entriesForMonth: Entry[]) => void;
  onExploreInChat: (summary: string) => void;
  isGenerating: string | null;
  onAddSuggestion: (suggestion: AISuggestion) => void;
  aiStatus: AIStatus;
  onDebug: () => void;
  debugOutput: string | null;
  accountCreatedAt?: string; // ISO timestamp of when account was created
}

const timeframes: { id: ReflectionTimeframe; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'insights', label: 'Insights' },
];

export const ReflectionsView: React.FC<ReflectionsViewProps> = ({
  entries,
  intentions,
  reflections,
  habits,
  habitLogs,
  onGenerateDaily,
  onGenerateWeekly,
  onGenerateMonthly,
  onExploreInChat,
  isGenerating,
  onAddSuggestion,
  aiStatus,
  onDebug,
  debugOutput,
  accountCreatedAt
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState<ReflectionTimeframe>('daily');
  const [isGeneratingPulse, setIsGeneratingPulse] = useState(false);
  const [lastGeneratedDate, setLastGeneratedDate] = useState<string | null>(null);
  const [insights, setInsights] = useState<{
    dailyPulse: string | null;
    correlation: string | null;
    sentiment: string | null;
    heatmaps: Array<{ habitIndex: number; text: string }>;
  }>({ dailyPulse: null, correlation: null, sentiment: null, heatmaps: [] });

  // Calculate days since account creation and entry count
  const { daysSinceInstall, entryCount, weeklyUnlocked, monthlyUnlocked } = useMemo(() => {
    const now = new Date();
    const createdAt = accountCreatedAt ? new Date(accountCreatedAt) : now;
    const daysSinceInstall = differenceInDays(now, createdAt);
    const entryCount = entries.filter(e => !e.id.startsWith('temp-')).length;

    const weeklyUnlocked = daysSinceInstall >= WEEKLY_UNLOCK.days && entryCount >= WEEKLY_UNLOCK.entries;
    const monthlyUnlocked = daysSinceInstall >= MONTHLY_UNLOCK.days && entryCount >= MONTHLY_UNLOCK.entries;

    return { daysSinceInstall, entryCount, weeklyUnlocked, monthlyUnlocked };
  }, [accountCreatedAt, entries]);

  // Get unlock progress for display
  const getUnlockProgress = (type: 'weekly' | 'monthly') => {
    const threshold = type === 'weekly' ? WEEKLY_UNLOCK : MONTHLY_UNLOCK;
    const daysNeeded = Math.max(0, threshold.days - daysSinceInstall);
    const entriesNeeded = Math.max(0, threshold.entries - entryCount);
    return { daysNeeded, entriesNeeded };
  };

  // Fetch insights when Insights tab is active
  useEffect(() => {
    if (activeTimeframe !== 'insights') return;

    async function fetchInsights() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('chart_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('insight_date', { ascending: false })
        .limit(1); // Get latest daily insights

      if (!data || data.length === 0) {
        console.log('No insights found');
        return;
      }

      const latestInsight = data[0] as any;
      const heatmaps = Array.isArray(latestInsight.heatmap_insights)
        ? latestInsight.heatmap_insights.map((text: string, idx: number) => ({
          habitIndex: idx,
          text
        }))
        : [];

      setInsights({
        dailyPulse: latestInsight.daily_pulse ?? null,
        correlation: latestInsight.correlation_insight ?? null,
        sentiment: latestInsight.sentiment_insight ?? null,
        heatmaps
      });
      setLastGeneratedDate(latestInsight.insight_date);
    }

    fetchInsights();
  }, [activeTimeframe]);

  // Generate Daily Pulse (user-triggered, same SDK as Chat)
  const handleGeneratePulse = async () => {
    setIsGeneratingPulse(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch last 30 days of data
      const thirtyDaysAgo = subDays(new Date(), 30);
      const [{ data: entriesData }, { data: habitsData }, { data: logsData }] = await Promise.all([
        supabase.from('entries').select('timestamp, primary_sentiment, title')
          .eq('user_id', user.id)
          .gte('timestamp', thirtyDaysAgo.toISOString())
          .order('timestamp', { ascending: false }),
        supabase.from('habits').select('id, name, emoji')
          .eq('user_id', user.id),
        supabase.from('habit_logs').select('habit_id, completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', thirtyDaysAgo.toISOString())
      ]);

      if (!entriesData || entriesData.length < 3) {
        alert('You need at least 3 journal entries to generate insights.');
        return;
      }

      // Generate insights using same SDK as Chat
      const generatedInsights = await generateChartInsights({
        entries: entriesData,
        habits: habitsData || [],
        habitLogs: logsData || []
      });

      // Save to database (UPSERT: update if exists, insert if not)
      const { error: insertError } = await (supabase as any).from('chart_insights')
        .upsert({
          user_id: user.id,
          daily_pulse: generatedInsights.dailyPulse,
          correlation_insight: generatedInsights.correlation,
          sentiment_insight: generatedInsights.sentiment,
          heatmap_insights: generatedInsights.heatmaps,
          insight_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'user_id,insight_date'
        });

      if (insertError) {
        console.error('Error saving insights to DB:', insertError);
      }

      const heatmaps = generatedInsights.heatmaps.map((text: string, idx: number) => ({
        habitIndex: idx,
        text
      }));

      setInsights({
        dailyPulse: generatedInsights.dailyPulse,
        correlation: generatedInsights.correlation,
        sentiment: generatedInsights.sentiment,
        heatmaps
      });
      setLastGeneratedDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      console.error('Error generating pulse:', error);

      // Provide specific error messages
      let errorMessage = 'Failed to generate pulse. ';

      if (error.message?.includes('not authenticated')) {
        errorMessage += 'Please log in again.';
      } else if (error.message?.includes('3 journal entries')) {
        errorMessage += 'You need at least 3 journal entries to generate insights.';
      } else if (error.message?.includes('AI client not initialized')) {
        errorMessage += 'API key is missing. Please check your configuration.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      alert(errorMessage);
    } finally {
      setIsGeneratingPulse(false);
    }
  };

  const { daily, weekly, monthly } = useMemo(() => {
    const daily: Reflection[] = [];
    const weekly: Reflection[] = [];
    const monthly: Reflection[] = [];
    reflections.forEach(r => {
      if (r.type === 'daily') daily.push(r);
      else if (r.type === 'weekly') weekly.push(r);
      else if (r.type === 'monthly') monthly.push(r);
    });
    return { daily, weekly, monthly };
  }, [reflections]);

  // Render locked state for a timeframe
  const renderLockedState = (type: 'weekly' | 'monthly') => {
    const progress = getUnlockProgress(type);
    const label = type === 'weekly' ? 'Weekly' : 'Monthly';
    const requirements = [];

    if (progress.daysNeeded > 0) {
      requirements.push(`${progress.daysNeeded} more day${progress.daysNeeded === 1 ? '' : 's'}`);
    }
    if (progress.entriesNeeded > 0) {
      requirements.push(`${progress.entriesNeeded} more entr${progress.entriesNeeded === 1 ? 'y' : 'ies'}`);
    }

    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div className="max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white mb-2">
            {label} Reflections
          </h2>
          <p className="text-gray-400 mb-4">
            Unlock {type} reflections by continuing to journal.
          </p>
          <div className="bg-dark-surface-light rounded-lg p-4 text-left">
            <p className="text-sm text-gray-300">
              <span className="text-brand-teal font-medium">Still needed:</span>
              <br />
              {requirements.join(' and ')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTimeframe) {
      case 'daily':
        return <DailyReflections
          entries={entries}
          intentions={intentions}
          dailyReflections={daily}
          onGenerate={onGenerateDaily}
          onExplore={onExploreInChat}
          isGenerating={isGenerating}
          onAddSuggestion={onAddSuggestion}
          aiStatus={aiStatus}
          onDebug={onDebug}
          debugOutput={debugOutput}
        />;
      case 'weekly':
        if (!weeklyUnlocked) {
          return renderLockedState('weekly');
        }
        return <WeeklyReflections entries={entries} weeklyReflections={weekly} onGenerate={onGenerateWeekly} onExplore={onExploreInChat} isGenerating={isGenerating} onAddSuggestion={onAddSuggestion} />;
      case 'monthly':
        if (!monthlyUnlocked) {
          return renderLockedState('monthly');
        }
        return <MonthlyReflections entries={entries} monthlyReflections={monthly} onGenerate={onGenerateMonthly} onExplore={onExploreInChat} isGenerating={isGenerating} onAddSuggestion={onAddSuggestion} />;
      case 'insights':
        return (
          <div className="p-4 space-y-6">
            {/* Daily Pulse Summary */}
            <DailyPulse
              summary={insights.dailyPulse || "Keep tracking your habits and mood to unlock personalized insights."}
              lastGeneratedDate={lastGeneratedDate}
              isGenerating={isGeneratingPulse}
              onGenerate={handleGeneratePulse}
            />

            {/* Mood Flow - Always visible, no clicks needed */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Mood Flow
                </span>
                <span className="text-xs text-gray-500">Last 14 Days</span>
              </div>
              <p className="text-lg text-white mb-4">
                {insights.sentiment || "Tracking your emotional trends..."}
              </p>
              <div className="h-[200px] w-full">
                <SentimentTimeline
                  entries={entries}
                  days={14}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Check if a tab should show a lock icon
  const isTabLocked = (tfId: ReflectionTimeframe): boolean => {
    if (tfId === 'weekly') return !weeklyUnlocked;
    if (tfId === 'monthly') return !monthlyUnlocked;
    return false;
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex-shrink-0 p-4 border-b border-white/10 flex items-center overflow-x-auto">
        <div className="flex items-center gap-2">
          {timeframes.map(tf => (
            <button
              key={tf.id}
              onClick={() => setActiveTimeframe(tf.id)}
              className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTimeframe === tf.id
                ? 'bg-brand-teal text-white'
                : isTabLocked(tf.id)
                  ? 'text-gray-500 hover:bg-white/5'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              {isTabLocked(tf.id) && <Lock className="w-3 h-3" />}
              {tf.label}
            </button>
          ))}
        </div>
      </header>
      <main className="flex-grow overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};
