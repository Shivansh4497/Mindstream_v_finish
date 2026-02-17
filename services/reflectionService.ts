import type { Entry, Intention, AISuggestion, Habit, HabitLog } from '../types';
import { callAIProxy } from './geminiClient';

interface ReflectionResult {
    summary: string;
    suggestions: AISuggestion[];
}

// --- DAILY REFLECTION ---
// --- DAILY REFLECTION ---
export const generateReflection = async (
    entries: Entry[],
    intentions: Intention[],
    habits?: Habit[],
    habitLogs?: HabitLog[],
    targetDate?: string,  // Date for which to generate reflection (YYYY-MM-DD format)
): Promise<ReflectionResult> => {
    const entriesText = entries.map(e =>
        `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.primary_sentiment}: ${e.text}`
    ).join('\n');

    const intentionsText = intentions.map(i =>
        `Goal: ${i.text} (${i.status})`
    ).join('\n');

    // Show whether each habit was completed on the target date
    const habitsText = habits?.map(h => {
        const completedToday = habitLogs?.some(l => l.habit_id === h.id);
        return `Habit: ${h.name} (${completedToday ? 'Done today ✅' : 'Not done today ❌'})`;
    }).join('\n') || '';

    try {
        return await callAIProxy<ReflectionResult>('daily-reflection', {
            entries: entriesText || 'No entries today',
            intentions: intentionsText || 'No active goals',
            habits: habitsText || 'No habits tracked'
        });
    } catch (e) {
        console.error('[Reflection] Daily reflection failed:', e);
        return { summary: 'Unable to generate reflection', suggestions: [] };
    }
};


// --- WEEKLY REFLECTION ---
export const generateWeeklyReflection = async (
    entries: Entry[],
    intentions: Intention[],
    habits?: Habit[],
    habitLogs?: HabitLog[],
    daysInPeriod: number = 7,
): Promise<ReflectionResult> => {
    const entriesText = entries.map(e =>
        `[${new Date(e.timestamp).toLocaleDateString()}] ${e.primary_sentiment}: ${e.text}`
    ).join('\n');

    const intentionsText = intentions.map(i =>
        `Goal: ${i.text} (${i.status})`
    ).join('\n');

    // Show habit completion rates for the week
    const habitsText = habits?.map(h => {
        const completions = habitLogs?.filter(l => l.habit_id === h.id).length || 0;
        return `Habit: ${h.name} (${completions} of ${daysInPeriod} days)`;
    }).join('\n') || '';

    try {
        return await callAIProxy<ReflectionResult>('weekly-reflection', {
            entries: entriesText || 'No entries this week',
            intentions: intentionsText || 'No active goals',
            habits: habitsText || 'No habits tracked'
        });
    } catch (e) {
        console.error('[Reflection] Weekly reflection failed:', e);
        return { summary: 'Unable to generate weekly reflection', suggestions: [] };
    }
};

// --- MONTHLY REFLECTION ---
export const generateMonthlyReflection = async (
    entries: Entry[],
    intentions: Intention[],
    habits?: Habit[],
    habitLogs?: HabitLog[],
    daysInPeriod: number = 30,
): Promise<ReflectionResult> => {
    const entriesText = entries.map(e =>
        `[${new Date(e.timestamp).toLocaleDateString()}] ${e.primary_sentiment}: ${e.title}`
    ).join('\n');

    const intentionsText = intentions.map(i =>
        `Goal: ${i.text} (${i.status})`
    ).join('\n');

    // Show habit completion rates for the month
    const habitsText = habits?.map(h => {
        const completions = habitLogs?.filter(l => l.habit_id === h.id).length || 0;
        const rate = daysInPeriod > 0 ? Math.round((completions / daysInPeriod) * 100) : 0;
        return `Habit: ${h.name} (${completions} of ${daysInPeriod} days - ${rate}%)`;
    }).join('\n') || '';

    try {
        return await callAIProxy<ReflectionResult>('monthly-reflection', {
            entries: entriesText || 'No entries this month',
            intentions: intentionsText || 'No active goals',
            habits: habitsText || 'No habits tracked'
        });
    } catch (e) {
        console.error('[Reflection] Monthly reflection failed:', e);
        return { summary: 'Unable to generate monthly reflection', suggestions: [] };
    }
};

// --- THEMATIC REFLECTION (Uses chat action) ---
export const generateThematicReflection = async (tag: string, entries: Entry[]): Promise<string> => {
    const filteredEntries = entries.filter(e => e.tags?.includes(tag));
    const entriesText = filteredEntries.map(e =>
        `[${new Date(e.timestamp).toLocaleDateString()}] ${e.text}`
    ).join('\n');

    try {
        const result = await callAIProxy<{ response: string }>('chat', {
            history: [],
            userPrompt: `Perform a Thematic Analysis on the tag: "${tag}".
            
Entries tagged with "${tag}":
${entriesText}

Task:
1. Trace the evolution of this theme over time.
2. Identify triggers and resolutions mentioned by the user.
3. Provide a deep, psychological insight about their relationship with this topic.

Format your response in Markdown.`,
            systemInstruction: 'You are an insightful psychology expert analyzing journal entries.'
        });
        return result.response || 'Could not generate reflection.';
    } catch (e) {
        console.error('[Reflection] Thematic reflection failed:', e);
        return 'Unable to generate thematic reflection.';
    }
};

// --- CHAT STARTERS ---
export const generateChatStarters = async (entries: Entry[]): Promise<{ starters: string[] }> => {
    const recentEntries = entries.slice(0, 5).map(e => e.text).join(' | ');

    try {
        const result = await callAIProxy<{ response: string }>('chat', {
            history: [],
            userPrompt: `Based on these recent user thoughts: "${recentEntries}"
Generate 3 short, engaging conversation starter questions to help them dig deeper.
Respond with JSON: { "starters": ["Question 1?", "Question 2?", "Question 3?"] }`,
            systemInstruction: 'You are a helpful assistant. Respond only with valid JSON.'
        });

        // Try to parse JSON from response
        try {
            const match = result.response.match(/\{[\s\S]*\}/);
            if (match) {
                return JSON.parse(match[0]);
            }
        } catch { }

        return { starters: ["What's on your mind?", "How are you feeling?", "Reflect on today"] };
    } catch (e) {
        return { starters: ["What's on your mind?", "How are you feeling?", "Reflect on today"] };
    }
};

// --- DEBUG FUNCTION ---
export const getRawReflectionForDebug = async (): Promise<string> => {
    try {
        const result = await callAIProxy<{ response: string }>('chat', {
            history: [],
            userPrompt: 'Reply with: AI Online',
            systemInstruction: ''
        });
        return result.response || 'No response';
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
};
