import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Sparkles,
  Globe,
  ShieldCheck,
  ChevronDown,
  Check,
  Crown,
  Flame,
  HeartHandshake,
  SlidersHorizontal,
  BarChart3,
  X,
} from 'lucide-react';
import { UserProfile, AppLanguage } from '../types';
import { getTranslation, supportedLanguages } from '../locales/translations';
import { SystemPublicSettings } from '../App';

interface HeaderProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onOpenSettings: () => void;
  onOpenPermissions: () => void;
  onOpenSubscription?: () => void;
  onOpenMaritalSupport?: () => void;
  onOpenStats?: () => void;
  systemSettings?: SystemPublicSettings | null;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onUpdateProfile,
  onOpenSettings,
  onOpenPermissions,
  onOpenSubscription,
  onOpenMaritalSupport,
  onOpenStats,
  systemSettings,
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';
  const currentLangObj = supportedLanguages.find((l) => l.code === profile.language) || supportedLanguages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = profile.theme === 'dark' ? 'light' : 'dark';
    onUpdateProfile({ ...profile, theme: nextTheme });
  };

  const handleSelectLanguage = (code: AppLanguage) => {
    onUpdateProfile({ ...profile, language: code });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b backdrop-blur-md bg-opacity-90 transition-colors border-[var(--border-color)] bg-[var(--bg-surface)] w-full max-w-full">
      {/* Left / Start: Companion Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-[var(--accent-sage)] text-white shadow-sm shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xs sm:text-base font-bold tracking-tight text-[var(--text-main)] flex items-center gap-1.5 truncate">
            <span className="truncate">
              {profile.displayName || (isArabic ? (profile.companionGender === 'female' ? 'رفيقتك' : 'رفيقك') : t.appName)}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" title="Online / متصل"></span>
          </h1>
          <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium truncate hidden min-[360px]:block">
            {isArabic
              ? profile.companionGender === 'female'
                ? 'رفيقتك الذكية الشخصية'
                : 'رفيقك الذكي الشخصي'
              : t.tagline}
          </p>
        </div>
      </div>

      {/* Right / End: Streamlined Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* 1. Prominent Upgrade / Subscription Button */}
        {onOpenSubscription && (
          <button
            onClick={onOpenSubscription}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
            title={isArabic ? 'ترقية الاشتراك إلى الخطة المتقدمة' : 'Upgrade to Pro Subscription'}
          >
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-100 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">{isArabic ? 'ترقية ✨' : 'Upgrade ✨'}</span>
          </button>
        )}

        {/* 1.5. Stats Modal Quick Trigger */}
        {onOpenStats && (
          <button
            onClick={onOpenStats}
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--accent-sage)] transition-all flex items-center gap-1 font-bold text-xs"
            title={isArabic ? 'إحصائيات الاستهلاك والإنجاز' : 'Usage & Stats'}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">{isArabic ? 'الإحصائيات' : 'Stats'}</span>
          </button>
        )}

        {/* 2. Quick Tools Dropdown Menu (Consolidating Theme, Language, Candid Mode, Marital Support & Permissions) */}
        <div className="relative" ref={toolsMenuRef}>
          <button
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
              isToolsMenuOpen
                ? 'bg-[var(--accent-sage)]/15 border-[var(--accent-sage)] text-[var(--accent-sage)]'
                : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
            }`}
            title={isArabic ? 'أدوات الوصول السريع والتفضيلات' : 'Quick Tools & Preferences'}
          >
            <SlidersHorizontal className="w-4 h-4 text-[var(--accent-sage)]" />
            <span className="hidden sm:inline font-semibold">{isArabic ? 'الأدوات' : 'Tools'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${
                isToolsMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Quick Tools Dropdown Card */}
          {isToolsMenuOpen && (
            <div className="absolute top-full mt-2 end-0 z-50 w-80 min-w-[18rem] max-w-[calc(100vw-1.5rem)] p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <span className="font-extrabold text-[var(--text-muted)] uppercase tracking-wider text-[10px] whitespace-nowrap">
                  {isArabic ? 'أدوات الخيارات السريعة' : 'Quick Options'}
                </span>
                <button
                  onClick={() => setIsToolsMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme & Language Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    {profile.theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200 shrink-0" />
                    )}
                    <span className="whitespace-nowrap">{profile.theme === 'dark' ? t.themeLight : t.themeDark}</span>
                  </span>
                </button>

                {/* Permissions Trigger */}
                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenPermissions();
                  }}
                  className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-bold flex items-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate whitespace-nowrap">{t.permissionsTitle}</span>
                </button>
              </div>

              {/* Language Selector */}
              <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Globe className="w-3.5 h-3.5 text-[var(--accent-sage)] shrink-0" />
                    <span className="whitespace-nowrap">{t.chooseLanguage}</span>
                  </span>
                  <span className="font-mono text-[var(--text-main)] whitespace-nowrap">{currentLangObj.flag} {currentLangObj.nativeName}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {supportedLanguages.slice(0, 4).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-between transition-all ${
                        profile.language === lang.code
                          ? 'bg-[var(--accent-sage)]/20 text-[var(--accent-sage)] border border-[var(--accent-sage)]/40'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span className="truncate whitespace-nowrap">{lang.flag} {lang.nativeName}</span>
                      {profile.language === lang.code && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Private Candid Conversations Toggle */}
              {systemSettings?.privateCandidAllowed !== false && (
                <button
                  onClick={() => {
                    onUpdateProfile({
                      ...profile,
                      privateCandidMode: !(profile.privateCandidMode || profile.personality === 'bold'),
                    });
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                    profile.privateCandidMode || profile.personality === 'bold'
                      ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-extrabold'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
                  }`}
                >
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Flame className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                    <span className="whitespace-nowrap">{isArabic ? 'نمط الحوارات الخاصة' : 'Private Candid Mode'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-bold whitespace-nowrap shrink-0">
                    {profile.privateCandidMode ? (isArabic ? 'مُفعّل' : 'ON') : (isArabic ? 'مُعطّل' : 'OFF')}
                  </span>
                </button>
              )}

              {/* Marital Support Session */}
              {systemSettings?.maritalSupportAllowed !== false && onOpenMaritalSupport && (
                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenMaritalSupport();
                  }}
                  className="w-full p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <HeartHandshake className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
                    <span className="whitespace-nowrap">{isArabic ? 'استشارة ودعم زوجي (18+)' : 'Marital Support (18+)'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 font-extrabold whitespace-nowrap">
                    {isArabic ? 'جلسة' : 'Session'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Settings Modal Trigger Icon */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-all"
          title={t.settings}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
        </button>
      </div>
    </header>
  );
};

