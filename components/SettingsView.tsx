import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileJson, FileText, Loader2, Bug } from 'lucide-react';
import { PersonalitySelector } from './PersonalitySelector';
import { supabase } from '../services/supabaseClient';
import { fetchAllUserData, downloadData } from '../services/dataExportService';
import { useToast } from './Toast';
import { InsightValidator } from './debug/InsightValidator';

interface SettingsViewProps {
    onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
    const [showDebug, setShowDebug] = useState(false);
    // ... existing code ...

    return (
        <div className="min-h-screen bg-dark-bg text-white p-6 md:p-12 overflow-y-auto">
            {showDebug && <InsightValidator onClose={() => setShowDebug(false)} />}
            <div className="max-w-6xl mx-auto">
                {/* ... existing header ... */}

                <div className="space-y-12">
                    {/* ... existing sections ... */}

                    <section>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-brand-teal mb-2">Data & Privacy</h2>
                            {/* ... existing content ... */}
                        </div>

                        {/* ... existing export buttons ... */}
                    </section>

                    {/* NEW DEBUG SECTION */}
                    <section className="pt-8 border-t border-white/10">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-400 mb-2">Developer Tools</h2>
                            <p className="text-gray-500">Internal tools for testing and validation.</p>
                        </div>

                        <button
                            onClick={() => setShowDebug(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg transition-colors"
                        >
                            <Bug className="w-4 h-4" />
                            <span>Debug Insights Quality</span>
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};
