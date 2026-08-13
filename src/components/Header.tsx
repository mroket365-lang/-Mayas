import React, { useState, useRef, useEffect } from 'react';
import { Settings, Moon, Sun, Sparkles, Globe, ShieldCheck, ChevronDown, Check, Crown, Flame, HeartHandshake } from 'lucide-react';
import { UserProfile, AppLanguage } from '../types';
import { getTranslation, supportedLanguages } from '../locales/translations';

interface HeaderProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onOpenSettings: () => void;
  onOpenPermissions: () => void;
  onOpenSubscription?: () => void;
  onOpenMaritalSupport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onUpdateProfile,
  onOpenSettings,
  onOpenPermissions,
  onOpenSubscription,
  onOpenMaritalSupport,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(profile.language);
  const currentLangObj = supportedLanguages.find((l) => l.code === profile.language) || supportedLanguages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
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
    setIsLangMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md bg-opacity-90 transition-colors border-[var(--border-color)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--accent-sage)] text-white shadow-sm">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            {profile.displayName || (profile.language === 'ar' ? (profile.companionGender === 'female' ? 'رفيقتك' : 'رفيقك') : t.appName)}
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Online / متصل"></span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-medium">
            {profile.language === 'ar'
              ? profile.companionGender === 'female'
                ? 'رفيقتك الذكية الشخصية'
                : profile.companionGender === 'male'
                ? 'رفيقك الذكي الشخصي'
                : 'رفيقك الذكي الشخصي'
              : profile.companionGender === 'female'
              ? 'Your Personal AI Companion (Female)'
              : profile.companionGender === 'male'
              ? 'Your Personal AI Companion (Male)'
              : t.tagline}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {onOpenMaritalSupport && (
          <button
            onClick={onOpenMaritalSupport}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              profile.specialCounselingEnabled &&
              profile.specialCounselingExpiresAt &&
              new Date(profile.specialCounselingExpiresAt).getTime() > Date.now()
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400 font-extrabold ring-1 ring-rose-500/30'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
            }`}
            title={profile.language === 'ar' ? 'جلسة الاستشارة والدعم الزوجي (18+)' : 'Marital Support Session (18+)'}
          >
            <HeartHandshake className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="hidden sm:inline">
              {profile.language === 'ar' ? 'استشارة زوجية' : 'Marital Support'}
            </span>
          </button>
        )}

        {/* Private Candid Mode Toggle Button */}
        <button
          onClick={() =>
            onUpdateProfile({
              ...profile,
              privateCandidMode: !(profile.privateCandidMode || profile.personality === 'bold'),
            })
          }
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
            profile.privateCandidMode || profile.personality === 'bold'
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400 font-extrabold ring-1 ring-amber-500/30'
              : 'border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]'
          }`}
          title={
            profile.language === 'ar'
              ? 'تفعيل/إلغاء نمط الحوارات الخاصة والصريحة'
              : 'Toggle Private Candid Conversations Mode'
          }
        >
          <Flame
            className={`w-4 h-4 ${
              profile.privateCandidMode || profile.personality === 'bold'
                ? 'text-amber-500 animate-pulse'
                : 'text-[var(--text-muted)]'
            }`}
          />
          <span className="hidden sm:inline">
            {profile.language === 'ar' ? 'حوارات خاصة' : 'Candid'}
          </span>
        </button>
        <button
          onClick={onOpenPermissions}
          className="p-2 rounded-xl border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-all"
          title={t.permissionsTitle}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </button>

        {/* Language Picker Dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="p-2 rounded-xl border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] text-xs font-bold flex items-center gap-1.5 transition-all"
            title={t.chooseLanguage}
          >
            <Globe className="w-4 h-4 text-[var(--accent-sage)]" />
            <span className="hidden sm:inline">{currentLangObj.flag} {currentLangObj.nativeName}</span>
            <span className="sm:hidden">{currentLangObj.code.toUpperCase()}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangMenuOpen && (
            <div className="absolute top-full mt-2 right-0 ltr:right-0 rtl:left-0 z-50 w-48 p-1.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl space-y-0.5 animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-color)] mb-1">
                {t.chooseLanguage}
              </div>
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                    profile.language === lang.code
                      ? 'bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] font-bold'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </span>
                  {profile.language === lang.code && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Night / Day Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-all flex items-center gap-1"
          title={profile.theme === 'dark' ? t.themeLight : t.themeDark}
        >
          {profile.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-all"
          title={t.settings}
        >
          <Settings className="w-5 h-5 text-[var(--text-muted)]" />
        </button>
      </div>
    </header>
  );
};
