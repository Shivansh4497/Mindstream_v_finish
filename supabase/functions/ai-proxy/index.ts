import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

// Use gemini-2.0-flash which supports generateContent
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

interface GeminiRequest {
    action: 'process-entry' | 'chat' | 'suggestions' | 'instant-insight' | 'analyze-habit' | 'extract-keywords';
    payload: Record<string, any>;
}

async function callGemini(prompt: string): Promise<string> {
    console.log(`[AI Proxy] Calling Gemini, prompt length: ${prompt.length}`);

    const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI Proxy] Gemini error ${response.status}:`, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[AI Proxy] Response received, candidates: ${result.candidates?.length}`);

    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error(`[AI Proxy] No text in response:`, JSON.stringify(result).slice(0, 500));
        throw new Error('No response from AI');
    }

    return result.candidates[0].content.parts[0].text;
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
                const prompt = `Analyze if this entry suggests any habits or intentions. Respond with ONLY JSON (no markdown):
Entry: "${entryText}"
${isTest ? "TEST MODE: Always suggest something." : "Only suggest if clearly needed."}

Return: {"suggestions": [{"type": "habit", "text": "...", "emoji": "🎯"}, {"type": "intention", "text": "..."}]}
Return empty suggestions array if nothing to suggest.`;

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
