import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Users,
  BookOpen,
  Compass,
  HeartHandshake,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
  Flame,
  AlertCircle,
  Play,
  Square,
} from 'lucide-react';
import { UserProfile, ConsultationType, ConsultationConfig } from '../types';
import { CONSULTATION_MODES, ALL_CONSULTATION_TYPES } from '../constants/consultations';
import { useFeatureGate } from '../context/FeatureGateContext';

interface ConsultationsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onGoToChat?: () => void;
}

const iconMap: Record<string, any> = {
  TrendingUp,
  Users,
  BookOpen,
  Compass,
  Sparkles,
  HeartHandshake,
};

export const ConsultationsHubModal: React.FC<ConsultationsHubModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onGoToChat,
}) => {
  const { isFeatureEnabled, isFeatureVisible, triggerLockedPrompt } = useFeatureGate();
  const isArabic = profile.language === 'ar';

  const [selectedType, setSelectedType] = useState<ConsultationType | null>(null);
  const [agreed18, setAgreed18] = useState<boolean>(profile.specialCounselingVerified18 || false);
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('');

  const activeType: ConsultationType =
    profile.activeConsultationType || (profile.specialCounselingEnabled ? 'marital' : 'none');
  const activeExpiresAt = profile.activeConsultationExpiresAt || profile.specialCounselingExpiresAt;

  const isSessionActive =
    activeType !== 'none' &&
    (!activeExpiresAt || new Date(activeExpiresAt).getTime() > Date.now());

  // Timer effect for active consultation session
  useEffect(() => {
    if (!isSessionActive || !activeExpiresAt) {
      setRemainingTimeStr('');
      return;
    }

    const updateTimer = () => {
      const diff = new Date(activeExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemainingTimeStr('00:00');
        // Auto expire
        onUpdateProfile({
          ...profile,
          activeConsultationType: 'none',
          activeConsultationExpiresAt: undefined,
          specialCounselingEnabled: false,
          specialCounselingExpiresAt: undefined,
        });
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemainingTimeStr(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeExpiresAt, isSessionActive]);

  if (!isOpen) return null;

  const handleActivateConsultation = (type: ConsultationType) => {
    const config = CONSULTATION_MODES[type];
    if (!config) return;

    if (!isFeatureEnabled(config.featureId)) {
      triggerLockedPrompt(config.featureId);
      return;
    }

    if (config.ageRestricted && !agreed18) {
      alert(isArabic ? 'يرجى الإقرار والتعهد بالسن القانوني (18+) أولاً' : 'Please verify age requirement (18+) first');
      return;
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const todayStr = new Date().toISOString().split('T')[0];

    onUpdateProfile({
      ...profile,
      activeConsultationType: type,
      activeConsultationExpiresAt: expiresAt,
      activeConsultationActivatedAt: new Date().toISOString(),
      specialCounselingEnabled: type === 'marital',
      specialCounselingVerified18: agreed18 || profile.specialCounselingVerified18,
      specialCounselingExpiresAt: type === 'marital' ? expiresAt : profile.specialCounselingExpiresAt,
      specialCounselingLastActivatedDate: type === 'marital' ? todayStr : profile.specialCounselingLastActivatedDate,
    });

    setSelectedType(null);
  };

  const handleDeactivate = () => {
    onUpdateProfile({
      ...profile,
      activeConsultationType: 'none',
      activeConsultationExpiresAt: undefined,
      specialCounselingEnabled: false,
      specialCounselingExpiresAt: undefined,
    });
    setSelectedType(null);
  };

  const activeConfig = isSessionActive ? CONSULTATION_MODES[activeType] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-500 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
                <span>{isArabic ? 'مركز الاستشارات المتخصصة' : 'Specialized Consultations Hub'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30">
                  {isArabic ? 'توجيه خبير' : 'AI Experts'}
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isArabic
                  ? 'اختر مجال الاستشارة لتخصيص نبرة وتحليل الرفيق وفق أحدث المعايير العلمية'
                  : 'Select an advisory field to adapt your companion with expert perspectives'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Active Session Highlight Banner if active */}
          {isSessionActive && activeConfig && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {isArabic ? 'الاستشارة النشطة حالياً' : 'Active Consultation'}
                    </span>
                    <h4 className="text-sm font-black text-[var(--text-main)]">
                      {isArabic ? activeConfig.nameAr : activeConfig.nameEn}
                    </h4>
                  </div>
                </div>

                {remainingTimeStr && (
                  <div className="px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                    ⏱️ {remainingTimeStr}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDeactivate}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-all"
                >
                  {isArabic ? 'إنهاء الاستشارة' : 'End Consultation'}
                </button>

                {onGoToChat && (
                  <button
                    onClick={() => {
                      onClose();
                      onGoToChat();
                    }}
                    className="flex-1 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>{isArabic ? 'الذهاب للمحادثة والاستشارة' : 'Go to Chat'}</span>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* List of Available Consultations */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
              {isArabic ? 'المجالات الاستشارية المتاحة' : 'Available Advisory Domains'}
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {ALL_CONSULTATION_TYPES.map((type) => {
                const config = CONSULTATION_MODES[type];
                if (!config) return null;

                // Feature gate check
                if (!isFeatureVisible(config.featureId)) return null;

                const isEnabled = isFeatureEnabled(config.featureId);
                const isCurrentActive = activeType === type && isSessionActive;
                const isSelected = selectedType === type;
                const IconComponent = iconMap[config.iconName] || Sparkles;

                return (
                  <div
                    key={type}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isCurrentActive
                        ? 'border-emerald-500/50 bg-emerald-500/5 shadow-sm'
                        : isSelected
                        ? 'border-indigo-500/50 bg-indigo-500/5 shadow-sm'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-slate-400/40'
                    }`}
                  >
                    {/* Item Main Row */}
                    <div
                      onClick={() => {
                        if (!isEnabled) {
                          triggerLockedPrompt(config.featureId);
                          return;
                        }
                        setSelectedType(isSelected ? null : type);
                      }}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 transition-transform ${
                            isCurrentActive
                              ? 'bg-emerald-500/20 text-emerald-600'
                              : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)]'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate">
                              {isArabic ? config.nameAr : config.nameEn}
                            </h5>
                            {config.ageRestricted && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 font-bold border border-rose-500/30">
                                18+
                              </span>
                            )}
                            {isCurrentActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold">
                                {isArabic ? 'نشط الآن 🟢' : 'Active 🟢'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                            {isArabic ? config.descAr : config.descEn}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isEnabled && (
                          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-600" title="مغلقة بالخطة">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 text-[var(--text-muted)] transition-transform rtl:rotate-180 ${
                            isSelected ? 'rotate-90 rtl:rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Detailed Drawer when clicked */}
                    {isSelected && (
                      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3 animate-fade-in text-xs">
                        <p className="text-[var(--text-main)] leading-relaxed">
                          {isArabic ? config.descAr : config.descEn}
                        </p>

                        {/* 18+ Age verification for marital */}
                        {config.ageRestricted && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                              <ShieldCheck className="w-4 h-4" />
                              <span>{isArabic ? 'تعهد الخصوصية والسن القانوني (18+)' : 'Verification & Age 18+'}</span>
                            </div>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={agreed18}
                                onChange={(e) => setAgreed18(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                              />
                              <span className="text-[11px] text-[var(--text-main)]">
                                {isArabic
                                  ? 'أتعهد بأني أبلغ 18 عاماً فأكثر وبأن الغرض هو الاستشارة الزوجية البنّاءة.'
                                  : 'I confirm that I am 18 years or older for marital counseling purposes.'}
                              </span>
                            </label>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'مدة الجلسة: 60 دقيقة قابلة للتجديد' : 'Session Duration: 60 Mins'}</span>
                          </div>

                          {isCurrentActive ? (
                            <button
                              onClick={handleDeactivate}
                              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold border border-rose-500/30 transition-all"
                            >
                              {isArabic ? 'إيقاف الاستشارة' : 'Deactivate'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateConsultation(type)}
                              disabled={config.ageRestricted && !agreed18}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{isArabic ? 'تفعيل جلسة الاستشارة' : 'Activate Session'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-[var(--text-muted)]">
            {isArabic
              ? 'تتم معالجة الاستشارات بأعلى درجات الخصوصية والتشفير.'
              : 'Consultations are processed with absolute privacy and confidentiality.'}
          </p>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] transition-all"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
