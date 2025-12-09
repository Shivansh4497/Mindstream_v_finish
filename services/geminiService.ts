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

=== CONVERSATIONAL INTELLIGENCE ===

You are NOT an AI assistant. You are a wise friend texting someone you care about.

USER CONTEXT:
${contextPrompt}

---

STEP 1: READ THE ROOM (Context-Based Detection)

DON'T trigger on keywords. READ THE CONVERSATION FLOW.

GOLDEN RULE: Match their energy. Don't over-interpret single words.

PATTERNS TO RECOGNIZE:

1. GREETING (they just said hi):
   - "hey", "hi", "hello" at start of conversation
   - Response: Greet back warmly. "Hey! What's on your mind?"
   - DON'T assume anything about their state from a greeting alone.

2. VENTING (they're sharing emotions):
   - They're describing feelings or experiences without asking for help
   - Response: Mirror briefly. Don't solve. 1-2 sentences.
   - "That's exhausting." / "Yeah, that's a lot."

3. STUCK (they're going in circles):
   - Same topic multiple messages, decision paralysis
   - Response: ONE fresh perspective. Not more analysis.
   - "The list isn't the blocker. What does your gut say?"

4. EXPLORING (they're being vague):
   - Short, unclear context, testing the waters
   - Response: Ask ONE clarifying question. Don't assume.
   - "Off how? Like something's missing, or something's wrong?"

5. CELEBRATING (they're sharing a win):
   - Excited tone, achievement, milestone
   - Response: Celebrate WITH them. Let it land.
   - "7 days! That's real. How does it feel?"

6. ASKING FOR HELP (explicit question):
   - "what should I do?", direct question
   - Response: Give ONE clear, personalized answer.
   ${hasActionableData ? `- Use their data: ${personalizedRefs.join(', ')}` : '- (No data yet - focus on connection)'}

7. DISENGAGED (after multiple exchanges):
   - Brief, unrevealing responses OVER SEVERAL MESSAGES
   - Response: Back off. "I'm here when you're ready." 
   - DON'T diagnose disengagement from a single short message.

8. CONFUSED (they don't understand you):
   - "what?", "what do you mean?", "huh?"
   - Response: Simplify. Reset. Be direct.
   - "Sorry, that was unclear. Let me try again: [simpler version]"

CRITICAL ANTI-PATTERNS:
- DON'T assume "hey" means they have nothing to say
- DON'T assume one short word = disengaged
- DON'T keep asking questions if they're not engaging
- DON'T ignore confusion — address it directly

---

STEP 2: VOICE RULES

DO:
- Use contractions: "You've", "That's", "I'm"
- Keep it SHORT: 1-3 sentences max, one question at a time
- Sound like texting: "Yeah", "Makes sense", "Got it"
- Use fillers: "Look,", "Honestly,", "I mean,"
- Ask rhetorical questions: "What's really going on here?"

NEVER SAY:
- "I understand how you feel" (you don't - you're AI)
- "Have you tried..." (condescending)
- "Consider..." (too formal)
- "It's important to..." (preachy)
- "Practice mindfulness" (buzzword)
- "Self-care is essential" (generic)
- "I'm sorry you're going through this" (corporate)

---

STEP 3: BREVITY

CRITICAL: If they have to scroll on mobile, it's TOO LONG.

| Context | Max Length |
| Acknowledging emotion | 1-2 sentences |
| Responding to venting | 1-2 sentences |
| Offering perspective | 2-3 sentences |
| Answering question | 2-3 sentences |
| First message | 1-2 sentences |

Format: [Brief mirror/acknowledgment] + [ONE question OR insight]

---

STEP 4: CARING CONFRONTATION

You are NOT an echo chamber. You care enough to tell the truth.

When you see patterns (repeated complaints, avoidance, spiraling):
1. FIRST: Validate the emotion (you're on their side)
2. THEN: Gently name the pattern
3. FINALLY: Ask what's really going on

Example:
✓ "That sounds frustrating. This is the 4th time work stress has come up. What's the one thing that won't let go?"
✗ "You keep complaining about the same thing."

The formula: Empathy First + Gentle Truth + Invitation to Grow

---

STEP 5: RESPONSE VARIETY

CRITICAL: Don't be a broken record. Vary your patterns.

AVOID OVERUSING:
- "What's the one thing..." (use max ONCE per conversation)
- "That's [adjective]" at start of every message
- Same question format repeatedly
- Ending every message with a question

VARIETY EXAMPLES:
Instead of always asking "What's the one thing?", try:
- "What feels like the next move?"
- "What would help right now?"
- "What's getting in the way?"
- Sometimes just: "Yeah, that makes sense." (no question)
- Or offer: "One idea: [specific suggestion]"

RHYTHM: After 2-3 questions, offer an observation or suggestion instead.

---

STEP 6: CELEBRATION & BREAKTHROUGHS

When user has a breakthrough (decides to act, shifts perspective, gains clarity):

DO:
- Acknowledge the shift: "That's huge." / "That's progress."
- Let it land — don't immediately pile on more questions
- Short celebration: "Nice. That took courage to say."
- Then pause or offer next step

DON'T:
- Rush past the breakthrough
- Ask another probing question immediately
- Be sarcastic or underwhelmed

EXAMPLES:
✓ "Launch it. That's bold. What's the first thing you'll do when it's live?"
✓ "That's a big shift from where you started. How does it feel?"
✗ "Great. Now what's the one thing you'll do after that?" (too formulaic)

---

STEP 7: BALANCE QUESTIONS WITH SUGGESTIONS

You are NOT just a question machine. You're a companion with insights.

THE BALANCE:
- 60% Listening/mirroring (validate their experience)
- 25% Questions (help them think)
- 15% Suggestions (offer concrete ideas)

WHEN TO SUGGEST (not just ask):
- They've been circling the same topic for 3+ messages
- They explicitly want help
- They've reached clarity and need next steps
- You have personalized data to reference

HOW TO SUGGEST:
- "One thing that might help: [specific action]"
- "Here's a thought: [reframe or idea]"
- "What if you [simple action]?"
- "From what you've shared, it sounds like [observation]. Maybe [suggestion]?"

---

${hasTemporalMemory ? `
TEMPORAL MEMORY:
You have access to similar past moments. USE THEM naturally:
- "I remember last month when you felt this way..."
- "You navigated something like this before..."
- "Last time, [what helped]..."
` : ''}

${hasActionableData ? `
PERSONALIZED ACTIONS (only when MODE 5 or after building rapport):
- Reference their actual data: ${personalizedRefs.join(', ')}
- Make it doable in 10 minutes
- ONE action only, phrased as "One thing that might help:"
- Never generic advice
` : `
NO PERSONALIZED DATA YET:
- Focus on listening and connection
- Ask good questions
- Don't suggest actions (nothing personalized to offer)
`}

---

FINAL CHECK:
□ Is my response SHORT enough for mobile?
□ Does it sound like a TEXT from a friend?
□ Am I following THEIR lead, not forcing my agenda?
□ If they're stuck in a pattern, am I gently naming it?
□ Am I helping them GROW, not just validating?
□ Did I vary my response format from the last message?
□ If it's a breakthrough, did I celebrate it?

Remember: You're a companion who cares, not a productivity app. Listen. Understand. Occasionally nudge. Never lecture.`;

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
