import React, { useState } from 'react';
import { UserProfile, PersonalityType, ProactivityLevel, AppLanguage } from '../types';
import { getTranslation, supportedLanguages } from '../locales/translations';
import { X, Save, Download, Trash2, ShieldAlert, Moon, Sun, Globe } from 'lucide-react';

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

  const handleSave = () => {
    onSaveProfile(localProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-4 border-[var(--border-color)]">
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            {t.profileSettings}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Night / Day Mode Toggle */}
        <div className="space-y-2 p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
            <span>{t.themeTitle}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLocalProfile({ ...localProfile, theme: 'light' })}
              className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                localProfile.theme === 'light'
                  ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] shadow-sm font-extrabold'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>{t.themeLight}</span>
            </button>

            <button
              type="button"
              onClick={() => setLocalProfile({ ...localProfile, theme: 'dark' })}
              className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                localProfile.theme === 'dark'
                  ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] shadow-sm font-extrabold'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>{t.themeDark}</span>
            </button>
          </div>
        </div>

        {/* Display Name & Address As */}
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

        {/* Persona Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.choosePersona}</label>
          <select
            value={localProfile.personality}
            onChange={(e) => setLocalProfile({ ...localProfile, personality: e.target.value as PersonalityType })}
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

        {/* Proactivity Level */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.proactivityTitle}</label>
          <select
            value={localProfile.proactivityLevel}
            onChange={(e) => setLocalProfile({ ...localProfile, proactivityLevel: e.target.value as ProactivityLevel })}
            className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
          >
            <option value="low">{t.proactivityLow}</option>
            <option value="medium">{t.proactivityMed}</option>
            <option value="high">{t.proactivityHigh}</option>
          </select>
        </div>

        {/* Language Selection & Emojis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
              <span>{t.chooseLanguage}</span>
            </label>
            <select
              value={localProfile.language}
              onChange={(e) => setLocalProfile({ ...localProfile, language: e.target.value as AppLanguage })}
              className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)] font-semibold"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-[var(--text-main)] py-2">
              <input
                type="checkbox"
                checked={localProfile.useEmojis}
                onChange={(e) => setLocalProfile({ ...localProfile, useEmojis: e.target.checked })}
                className="w-4 h-4 rounded text-[var(--accent-sage)] focus:ring-[var(--accent-sage)]"
              />
              <span>Use Emojis (استخدام الإيموجي)</span>
            </label>
          </div>
        </div>

        {/* Data Ownership & Privacy */}
        <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
          <h3 className="text-xs font-extrabold uppercase text-[var(--text-muted)] tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>الخصوصية والبيانات / Privacy & Data</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onExportData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] transition-all"
            >
              <Download className="w-4 h-4 text-[var(--accent-sage)]" />
              <span>{t.exportData}</span>
            </button>

            <button
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
              <span>لوحة التحكم الإدارية (Admin)</span>
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-[var(--accent-sage)] hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveChanges}</span>
          </button>

          <button
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
