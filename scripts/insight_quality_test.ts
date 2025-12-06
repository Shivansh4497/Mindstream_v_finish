#!/usr/bin/env node
/**
 * Insight Quality Test Script
 * 
 * Purpose: Validate AI insight quality before MVP launch
 * Pass Criteria:
 *   - Average score >= 4.0 (out of 5)
 *   - No individual score < 3
 * 
 * Run: npx ts-node scripts/insight_quality_test.ts
 */

// Quality scoring rubric
const SCORING_RUBRIC = `
Score each insight 1-5:
5 = Exceptional: Deeply personal, specific to user's situation, actionable
4 = Good: Relevant, shows understanding, helpful perspective
3 = Acceptable: Generic but relevant, not harmful
2 = Poor: Vague, unhelpful, or slightly off-topic
1 = Fail: Wrong, harmful, or completely irrelevant
`;

// Test entries covering diverse emotional states
const TEST_ENTRIES = [
    // Anxiety/Stress (5 entries)
    { text: "I have a huge deadline tomorrow and I feel like I'm going to fail.", expected: "Acknowledge stress, suggest breaking down tasks" },
    { text: "My chest feels tight and I can't stop worrying about money.", expected: "Validate anxiety, suggest grounding or financial review" },
    { text: "I feel like everyone is judging me at work.", expected: "Address imposter syndrome, suggest reality check" },
    { text: "I'm overwhelmed by the mess in my house.", expected: "Suggest small first step, validate feeling" },
    { text: "I keep overthinking a conversation I had with my boss.", expected: "Help with rumination, suggest perspective" },

    // Joy/Gratitude (5 entries)
    { text: "I had such a lovely coffee with Sarah today.", expected: "Celebrate connection, encourage more of this" },
    { text: "Finally finished that project I've been working on for months!", expected: "Celebrate achievement, acknowledge effort" },
    { text: "The sunset was beautiful and I felt at peace.", expected: "Reinforce mindfulness, encourage noticing beauty" },
    { text: "I'm so grateful for my health.", expected: "Deepen gratitude, suggest health habit" },
    { text: "My dog learned a new trick!", expected: "Share joy, maybe suggest bonding activity" },

    // Confusion/Overwhelm (5 entries)
    { text: "I don't know what to do with my life anymore.", expected: "Validate existential feelings, suggest small exploration" },
    { text: "There are too many choices and I can't pick one.", expected: "Address decision paralysis, suggest narrowing" },
    { text: "I feel stuck in a rut.", expected: "Validate stagnation, suggest one small change" },
    { text: "Why do I keep self-sabotaging?", expected: "Gentle curiosity about patterns, not judgmental" },
    { text: "I feel disconnected from everyone.", expected: "Validate loneliness, suggest one connection step" },

    // Goals/Planning (5 entries)
    { text: "I want to start running again but I lack motivation.", expected: "Understand barrier, suggest tiny first step" },
    { text: "Thinking about changing careers.", expected: "Explore curiosity, suggest one research action" },
    { text: "I need to set better boundaries with my mom.", expected: "Validate need, suggest one boundary to try" },
    { text: "Realized I spend too much time on my phone.", expected: "Acknowledge awareness, suggest one limit" },
    { text: "I want to learn Spanish this year.", expected: "Encourage goal, suggest first step (app, class)" },
];

interface InsightResult {
    entry: string;
    expected: string;
    insight: string;
    followUp: string;
    score: number;
    notes: string;
}

async function testInsight(entry: { text: string; expected: string }): Promise<InsightResult> {
    // This would call the actual AI - for now we simulate structure
    // In real test, call: generateInstantInsight(entry.text, ...)

    return {
        entry: entry.text,
        expected: entry.expected,
        insight: "[AI RESPONSE HERE]",
        followUp: "[FOLLOW-UP QUESTION HERE]",
        score: 0, // Human scores this
        notes: ""
    };
}

function printScoreCard(results: InsightResult[]): void {
    console.log("\n" + "=".repeat(60));
    console.log("INSIGHT QUALITY SCORECARD");
    console.log("=".repeat(60));

    const scores = results.filter(r => r.score > 0).map(r => r.score);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const failCount = scores.filter(s => s < 3).length;

    console.log(`\nTotal Entries Tested: ${results.length}`);
    console.log(`Entries Scored: ${scores.length}`);
    console.log(`Average Score: ${avg.toFixed(2)} / 5.00`);
    console.log(`Scores Below 3: ${failCount}`);

    console.log("\n" + "-".repeat(60));

    // Pass/Fail determination
    const passed = avg >= 4.0 && failCount === 0;

    if (passed) {
        console.log("✅ PASSED - Ready for MVP launch");
    } else {
        console.log("❌ FAILED - Needs prompt tuning");
        if (avg < 4.0) console.log(`   - Average score ${avg.toFixed(2)} < 4.0 threshold`);
        if (failCount > 0) console.log(`   - ${failCount} entries scored below 3`);
    }

    console.log("=".repeat(60) + "\n");
}

function printInstructions(): void {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           INSIGHT QUALITY TEST - INSTRUCTIONS                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. Run your app and create 20 test entries using the texts  ║
║     listed below                                              ║
║                                                               ║
║  2. For each entry, rate the AI insight 1-5:                  ║
║     5 = Exceptional (personal, specific, actionable)          ║
║     4 = Good (relevant, understanding, helpful)               ║
║     3 = Acceptable (generic but relevant)                     ║
║     2 = Poor (vague, unhelpful)                               ║
║     1 = Fail (wrong, harmful, irrelevant)                     ║
║                                                               ║
║  3. PASS CRITERIA:                                            ║
║     - Average score >= 4.0                                    ║
║     - No individual score < 3                                 ║
║                                                               ║
║  4. If FAIL: Update prompts in ai-proxy/index.ts and retest   ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
`);

    console.log("\n📝 TEST ENTRIES TO CREATE:\n");
    TEST_ENTRIES.forEach((entry, i) => {
        console.log(`${i + 1}. "${entry.text}"`);
        console.log(`   Expected: ${entry.expected}\n`);
    });

    console.log("\n📊 SCORE TRACKING:");
    console.log("-".repeat(60));
    console.log("Entry # | Score (1-5) | Notes");
    console.log("-".repeat(60));
    TEST_ENTRIES.forEach((_, i) => {
        console.log(`   ${String(i + 1).padStart(2)}   |     ___     | _____________________`);
    });
    console.log("-".repeat(60));
    console.log("\nTotal: ___ / 100");
    console.log("Average: ___ / 5.00");
    console.log("Scores < 3: ___");
    console.log("\n[ ] PASSED  [ ] FAILED");
}

// Main execution
printInstructions();
