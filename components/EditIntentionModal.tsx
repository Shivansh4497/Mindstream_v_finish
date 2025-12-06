import React, { useState } from 'react';
import type { Intention } from '../types';

interface EditIntentionModalProps {
    intention: Intention;
    onSave: (text: string) => Promise<void>;
    onCancel: () => void;
}

export const EditIntentionModal: React.FC<EditIntentionModalProps> = ({ intention, onSave, onCancel }) => {
    const [text, setText] = useState(intention.text);
    const [isSaving, setIsSaving] = useState(false);

    const hasChanged = text !== intention.text;

    const handleSave = async () => {
        if (!hasChanged || isSaving || !text.trim()) return;
        setIsSaving(true);
        await onSave(text.trim());
        setIsSaving(false);
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onCancel}
        >
            <div
                className="bg-dark-surface rounded-xl p-6 max-w-md w-full flex flex-col shadow-2xl animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold font-display text-white mb-4">Edit Intention</h2>

                <div className="mb-2 flex items-center gap-2 text-gray-400 text-sm">
                    {intention.emoji && <span className="text-lg">{intention.emoji}</span>}
                    {intention.category && <span>{intention.category}</span>}
                </div>

                <div className="mb-6">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={3}
                        className="w-full bg-dark-surface-light rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-teal focus:outline-none transition-shadow resize-none"
                        placeholder="What do you want to achieve?"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-dark-surface-light text-white font-bold py-3 px-6 rounded-full hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanged || isSaving || !text.trim()}
                        className="flex-1 bg-brand-teal text-white font-bold py-3 px-6 rounded-full hover:bg-teal-300 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};
