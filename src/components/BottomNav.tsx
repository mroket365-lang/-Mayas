import React from 'react';
import { MessageCircle, BookmarkCheck, Calendar, User, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import { useFeatureGate } from '../context/FeatureGateContext';

interface BottomNavProps {
  activeTab: 'companion' | 'saved' | 'today' | 'profile';
  onTabChange: (tab: 'companion' | 'saved' | 'today' | 'profile') => void;
  profile: UserProfile;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, profile }) => {
  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';
  const { isFeatureEnabled, isFeatureVisible, triggerLockedPrompt } = useFeatureGate();

  const navItems = [
    {
      id: 'companion' as const,
      featureId: 'tab_companion',
      label: t.navCompanion,
      icon: MessageCircle,
    },
    {
      id: 'today' as const,
      featureId: 'tab_today',
      label: t.navToday,
      icon: Calendar,
    },
    {
      id: 'saved' as const,
      featureId: 'tab_saved',
      label: t.navSaved,
      icon: BookmarkCheck,
    },
    {
      id: 'profile' as const,
      featureId: 'tab_profile',
      label: isArabic ? 'البروفايل' : (t as any).navProfile || 'Profile',
      icon: User,
    },
  ];

  const visibleItems = navItems.filter((item) => isFeatureVisible(item.featureId));

  return (
    <nav className="w-full shrink-0 h-[62px] border-t backdrop-blur-lg bg-[var(--bg-surface)]/95 border-[var(--border-color)] px-2 sm:px-4 flex items-center justify-center shadow-lg z-40">
      <div className="w-full max-w-lg mx-auto flex items-center justify-around">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = isFeatureEnabled(item.featureId);
          const isActive = activeTab === item.id;

          const handleClick = () => {
            if (!isEnabled) {
              triggerLockedPrompt(item.featureId);
              return;
            }
            onTabChange(item.id);
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 sm:px-3.5 rounded-2xl transition-all ${
                isActive
                  ? 'text-[var(--accent-sage)] font-extrabold scale-105 bg-[var(--accent-sage)]/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
              } ${!isEnabled ? 'opacity-70' : ''}`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {!isEnabled && (
                  <div className="absolute -top-1 -end-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <span className="text-[11px] whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

