/**
 * Insight Evaluator Service
 * 
 * Uses GPT-4 as an independent judge to evaluate the quality of
 * Gemini-generated insights. This creates a robust, automated
 * feedback loop for prompt improvement.
 * 
 * @module services/insightEvaluator
 */

import type { InstantInsight } from '../types';

// OpenAI API Key - will be set at runtime via setOpenAIKey()
let OPENAI_API_KEY: string | null = null;

/**
 * Set the OpenAI API key at runtime
 * This avoids hardcoding the key in the source code
 */
export function setOpenAIKey(key: string) {
    OPENAI_API_KEY = key;
}

export function getOpenAIKey(): string | null {
    return OPENAI_API_KEY;
}

// ============================================
// TEST CASES - Realistic, Edge-Case-Heavy
// ============================================

export interface TestCase {
    id: string;
    category: 'simple' | 'complex' | 'multi_emotion' | 'sensitive' | 'vague' | 'adversarial';
    entry: string;
    sentiment: string;
    lifeArea: string;
    trigger: string;
}

export const TEST_CASES: TestCase[] = [
    // SIMPLE CASES (Baseline)
    {
        id: 'simple_1',
        category: 'simple',
        entry: "I have a presentation tomorrow and I can't stop thinking about everything that could go wrong.",
        sentiment: 'Anxious',
        lifeArea: 'Work',
        trigger: 'Deadlines'
    },
    {
        id: 'simple_2',
        category: 'simple',
        entry: "Got promoted today! All those late nights finally paid off.",
        sentiment: 'Joyful',
        lifeArea: 'Work',
        trigger: 'Recognition'
    },
    {
        id: 'simple_3',
        category: 'simple',
        entry: "I finally went to the gym after 3 months. It felt amazing.",
        sentiment: 'Proud',
        lifeArea: 'Health',
        trigger: 'Exercise'
    },
    {
        id: 'simple_4',
        category: 'simple',
        entry: "My partner and I had a great conversation about our future plans.",
        sentiment: 'Hopeful',
        lifeArea: 'Relationships',
        trigger: 'Communication'
    },
    {
        id: 'simple_5',
        category: 'simple',
        entry: "I meditated for 10 minutes this morning and felt so calm.",
        sentiment: 'Calm',
        lifeArea: 'Self',
        trigger: 'Mindfulness'
    },

    // COMPLEX CASES (Long, rambling, multiple issues)
    {
        id: 'complex_1',
        category: 'complex',
        entry: "Work has been insane lately. My boss keeps piling on projects, and I said yes to all of them because I didn't want to seem lazy. Now I'm behind on everything, haven't been sleeping well, and I canceled plans with my best friend twice this week. I feel like I'm losing myself to this job but I also can't afford to lose it. My rent is due next week and I already maxed out my credit card last month. I don't know what to do first.",
        sentiment: 'Overwhelmed',
        lifeArea: 'Work',
        trigger: 'Burnout'
    },
    {
        id: 'complex_2',
        category: 'complex',
        entry: "I've been trying to eat healthier for months now, but I always end up binging on junk food when I'm stressed. Then I feel guilty, which makes me more stressed, which makes me eat more. It's a vicious cycle. My doctor said my cholesterol is too high and I need to make changes, but every time I try I fail within a week. Maybe I'm just not meant to be healthy.",
        sentiment: 'Frustrated',
        lifeArea: 'Health',
        trigger: 'Diet'
    },

    // MULTI-EMOTION CASES (Mixed feelings)
    {
        id: 'multi_1',
        category: 'multi_emotion',
        entry: "I'm excited about the new job offer but also terrified of leaving my current team. They've become like family. But the new role pays 40% more and has growth potential. I feel guilty for even considering leaving, but also resentful that my current company won't match the offer.",
        sentiment: 'Confused',
        lifeArea: 'Work',
        trigger: 'Career Decision'
    },
    {
        id: 'multi_2',
        category: 'multi_emotion',
        entry: "My mom is finally visiting after 2 years. I'm happy to see her, but she always criticizes how I live my life. Last time she made comments about my weight, my apartment, my relationship. I love her but I'm already dreading the visit.",
        sentiment: 'Anxious',
        lifeArea: 'Relationships',
        trigger: 'Family'
    },

    // SENSITIVE CASES (Grief, trauma, health)
    {
        id: 'sensitive_1',
        category: 'sensitive',
        entry: "It's been 6 months since dad passed and I still can't enter his room. Everyone says I should move on but I'm not ready. I keep thinking I could have done more, visited more, called more.",
        sentiment: 'Sad',
        lifeArea: 'Relationships',
        trigger: 'Loss'
    },
    {
        id: 'sensitive_2',
        category: 'sensitive',
        entry: "The doctor told me the test results were abnormal and I need more tests. I haven't told anyone yet. I'm trying to stay positive but my mind keeps going to the worst case scenario. I can't focus on anything else.",
        sentiment: 'Anxious',
        lifeArea: 'Health',
        trigger: 'Medical'
    },
    {
        id: 'sensitive_3',
        category: 'sensitive',
        entry: "I had a panic attack at work today. Locked myself in the bathroom for 20 minutes. Nobody noticed. I've been having them more frequently but I don't want to seem weak or like I can't handle my job.",
        sentiment: 'Overwhelmed',
        lifeArea: 'Health',
        trigger: 'Mental Health'
    },

    // VAGUE CASES (Unclear what's wrong)
    {
        id: 'vague_1',
        category: 'vague',
        entry: "I don't know. Everything just feels... off. Like I'm going through the motions but not really living. Nothing bad happened specifically, I just feel empty.",
        sentiment: 'Reflective',
        lifeArea: 'Self',
        trigger: 'Purpose'
    },
    {
        id: 'vague_2',
        category: 'vague',
        entry: "Something is missing but I can't put my finger on it. I should be happy - I have a good job, good friends, good health. But I'm not.",
        sentiment: 'Confused',
        lifeArea: 'Self',
        trigger: 'Meaning'
    },

    // SARCASM / SELF-DEPRECATING
    {
        id: 'sarcasm_1',
        category: 'adversarial',
        entry: "Oh great, another Monday. Can't wait to pretend I care about synergizing our Q3 deliverables. My soul definitely didn't die a little typing that.",
        sentiment: 'Frustrated',
        lifeArea: 'Work',
        trigger: 'Boredom'
    },
    {
        id: 'self_deprecating_1',
        category: 'adversarial',
        entry: "Failed at another diet. Shocking, I know. I'm basically an expert at starting things and never finishing them. Should add that to my resume.",
        sentiment: 'Frustrated',
        lifeArea: 'Health',
        trigger: 'Self-Worth'
    },

    // EDGE CASES
    {
        id: 'short_1',
        category: 'adversarial',
        entry: "Feeling stressed.",
        sentiment: 'Anxious',
        lifeArea: 'Work',
        trigger: 'General'
    },
    {
        id: 'gibberish_1',
        category: 'adversarial',
        entry: "asdfasdf test entry ignore",
        sentiment: 'Reflective',
        lifeArea: 'Self',
        trigger: 'Testing'
    },

    // POSITIVE GROWTH
    {
        id: 'growth_1',
        category: 'simple',
        entry: "I finally set a boundary with my coworker who keeps dumping their work on me. I said no and the world didn't end. Actually felt pretty good.",
        sentiment: 'Proud',
        lifeArea: 'Work',
        trigger: 'Boundaries'
    },
    {
        id: 'growth_2',
        category: 'simple',
        entry: "I saved $500 this month by cooking at home instead of ordering takeout. Small wins but they add up.",
        sentiment: 'Grateful',
        lifeArea: 'Finance',
        trigger: 'Budgeting'
    },

    // RELATIONSHIP COMPLEXITY
    {
        id: 'relationship_1',
        category: 'complex',
        entry: "My best friend didn't invite me to her wedding. We've known each other for 15 years. She said it's a small ceremony but I saw the photos - there were at least 50 people. I don't even know what I did wrong. Should I confront her or just let the friendship fade?",
        sentiment: 'Sad',
        lifeArea: 'Relationships',
        trigger: 'Trust'
    }
];

// ============================================
// EVALUATION RUBRIC (GPT-4 as Judge)
// ============================================

const EVALUATION_RUBRIC = `
You are an expert psychologist and UX researcher evaluating AI-generated therapeutic insights.

SCORING CRITERIA (1-5 scale for each):

1. RELEVANCE (Does it address the core concern?)
   1 = Completely misses the point
   2 = Somewhat related but off-target
   3 = Addresses surface level only
   4 = Captures main concern well
   5 = Deeply understands and addresses the root issue

2. SPECIFICITY (Does it reference concrete details from the entry?)
   1 = Completely generic, could apply to anyone
   2 = Mostly generic with one vague reference
   3 = References some details but feels template-ish
   4 = Clearly references specific words/situations from entry
   5 = Weaves multiple specific details naturally

3. ACTIONABILITY (Does it offer a perspective shift or next step?)
   1 = Just restates the problem
   2 = Offers vague encouragement ("hang in there")
   3 = Suggests general direction without specifics
   4 = Offers concrete perspective shift or action
   5 = Provides immediately applicable insight or step

4. EMPATHY (Is the tone warm and validating, not preachy?)
   1 = Cold/clinical or dismissive
   2 = Stilted or overly formal
   3 = Neutral but not warm
   4 = Warm and understanding
   5 = Deeply empathetic, feels like a wise friend

5. FOLLOW_UP_QUALITY (Is the question open-ended and deepening?)
   1 = Yes/no question or irrelevant
   2 = Shallow or obvious question
   3 = Reasonable but predictable
   4 = Thoughtful, invites real reflection
   5 = Profound, opens new avenues of self-discovery

Return your evaluation as JSON:
{
  "relevance": { "score": X, "reasoning": "..." },
  "specificity": { "score": X, "reasoning": "..." },
  "actionability": { "score": X, "reasoning": "..." },
  "empathy": { "score": X, "reasoning": "..." },
  "follow_up_quality": { "score": X, "reasoning": "..." },
  "overall_notes": "...",
  "failure_mode": null | "generic" | "wrong_sentiment" | "preachy" | "missed_context" | "bad_followup" | "hallucination"
}
`;

// ============================================
// EVALUATION TYPES
// ============================================

export interface EvaluationScores {
    relevance: { score: number; reasoning: string };
    specificity: { score: number; reasoning: string };
    actionability: { score: number; reasoning: string };
    empathy: { score: number; reasoning: string };
    follow_up_quality: { score: number; reasoning: string };
    overall_notes: string;
    failure_mode: string | null;
}

export interface EvaluationResult {
    testCase: TestCase;
    insight: InstantInsight;
    scores: EvaluationScores;
    averageScore: number;
    passed: boolean;
    latencyMs: number;
}

export interface EvaluationSummary {
    totalCases: number;
    passedCases: number;
    averageScore: number;
    scoresByCategory: Record<string, number>;
    scoresByCriterion: Record<string, number>;
    failureModes: Record<string, number>;
    worstCases: EvaluationResult[];
    bestCases: EvaluationResult[];
}

// ============================================
// CORE EVALUATION LOGIC
// ============================================

/**
 * Call GPT-4 to evaluate a generated insight
 */
async function callGPT4Judge(
    entry: string,
    sentiment: string,
    lifeArea: string,
    trigger: string,
    insight: InstantInsight
): Promise<EvaluationScores> {
    const prompt = `
${EVALUATION_RUBRIC}

---

USER ENTRY:
"${entry}"

CONTEXT:
- Sentiment: ${sentiment}
- Life Area: ${lifeArea}
- Trigger: ${trigger}

AI-GENERATED INSIGHT:
"${insight.insight}"

AI-GENERATED FOLLOW-UP QUESTION:
"${insight.followUpQuestion}"

---

Evaluate this insight based on the rubric above. Return JSON only.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an expert evaluator. Return only valid JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`GPT-4 API Error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
}

/**
 * Run a single evaluation
 */
export async function evaluateSingleInsight(
    testCase: TestCase,
    generateInsight: (text: string, sentiment: string, lifeArea: string, trigger: string) => Promise<InstantInsight>
): Promise<EvaluationResult> {
    const startTime = Date.now();

    // Generate insight using Gemini
    const insight = await generateInsight(
        testCase.entry,
        testCase.sentiment,
        testCase.lifeArea,
        testCase.trigger
    );

    const latencyMs = Date.now() - startTime;

    // Evaluate using GPT-4
    const scores = await callGPT4Judge(
        testCase.entry,
        testCase.sentiment,
        testCase.lifeArea,
        testCase.trigger,
        insight
    );

    // Calculate average
    const scoreValues = [
        scores.relevance.score,
        scores.specificity.score,
        scores.actionability.score,
        scores.empathy.score,
        scores.follow_up_quality.score
    ];
    const averageScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

    // Check if passed (avg >= 4.0 and no score < 3)
    const passed = averageScore >= 4.0 && scoreValues.every(s => s >= 3);

    return {
        testCase,
        insight,
        scores,
        averageScore,
        passed,
        latencyMs
    };
}

/**
 * Run full evaluation suite
 */
export async function runFullEvaluation(
    generateInsight: (text: string, sentiment: string, lifeArea: string, trigger: string) => Promise<InstantInsight>,
    onProgress?: (completed: number, total: number) => void
): Promise<EvaluationSummary> {
    const results: EvaluationResult[] = [];

    for (let i = 0; i < TEST_CASES.length; i++) {
        const testCase = TEST_CASES[i];

        try {
            const result = await evaluateSingleInsight(testCase, generateInsight);
            results.push(result);
        } catch (error) {
            console.error(`Failed to evaluate ${testCase.id}:`, error);
            // Continue with other tests
        }

        if (onProgress) {
            onProgress(i + 1, TEST_CASES.length);
        }

        // Rate limiting: 500ms between calls
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Aggregate results
    const passedCases = results.filter(r => r.passed).length;
    const averageScore = results.reduce((sum, r) => sum + r.averageScore, 0) / results.length;

    // Scores by category
    const scoresByCategory: Record<string, number> = {};
    const categoryGroups: Record<string, EvaluationResult[]> = {};

    results.forEach(r => {
        const cat = r.testCase.category;
        if (!categoryGroups[cat]) categoryGroups[cat] = [];
        categoryGroups[cat].push(r);
    });

    Object.entries(categoryGroups).forEach(([cat, group]) => {
        scoresByCategory[cat] = group.reduce((sum, r) => sum + r.averageScore, 0) / group.length;
    });

    // Scores by criterion
    const scoresByCriterion: Record<string, number> = {
        relevance: results.reduce((sum, r) => sum + r.scores.relevance.score, 0) / results.length,
        specificity: results.reduce((sum, r) => sum + r.scores.specificity.score, 0) / results.length,
        actionability: results.reduce((sum, r) => sum + r.scores.actionability.score, 0) / results.length,
        empathy: results.reduce((sum, r) => sum + r.scores.empathy.score, 0) / results.length,
        follow_up_quality: results.reduce((sum, r) => sum + r.scores.follow_up_quality.score, 0) / results.length,
    };

    // Failure modes
    const failureModes: Record<string, number> = {};
    results.forEach(r => {
        if (r.scores.failure_mode) {
            failureModes[r.scores.failure_mode] = (failureModes[r.scores.failure_mode] || 0) + 1;
        }
    });

    // Best and worst cases
    const sortedByScore = [...results].sort((a, b) => a.averageScore - b.averageScore);
    const worstCases = sortedByScore.slice(0, 5);
    const bestCases = sortedByScore.slice(-5).reverse();

    return {
        totalCases: results.length,
        passedCases,
        averageScore,
        scoresByCategory,
        scoresByCriterion,
        failureModes,
        worstCases,
        bestCases
    };
}
