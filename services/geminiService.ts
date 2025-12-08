import type { Entry, Message, HabitCategory, InstantInsight, EntrySuggestion, UserContext } from '../types';
import { callAIProxy, verifyApiKey, parseGeminiJson, GEMINI_API_KEY_AVAILABLE, getAiClient } from './geminiClient';
import { getPersonality, DEFAULT_PERSONALITY, PersonalityId } from '../config/personalities';

export { verifyApiKey, GEMINI_API_KEY_AVAILABLE, getAiClient };

// --- RAG HELPERS ---

export const extractSearchKeywords = async (userQuery: string): Promise<string[]> => {
    try {
        const result = await callAIProxy<{ keywords: string[] }>('extract-keywords', { query: userQuery });
        return result.keywords || [];
    } catch (e) {
        console.warn("Failed to extract keywords:", e);
        return [];
    }
};

const buildSystemContext = (context: UserContext): string => {
    // Optimize Context Window: Limit tokens by slicing arrays
    const recentEntriesSummary = context.recentEntries
        .slice(0, 10) // Limit to 10 most recent
        .map(e => `- On ${new Date(e.timestamp).toLocaleDateString()}, feeling ${e.primary_sentiment}, I wrote: "${e.text}"`)
        .join('\n');

    const intentionsSummary = context.pendingIntentions
        .slice(0, 10) // Limit to top 10
        .map(i => `- My [${i.timeframe}] goal is: "${i.text}"`)
        .join('\n');

    const habitsSummary = context.activeHabits
        .slice(0, 15) // Limit to 15 habits
        .map(h => `- Habit: ${h.name} (${h.category}, Streak: ${h.current_streak})`)
        .join('\n');

    let contextString = "";

    if (context.searchResults && context.searchResults.length > 0) {
        const historySummary = context.searchResults.map(e =>
            `- [HISTORICAL] On ${new Date(e.timestamp).toLocaleDateString()}: "${e.text}"`
        ).join('\n');
        contextString += `RELEVANT PAST HISTORY (Use this to answer specific questions about the past):\n${historySummary}\n\n`;
    }

    contextString += `CONTEXT from my recent journal entries:\n${recentEntriesSummary || "No recent entries."}\n\n`;
    contextString += `CONTEXT from my active intentions/goals:\n${intentionsSummary || "No active goals."}\n\n`;
    contextString += `CONTEXT from my active habits:\n${habitsSummary || "No habits."}\n\n`;

    if (context.latestReflection) {
        contextString += `CONTEXT: My latest reflection was: "${context.latestReflection.summary}"`;
    }

    return contextString;
}

// --- CHAT ---
// Chat uses a simplified non-streaming approach for now
// Can be upgraded to streaming Edge Function later

export const getChatResponseStream = async (history: Message[], context: UserContext) => {
    const contextPrompt = buildSystemContext(context);
    const personalityId = (context.personalityId as PersonalityId) || DEFAULT_PERSONALITY;
    const personality = getPersonality(personalityId) || getPersonality(DEFAULT_PERSONALITY);

    const systemInstruction = `${personality.systemPrompt}
    
The following is the user's actual context from their journal. ONLY use information that is explicitly provided below — never invent or assume historical data, patterns, tags, or timelines that are not in the context.

${contextPrompt}

CRITICAL RULES:
- NEVER fabricate history. If the context shows few or no entries, the user is new.
- NEVER claim the user has "X days of..." anything unless the context explicitly shows it.
- If the context shows "No recent entries" or minimal data, treat the user as brand new.
- Be empathetic, grounded, and concise.
- If asked about patterns you don't have data for, say "Based on what you've shared so far..." not "I see a pattern of..."`;

    const userPrompt = history[history.length - 1].text;

    const chatHistory = history.slice(0, -1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    // Call the AI proxy with chat action
    const result = await callAIProxy<{ response: string }>('chat', {
        history: chatHistory,
        userPrompt,
        systemInstruction
    });

    // Return an async generator that yields the response at once
    // This maintains compatibility with existing streaming code
    return {
        [Symbol.asyncIterator]: async function* () {
            yield { text: result.response || '' };
        }
    };
}

// --- SILENT OBSERVER & BRIDGES ---

export const generateEntrySuggestions = async (entryText: string): Promise<EntrySuggestion[] | null> => {
    const isTest = entryText.startsWith("TEST:");
    console.log(`[SILENT OBSERVER] Analysis starting... Test: ${isTest}`);

    try {
        const result = await callAIProxy<{ suggestions: EntrySuggestion[] }>('suggestions', {
            entryText,
            isTest
        });
        return result.suggestions?.length > 0 ? result.suggestions : null;
    } catch (e) {
        console.warn("[SILENT OBSERVER] Failed:", e);
        return null;
    }
}

// --- CORE PROCESSING ---

export const processEntry = async (entryText: string): Promise<Omit<Entry, 'id' | 'user_id' | 'timestamp' | 'text'>> => {
    try {
        return await callAIProxy<Omit<Entry, 'id' | 'user_id' | 'timestamp' | 'text'>>('process-entry', {
            entryText
        });
    } catch (e) {
        console.error("[AI] Process entry failed:", e);
        // Return defaults if AI fails
        return { title: "Entry", tags: ["Unprocessed"], emoji: "📝", primary_sentiment: null };
    }
};

export const analyzeHabit = async (habitName: string): Promise<{ emoji: string, category: HabitCategory }> => {
    try {
        return await callAIProxy<{ emoji: string, category: HabitCategory }>('analyze-habit', {
            habitName
        });
    } catch (e) {
        return { emoji: "✨", category: "Growth" };
    }
};

export const generateInstantInsight = async (text: string, sentiment: string, lifeArea: string, trigger: string): Promise<InstantInsight> => {
    try {
        const result = await callAIProxy<InstantInsight>('instant-insight', {
            text,
            sentiment,
            lifeArea,
            trigger
        });

        // Ensure confidence is a valid number
        return {
            ...result,
            confidence: typeof result.confidence === 'number' ? result.confidence : 0.5
        };
    } catch (e) {
        console.error("[AI] Instant insight failed:", e);
        throw new Error("AI service unavailable");
    }
};
