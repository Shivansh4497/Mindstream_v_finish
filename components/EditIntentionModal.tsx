import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import type { Intention } from '../types';
import { ETASelector } from './ETASelector';
import type { ETAPreset } from '../utils/etaCalculator';

interface EditIntentionModalProps {
    intention: Intention;
    onSave: (updates: Partial<Intention>) => Promise<void>;
    onCancel: () => void;
}

const CATEGORIES = ['Health', 'Growth', 'Career', 'Finance', 'Connection', 'System'] as const;

// Common emojis for intentions
const COMMON_EMOJIS = ['🎯', '🚀', '💪', '📚', '💼', '💰', '❤️', '🌟', '✨', '🔥', '⏰', '📝', '🎨', '🏃', '🧘', '💡'];

export const EditIntentionModal: React.FC<EditIntentionModalProps> = ({ intention, onSave, onCancel }) => {
    const [text, setText] = useState(intention.text);
    const [emoji, setEmoji] = useState(intention.emoji || '🎯');
    const [category, setCategory] = useState<typeof CATEGORIES[number]>(intention.category || 'Growth');
    const [tags, setTags] = useState<string[]>(intention.tags || []);
    const [newTag, setNewTag] = useState('');
    const [showETASelector, setShowETASelector] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Determine initial preset from current due_date
    const getInitialPreset = (): ETAPreset => {
        if (intention.is_life_goal) return 'life';
        if (!intention.due_date) return 'this_week';
        return 'custom';
    };

    const [selectedPreset, setSelectedPreset] = useState<ETAPreset>(getInitialPreset());
    const [selectedDueDate, setSelectedDueDate] = useState<Date | null>(
        intention.due_date ? new Date(intention.due_date) : null
    );
    const [customDate, setCustomDate] = useState<Date | undefined>(
        intention.due_date ? new Date(intention.due_date) : undefined
    );
    const [isSaving, setIsSaving] = useState(false);

    // Compare arrays for change detection
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(intention.tags || []);

    const hasChanged =
        text !== intention.text ||
        emoji !== intention.emoji ||
        category !== intention.category ||
        tagsChanged ||
        selectedPreset !== getInitialPreset() ||
        (selectedDueDate?.toISOString() !== intention.due_date && !(selectedDueDate === null && !intention.due_date));

    const handleSave = async () => {
        if (isSaving || !text.trim()) return;
        setIsSaving(true);

        const updates: Partial<Intention> = {
            text: text.trim(),
            emoji,
            category,
            tags,
            due_date: selectedDueDate?.toISOString() || null,
            is_life_goal: selectedPreset === 'life',
        };

        await onSave(updates);
        setIsSaving(false);
    };

    const handlePresetSelect = (preset: ETAPreset, dueDate: Date | null) => {
        setSelectedPreset(preset);
        setSelectedDueDate(dueDate);
    };

    const handleAddTag = () => {
        const trimmedTag = newTag.trim().toLowerCase();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    // Format due date for display
    const getDueDateDisplay = () => {
        if (selectedPreset === 'life') return 'Life Goal';
        if (!selectedDueDate) return 'No deadline';
        return selectedDueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: selectedDueDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onCancel}
        >
            <div
                className="bg-dark-surface rounded-xl p-6 max-w-md w-full flex flex-col shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold font-display text-white mb-4">Edit Intention</h2>

                {/* Emoji & Category Row */}
                <div className="mb-4 flex items-center gap-3">
                    {/* Emoji Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="text-3xl p-2 bg-dark-surface-light rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                        >
                            {emoji}
                        </button>

                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute top-full left-0 mt-2 z-10 bg-dark-surface-light rounded-lg p-3 border border-white/10 shadow-xl"
                                >
                                    <div className="grid grid-cols-8 gap-1">
                                        {COMMON_EMOJIS.map((e) => (
                                            <button
                                                key={e}
                                                onClick={() => {
                                                    setEmoji(e);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className={`text-xl p-1 rounded hover:bg-white/10 transition-colors ${emoji === e ? 'bg-brand-teal/20 ring-1 ring-brand-teal' : ''}`}
                                            >
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Category Selector */}
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                        className="flex-1 bg-dark-surface-light rounded-lg p-3 text-white border border-white/10 focus:ring-2 focus:ring-brand-teal focus:outline-none transition-shadow appearance-none cursor-pointer"
                    >
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="bg-dark-surface">
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Text Input */}
                <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-1 block">Intention</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={3}
                        className="w-full bg-dark-surface-light rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-teal focus:outline-none transition-shadow resize-none border border-white/10"
                        placeholder="What do you want to achieve?"
                    />
                </div>

                {/* Tags Section */}
                <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">Tags</label>

                    {/* Existing Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-teal/20 text-brand-teal rounded-full text-sm"
                                >
                                    #{tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Add Tag Input */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="Add a tag..."
                            className="flex-1 bg-dark-surface-light rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-brand-teal focus:outline-none transition-shadow border border-white/10"
                        />
                        <button
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                            className="p-2 bg-brand-teal/20 text-brand-teal rounded-lg hover:bg-brand-teal/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Due Date Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-400">Due Date</label>
                        <button
                            onClick={() => setShowETASelector(!showETASelector)}
                            className="text-sm text-brand-teal hover:text-teal-300 transition-colors"
                        >
                            {showETASelector ? 'Done' : 'Change'}
                        </button>
                    </div>

                    {!showETASelector ? (
                        <div
                            onClick={() => setShowETASelector(true)}
                            className="bg-dark-surface-light rounded-lg p-3 text-white border border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                        >
                            {getDueDateDisplay()}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <ETASelector
                                selectedPreset={selectedPreset}
                                onSelectPreset={handlePresetSelect}
                                customDate={customDate}
                                onCustomDateChange={setCustomDate}
                            />
                        </motion.div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-dark-surface-light text-white font-bold py-3 px-6 rounded-full hover:bg-white/10 transition-colors border border-white/10"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !text.trim()}
                        className="flex-1 bg-brand-teal text-white font-bold py-3 px-6 rounded-full hover:bg-teal-300 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};
