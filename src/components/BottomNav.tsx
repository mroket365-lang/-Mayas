import React from 'react';
import { MessageCircle, BookmarkCheck, Calendar, User } from 'lucide-react';
import { UserProfile } from '../types';
import { getTranslation } from '../locales/translations';

interface BottomNavProps {
  activeTab: 'companion' | 'saved' | 'today' | 'profile';
  onTabChange: (tab: 'companion' | 'saved' | 'today' | 'profile') => void;
  profile: UserProfile;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, profile }) => {
  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';

  return (
    <nav className="w-full shrink-0 h-[62px] border-t backdrop-blur-lg bg-[var(--bg-surface)]/95 border-[var(--border-color)] px-2 sm:px-4 flex items-center justify-center shadow-lg z-40">
      <div className="w-full max-w-lg mx-auto flex items-center justify-around">
        {/* 1. Companion / رفيقي */}
        <button
          onClick={() => onTabChange('companion')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 sm:px-3.5 rounded-2xl transition-all ${
            activeTab === 'companion'
              ? 'text-[var(--accent-sage)] font-extrabold scale-105 bg-[var(--accent-sage)]/10'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[11px] whitespace-nowrap">{t.navCompanion}</span>
        </button>

        {/* 2. Today / يومي */}
        <button
          onClick={() => onTabChange('today')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 sm:px-3.5 rounded-2xl transition-all ${
            activeTab === 'today'
              ? 'text-[var(--accent-sage)] font-extrabold scale-105 bg-[var(--accent-sage)]/10'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[11px] whitespace-nowrap">{t.navToday}</span>
        </button>

        {/* 3. Saved / المحفوظات */}
        <button
          onClick={() => onTabChange('saved')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 sm:px-3.5 rounded-2xl transition-all ${
            activeTab === 'saved'
              ? 'text-[var(--accent-sage)] font-extrabold scale-105 bg-[var(--accent-sage)]/10'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
          }`}
        >
          <BookmarkCheck className="w-5 h-5" />
          <span className="text-[11px] whitespace-nowrap">{t.navSaved}</span>
        </button>

        {/* 4. Profile / البروفايل */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 sm:px-3.5 rounded-2xl transition-all ${
            activeTab === 'profile'
              ? 'text-[var(--accent-sage)] font-extrabold scale-105 bg-[var(--accent-sage)]/10'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] whitespace-nowrap">{isArabic ? 'البروفايل' : (t as any).navProfile || 'Profile'}</span>
        </button>
      </div>
    </nav>
  );
};

