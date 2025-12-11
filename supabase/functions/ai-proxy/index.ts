import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const groqKey = Deno.env.get('GROQ_API_KEY');
const geminiKey = Deno.env.get('GEMINI_API_KEY');

// =============================================================================
// PROVIDER CONFIGURATION
// =============================================================================

// Groq models (primary - most capacity)
const GROQ_API_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL_PRIMARY = 'llama-3.1-70b-versatile';
const GROQ_MODEL_BACKUP = 'llama-3.1-8b-instant';

// Gemini models (fallback)
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL_PRIMARY = 'gemini-2.0-flash';
const GEMINI_MODEL_BACKUP = 'gemini-2.5-flash-lite';

// Startup logging
console.log('[AI Proxy] Initializing multi-provider system...');
console.log('[AI Proxy] GROQ_API_KEY present:', !!groqKey);
console.log('[AI Proxy] GEMINI_API_KEY present:', !!geminiKey);
console.log('[AI Proxy] Provider chain: Groq 70B -> Groq 8B -> Gemini Flash -> Gemini Lite -> Cached');

interface AIRequest {
    action: 'process-entry' | 'chat' | 'suggestions' | 'instant-insight' | 'analyze-habit' | 'analyze-intention' | 'extract-keywords' | 'daily-reflection' | 'weekly-reflection' | 'monthly-reflection' | 'chat-summary' | 'list-models';
    payload: Record<string, any>;
}

// =============================================================================
// PROVIDER CALL FUNCTIONS
// =============================================================================

async function callGroqWithModel(model: string, prompt: string): Promise<string> {
    if (!groqKey) throw new Error('Groq API key not configured');

    console.log(`[AI Proxy] Calling Groq ${model}, prompt length: ${prompt.length}`);

    const response = await fetch(GROQ_API_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2048,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI Proxy] Groq ${model} error ${response.status}:`, errorText);
        throw new Error(`Groq API error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.choices?.[0]?.message?.content) {
        throw new Error('No response from Groq');
    }

    return result.choices[0].message.content;
}

async function callGeminiWithModel(model: string, prompt: string): Promise<string> {
    if (!geminiKey) throw new Error('Gemini API key not configured');

    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${geminiKey}`;
    console.log(`[AI Proxy] Calling Gemini ${model}, prompt length: ${prompt.length}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI Proxy] Gemini ${model} error ${response.status}:`, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response from Gemini');
    }

    return result.candidates[0].content.parts[0].text;
}

// =============================================================================
// CACHED FALLBACK RESPONSES (Layer 8 - Never fails)
// =============================================================================

interface CachedResponses {
    [key: string]: any;
}

const CACHED_FALLBACKS: CachedResponses = {
    'process-entry': {
        title: 'Entry',
        tags: [],
        primary_sentiment: 'Reflective',
        emoji: '📝'
    },
    'suggestions': {
        suggestions: []
    },
    'instant-insight': {
        insight: "Every moment of self-reflection is a step toward understanding yourself better. Take a breath and appreciate that you're here, thinking about what matters to you.",
        followUpQuestion: "What's one small thing you could do right now to feel a bit better?",
        confidence: 0.5
    },
    'analyze-habit': {
        emoji: '✨',
        category: 'Growth'
    },
    'analyze-intention': {
        emoji: '🎯',
        category: 'Growth'
    },
    'extract-keywords': {
        keywords: []
    },
    'chat': {
        response: "I'm taking a brief pause to collect my thoughts. Your reflections are valuable—please try again in just a moment, and I'll be here to help."
    },
    'daily-reflection': {
        summary: "Today brought its own unique lessons. Take a moment to acknowledge your efforts and appreciate how far you've come. Tomorrow offers a fresh start.",
        suggestions: []
    },
    'weekly-reflection': {
        summary: "This week held its own story. Whether filled with progress or challenges, each day contributed to your growth. Look ahead with optimism.",
        suggestions: []
    },
    'monthly-reflection': {
        summary: "Another month has passed in your journey. The experiences, both highs and lows, have shaped who you are becoming. Trust the process and keep moving forward.",
        suggestions: []
    },
    'chat-summary': {
        title: "Conversation Insights",
        summary: "• Unable to generate summary at this time\n• Please try again in a moment",
        prompt_version: 'chat-summary-v1'
    }
};

function getCachedResponse(action: string): any {
    console.log(`[AI Proxy] Using cached fallback for: ${action}`);
    return CACHED_FALLBACKS[action] || { error: 'Unknown action' };
}

// =============================================================================
// MULTI-PROVIDER CALL WITH FALLBACK CHAIN
// =============================================================================

async function callAI(prompt: string, action: string): Promise<string> {
    const providers = [
        { name: 'Groq 70B', fn: () => callGroqWithModel(GROQ_MODEL_PRIMARY, prompt), available: !!groqKey },
        { name: 'Groq 8B', fn: () => callGroqWithModel(GROQ_MODEL_BACKUP, prompt), available: !!groqKey },
        { name: 'Gemini Flash', fn: () => callGeminiWithModel(GEMINI_MODEL_PRIMARY, prompt), available: !!geminiKey },
        { name: 'Gemini Lite', fn: () => callGeminiWithModel(GEMINI_MODEL_BACKUP, prompt), available: !!geminiKey },
    ];

    for (const provider of providers) {
        if (!provider.available) {
            console.log(`[AI Proxy] Skipping ${provider.name} (not configured)`);
            continue;
        }

        try {
            const result = await provider.fn();
            console.log(`[AI Proxy] ✓ ${provider.name} succeeded`);
            return result;
        } catch (error: any) {
            console.warn(`[AI Proxy] ✗ ${provider.name} failed: ${error.message}`);
            // Continue to next provider
        }
    }

    // All providers failed - this should never happen, but return cached as JSON string
    console.error('[AI Proxy] All providers failed! Using cached response.');
    return JSON.stringify(getCachedResponse(action));
}

function parseJSON<T>(text: string): T {
    // Clean markdown code blocks if present
    let clean = text.trim();
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) clean = match[1];

    // Sanitize control characters inside JSON strings
    // This fixes AI responses that use actual newlines instead of \n
    clean = clean.replace(/[\x00-\x1F]/g, (char) => {
        switch (char) {
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            default: return '';
        }
    });

    return JSON.parse(clean);
}

// Normalize reflection response - Llama often returns nested objects instead of plain summary
function normalizeReflection(parsed: any): { summary: string; suggestions: any[] } {
    let summary = '';

    // Try to extract summary from various possible fields
    if (typeof parsed.summary === 'string') {
        summary = parsed.summary;
    } else if (typeof parsed.text === 'string') {
        summary = parsed.text;
    } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        // If summary is an object, try to concatenate its values
        const fields = ['picture', 'emotional_arc', 'sentiment_arc', 'text', 'description', 'mood_to_action', 'win', 'improvement', 'goal_progress', 'pattern'];
        const parts: string[] = [];
        for (const field of fields) {
            if (parsed[field] && typeof parsed[field] === 'string') {
                parts.push(parsed[field]);
            }
        }
        if (parts.length > 0) {
            summary = parts.join(' ');
        } else if (parsed.summary && typeof parsed.summary === 'object') {
            // Nested summary object
            summary = Object.values(parsed.summary).filter(v => typeof v === 'string').join(' ');
        }
    }

    // Normalize suggestions
    let suggestions = parsed.suggestions || [];
    if (!Array.isArray(suggestions)) suggestions = [];

    return { summary: summary || 'Unable to generate reflection', suggestions };
}

// =============================================================================
// RATE LIMITING
// =============================================================================

const userCallCounts: Map<string, { count: number; resetAt: number }> = new Map();
const RATE_LIMIT = 200; // Increased since we have more capacity now
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = userCallCounts.get(userId);
    if (!userLimit || userLimit.resetAt < now) {
        userCallCounts.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    if (userLimit.count >= RATE_LIMIT) return false;
    userLimit.count++;
    return true;
}

// =============================================================================
// MAIN REQUEST HANDLER
// =============================================================================

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Missing authorization' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: { user }, error: userError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (userError || !user) {
            console.error('[AI Proxy] Auth error:', userError);
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`[AI Proxy] Authenticated user: ${user.id}`);

        // Rate limiting
        if (!checkRateLimit(user.id)) {
            return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Parse request
        const { action, payload }: AIRequest = await req.json();
        console.log(`[AI Proxy] Action: ${action}`);

        let result: any;

        try {
            switch (action) {
                case 'list-models': {
                    result = {
                        providers: {
                            groq: { available: !!groqKey, models: [GROQ_MODEL_PRIMARY, GROQ_MODEL_BACKUP] },
                            gemini: { available: !!geminiKey, models: [GEMINI_MODEL_PRIMARY, GEMINI_MODEL_BACKUP] },
                            cached: { available: true, models: ['fallback-templates'] }
                        }
                    };
                    break;
                }

                case 'process-entry': {
                    const { entryText } = payload;
                    const prompt = `Analyze this journal entry and respond with ONLY a JSON object (no markdown, no code blocks):
Entry: "${entryText}"

Return JSON in this exact format:
{"title": "Short Title", "tags": ["tag1", "tag2"], "primary_sentiment": "Reflective", "emoji": "🌟"}

EMOJI RULES:
- Choose an emoji that reflects the EMOTION or TOPIC of the entry
- Match the mood: 😓 for stress, 😊 for joy, 💪 for productivity, 😔 for sadness, 🎉 for celebration
- Match the topic: 💻 for coding, 🏋️ for exercise, 💼 for work, 🏠 for home, 💡 for ideas
- NEVER use 📓 or 📝 - too generic. Be specific to the content.

Sentiments must be one of: Joyful, Grateful, Proud, Hopeful, Content, Anxious, Frustrated, Sad, Overwhelmed, Confused, Reflective, Inquisitive, Observational`;

                    const response = await callAI(prompt, action);
                    result = parseJSON(response);
                    break;
                }

                case 'suggestions': {
                    const { entryText, isTest } = payload;
                    const prompt = `You are a wise, selective coach. Analyze this journal entry. Respond with ONLY JSON.

Entry: "${entryText}"

RULES:
- Only suggest if the entry shows CLEAR intent to change behavior, build a habit, or achieve a goal
- NO suggestions for: test entries, casual observations, vague statements, technical notes
- Maximum 1-2 suggestions total (prefer 0-1)
- Labels must be SHORT (5-7 words max), actionable, specific
- Use "habit" for recurring behaviors, "intention" for one-time goals
${isTest ? "- TEST MODE: Override rules, always return one habit and one intention." : "- Be VERY selective. When in doubt, return empty array."}

Return: {"suggestions": [{"type": "habit", "label": "Meditate 5 mins daily", "data": {"frequency": "daily"}}, {"type": "intention", "label": "Run first 5K by March", "data": {"timeframe": "weekly"}}]}
If entry doesn't warrant suggestions, return: {"suggestions": []}`;

                    const response = await callAI(prompt, action);
                    result = parseJSON(response);
                    break;
                }

                case 'instant-insight': {
                    const { text, sentiment, lifeArea, trigger } = payload;
                    const prompt = `You are a wise coach. Respond with ONLY JSON (no markdown):
User feeling: ${sentiment}
Life area: ${lifeArea}
Trigger: ${trigger}
Entry: "${text}"

Provide an empathetic insight and follow-up question. Rate confidence 0.0-1.0 based on entry quality.
Return: {"insight": "Your insight...", "followUpQuestion": "Your question?", "confidence": 0.8}`;

                    const response = await callAI(prompt, action);
                    result = parseJSON(response);
                    result.confidence = typeof result.confidence === 'number' ? result.confidence : 0.5;
                    break;
                }

                case 'analyze-habit': {
                    const { habitName } = payload;
                    const prompt = `Classify this habit and assign an emoji. Respond with ONLY JSON:
Habit: "${habitName}"
Categories: Health, Growth, Career, Finance, Connection, System
Return: {"emoji": "🏃", "category": "Health"}`;

                    const response = await callAI(prompt, action);
                    result = parseJSON(response);
                    break;
                }

                case 'analyze-intention': {
                    const { intentionText } = payload;
                    const prompt = `Classify this intention/goal and assign an emoji. Respond with ONLY JSON:
Intention: "${intentionText}"
Categories: Health, Growth, Career, Finance, Connection, System
Return: {"emoji": "🎯", "category": "Growth"}`;

                    const response = await callAI(prompt, action);
                    result = parseJSON(response);
                    break;
                }

                case 'extract-keywords': {
                    const { query } = payload;
                    const prompt = `Extract 2-4 search keywords from: "${query}"
Respond with ONLY JSON: {"keywords": ["term1", "term2"]}`;

                    const response = await callAI(prompt, action);
                    result = parseJSON(response);
                    break;
                }

                case 'chat': {
                    const { history, userPrompt, systemInstruction } = payload;

                    let context = systemInstruction ? `${systemInstruction}\n\n` : '';
                    if (history && Array.isArray(history)) {
                        for (const msg of history) {
                            const role = msg.role === 'user' ? 'User' : 'Assistant';
                            const text = msg.parts?.[0]?.text || '';
                            context += `${role}: ${text}\n`;
                        }
                    }
                    context += `User: ${userPrompt}\n\nRespond as a helpful, empathetic assistant:`;

                    const response = await callAI(context, action);
                    result = { response };
                    break;
                }

                case 'daily-reflection': {
                    const { entries, intentions, habits } = payload;
                    const prompt = `You are the user's thoughtful life coach. Generate a Daily Reflection. Respond with ONLY valid JSON.

TODAY'S DATA:
Entries: ${entries || 'No entries today'}
Pending Goals: ${intentions || 'No active goals'}
Habits Already Tracked: ${habits || 'No habits'}

VOICE RULES (CRITICAL):
- ALWAYS use second-person: "you felt", "you did", "your day"
- NEVER use third-person: "they", "the user", "one"
- Speak directly TO the user, not ABOUT them
- Use pattern language when relevant: "you tend to...", "when you..., you usually..."

YOUR TASK - SUMMARY (3-5 sentences):
- Paint a picture of YOUR day. What was the emotional arc?
- Connect your mood (from entries) to your actions (habits completed, goals progressed)
- Celebrate ONE specific win - be precise, name the actual thing you did
- Offer ONE gentle observation about what could improve - be kind, not preachy
- Don't include exact timestamps - use natural time references ("this morning", "later")

YOUR TASK - SUGGESTIONS (max 1, can be empty):
CRITICAL: Do NOT suggest something already tracked as a habit! Check "Habits Already Tracked" above.
- Only suggest a NEW intention/goal, never an existing habit
- MUST reference SPECIFIC items from the entries or pending goals
- The suggestion must DIRECTLY relate to something mentioned in the entries
- Format: 5-12 words max, actionable
- BAD: "Prioritize your goals" (generic)
- BAD: "Take a break before emails" (if emails weren't mentioned)
- GOOD: "Tomorrow: finish the Mindstream migration" (specific from data)
- If day was balanced or data is sparse, return empty array []

Return: {"summary": "Your personalized daily story...", "suggestions": [{"text": "Short actionable text", "type": "intention", "timeframe": "daily"}]}`;

                    const response = await callAI(prompt, action);
                    result = normalizeReflection(parseJSON(response));
                    break;
                }

                case 'weekly-reflection': {
                    const { entries, intentions, habits } = payload;
                    const prompt = `You are the user's strategic life coach. Generate a Weekly Reflection. Respond with ONLY valid JSON.

THIS WEEK'S DATA:
Entries: ${entries || 'No entries this week'}
Goals: ${intentions || 'No active goals'}
Habits Tracked: ${habits || 'No habits'}

VOICE RULES (CRITICAL):
- ALWAYS use second-person: "you felt", "you did", "your week"
- NEVER use third-person: "they", "the user", "one"
- Speak directly TO the user, not ABOUT them
- Use pattern language: "you tend to...", "when you..., you usually..."

YOUR TASK - SUMMARY (3-5 sentences):
- What was the dominant emotional theme YOUR week?
- How did YOU progress on your stated goals? Be specific about which ones
- What pattern do you notice in your entries?
- End with an encouraging observation about YOUR trajectory

YOUR TASK - SUGGESTIONS (max 1):
CRITICAL: Must be 15 words or fewer. One short sentence only.
- MUST reference a SPECIFIC goal or pattern from the data
- The suggestion must DIRECTLY relate to something mentioned in the entries
- Do NOT suggest things already tracked as habits
- BAD: "Given the consistent theme of sleep affecting your performance..." (too long!)
- GOOD: "Break 'Launch project' into 3 small daily tasks" (short, specific)
- If week was balanced, return empty array []

Return: {"summary": "Your weekly story arc...", "suggestions": [{"text": "Max 15 words action item", "type": "intention", "timeframe": "weekly"}]}`;

                    const response = await callAI(prompt, action);
                    result = normalizeReflection(parseJSON(response));
                    break;
                }

                case 'monthly-reflection': {
                    const { entries, intentions } = payload;
                    const prompt = `You are the user's wise life coach. Generate a Monthly Reflection. Respond with ONLY valid JSON.

THIS MONTH'S DATA:
Entries: ${entries || 'No entries this month'}
Goals: ${intentions || 'No active goals'}

VOICE RULES (CRITICAL):
- ALWAYS use second-person: "you", "your", "you've"
- NEVER use third-person: "they", "the user", "one"
- Speak directly TO the user, not ABOUT them

YOUR TASK - SUMMARY (4-6 sentences as ONE paragraph):
Write a cohesive narrative paragraph that includes:
- A "chapter title" feeling (e.g., "This was YOUR month of...")
- The sentiment arc: how did YOU start vs end the month?
- Which of YOUR goals saw progress? Which got stuck? Be specific by name
- What life area (Health, Career, Relationships, Growth) got the most of YOUR attention?
- End with an inspiring observation about YOUR growth

IMPORTANT: Return summary as a PLAIN TEXT string, not nested JSON. No chapter_title field, no sentiment_arc field - just one flowing paragraph.

YOUR TASK - SUGGESTIONS (max 1):
- Should be a meaningful goal for YOUR next month
- MUST connect to something specific from your entries
- Maximum 15 words
- MUST connect to patterns you noticed in their data
- BAD: "Set clearer goals" (generic advice)
- GOOD: "Next month: dedicate mornings to 'Learn Spanish'" (specific)
- If month was well-balanced, return empty array []

Return exactly this format:
{"summary": "This month you... (full paragraph here)...", "suggestions": [{"text": "Next month: specific action", "type": "intention", "timeframe": "monthly"}]}`;

                    const response = await callAI(prompt, action);
                    result = normalizeReflection(parseJSON(response));
                    break;
                }

                case 'chat-summary': {
                    const { messages } = payload;
                    const prompt = `Summarize this conversation into key takeaways.

CONVERSATION:
${messages}

Respond with valid JSON only. Use | to separate bullet points (NOT newlines):
{"title": "short title", "summary": "• point one | • point two | • point three"}

Rules:
- title: 3-7 words
- summary: 2-4 bullets separated by |
- Focus on insights, use "you/your"
- Under 50 words total`;

                    console.log('[AI Proxy] chat-summary: Calling AI with prompt length:', prompt.length);
                    let response = await callAI(prompt, action);
                    console.log('[AI Proxy] chat-summary: Raw AI response:', response?.substring(0, 500));

                    let parsed: any = null;
                    try {
                        // First try direct parse
                        parsed = JSON.parse(response.trim());
                    } catch (e1) {
                        console.log('[AI Proxy] chat-summary: Direct parse failed, trying cleanup...');
                        try {
                            // Try extracting JSON from markdown
                            let clean = response.trim();
                            const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                            if (match && match[1]) clean = match[1];
                            // Remove any actual newlines inside the JSON string
                            clean = clean.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
                            parsed = JSON.parse(clean);
                        } catch (e2) {
                            console.error('[AI Proxy] chat-summary: JSON parse failed:', e2);
                        }
                    }
                    console.log('[AI Proxy] chat-summary: Parsed result:', JSON.stringify(parsed));

                    // Convert pipe separators to newlines in summary
                    if (parsed?.summary) {
                        parsed.summary = parsed.summary.replace(/\s*\|\s*/g, '\n');
                    }

                    // Validation: must have title, summary, and bullet points
                    const isValid = parsed?.title &&
                        parsed?.summary &&
                        typeof parsed.summary === 'string' &&
                        parsed.summary.includes('•');

                    // Retry once if invalid
                    if (!isValid) {
                        console.log('[AI Proxy] chat-summary: Invalid response, retrying...');
                        response = await callAI(prompt, action);
                        console.log('[AI Proxy] chat-summary: Retry raw response:', response?.substring(0, 500));
                        try {
                            let clean = response.trim();
                            const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                            if (match && match[1]) clean = match[1];
                            clean = clean.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
                            parsed = JSON.parse(clean);
                            if (parsed?.summary) {
                                parsed.summary = parsed.summary.replace(/\s*\|\s*/g, '\n');
                            }
                        } catch (e) {
                            console.error('[AI Proxy] chat-summary: Retry JSON parse failed:', e);
                            parsed = null;
                        }
                        console.log('[AI Proxy] chat-summary: Retry parsed:', JSON.stringify(parsed));
                    }

                    // Final validation - return error if still invalid
                    if (!parsed?.title || !parsed?.summary) {
                        console.error('[AI Proxy] chat-summary: Final validation failed, parsed:', parsed);
                        return new Response(JSON.stringify({
                            success: false,
                            error: 'Failed to generate valid summary',
                            prompt_version: 'chat-summary-v2'
                        }), {
                            status: 200,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    }

                    result = {
                        title: parsed.title,
                        summary: parsed.summary,
                        prompt_version: 'chat-summary-v2'
                    };
                    break;
                }

                default:
                    return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
            }
        } catch (parseError: any) {
            // JSON parsing failed even after all providers - use cached fallback
            console.error(`[AI Proxy] Parse error for ${action}:`, parseError.message);
            result = getCachedResponse(action);
        }

        console.log(`[AI Proxy] Success for action: ${action}`);
        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[AI Proxy] Critical error:', error.message);

        // Even on critical error, try to return something useful
        // Parse action from request if possible
        try {
            const { action } = await req.clone().json();
            const fallback = getCachedResponse(action);
            return new Response(JSON.stringify({ success: true, data: fallback }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } catch {
            return new Response(JSON.stringify({ success: false, error: error.message || 'Internal error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
});
