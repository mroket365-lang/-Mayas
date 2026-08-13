import React, { useState } from 'react';
import { UserProfile, PersonalityType, ProactivityLevel, AppLanguage, CompanionGender } from '../types';
import { getTranslation, supportedLanguages } from '../locales/translations';
import { Sparkles, Heart, CheckCircle2, Globe, UserCheck } from 'lucide-react';

interface OnboardingModalProps {
  profile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ profile, onComplete }) => {
  const [lang, setLang] = useState<AppLanguage>(profile.language);
  const [addressAs, setAddressAs] = useState(profile.addressAs || (profile.language === 'ar' ? 'يا غالي' : 'My friend'));
  const [persona, setPersona] = useState<PersonalityType>(profile.personality);
  const [companionGender, setCompanionGender] = useState<CompanionGender>(profile.companionGender || 'male');
  const [proactivity, setProactivity] = useState<ProactivityLevel>(profile.proactivityLevel);

  const t = getTranslation(lang);

  const personasList: { type: PersonalityType; title: string; desc: string }[] = [
    { type: 'close_friend', title: t.personaCloseFriend, desc: 'Warm, casual, empathetic friend' },
    { type: 'brother_sister', title: t.personaBrotherSister, desc: 'Loving, caring sibling advice' },
    { type: 'secretary', title: t.personaSecretary, desc: 'Organized, direct, efficient' },
    { type: 'motivator', title: t.personaMotivator, desc: 'Energetic, inspiring, uplifting' },
    { type: 'calm', title: t.personaCalm, desc: 'Quiet, serene, mindful listener' },
    { type: 'spontaneous', title: t.personaSpontaneous, desc: 'Simple, playful, relaxed' },
  ];

  const handleFinish = () => {
    onComplete({
      ...profile,
      language: lang,
      addressAs,
      personality: persona,
      companionGender,
      proactivityLevel: proactivity,
      onboardingCompleted: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--accent-sage)] text-white mb-2 shadow-md">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-main)]">{t.onboardingTitle}</h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{t.onboardingSubtitle}</p>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-[var(--accent-sage)]" />
            <span>{t.chooseLanguage}</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {supportedLanguages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                  lang === l.code
                    ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] font-extrabold shadow-sm'
                    : 'border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span className="truncate w-full text-center">{l.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* How to Address You */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{t.howToAddressYou}</label>
          <input
            type="text"
            value={addressAs}
            onChange={(e) => setAddressAs(e.target.value)}
            placeholder={t.addressPlaceholder}
            className="w-full px-4 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)] text-sm"
          />
        </div>

        {/* Persona Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{t.choosePersona}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {personasList.map((p) => (
              <button
                key={p.type}
                type="button"
                onClick={() => setPersona(p.type)}
                className={`p-3 rounded-2xl border transition-all text-sm flex flex-col justify-between ${
                  persona === p.type
                    ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] font-bold'
                    : 'border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span className="font-bold flex items-center justify-between">
                  {p.title}
                  {persona === p.type && <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline" />}
                </span>
                <span className="text-xs opacity-75 font-normal mt-1">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Companion Gender Selection (مذكر / مؤنث / غير مهم) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t.chooseCompanionGender || 'هل تريد رفيقك يتحدث معك بكونه ذكر أم انثى؟'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCompanionGender('male')}
              className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all flex flex-col items-center justify-center gap-1 ${
                companionGender === 'male'
                  ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] font-extrabold shadow-sm'
                  : 'border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span className="text-base">👨‍💼</span>
              <span>{t.genderMale || 'مذكر'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCompanionGender('female')}
              className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all flex flex-col items-center justify-center gap-1 ${
                companionGender === 'female'
                  ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] font-extrabold shadow-sm'
                  : 'border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span className="text-base">👩‍💼</span>
              <span>{t.genderFemale || 'مؤنث'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCompanionGender('unspecified')}
              className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all flex flex-col items-center justify-center gap-1 ${
                companionGender === 'unspecified'
                  ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)] font-extrabold shadow-sm'
                  : 'border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span className="text-base">🤝</span>
              <span>{t.genderUnspecified || 'غير مهم'}</span>
            </button>
          </div>
        </div>

        {/* Proactivity Level */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{t.proactivityTitle}</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setProactivity('low')}
              className={`p-2.5 rounded-2xl border text-xs font-semibold text-center transition-all ${
                proactivity === 'low'
                  ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)]'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {t.proactivityLow.split(' - ')[0]}
            </button>
            <button
              type="button"
              onClick={() => setProactivity('medium')}
              className={`p-2.5 rounded-2xl border text-xs font-semibold text-center transition-all ${
                proactivity === 'medium'
                  ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)]'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {t.proactivityMed.split(' - ')[0]}
            </button>
            <button
              type="button"
              onClick={() => setProactivity('high')}
              className={`p-2.5 rounded-2xl border text-xs font-semibold text-center transition-all ${
                proactivity === 'high'
                  ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/10 text-[var(--accent-sage)]'
                  : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {t.proactivityHigh.split(' - ')[0]}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="w-full py-4 rounded-2xl bg-[var(--accent-sage)] hover:opacity-90 text-white font-extrabold text-base transition-all shadow-md flex items-center justify-center gap-2"
        >
          <span>{t.getStarted}</span>
        </button>
      </div>
    </div>
  );
};
