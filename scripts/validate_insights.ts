
import { generateInstantInsight } from '../services/geminiService';
import { GEMINI_API_KEY_AVAILABLE } from '../services/geminiClient';

// Mock process.env if needed (though geminiClient checks it)
// We hope the environment has the key.

const testEntries = [
    // Anxiety/Stress
    { text: "I have a huge deadline tomorrow and I feel like I'm going to fail.", sentiment: "Anxious", lifeArea: "Work", trigger: "Deadline" },
    { text: "My chest feels tight and I can't stop worrying about money.", sentiment: "Anxious", lifeArea: "Finance", trigger: "Bills" },
    { text: "I feel like everyone is judging me at work.", sentiment: "Anxious", lifeArea: "Work", trigger: "Social Interaction" },
    { text: "I'm overwhelmed by the mess in my house.", sentiment: "Overwhelmed", lifeArea: "Home", trigger: "Clutter" },
    { text: "I keep overthinking a conversation I had with my boss.", sentiment: "Anxious", lifeArea: "Work", trigger: "Conversation" },

    // Joy/Gratitude
    { text: "I had such a lovely coffee with Sarah today.", sentiment: "Joyful", lifeArea: "Connection", trigger: "Social" },
    { text: "Finally finished that project I've been working on for months!", sentiment: "Proud", lifeArea: "Work", trigger: "Completion" },
    { text: "The sunset was beautiful and I felt at peace.", sentiment: "Content", lifeArea: "Personal", trigger: "Nature" },
    { text: "I'm so grateful for my health.", sentiment: "Grateful", lifeArea: "Health", trigger: "Reflection" },
    { text: "My dog learned a new trick!", sentiment: "Joyful", lifeArea: "Personal", trigger: "Pet" },

    // Confusion/Overwhelm
    { text: "I don't know what to do with my life anymore.", sentiment: "Confused", lifeArea: "Purpose", trigger: "Existential" },
    { text: "There are too many choices and I can't pick one.", sentiment: "Overwhelmed", lifeArea: "Decision", trigger: "Choice" },
    { text: "I feel stuck in a rut.", sentiment: "Frustrated", lifeArea: "Growth", trigger: "Stagnation" },
    { text: "Why do I keep self-sabotaging?", sentiment: "Confused", lifeArea: "Growth", trigger: "Behavior" },
    { text: "I feel disconnected from everyone.", sentiment: "Sad", lifeArea: "Connection", trigger: "Isolation" },

    // Reflection/Planning
    { text: "I want to start running again but I lack motivation.", sentiment: "Reflective", lifeArea: "Health", trigger: "Habit" },
    { text: "Thinking about changing careers.", sentiment: "Inquisitive", lifeArea: "Career", trigger: "Future" },
    { text: "I need to set better boundaries with my mom.", sentiment: "Reflective", lifeArea: "Family", trigger: "Boundaries" },
    { text: "Realized I spend too much time on my phone.", sentiment: "Observational", lifeArea: "Habits", trigger: "Screen Time" },
    { text: "I want to learn Spanish this year.", sentiment: "Hopeful", lifeArea: "Growth", trigger: "Goal" }
];

async function runValidation() {
    console.log("Starting Insight Quality Validation...");

    // Check for API Key indirectly via geminiClient
    // Note: geminiClient initializes 'ai' on load if key is present.
    // We can't easily check 'ai' directly as it's not exported, but GEMINI_API_KEY_AVAILABLE is.
    // Wait, GEMINI_API_KEY_AVAILABLE is a boolean exported from geminiClient.

    if (!GEMINI_API_KEY_AVAILABLE) {
        console.error("❌ API Key not found. Cannot run validation.");
        console.error("Please ensure API_KEY or VITE_GEMINI_API_KEY is set in the environment.");
        // Try to proceed anyway, maybe it initialized and we just need to wait or it's a false negative?
        // Actually GEMINI_API_KEY_AVAILABLE is set at module load time.
    }

    console.log(`Testing ${testEntries.length} entries...\n`);

    const results = [];

    for (const entry of testEntries) {
        try {
            console.log(`Processing: "${entry.text.substring(0, 30)}..."`);
            const start = Date.now();
            const insight = await generateInstantInsight(entry.text, entry.sentiment, entry.lifeArea, entry.trigger);
            const duration = Date.now() - start;

            results.push({
                input: entry,
                output: insight,
                duration
            });
        } catch (error) {
            console.error(`Failed for entry: "${entry.text}"`, error);
            results.push({
                input: entry,
                error: error.message
            });
        }
    }

    console.log("\n--- VALIDATION RESULTS ---\n");

    results.forEach((res, index) => {
        console.log(`Entry #${index + 1}: ${res.input.sentiment} / ${res.input.trigger}`);
        console.log(`Text: "${res.input.text}"`);
        if (res.error) {
            console.log(`❌ Error: ${res.error}`);
        } else {
            console.log(`✅ Insight: "${res.output.insight}"`);
            console.log(`❓ Question: "${res.output.followUpQuestion}"`);
            console.log(`⏱️ Time: ${res.duration}ms`);
        }
        console.log("-".repeat(40));
    });

    console.log("\nDone.");
}

runValidation();
