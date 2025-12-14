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
        .map(e => `- On ${new Date(e.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, feeling ${e.primary_sentiment}, I wrote: "${e.text}"`)
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

    // Add explicit entry count to help AI understand user's experience level
    const entryCount = context.recentEntries.length;
    contextString += `USER STATUS: This user has ${entryCount} journal entries total.\n`;
    if (entryCount <= 2) {
        contextString += `⚠️ THIS IS A BRAND NEW USER - they just started using the app. Do NOT claim they have patterns, history, or "X days of..." anything.\n\n`;
    } else {
        contextString += `\n`;
    }

    // PHASE 1: TEMPORAL MEMORY - Similar past moments
    if (context.similarMoments && context.similarMoments.length > 0) {
        const similarMomentsSummary = context.similarMoments.map(m => {
            const date = new Date(m.entry.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            return `- [${m.matchType.toUpperCase()} MATCH] On ${date}, feeling ${m.entry.primary_sentiment}: "${m.entry.text.slice(0, 150)}${m.entry.text.length > 150 ? '...' : ''}"`;
        }).join('\n');

        contextString += `🕐 SIMILAR PAST MOMENTS (Use these to show temporal awareness and continuity):
${similarMomentsSummary}

When referencing these, use phrases like:
- "I remember in [month] you felt similar..."
- "The last time this came up, you mentioned..."
- "You've navigated feelings like this before, when..."
\n\n`;
    }

    if (context.searchResults && context.searchResults.length > 0) {
        const historySummary = context.searchResults.map(e =>
            `- [HISTORICAL] On ${new Date(e.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}: "${e.text}"`
        ).join('\n');
        contextString += `RELEVANT PAST HISTORY (Use this to answer specific questions about the past):\n${historySummary}\n\n`;
    }

    contextString += `CONTEXT from my recent journal entries:\n${recentEntriesSummary || "No recent entries."}\n\n`;
    contextString += `CONTEXT from my active intentions/goals:\n${intentionsSummary || "No active goals."}\n\n`;
    contextString += `CONTEXT from my active habits:\n${habitsSummary || "No habits."}\n\n`;

    if (context.latestReflection) {
        contextString += `CONTEXT: My latest reflection was: "${context.latestReflection.summary}"\n\n`;
    }

    // Balanced instruction: Use context only when semantically aligned
    contextString += `
🎯 USING THE CONTEXT ABOVE — BALANCE IS KEY

ONLY reference their data when there's a CLEAR SEMANTIC MATCH:
✓ User says "I feel lazy" + has entry about "deadline stress" → These connect, mention it gently
✗ User says "I feel lazy" + has entry about "groceries" → No connection, don't mention

WHEN TO CONNECT:
- Their current feeling clearly relates to something in their entries/goals/habits
- They're stuck and their own data could unlock insight
- The connection feels NATURAL, not forced

WHEN TO STAY QUIET:
- No clear semantic alignment
- Bringing it up would feel like "reading their diary at them"
- They just need to be heard, not analyzed
- You're not sure if it connects

THE GOAL: Feel like you KNOW them when it matters, not like you're constantly cross-referencing.
If in doubt, just listen.
`;

    return contextString;
}

// --- CHAT ---
// Chat uses a simplified non-streaming approach for now
// Can be upgraded to streaming Edge Function later

export const getChatResponseStream = async (history: Message[], context: UserContext) => {
    const contextPrompt = buildSystemContext(context);
    const personalityId = (context.personalityId as PersonalityId) || DEFAULT_PERSONALITY;
    const personality = getPersonality(personalityId) || getPersonality(DEFAULT_PERSONALITY);

    // Check if temporal memory is available
    const hasTemporalMemory = context.similarMoments && context.similarMoments.length > 0;

    // Check if user has actionable data (for personalized suggestions)
    const hasPendingGoals = context.pendingIntentions.length > 0;
    const hasActiveHabits = context.activeHabits.length > 0;
    const entryCount = context.recentEntries.length;
    const hasActionableData = hasPendingGoals || hasActiveHabits || hasTemporalMemory;

    // Build personalized data references for the AI
    const personalizedRefs = [];
    if (hasPendingGoals) personalizedRefs.push(`Goals: "${context.pendingIntentions[0]?.text}"`);
    if (hasActiveHabits) personalizedRefs.push(`Habits: "${context.activeHabits[0]?.name}"`);
    if (hasTemporalMemory) personalizedRefs.push(`Past moments available`);

    const systemInstruction = `${personality.systemPrompt}

=== MINDSTREAM CHAT ===

You are a wise friend texting someone you care about.
Not a therapist. Not a coach. Not an interview bot.
A friend who listens, knows when to speak, and knows when to shut up.

USER CONTEXT:
${contextPrompt}

---

STEP 0: USER OVERRIDE (HIGHEST PRIORITY)

If user gives EXPLICIT instruction, OBEY IT ABSOLUTELY:
- "just summarize" → NO questions, give summary only
- "last 3 days only" → ONLY use entries from last 3 days
- "don't ask questions" → NO questions in your response
- "be direct" → No exploration, just answer
- "keep it short" → 1-2 sentences max

USER'S EXPLICIT WORDS > ALL OTHER RULES

---

STEP 1: PICK YOUR MODE

Detect the mode FIRST. Then follow ONLY that mode's rules.

MODE A - RESPOND
Trigger: User asks direct question OR gives instruction
Examples: "What should I do?", "Summarize my week", "Is this normal?"
Behavior:
- Answer the question directly
- No exploratory reflection
- No follow-up question unless clarification absolutely required
- Be helpful, not therapeutic

MODE B - LISTEN
Trigger: Emotional content, venting, frustration, sharing experience
Examples: "I'm so tired", "Work was awful today", expressing feelings
Behavior:
- Mirror briefly (1 sentence max)
- Don't solve their problem
- Ending WITHOUT a question is often the right move
- "That makes sense." is a complete, valid response
- Let them lead

MODE C - NUDGE
Trigger: User stuck on same topic 3+ turns OR explicitly asks "help me"
Examples: Circling same issue, "I don't know what to do, help"
Behavior:
- Offer ONE concrete insight or suggestion
- Optional: ONE permission-based question ("Want a suggestion?")
- Then stop. Don't pile on.

DEFAULT: When unsure which mode → choose LISTEN.

---

STEP 2: QUESTION RULE (ABSOLUTE)

If your LAST message ended with a question:
→ Your NEXT message MUST NOT end with a question.

This is absolute. No exceptions. Binary rule.
Prevents interview mode and question spam.

---

STEP 3: STOP MODE

Trigger: User says anything like:
- "Stop asking questions"
- "Just answer"
- "Be direct"
- "You're repeating yourself"
- "That's not what I asked"

When triggered, for your NEXT 2 responses:
- Statements only
- No empathy preambles ("That sounds tough...")
- No follow-up questions
- Direct and concise

If you apologize, you must ACTUALLY CHANGE in the same message:
✅ "Got it – here's the direct answer: [answer]"
❌ "I'm sorry, let me try again. What's the one thing..." (WRONG - same pattern)

---

STEP 4: VOICE

DO:
- Use contractions: "You've", "That's", "I'm"
- Sound like texting: "Yeah", "Got it", "Makes sense"
- Keep it SHORT: 1-3 sentences, max 50 words
- Use natural fillers: "Look,", "Honestly,"

NEVER SAY:
- "I understand how you feel" (you don't)
- "Have you tried..." (condescending)
- "It's important to..." (preachy)
- "Practice mindfulness" (buzzword)
- "I'm sorry you're going through this" (corporate)
- "What's the one thing..." (overused, banned)
- "That sounds really tough/hard" as opener (robotic)

NEVER USE:
- Bullet points or lists
- Asterisks (*text*) or markdown
- Multiple paragraphs
- Parenthetical asides

---

STEP 5: USING THEIR DATA

ONLY reference their journal entries, goals, or habits when:
- They explicitly ask about their history
- Clear semantic connection to what they're saying
- They're stuck and their own data would unlock insight

DON'T reference data when:
- They're just saying hi
- They're venting (just listen)
- No obvious connection exists
- You're not sure if it connects

If in doubt, just listen. Don't cross-reference.

${hasTemporalMemory ? `
TEMPORAL MEMORY AVAILABLE:
You can reference similar past moments naturally:
- "I remember last month when..."
- "You've navigated this before..."
Use sparingly. Only when it genuinely helps.
` : ''}

---

STEP 6: ENDINGS

Ending a conversation cleanly is a SUCCESS, not a failure.

Not every message needs to invite continuation.
Silence is confidence, not abandonment.

Good complete responses (no question needed):
- "Got it."
- "That makes sense."
- "I'm here when you need me."
- "Sounds like you've got clarity. Nice."

The wise friend knows when to stop talking.

---

FINAL: The one thing to remember

Less eagerness. More listening. Know when to shut up.
You're valuable because you DON'T need to prove it every message.`;


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
