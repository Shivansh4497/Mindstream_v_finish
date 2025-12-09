import React from 'react';
import { X, Check, Shield, Clock, Trash2, FlaskConical } from 'lucide-react';

interface ChatSharingModalProps {
    onAccept: () => void;
    onDecline: () => void;
}

export const ChatSharingModal: React.FC<ChatSharingModalProps> = ({
    onAccept,
    onDecline
}) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-dark border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-teal/20 flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-brand-teal" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                        Help Make Mindstream Smarter?
                    </h2>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-6">
                    Share your chats to help us improve AI responses.
                </p>

                {/* Benefits list */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-300">
                        <Shield className="w-4 h-4 text-brand-teal flex-shrink-0" />
                        <span className="text-sm">Only viewed by the Mindstream team</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                        <Check className="w-4 h-4 text-brand-teal flex-shrink-0" />
                        <span className="text-sm">Only used for improving AI quality</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                        <X className="w-4 h-4 text-brand-teal flex-shrink-0" />
                        <span className="text-sm">Never used for marketing or ads</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                        <Clock className="w-4 h-4 text-brand-teal flex-shrink-0" />
                        <span className="text-sm">Auto-deleted after 90 days</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                        <Trash2 className="w-4 h-4 text-brand-teal flex-shrink-0" />
                        <span className="text-sm">You can turn off or delete anytime</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onDecline}
                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium"
                    >
                        Not Now
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 px-4 py-3 rounded-xl bg-brand-teal text-brand-dark hover:bg-brand-teal/90 transition-colors font-medium"
                    >
                        Yes, Help Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatSharingModal;
