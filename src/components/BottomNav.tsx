import React from 'react';
import { MessageCircle, BookmarkCheck, Calendar } from 'lucide-react';
import { UserProfile } from '../types';
import { getTranslation } from '../locales/translations';

interface BottomNavProps {
  activeTab: 'companion' | 'saved' | 'today';
  onTabChange: (tab: 'companion' | 'saved' | 'today') => void;
  profile: UserProfile;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, profile }) => {
  const t = getTranslation(profile.language);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t backdrop-blur-lg bg-[var(--bg-surface)]/95 border-[var(--border-color)] px-4 flex items-center justify-center shadow-lg">
      <div className="w-full max-w-md mx-auto flex items-center justify-around">
        <button
          onClick={() => onTabChange('companion')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'companion'
              ? 'text-[var(--accent-sage)] font-bold scale-105'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[11px]">{t.navCompanion}</span>
        </button>

        <button
          onClick={() => onTabChange('saved')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'saved'
              ? 'text-[var(--accent-sage)] font-bold scale-105'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
          }`}
        >
          <BookmarkCheck className="w-5 h-5" />
          <span className="text-[11px]">{t.navSaved}</span>
        </button>

        <button
          onClick={() => onTabChange('today')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'today'
              ? 'text-[var(--accent-sage)] font-bold scale-105'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[11px]">{t.navToday}</span>
        </button>
      </div>
    </nav>
  );
};
