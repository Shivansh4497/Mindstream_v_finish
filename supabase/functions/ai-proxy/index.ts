import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const PRIMARY_MODEL = 'gemini-2.0-flash-exp';
const BACKUP_MODEL = 'gemini-1.5-flash';

interface GeminiRequest {
    action: 'process-entry' | 'chat' | 'suggestions' | 'instant-insight' | 'analyze-habit' | 'extract-keywords';
    payload: Record<string, any>;
}

async function callGemini(model: string, contents: string, responseJson: boolean = true): Promise<any> {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: contents }] }],
            generationConfig: responseJson ? { response_mime_type: 'application/json' } : {}
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid Gemini response format');
    }

    const text = result.candidates[0].content.parts[0].text;
    return responseJson ? JSON.parse(text) : text;
}

async function callWithFallback(contents: string, responseJson: boolean = true): Promise<any> {
    try {
        return await callGemini(PRIMARY_MODEL, contents, responseJson);
    } catch (error: any) {
        if (error.message?.includes('503') || error.message?.includes('429')) {
            console.warn('Primary model failed, trying backup...');
            return await callGemini(BACKUP_MODEL, contents, responseJson);
        }
        throw error;
    }
}

// Rate limiting: Simple in-memory counter (resets on cold start)
const userCallCounts: Map<string, { count: number; resetAt: number }> = new Map();
const RATE_LIMIT = 100; // calls per hour
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = userCallCounts.get(userId);

    if (!userLimit || userLimit.resetAt < now) {
        userCallCounts.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }

    if (userLimit.count >= RATE_LIMIT) {
        return false;
    }

    userLimit.count++;
    return true;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: { user }, error: userError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Rate limiting
        if (!checkRateLimit(user.id)) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Parse request
        const { action, payload }: GeminiRequest = await req.json();

        let result: any;

        switch (action) {
            case 'process-entry': {
                const { entryText } = payload;
                const prompt = `
                    Analyze this journal entry. 
                    1. Generate a short, punchy Title (max 5 words).
                    2. Assign 1-3 relevant Tags.
                    3. Determine Primary Sentiment (from: Joyful, Grateful, Proud, Hopeful, Content, Anxious, Frustrated, Sad, Overwhelmed, Confused, Reflective, Inquisitive, Observational).
                    4. Select a single Emoji that best represents the entry.
                    
                    Entry: "${entryText}"
                    
                    Respond with JSON: { "title": "...", "tags": ["..."], "primary_sentiment": "...", "emoji": "..." }
                `;
                result = await callWithFallback(prompt);
                break;
            }

            case 'suggestions': {
                const { entryText, isTest } = payload;
                const prompt = `Analyze this entry. Does the user express a clear need for a Habit, Intention, or Reflection?
                    Entry: "${entryText}"
                    Rules: ${isTest ? "TEST MODE: FORCE SUGGESTION." : "Be Strict: Return empty if just venting."}
                    Respond with JSON object: { "suggestions": [{ "type": "habit|intention|reflection", "label": "...", "data": {...} }] }`;
                result = await callWithFallback(prompt);
                break;
            }

            case 'instant-insight': {
                const { text, sentiment, lifeArea, trigger } = payload;
                const prompt = `
                    You are a wise, empathetic coach helping someone reflect on their thoughts.
                    
                    USER CONTEXT:
                    - Feeling: "${sentiment}"
                    - Life Area: "${lifeArea}"  
                    - Trigger: "${trigger}"
                    - Their Entry: "${text}"
                    
                    RULES:
                    1. SPECIFICITY: Reference at least 2 specific words or phrases from their entry.
                    2. VARIED OPENINGS: Do NOT start with "It's completely understandable".
                    3. EDGE CASE: If the entry is gibberish or under 3 words, set confidence LOW (0.2-0.4).
                    4. INSIGHT: Offer a concrete perspective shift, not generic encouragement.
                    5. FOLLOW-UP: Ask ONE open-ended question.
                    6. CONFIDENCE: Rate 0.0-1.0 based on entry quality.
                    
                    RESPONSE FORMAT (JSON only):
                    { "insight": "...", "followUpQuestion": "...", "confidence": 0.8 }
                `;
                result = await callWithFallback(prompt);
                // Ensure confidence is a valid number
                result.confidence = typeof result.confidence === 'number' ? result.confidence : 0.5;
                break;
            }

            case 'analyze-habit': {
                const { habitName } = payload;
                const prompt = `
                    Classify this habit into one of these categories: Health, Growth, Career, Finance, Connection, System.
                    Also assign a relevant Emoji.
                    Habit: "${habitName}"
                    JSON Response: { "emoji": "...", "category": "..." }
                `;
                result = await callWithFallback(prompt);
                break;
            }

            case 'extract-keywords': {
                const { query } = payload;
                const prompt = `Extract 2-4 key search terms from this query to find relevant past journal entries. Ignore filler words. 
                    Query: "${query}"
                    Respond with a JSON object: { "keywords": ["term1", "term2"] }`;
                result = await callWithFallback(prompt);
                break;
            }

            case 'chat': {
                const { history, userPrompt, systemInstruction } = payload;

                // Build conversation context
                let conversationContext = systemInstruction ? `${systemInstruction}\n\n` : '';

                if (history && Array.isArray(history)) {
                    for (const msg of history) {
                        const role = msg.role === 'user' ? 'User' : 'Assistant';
                        const text = msg.parts?.[0]?.text || '';
                        conversationContext += `${role}: ${text}\n`;
                    }
                }

                conversationContext += `User: ${userPrompt}\n\nAssistant:`;

                const response = await callWithFallback(conversationContext, false);
                result = { response };
                break;
            }

            default:
                return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('AI Proxy error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
