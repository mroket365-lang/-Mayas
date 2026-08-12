import React, { useState, useEffect } from 'react';
import { UserProfile, PersonalityType, ProactivityLevel, AppLanguage } from '../types';
import { getTranslation, supportedLanguages } from '../locales/translations';
import {
  X,
  Save,
  Download,
  Trash2,
  ShieldAlert,
  Moon,
  Sun,
  Globe,
  User,
  ShieldCheck,
  Mic,
  Video,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface SettingsModalProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  onClose: () => void;
  onClearMemory: () => void;
  onExportData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  onSaveProfile,
  onClose,
  onClearMemory,
  onExportData,
}) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>({ ...profile });
  const t = getTranslation(localProfile.language);

  // Permission status tracking
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraStatus, setCameraStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((res) => setMicStatus(res.state as 'prompt' | 'granted' | 'denied'))
        .catch(() => {});

      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((res) => setCameraStatus(res.state as 'prompt' | 'granted' | 'denied'))
        .catch(() => {});
    }
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('granted');
      stream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.warn('Microphone permission error:', e);
      setMicStatus('denied');
    }
  };

  const requestCameraAndVideoPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus('granted');
      stream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.warn('Camera/Video permission error:', e);
      setCameraStatus('denied');
    }
  };

  const handleLanguageChange = (code: AppLanguage) => {
    setLocalProfile((prev) => ({ ...prev, language: code }));
  };

  const handleSave = () => {
    onSaveProfile(localProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl p-6 md:p-8 space-y-7 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-4 border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--accent-sage)]/15 text-[var(--accent-sage)]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)]">
                {localProfile.language === 'ar' ? 'البروفايل والتفضيلات' : 'Profile & Preferences'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {localProfile.language === 'ar'
                  ? 'إدارة إعدادات الملف الشخصي، اللغة، الأذونات وتخصيص الرفيق'
                  : 'Manage profile settings, language, permissions, and companion persona'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-all"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: Profile & Preferences Header & Content */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)] text-[var(--accent-sage)] font-bold text-sm">
            <Sliders className="w-4 h-4" />
            <span className="uppercase tracking-wider text-xs">
              {localProfile.language === 'ar' ? 'الملف الشخصي والتفضيلات (Profile & Preferences)' : 'Profile & Preferences'}
            </span>
          </div>

          {/* 1. Language Selection (تغيير اللغة) */}
          <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--accent-sage)]" />
                <span>{t.chooseLanguage}</span>
              </label>
              <span className="text-[11px] font-semibold text-[var(--accent-sage)] bg-[var(--accent-sage)]/10 px-2.5 py-1 rounded-full">
                {supportedLanguages.find((l) => l.code === localProfile.language)?.flag}{' '}
                {supportedLanguages.find((l) => l.code === localProfile.language)?.nativeName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {supportedLanguages.map((lang) => {
                const isSelected = localProfile.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-start gap-2 transition-all ${
                      isSelected
                        ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] shadow-sm font-extrabold ring-1 ring-[var(--accent-sage)]'
                        : 'border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="truncate">{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Permissions Management (إدارة الأذونات) */}
          <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t.permissionsTitle}</span>
              </label>
              <span className="text-[11px] text-[var(--text-muted)]">
                {localProfile.language === 'ar' ? 'إدارة وتمكين الأذونات' : 'Manage & Grant Permissions'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Microphone Permission */}
              <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[var(--text-main)] truncate">
                      {localProfile.language === 'ar' ? 'الميكروفون' : 'Microphone'}
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                      {micStatus === 'granted'
                        ? localProfile.language === 'ar'
                          ? 'مسموح به'
                          : 'Granted'
                        : micStatus === 'denied'
                        ? localProfile.language === 'ar'
                          ? 'مرفوض بالمتصفح'
                          : 'Denied in browser'
                        : localProfile.language === 'ar'
                        ? 'التسجيل الصوتي'
                        : 'Voice input'}
                    </p>
                  </div>
                </div>

                {micStatus === 'granted' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <button
                    type="button"
                    onClick={requestMicPermission}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-sage)] text-white text-[11px] font-bold hover:opacity-90 transition-all shrink-0"
                  >
                    {t.grantPermissions}
                  </button>
                )}
              </div>

              {/* Camera / Video Permission */}
              <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[var(--text-main)] truncate">
                      {localProfile.language === 'ar' ? 'الكاميرا والفيديو' : 'Camera & Video'}
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                      {cameraStatus === 'granted'
                        ? localProfile.language === 'ar'
                          ? 'مسموح به'
                          : 'Granted'
                        : cameraStatus === 'denied'
                        ? localProfile.language === 'ar'
                          ? 'مرفوض'
                          : 'Denied'
                        : localProfile.language === 'ar'
                        ? 'التقاط الصور'
                        : 'Capture media'}
                    </p>
                  </div>
                </div>

                {cameraStatus === 'granted' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <button
                    type="button"
                    onClick={requestCameraAndVideoPermission}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--accent-sage)] text-white text-[11px] font-bold hover:opacity-90 transition-all shrink-0"
                  >
                    {t.grantPermissions}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Display Name & Address As */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.companionName}</label>
              <input
                type="text"
                value={localProfile.displayName}
                onChange={(e) => setLocalProfile({ ...localProfile, displayName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.howToAddressYou}</label>
              <input
                type="text"
                value={localProfile.addressAs}
                onChange={(e) => setLocalProfile({ ...localProfile, addressAs: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
              />
            </div>
          </div>

          {/* 4. Persona Select & Proactivity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.choosePersona}</label>
              <select
                value={localProfile.personality}
                onChange={(e) =>
                  setLocalProfile({ ...localProfile, personality: e.target.value as PersonalityType })
                }
                className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
              >
                <option value="close_friend">{t.personaCloseFriend}</option>
                <option value="brother_sister">{t.personaBrotherSister}</option>
                <option value="secretary">{t.personaSecretary}</option>
                <option value="motivator">{t.personaMotivator}</option>
                <option value="calm">{t.personaCalm}</option>
                <option value="spontaneous">{t.personaSpontaneous}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.proactivityTitle}</label>
              <select
                value={localProfile.proactivityLevel}
                onChange={(e) =>
                  setLocalProfile({ ...localProfile, proactivityLevel: e.target.value as ProactivityLevel })
                }
                className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
              >
                <option value="low">{t.proactivityLow}</option>
                <option value="medium">{t.proactivityMed}</option>
                <option value="high">{t.proactivityHigh}</option>
              </select>
            </div>
          </div>

          {/* 5. Theme & Emojis */}
          <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-2">
                <span>{t.themeTitle}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={localProfile.useEmojis}
                  onChange={(e) => setLocalProfile({ ...localProfile, useEmojis: e.target.checked })}
                  className="w-4 h-4 rounded text-[var(--accent-sage)] focus:ring-[var(--accent-sage)]"
                />
                <span>{localProfile.language === 'ar' ? 'استخدام الإيموجي' : 'Use Emojis'}</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalProfile({ ...localProfile, theme: 'light' })}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  localProfile.theme === 'light'
                    ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] shadow-sm font-extrabold'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>{t.themeLight}</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalProfile({ ...localProfile, theme: 'dark' })}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  localProfile.theme === 'dark'
                    ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] shadow-sm font-extrabold'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>{t.themeDark}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Privacy & Data Management */}
        <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
          <h3 className="text-xs font-extrabold uppercase text-[var(--text-muted)] tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>{localProfile.language === 'ar' ? 'الخصوصية وإدارة البيانات' : 'Privacy & Data Management'}</span>
          </h3>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onExportData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] transition-all"
            >
              <Download className="w-4 h-4 text-[var(--accent-sage)]" />
              <span>{t.exportData}</span>
            </button>

            <button
              type="button"
              onClick={onClearMemory}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold text-rose-600 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.clearMemory}</span>
            </button>

            <a
              href="/admin"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-bold text-indigo-400 transition-all ml-auto"
            >
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>{localProfile.language === 'ar' ? 'لوحة التحكم الإدارية (Admin)' : 'Admin Panel'}</span>
            </a>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-[var(--accent-sage)] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveChanges}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] font-semibold text-sm transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

