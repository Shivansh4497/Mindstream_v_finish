import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

// Model configuration with fallback
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const PRIMARY_MODEL = 'gemini-2.0-flash';
const BACKUP_MODEL = 'gemini-2.5-flash';

interface GeminiRequest {
    action: 'process-entry' | 'chat' | 'suggestions' | 'instant-insight' | 'analyze-habit' | 'analyze-intention' | 'extract-keywords' | 'daily-reflection' | 'weekly-reflection' | 'monthly-reflection';
    payload: Record<string, any>;
}

async function callGeminiWithModel(model: string, prompt: string): Promise<string> {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${geminiKey}`;
    console.log(`[AI Proxy] Calling ${model}, prompt length: ${prompt.length}`);

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
        console.error(`[AI Proxy] ${model} error ${response.status}:`, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response from AI');
    }

    return result.candidates[0].content.parts[0].text;
}

async function callGemini(prompt: string): Promise<string> {
    try {
        return await callGeminiWithModel(PRIMARY_MODEL, prompt);
    } catch (error: any) {
        console.warn(`[AI Proxy] Primary model failed, trying backup...`);
        return await callGeminiWithModel(BACKUP_MODEL, prompt);
    }
}

function parseJSON<T>(text: string): T {
    // Clean markdown code blocks if present
    let clean = text.trim();
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) clean = match[1];
    return JSON.parse(clean);
}

// Rate limiting
const userCallCounts: Map<string, { count: number; resetAt: number }> = new Map();
const RATE_LIMIT = 100;
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
        const { action, payload }: GeminiRequest = await req.json();
        console.log(`[AI Proxy] Action: ${action}`);

        let result: any;

        switch (action) {
            case 'process-entry': {
                const { entryText } = payload;
                const prompt = `Analyze this journal entry and respond with ONLY a JSON object (no markdown, no code blocks):
Entry: "${entryText}"

Return JSON in this exact format:
{"title": "Short Title", "tags": ["tag1", "tag2"], "primary_sentiment": "Reflective", "emoji": "📝"}

Sentiments must be one of: Joyful, Grateful, Proud, Hopeful, Content, Anxious, Frustrated, Sad, Overwhelmed, Confused, Reflective, Inquisitive, Observational`;

                const response = await callGemini(prompt);
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

                const response = await callGemini(prompt);
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

                const response = await callGemini(prompt);
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

                const response = await callGemini(prompt);
                result = parseJSON(response);
                break;
            }

            case 'analyze-intention': {
                const { intentionText } = payload;
                const prompt = `Classify this intention/goal and assign an emoji. Respond with ONLY JSON:
Intention: "${intentionText}"
Categories: Health, Growth, Career, Finance, Connection, System
Return: {"emoji": "🎯", "category": "Growth"}`;

                const response = await callGemini(prompt);
                result = parseJSON(response);
                break;
            }

            case 'extract-keywords': {
                const { query } = payload;
                const prompt = `Extract 2-4 search keywords from: "${query}"
Respond with ONLY JSON: {"keywords": ["term1", "term2"]}`;

                const response = await callGemini(prompt);
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

                const response = await callGemini(context);
                result = { response };
                break;
            }

            case 'daily-reflection': {
                const { entries, intentions, habits } = payload;
                const prompt = `Generate a Daily Reflection based on today's data. Respond with ONLY JSON.

Entries:
${entries || 'No entries today'}

Goals/Intentions:
${intentions || 'No active goals'}

Habits:
${habits || 'No habits tracked'}

Task:
1. Synthesize the user's day. Find connections between their mood (entries) and their actions (habits/goals).
2. Highlight one key win and one gentle observation for improvement.
3. Suggest 1-2 actionable intentions for tomorrow.

Return: {"summary": "Your insightful summary...", "suggestions": [{"text": "Do X tomorrow", "timeframe": "daily"}]}`;

                const response = await callGemini(prompt);
                result = parseJSON(response);
                break;
            }

            case 'weekly-reflection': {
                const { entries, intentions } = payload;
                const prompt = `Generate a Weekly Reflection. Respond with ONLY JSON.

Entries from this week:
${entries || 'No entries this week'}

Goals/Intentions:
${intentions || 'No active goals'}

Task:
1. Identify the dominant emotional theme of the week.
2. Summarize progress on intentions.
3. Offer a strategic focus for next week.

Return: {"summary": "Your weekly synthesis...", "suggestions": [{"text": "Focus on X next week", "timeframe": "weekly"}]}`;

                const response = await callGemini(prompt);
                result = parseJSON(response);
                break;
            }

            case 'monthly-reflection': {
                const { entries, intentions } = payload;
                const prompt = `Generate a Monthly Reflection. This is a high-level review. Respond with ONLY JSON.

Entries (titles & sentiments):
${entries || 'No entries this month'}

Goals/Intentions:
${intentions || 'No active goals'}

Task:
1. Summarize the "Chapter Title" for this month.
2. Analyze how the user's sentiment has evolved.
3. Suggest a Life/Monthly Goal for next month.

Return: {"summary": "Your month in review...", "suggestions": [{"text": "Consider X for next month", "timeframe": "monthly"}]}`;

                const response = await callGemini(prompt);
                result = parseJSON(response);
                break;
            }

            default:
                return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

        console.log(`[AI Proxy] Success for action: ${action}`);
        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[AI Proxy] Error:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message || 'Internal error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
