import { callAIProxy } from './geminiClient';

export interface OnboardingSuggestion {
    type: 'habit' | 'intention';
    name: string;
    emoji: string;
    category?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'life';
}

export interface OnboardingSuggestionsResponse {
    habits: OnboardingSuggestion[];
    intentions: OnboardingSuggestion[];
}

export const generateOnboardingSuggestions = async (
    initialEntry: string
): Promise<OnboardingSuggestionsResponse> => {
    try {
        // Use the suggestions action from the AI proxy
        const result = await callAIProxy<{
            suggestions: Array<{
                type: 'habit' | 'intention';
                label: string;
                emoji?: string;
                data?: {
                    category?: string;
                    frequency?: 'daily' | 'weekly' | 'monthly';
                    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'life';
                };
            }>
        }>('suggestions', {
            entryText: initialEntry,
            isTest: false
        });

        // Transform suggestions into the expected format
        const habits: OnboardingSuggestion[] = [];
        const intentions: OnboardingSuggestion[] = [];

        for (const suggestion of result.suggestions || []) {
            if (suggestion.type === 'habit') {
                habits.push({
                    type: 'habit',
                    name: suggestion.label,
                    emoji: suggestion.emoji || '⚡️',
                    category: suggestion.data?.category || 'System',
                    frequency: suggestion.data?.frequency || 'daily'
                });
            } else if (suggestion.type === 'intention') {
                intentions.push({
                    type: 'intention',
                    name: suggestion.label,
                    emoji: suggestion.emoji || '🎯',
                    timeframe: suggestion.data?.timeframe || 'weekly'
                });
            }
        }

        return { habits, intentions };
    } catch (error) {
        console.error('Error generating onboarding suggestions:', error);
        // Return empty suggestions on error
        return {
            habits: [],
            intentions: []
        };
    }
};
