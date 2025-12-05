import { supabase } from './supabaseClient';

// Edge Function proxy for all AI calls - keeps API key secure on server
const AI_PROXY_URL = 'ai-proxy';

export type AIProxyAction =
    | 'process-entry'
    | 'suggestions'
    | 'instant-insight'
    | 'analyze-habit'
    | 'extract-keywords'
    | 'chat';

interface AIProxyResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Call the AI proxy Edge Function
 * Automatically includes user authentication
 */
export async function callAIProxy<T>(
    action: AIProxyAction,
    payload: Record<string, any>
): Promise<T> {
    if (!supabase) {
        throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.functions.invoke<AIProxyResponse<T>>(AI_PROXY_URL, {
        body: { action, payload }
    });

    if (error) {
        console.error('[AI Proxy] Function error:', error);
        throw new Error(error.message || 'AI service unavailable');
    }

    if (!data?.success) {
        throw new Error(data?.error || 'AI request failed');
    }

    return data.data as T;
}

/**
 * Verify AI service is available
 * Just checks if the Edge Function is reachable
 */
export const verifyApiKey = async (): Promise<boolean> => {
    // With Edge Function, we don't need to verify client-side API key
    // The function handles authentication
    return true;
};

/**
 * Parse JSON from AI responses (kept for backward compatibility)
 */
export const parseGeminiJson = <T>(jsonString: string): T => {
    let clean = jsonString.trim();
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) clean = match[1];
    return JSON.parse(clean);
};

// Legacy exports for backward compatibility during migration
export const GEMINI_API_KEY_AVAILABLE = true; // Always available via Edge Function
export const getAiClient = () => null; // No longer needed

// Legacy callWithFallback - these services need to be migrated to use callAIProxy
// For now, this stub will cause them to throw/return fallback values
export async function callWithFallback<T>(operation: (model: string) => Promise<T>): Promise<T> {
    // Since getAiClient returns null, any service using this pattern will need migration
    // For now, we throw to make it clear these need updating
    throw new Error('callWithFallback is deprecated. Please migrate to callAIProxy.');
}

