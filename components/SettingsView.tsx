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
    const [isExporting, setIsExporting] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const { showToast } = useToast();

    const handleExport = async (type: 'json' | 'markdown') => {
        setIsExporting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const data = await fetchAllUserData(user.id);
            const filename = `mindstream_export_${new Date().toISOString().split('T')[0]}.${type === 'json' ? 'json' : 'md'}`;

            downloadData(data, filename, type);
            showToast('Export started successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showToast('Failed to export data', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg text-white p-6 md:p-12 overflow-y-auto">
            {showDebug && <InsightValidator onClose={() => setShowDebug(false)} />}
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold font-display">Settings</h1>
                </div>

                <div className="space-y-12">
                    <section>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-brand-teal mb-2">Mindstream Companion</h2>
                            <p className="text-gray-400">Choose the personality that best fits your thinking style.</p>
                        </div>

                        <PersonalitySelector />
                    </section>

                    <section>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-brand-teal mb-2">Data & Privacy</h2>
                            <p className="text-gray-400">Manage your data ownership and privacy settings.</p>
                        </div>

                        <div className="bg-dark-surface border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Download className="w-5 h-5 text-brand-teal" />
                                Export Your Data
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Download a complete copy of your journal entries, habits, intentions, and reflections.
                                You own your data.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => handleExport('json')}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4 text-yellow-400" />}
                                    <span>Export as JSON</span>
                                </button>

                                <button
                                    onClick={() => handleExport('markdown')}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-blue-400" />}
                                    <span>Export as Markdown</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Developer Tools Section */}
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
