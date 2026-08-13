import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, ShieldCheck, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface MaritalCounselingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export const MaritalCounselingModal: React.FC<MaritalCounselingModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const [agreed18, setAgreed18] = useState(profile.specialCounselingVerified18 || false);
  const [agreedNeeds, setAgreedNeeds] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

  useEffect(() => {
    if (!profile.specialCounselingExpiresAt) {
      setIsSessionActive(false);
      return;
    }

    const interval = setInterval(() => {
      const expiresAt = new Date(profile.specialCounselingExpiresAt!).getTime();
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setIsSessionActive(false);
        setRemainingTime('00:00');
      } else {
        setIsSessionActive(true);
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemainingTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile.specialCounselingExpiresAt]);

  if (!isOpen) return null;

  const handleStartSession = () => {
    if (!agreed18 || !agreedNeeds || !agreedTerms) return;

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const todayStr = new Date().toISOString().split('T')[0];

    onUpdateProfile({
      ...profile,
      specialCounselingEnabled: true,
      specialCounselingVerified18: true,
      specialCounselingExpiresAt: expiresAt,
      specialCounselingLastActivatedDate: todayStr,
    });
  };

  const handleEndSession = () => {
    onUpdateProfile({
      ...profile,
      specialCounselingEnabled: false,
      specialCounselingExpiresAt: undefined,
    });
  };

  const isArabic = profile.language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-500/10 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-500 shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
                <span>{isArabic ? 'جلسة الاستشارة والدعم الزوجي' : 'Marital Intimacy Support'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 font-bold">
                  18+
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {isArabic
                  ? 'دعم وإرشادات مخصصة للتغلب على صعوبات العلاقة الزوجية الحميمة'
                  : 'Specialized counseling and direct guidance for marital intimacy'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status view if session active */}
          {isSessionActive ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-3 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{isArabic ? 'الجلسة الاستشارية نشطة حالياً' : 'Session Currently Active'}</span>
              </div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-widest dir-ltr">
                ⏱️ {remainingTime}
              </div>
              <p className="text-xs text-[var(--text-main)] leading-relaxed">
                {isArabic
                  ? 'يمكنك الآن الانتقال إلى شاشة المحادثة وطرح كافة أسئلتك واستفساراتك المتعلقة بالعلاقة الزوجية الحميمة بكل وضوح، وستحصل على تحليل وإرشادات علمية ونفسية مخصصة.'
                  : 'You can now go to the chat screen and ask any marital intimacy questions with complete clarity and direct guidance.'}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold border border-rose-500/30 transition-all"
                >
                  {isArabic ? 'إنهاء الجلسة الآن' : 'End Session Now'}
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-md hover:opacity-90 transition-all"
                >
                  {isArabic ? 'الانتقال للمحادثة' : 'Go to Chat'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Info Card */}
              <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-rose-500 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isArabic ? 'خصوصية تامة واستشارات مخصصة' : 'Complete Privacy & Guidance'}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {isArabic
                    ? 'هذه الميزة مصممة خصيصاً لمساعدة الأزواج وذوي الاحتياجات الخاصة الذين يواجهون صعوبات في العلاقة الحميمة والتواصل الزوجي. عند التفعيل، يقوم الذكاء الاصطناعي بتقديم تحليل وافٍ وإرشادات علمية ونفسية جريئة وواضحة لبناء أفضل الممارسات بين الزوجين.'
                    : 'Designed for couples and special needs individuals facing marital intimacy challenges. Provides scientific, behavioral analysis and direct step-by-step guidance.'}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 font-bold pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {isArabic
                      ? 'مدة الجلسة: 60 دقيقة من الحوار الاستشاري المفتوح'
                      : 'Session duration: 60 minutes of open counseling'}
                  </span>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                  {isArabic ? 'الشروط والتعهدات المطلوبة للتفعيل' : 'Verification & Pledge'}
                </h4>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] cursor-pointer hover:border-rose-500/40 transition-all">
                  <input
                    type="checkbox"
                    checked={agreed18}
                    onChange={(e) => setAgreed18(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-gray-300"
                  />
                  <span className="text-xs text-[var(--text-main)] leading-normal">
                    {isArabic
                      ? 'أقر وأتعهد بأني أبلغ من العمر 18 عاماً فأكثر (السن القانوني).'
                      : 'I pledge and confirm that I am 18 years of age or older (legal age).'}
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] cursor-pointer hover:border-rose-500/40 transition-all">
                  <input
                    type="checkbox"
                    checked={agreedNeeds}
                    onChange={(e) => setAgreedNeeds(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-gray-300"
                  />
                  <span className="text-xs text-[var(--text-main)] leading-normal">
                    {isArabic
                      ? 'أقر بأني أواجه أو شريكي صعوبات أو أحتاج إلى حلول وإرشادات مخصصة للعلاقة الزوجية الحميمة.'
                      : 'I confirm that I or my partner face intimacy barriers or seek specialized marital solutions.'}
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] cursor-pointer hover:border-rose-500/40 transition-all">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-500 focus:ring-rose-500 border-gray-300"
                  />
                  <span className="text-xs text-[var(--text-main)] leading-normal">
                    {isArabic
                      ? 'أفهم أن الإرشادات للتوعية والتوجيه السلوكي والعاطفي وليست بديلاً عن الاستشارة الطبية المباشرة.'
                      : 'I understand that advice is for behavioral & emotional guidance and not a medical replacement.'}
                  </span>
                </label>
              </div>

              {/* Activate Button */}
              <div className="pt-2">
                <button
                  onClick={handleStartSession}
                  disabled={!agreed18 || !agreedNeeds || !agreedTerms}
                  className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                    agreed18 && agreedNeeds && agreedTerms
                      ? 'bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 text-white hover:opacity-95 shadow-rose-500/25 active:scale-[0.99]'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-transparent'
                  }`}
                >
                  <HeartHandshake className="w-5 h-5" />
                  <span>{isArabic ? 'بدء الجلسة الاستشارية (60 دقيقة)' : 'Start 60-Min Counseling Session'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
