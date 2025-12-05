import React from 'react';
import { Target, Sparkles } from 'lucide-react';
import { ChatIcon } from './icons/ChatIcon';

// An icon for the "Stream" view is defined inline to avoid creating new files.
const StreamIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
  </svg>
);

export type View = 'stream' | 'focus' | 'insights' | 'chat' | 'settings';

const INSIGHTS_UNLOCK_THRESHOLD = 5;

interface NavBarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isChatDisabled?: boolean;
  entryCount?: number;           // For progressive disclosure
  showInsightsBadge?: boolean;   // Show red dot on Insights tab
}

export const NavBar: React.FC<NavBarProps> = ({
  activeView,
  onViewChange,
  isChatDisabled,
  entryCount = 0,
  showInsightsBadge = false
}) => {
  const navItems = [
    { id: 'stream', label: 'Stream', icon: StreamIcon },
    { id: 'focus', label: 'Focus', icon: Target },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'chat', label: 'Chat', icon: ChatIcon },
  ];

  // Progressive disclosure: hide Insights until user has enough entries
  const visibleItems = navItems.filter(item =>
    item.id !== 'insights' || entryCount >= INSIGHTS_UNLOCK_THRESHOLD
  );

  return (
    <nav className="flex-shrink-0 bg-brand-indigo/80 backdrop-blur-sm p-2 border-t border-white/10 z-20 flex justify-around items-center">
      {visibleItems.map((item) => {
        const isActive = activeView === item.id;
        const isDisabled = item.id === 'chat' && isChatDisabled;
        const Icon = item.icon;
        const showBadge = item.id === 'insights' && showInsightsBadge;

        let buttonClasses = `relative flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-colors `;
        if (isDisabled) {
          buttonClasses += 'text-gray-600 cursor-not-allowed';
        } else if (isActive) {
          buttonClasses += 'bg-brand-teal/20 text-brand-teal';
        } else {
          buttonClasses += 'text-gray-400 hover:bg-white/10 hover:text-white';
        }

        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={buttonClasses}
            aria-current={isActive ? 'page' : undefined}
            disabled={isDisabled}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
            {showBadge && (
              <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
