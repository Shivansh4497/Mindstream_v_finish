import { supabase } from './supabaseClient';
import { Entry, Habit, Intention, Reflection } from '../types';
import { callAIProxy } from './geminiClient';

export interface YearlyStats {
    totalEntries: number;
    totalWords: number;
    topMoods: { mood: string; count: number }[];
    longestStreak: number;
    mostActiveMonth: string;
    totalHabitsCompleted: number;
    intentionsCompleted: number;
}

export interface YearTheme {
    title: string;
    description: string;
    emoji: string;
}

export interface YearlyReviewData {
    year: number;
    stats: YearlyStats;
    themes: YearTheme[];
    coreMemories: Entry[]; // Top 3-5 significant entries
    monthByMonth: { month: string; mood: string; summary: string }[];
}

export const generateYearlyStats = (entries: Entry[], habits: Habit[], intentions: Intention[], habitLogs: any[]): YearlyStats => {
    // 1. Total Entries & Words
    const totalEntries = entries.length;
    const totalWords = entries.reduce((acc, entry) => acc + entry.text.split(' ').length, 0);

    // 2. Top Moods
    const moodCounts: Record<string, number> = {};
    entries.forEach(entry => {
        if (entry.primary_sentiment) {
            moodCounts[entry.primary_sentiment] = (moodCounts[entry.primary_sentiment] || 0) + 1;
        }
    });
    const topMoods = Object.entries(moodCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([mood, count]) => ({ mood, count }));

    // 3. Longest Streak (Simplified calculation for now)
    const longestStreak = Math.max(...habits.map(h => h.longest_streak), 0);

    // 4. Most Active Month
    const monthCounts: Record<string, number> = {};
    entries.forEach(entry => {
        const month = new Date(entry.timestamp).toLocaleString('default', { month: 'long' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    const mostActiveMonth = Object.entries(monthCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    // 5. Completions
    const totalHabitsCompleted = habitLogs.length;
    const intentionsCompleted = intentions.filter(i => i.status === 'completed').length;

    return {
        totalEntries,
        totalWords,
        topMoods,
        longestStreak,
        mostActiveMonth,
        totalHabitsCompleted,
        intentionsCompleted
    };
};

export const generateYearlyReview = async (userId: string, year: number): Promise<YearlyReviewData> => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch Data
    const [entriesRes, habitsRes, intentionsRes, reflectionsRes] = await Promise.all([
        supabase.from('entries').select('*').eq('user_id', userId).gte('timestamp', startDate).lte('timestamp', endDate),
        supabase.from('habits').select('*').eq('user_id', userId),
        supabase.from('intentions').select('*').eq('user_id', userId).gte('created_at', startDate).lte('created_at', endDate),
        supabase.from('reflections').select('*').eq('user_id', userId).eq('type', 'monthly').gte('date', startDate).lte('date', endDate)
    ]);

    if (entriesRes.error) throw entriesRes.error;

    const entries = entriesRes.data || [];
    const habits = habitsRes.data || [];
    const intentions = intentionsRes.data || [];
    const reflections = reflectionsRes.data || [];

    // Fetch habit logs
    const { data: habitLogs } = await supabase.from('habit_logs')
        .select('*')
        .gte('completed_at', startDate)
        .lte('completed_at', endDate);

    const stats = generateYearlyStats(entries, habits, intentions, habitLogs || []);

    // AI Generation for Themes & Core Memories using Edge Function
    try {
        const entriesSample = entries.slice(0, 30).map(e => ({
            date: e.timestamp,
            text: e.text.slice(0, 100),
            mood: e.primary_sentiment
        }));

        const reflectionsSample = reflections.map(r => ({
            month: r.date,
            summary: r.summary?.slice(0, 100)
        }));

        const result = await callAIProxy<{ response: string }>('chat', {
            history: [],
            userPrompt: `Analyze this user's year (${year}) from their journal. Respond with ONLY JSON.

Entries sample: ${JSON.stringify(entriesSample)}
Monthly reflections: ${JSON.stringify(reflectionsSample)}

Generate:
1. themes: 3 major themes with title, description, emoji
2. coreMemories: 3 significant moments with date and reason
3. monthSummaries: 1-sentence summary per month

Return JSON: {
  "themes": [{"title": "...", "description": "...", "emoji": "..."}],
  "coreMemories": [{"date": "YYYY-MM-DD", "reason": "..."}],
  "monthSummaries": [{"month": "January", "summary": "..."}]
}`,
            systemInstruction: 'You are creating a Spotify Wrapped-style yearly review. Be warm and celebratory. Return only valid JSON.'
        });

        // Parse JSON from response
        let aiData = { themes: [], coreMemories: [], monthSummaries: [] };
        const responseText = result.response || '{}';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            aiData = JSON.parse(jsonMatch[0]);
        }

        // Map Core Memories back to full entry objects
        const coreMemories = (aiData.coreMemories || []).map((cm: any) => {
            const original = entries.find(e => e.timestamp.startsWith(cm.date));
            return original || { ...entries[0], text: cm.reason, timestamp: cm.date, title: "Core Memory" };
        }).filter(Boolean);

        return {
            year,
            stats,
            themes: aiData.themes || [],
            coreMemories,
            monthByMonth: aiData.monthSummaries || []
        };
    } catch (error) {
        console.error('Error generating yearly review AI content:', error);
        // Return stats without AI-generated content
        return {
            year,
            stats,
            themes: [{ title: "Your Year", description: "A year of growth and reflection", emoji: "🌟" }],
            coreMemories: entries.slice(0, 3),
            monthByMonth: []
        };
    }
};
