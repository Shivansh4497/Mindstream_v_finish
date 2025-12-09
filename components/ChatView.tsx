import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, Share2, Check } from 'lucide-react';
import { Message, AISuggestion } from '../types';
import { MessageBubble } from './MessageBubble';
import { speak, stopSpeaking, initializeTTS } from '../utils/tts';
import { ChatSharingModal } from './ChatSharingModal';
import { saveChatFeedback, logEvent, EntryPoint, ChatMessage } from '../services/dbService';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  onAddSuggestion: (suggestion: AISuggestion) => void;
  userId?: string;
  currentPersonality?: string;
  entryPoint?: EntryPoint;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onAddSuggestion,
  userId,
  currentPersonality = 'stoic',
  entryPoint = 'organic'
}) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    const saved = localStorage.getItem('ttsEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const lastMessageRef = useRef<string>('');

  // Chat sharing state
  const [chatSharingEnabled, setChatSharingEnabled] = useState(() => {
    const saved = localStorage.getItem('chatSharingEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [chatSharingPromptShown, setChatSharingPromptShown] = useState(() => {
    const saved = localStorage.getItem('chatSharingPromptShown');
    return saved ? JSON.parse(saved) : false;
  });
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const lastSavedMessageCount = useRef(0);
  const wasLoadingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize TTS on mount
  useEffect(() => {
    initializeTTS();
  }, []);

  // Save TTS preference
  useEffect(() => {
    localStorage.setItem('ttsEnabled', JSON.stringify(ttsEnabled));
  }, [ttsEnabled]);

  // Save chat sharing preference
  useEffect(() => {
    localStorage.setItem('chatSharingEnabled', JSON.stringify(chatSharingEnabled));
  }, [chatSharingEnabled]);

  // Save prompt shown state
  useEffect(() => {
    localStorage.setItem('chatSharingPromptShown', JSON.stringify(chatSharingPromptShown));
  }, [chatSharingPromptShown]);

  // Count user messages and trigger prompt after 3rd
  useEffect(() => {
    const userMessages = messages.filter(m => m.sender === 'user');
    setUserMessageCount(userMessages.length);

    // Show prompt after 3rd user message, if not shown before
    if (userMessages.length >= 3 && !chatSharingPromptShown && !showSharingModal) {
      setShowSharingModal(true);
      if (userId) {
        logEvent(userId, 'chat_sharing_prompt_shown');
      }
    }
  }, [messages, chatSharingPromptShown, showSharingModal, userId]);

  // Save chat feedback after AI finishes responding (when isLoading goes false)
  useEffect(() => {
    // Detect when AI just finished responding
    if (wasLoadingRef.current && !isLoading && chatSharingEnabled && userId) {
      // Only save if we have new messages since last save
      if (messages.length > lastSavedMessageCount.current) {
        const chatMessages: ChatMessage[] = messages.map(m => ({
          sender: m.sender,
          text: m.text,
          timestamp: new Date().toISOString()
        }));

        saveChatFeedback(userId, chatMessages, currentPersonality, entryPoint)
          .then(success => {
            if (success) {
              lastSavedMessageCount.current = messages.length;
              logEvent(userId, 'chat_feedback_session_saved', {
                message_count: chatMessages.length,
                entry_point: entryPoint
              });
            }
          });
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, chatSharingEnabled, userId, messages, currentPersonality, entryPoint]);

  // Auto-speak AI responses
  useEffect(() => {
    if (!ttsEnabled || isLoading) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai' && lastMessage.text && lastMessage.text !== lastMessageRef.current) {
      lastMessageRef.current = lastMessage.text;
      speak(lastMessage.text);
    }
  }, [messages, ttsEnabled, isLoading]);

  // Stop speaking when component unmounts or TTS is disabled
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (!ttsEnabled) {
      stopSpeaking();
    }
  }, [ttsEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleTTS = () => {
    setTtsEnabled(!ttsEnabled);
    if (ttsEnabled) {
      stopSpeaking();
    }
  };

  const toggleChatSharing = useCallback(() => {
    const newValue = !chatSharingEnabled;
    setChatSharingEnabled(newValue);
    if (userId) {
      logEvent(userId, newValue ? 'chat_sharing_enabled' : 'chat_sharing_disabled');
    }
  }, [chatSharingEnabled, userId]);

  const handleAcceptSharing = useCallback(() => {
    setChatSharingEnabled(true);
    setChatSharingPromptShown(true);
    setShowSharingModal(false);
    if (userId) {
      logEvent(userId, 'chat_sharing_prompt_accepted');
      logEvent(userId, 'chat_sharing_enabled');
    }
  }, [userId]);

  const handleDeclineSharing = useCallback(() => {
    setChatSharingPromptShown(true);
    setShowSharingModal(false);
    if (userId) {
      logEvent(userId, 'chat_sharing_prompt_declined');
    }
  }, [userId]);

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header with TTS and Sharing toggles */}
        <div className="flex-shrink-0 flex flex-col border-b border-white/5 bg-brand-indigo">
          <div className="flex justify-end gap-2 p-3">
            {/* Chat Sharing Toggle */}
            <button
              onClick={toggleChatSharing}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${chatSharingEnabled
                ? 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              title={chatSharingEnabled ? 'Chat sharing enabled' : 'Chat sharing disabled'}
            >
              {chatSharingEnabled ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Sharing</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share: Off</span>
                </>
              )}
            </button>

            {/* TTS Toggle */}
            <button
              onClick={toggleTTS}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${ttsEnabled
                ? 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              title={ttsEnabled ? 'Voice enabled' : 'Voice disabled'}
            >
              {ttsEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Voice On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Voice Off</span>
                </>
              )}
            </button>
          </div>
          {/* Ephemerality indicator */}
          <div className="text-xs text-gray-500 text-center pb-2">
            💡 Conversations reset when you leave this tab
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 min-h-0">
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id || index}
              sender={msg.sender}
              text={msg.text}
              suggestions={msg.suggestions}
              onAddSuggestion={onAddSuggestion}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.text !== '' && (
            <div className="flex items-start gap-3 my-4 justify-start animate-fade-in-up">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-800 to-indigo-900 flex-shrink-0" aria-label="Mindstream avatar"></div>
              <div className="max-w-md lg:max-w-2xl rounded-2xl p-4 text-white bg-dark-surface-light rounded-bl-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>
      </div>

      {/* Chat Sharing Modal */}
      {showSharingModal && (
        <ChatSharingModal
          onAccept={handleAcceptSharing}
          onDecline={handleDeclineSharing}
        />
      )}
    </>
  );
};
