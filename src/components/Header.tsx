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
  LogIn,
  UserCheck,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, AppLanguage } from '../types';
import { getTranslation, supportedLanguages } from '../locales/translations';
import { SystemPublicSettings } from '../App';
import { useFeatureGate } from '../context/FeatureGateContext';

interface HeaderProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onOpenSettings: () => void;
  onOpenPermissions: () => void;
  onOpenSubscription?: () => void;
  onOpenMaritalSupport?: () => void;
  onOpenConsultationsHub?: () => void;
  onOpenStats?: () => void;
  onOpenAuth?: () => void;
  systemSettings?: SystemPublicSettings | null;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onUpdateProfile,
  onOpenSettings,
  onOpenPermissions,
  onOpenSubscription,
  onOpenMaritalSupport,
  onOpenConsultationsHub,
  onOpenStats,
  onOpenAuth,
  systemSettings,
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';
  const currentLangObj = supportedLanguages.find((l) => l.code === profile.language) || supportedLanguages[0];

  const { isFeatureEnabled, isFeatureVisible, triggerLockedPrompt } = useFeatureGate();

  const isLoggedIn = Boolean(
    profile.email || (profile.id && profile.id.startsWith('USR-') && profile.id !== 'user_default_01')
  );

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
    if (!isFeatureEnabled('pref_dark_mode')) {
      triggerLockedPrompt('pref_dark_mode');
      return;
    }
    const nextTheme = profile.theme === 'dark' ? 'light' : 'dark';
    onUpdateProfile({ ...profile, theme: nextTheme });
  };

  const handleSelectLanguage = (code: AppLanguage) => {
    if (!isFeatureEnabled('pref_language')) {
      triggerLockedPrompt('pref_language');
      return;
    }
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
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Guest Auth Action or Pro Subscription Button */}
        {!isLoggedIn && onOpenAuth ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] sm:text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 shrink-0"
            title={isArabic ? 'تسجيل الدخول / إنشاء حساب' : 'Log In / Sign Up'}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{isArabic ? 'دخول / تسجيل' : 'Login'}</span>
          </button>
        ) : onOpenSubscription && isFeatureVisible('header_upgrade_button') ? (
          <button
            onClick={() => {
              if (!isFeatureEnabled('header_upgrade_button')) {
                triggerLockedPrompt('header_upgrade_button');
                return;
              }
              onOpenSubscription();
            }}
            className="relative flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-[11px] sm:text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
            title={isArabic ? 'ترقية الاشتراك إلى الخطة المتقدمة' : 'Upgrade to Pro Subscription'}
          >
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-100 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">{isArabic ? 'ترقية ✨' : 'Upgrade ✨'}</span>
            {!isFeatureEnabled('header_upgrade_button') && (
              <div className="absolute -top-1 -end-1 bg-amber-700 text-white rounded-full p-0.5 shadow-sm">
                <Lock className="w-2.5 h-2.5" />
              </div>
            )}
          </button>
        ) : null}

        {/* 1.5. Stats Modal Quick Trigger (Controlled by header_stats_button or action_stats) */}
        {onOpenStats && (isFeatureVisible('header_stats_button') || isFeatureVisible('action_stats')) && (
          <button
            onClick={() => {
              const featKey = isFeatureVisible('header_stats_button') ? 'header_stats_button' : 'action_stats';
              if (!isFeatureEnabled(featKey)) {
                triggerLockedPrompt(featKey);
                return;
              }
              onOpenStats();
            }}
            className="relative p-1.5 sm:p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--accent-sage)] transition-all flex items-center gap-1 font-bold text-xs"
            title={isArabic ? 'إحصائيات الاستهلاك والإنجاز' : 'Usage & Stats'}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            {!isFeatureEnabled('header_stats_button') && !isFeatureEnabled('action_stats') && (
              <div className="absolute -top-1 -end-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                <Lock className="w-2.5 h-2.5" />
              </div>
            )}
            <span className="hidden md:inline whitespace-nowrap">{isArabic ? 'الإحصائيات' : 'Stats'}</span>
          </button>
        )}

        {/* 2. Quick Tools Dropdown Menu (Controlled by action_tools_menu) */}
        {isFeatureVisible('action_tools_menu') && (
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => {
                if (!isFeatureEnabled('action_tools_menu')) {
                  triggerLockedPrompt('action_tools_menu');
                  return;
                }
                setIsToolsMenuOpen(!isToolsMenuOpen);
              }}
              className={`relative p-1.5 sm:p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1 sm:gap-1.5 ${
                isToolsMenuOpen
                  ? 'bg-[var(--accent-sage)]/15 border-[var(--accent-sage)] text-[var(--accent-sage)]'
                  : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
              }`}
              title={isArabic ? 'أدوات الوصول السريع والتفضيلات' : 'Quick Tools & Preferences'}
            >
              <SlidersHorizontal className="w-4 h-4 text-[var(--accent-sage)] shrink-0" />
              {!isFeatureEnabled('action_tools_menu') && (
                <div className="absolute -top-1 -end-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}
              <span className="hidden sm:inline font-semibold whitespace-nowrap">{isArabic ? 'الأدوات' : 'Tools'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform shrink-0 ${
                  isToolsMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Quick Tools Dropdown Card */}
            {isToolsMenuOpen && (
              <>
                {/* Backdrop for mobile */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden"
                  onClick={() => setIsToolsMenuOpen(false)}
                />
                <div className="fixed sm:absolute inset-x-3 sm:inset-auto top-14 sm:top-full sm:end-0 sm:mt-2 z-50 w-auto sm:w-84 max-w-full sm:max-w-xs p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl space-y-3 animate-fade-in text-xs overflow-y-auto max-h-[85vh]">
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

                {/* Action Rows: Theme & Permissions */}
                <div className="space-y-2">
                  {/* Theme Toggle */}
                  {isFeatureVisible('pref_dark_mode') && (
                    <button
                      onClick={toggleTheme}
                      className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-bold flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {profile.theme === 'dark' ? (
                          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200 shrink-0" />
                        )}
                        <span className="truncate">{isArabic ? 'الوضع الليلي والداكن' : 'Night / Dark Mode'}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-sage)]/20 text-[var(--accent-sage)] font-extrabold whitespace-nowrap shrink-0 flex items-center gap-1">
                        {!isFeatureEnabled('pref_dark_mode') && <Lock className="w-2.5 h-2.5" />}
                        <span>{profile.theme === 'dark' ? (isArabic ? 'داكن 🌙' : 'Dark 🌙') : (isArabic ? 'فاتح ☀️' : 'Light ☀️')}</span>
                      </span>
                    </button>
                  )}

                  {/* Permissions Trigger */}
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenPermissions();
                    }}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-bold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{isArabic ? 'أذونات الميكروفون والوسائط' : 'Media & Mic Permissions'}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold whitespace-nowrap shrink-0">
                      {isArabic ? 'إدارة' : 'Manage'}
                    </span>
                  </button>

                  {/* Consultations Hub Trigger */}
                  {isFeatureVisible('consultations_hub') && onOpenConsultationsHub && (
                    <button
                      onClick={() => {
                        if (!isFeatureEnabled('consultations_hub')) {
                          triggerLockedPrompt('consultations_hub');
                          return;
                        }
                        setIsToolsMenuOpen(false);
                        onOpenConsultationsHub();
                      }}
                      className="w-full p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse shrink-0" />
                        <span className="truncate">{isArabic ? 'مركز الاستشارات المتخصصة' : 'Consultations Hub'}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 font-extrabold whitespace-nowrap shrink-0 flex items-center gap-1">
                        {!isFeatureEnabled('consultations_hub') && <Lock className="w-2.5 h-2.5" />}
                        <span>{isArabic ? 'استشارات' : 'Advisory'}</span>
                      </span>
                    </button>
                  )}

                  {/* Admin Panel Portal Trigger */}
                  {isFeatureVisible('button_admin_panel') && (
                    <a
                      href="/admin"
                      onClick={(e) => {
                        if (!isFeatureEnabled('button_admin_panel')) {
                          e.preventDefault();
                          triggerLockedPrompt('button_admin_panel');
                          return;
                        }
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <ShieldAlert className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="truncate">{isArabic ? 'لوحة التحكم الإدارية' : 'Admin Panel'}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 font-extrabold whitespace-nowrap shrink-0 flex items-center gap-1">
                        {!isFeatureEnabled('button_admin_panel') && <Lock className="w-2.5 h-2.5" />}
                        <span>Admin</span>
                      </span>
                    </a>
                  )}
                </div>

                {/* Language Selector */}
                {isFeatureVisible('pref_language') && (
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
                )}

                {/* Private Candid Conversations Toggle */}
                {(isFeatureVisible('tool_private_candid') || isFeatureVisible('chat_candid')) &&
                  systemSettings?.privateCandidAllowed !== false && (
                    <button
                      onClick={() => {
                        const featKey = isFeatureVisible('tool_private_candid') ? 'tool_private_candid' : 'chat_candid';
                        if (!isFeatureEnabled(featKey)) {
                          triggerLockedPrompt(featKey);
                          return;
                        }
                        onUpdateProfile({
                          ...profile,
                          privateCandidMode: !profile.privateCandidMode,
                        });
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        profile.privateCandidMode
                          ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-extrabold'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <Flame className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                        <span className="whitespace-nowrap">{isArabic ? 'نمط الحوارات الخاصة والشفافية' : 'Private Candid Mode'}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-bold whitespace-nowrap shrink-0 flex items-center gap-1">
                        {!isFeatureEnabled('tool_private_candid') && !isFeatureEnabled('chat_candid') && <Lock className="w-2.5 h-2.5" />}
                        <span>{profile.privateCandidMode ? (isArabic ? 'مُفعّل' : 'ON') : (isArabic ? 'مُعطّل' : 'OFF')}</span>
                      </span>
                    </button>
                  )}

                {/* Marital Support Session */}
                {isFeatureVisible('chat_marital_support') && onOpenMaritalSupport && (
                  <button
                    onClick={() => {
                      if (!isFeatureEnabled('chat_marital_support')) {
                        triggerLockedPrompt('chat_marital_support');
                        return;
                      }
                      setIsToolsMenuOpen(false);
                      onOpenMaritalSupport();
                    }}
                    className="w-full p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <HeartHandshake className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
                      <span className="whitespace-nowrap">{isArabic ? 'استشارة ودعم زوجي (18+)' : 'Marital Support (18+)'}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 font-extrabold whitespace-nowrap shrink-0 flex items-center gap-1">
                      {!isFeatureEnabled('chat_marital_support') && <Lock className="w-2.5 h-2.5" />}
                      <span>{isArabic ? 'جلسة' : 'Session'}</span>
                    </span>
                  </button>
                )}
              </div>
            </>
            )}
          </div>
        )}

        {/* 3. Settings Modal Trigger Icon (Controlled by action_settings) */}
        {isFeatureVisible('action_settings') && (
          <button
            onClick={() => {
              if (!isFeatureEnabled('action_settings')) {
                triggerLockedPrompt('action_settings');
                return;
              }
              onOpenSettings();
            }}
            className="relative p-1.5 sm:p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-all shrink-0"
            title={t.settings}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0" />
            {!isFeatureEnabled('action_settings') && (
              <div className="absolute -top-1 -end-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                <Lock className="w-2.5 h-2.5" />
              </div>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

