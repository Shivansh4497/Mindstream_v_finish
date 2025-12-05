import { callAIProxy } from './geminiClient';

interface ChartInsightsInput {
    entries: Array<{
        timestamp: string;
        primary_sentiment?: string;
        title?: string;
    }>;
    habits: Array<{
        id: string;
        name: string;
        emoji: string;
    }>;
    habitLogs: Array<{
        habit_id: string;
        completed_at: string;
    }>;
}

interface ChartInsightsOutput {
    dailyPulse: string;
    correlation: string;
    sentiment: string;
    heatmaps: string[];
}

export async function generateChartInsights(
    data: ChartInsightsInput
): Promise<ChartInsightsOutput> {
    try {
        // Build data summary for the prompt
        const entriesSummary = data.entries.slice(0, 10).map(e =>
            `${e.timestamp}: ${e.primary_sentiment || 'neutral'} - ${e.title || ''}`
        ).join('\n');

        const habitsSummary = data.habits.map(h => `${h.emoji} ${h.name}`).join(', ');

        const result = await callAIProxy<ChartInsightsOutput>('chat', {
            history: [],
            userPrompt: `Analyze this journaling data and generate insights. Respond with ONLY JSON.

**Data Summary:**
- ${data.entries.length} journal entries over the last 30 days
- ${data.habits.length} habits: ${habitsSummary}
- ${data.habitLogs.length} habit completions logged

**Recent Entries:**
${entriesSummary}

**Generate these 4 insights:**

1. **dailyPulse**: 2-3 sentence holistic summary (coach-like, warm, actionable)
2. **correlation**: One line about habit-mood correlation (e.g. "You feel 35% better when you meditate")
3. **sentiment**: One line about mood trends (e.g. "You bounced back from a hard week—great resilience")
4. **heatmaps**: Array of insights for each habit (one line each)

Return JSON: {"dailyPulse": "...", "correlation": "...", "sentiment": "...", "heatmaps": ["...", "..."]}`,
            systemInstruction: 'You are a wellness data analyst. Be warm, specific, and coach-like. Each insight should be one line max (120 chars). Return only valid JSON.'
        });

        // Parse the response - it might be wrapped in a response object
        let parsed: ChartInsightsOutput;
        if ('response' in result) {
            // Extract JSON from the chat response
            const responseText = (result as any).response || '{}';
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            } else {
                throw new Error('Could not parse JSON from response');
            }
        } else {
            parsed = result;
        }

        return {
            dailyPulse: parsed.dailyPulse || 'Keep tracking your habits and mood to unlock personalized insights.',
            correlation: parsed.correlation || 'Not enough data to find patterns yet.',
            sentiment: parsed.sentiment || 'Keep journaling to see trends emerge!',
            heatmaps: parsed.heatmaps || data.habits.map(() => 'Track more days to unlock insights.')
        };
    } catch (error) {
        console.error('Error generating chart insights:', error);
        // Graceful fallback
        return {
            dailyPulse: 'Keep tracking your habits and mood to unlock personalized insights.',
            correlation: 'Complete more habit logs to reveal correlations.',
            sentiment: 'Keep journaling regularly to see patterns.',
            heatmaps: data.habits.map(h => `Build consistency with ${h.name} to see trends.`)
        };
    }
}
