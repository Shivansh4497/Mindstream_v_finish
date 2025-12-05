
import React, { useState } from 'react';
import { generateInstantInsight } from '../../services/geminiService';

const TEST_ENTRIES = [
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

interface ValidationResult {
    input: typeof TEST_ENTRIES[0];
    output?: { insight: string; followUpQuestion: string };
    error?: string;
    duration: number;
}

export const InsightValidator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [results, setResults] = useState<ValidationResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);

    const runValidation = async () => {
        setIsRunning(true);
        setResults([]);
        setProgress(0);

        const newResults: ValidationResult[] = [];

        for (let i = 0; i < TEST_ENTRIES.length; i++) {
            const entry = TEST_ENTRIES[i];
            const start = Date.now();
            try {
                const insight = await generateInstantInsight(entry.text, entry.sentiment, entry.lifeArea, entry.trigger);
                newResults.push({
                    input: entry,
                    output: insight,
                    duration: Date.now() - start
                });
            } catch (e: any) {
                newResults.push({
                    input: entry,
                    error: e.message || "Unknown error",
                    duration: Date.now() - start
                });
            }
            setResults([...newResults]);
            setProgress(i + 1);
        }

        setIsRunning(false);
    };

    return (
        <div className="fixed inset-0 bg-mindstream-bg-primary z-50 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Insight Quality Validator</h1>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">Close</button>
                </div>

                <div className="mb-8 flex gap-4">
                    <button
                        onClick={runValidation}
                        disabled={isRunning}
                        className={`px-6 py-2 rounded-lg font-medium ${isRunning ? 'bg-gray-700 text-gray-400' : 'bg-brand-teal text-black hover:bg-teal-400'}`}
                    >
                        {isRunning ? `Running (${progress}/${TEST_ENTRIES.length})...` : 'Run Validation'}
                    </button>
                </div>

                <div className="space-y-4">
                    {results.map((res, idx) => (
                        <div key={idx} className="bg-mindstream-bg-surface p-4 rounded-lg border border-gray-800">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-400">{res.input.sentiment} • {res.input.trigger}</span>
                                <span className="text-xs text-gray-500">{res.duration}ms</span>
                            </div>
                            <p className="text-white mb-4 italic">"{res.input.text}"</p>

                            {res.error ? (
                                <div className="text-red-400 bg-red-900/20 p-3 rounded">Error: {res.error}</div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="bg-mindstream-bg-elevated p-3 rounded border-l-4 border-brand-teal">
                                        <span className="text-xs text-brand-teal uppercase font-bold block mb-1">Insight</span>
                                        <p className="text-gray-200">{res.output?.insight}</p>
                                    </div>
                                    <div className="bg-mindstream-bg-elevated p-3 rounded border-l-4 border-brand-indigo">
                                        <span className="text-xs text-brand-indigo uppercase font-bold block mb-1">Question</span>
                                        <p className="text-gray-200">{res.output?.followUpQuestion}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
