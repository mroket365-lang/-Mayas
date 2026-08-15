import React from 'react';
import { Sparkles, UserPlus, LogIn, Cloud, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { AppLanguage } from '../types';

interface GuestBannerProps {
  language: AppLanguage;
  onOpenAuth: () => void;
  onDismiss?: () => void;
  messageCount?: number;
}

export const GuestBanner: React.FC<GuestBannerProps> = ({
  language,
  onOpenAuth,
  onDismiss,
  messageCount = 0,
}) => {
  const isArabic = language === 'ar';

  return (
    <div
      id="guest-notification-banner"
      className="relative mx-3 my-2 p-3 sm:p-3.5 pr-8 sm:pr-9 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 text-[var(--text-main)] shadow-sm animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0"
    >
      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label={isArabic ? 'إغلاق التنبيه' : 'Dismiss banner'}
          title={isArabic ? 'إغلاق التنبيه' : 'Dismiss'}
          className="absolute top-2.5 left-2.5 sm:left-3 rtl:left-auto rtl:right-2.5 rtl:sm:right-3 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-2.5 min-w-0 flex-1 pl-1 rtl:pl-0 rtl:pr-1">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
          <Cloud className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
            <span>{isArabic ? '💡 أنت تستخدم رفيق كـ "ضيف زائر"' : '💡 You are using Rafiq as a "Guest"'}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-md font-extrabold">
              {isArabic ? 'تجربة حرة' : 'Free Trial'}
            </span>
          </h4>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
            {isArabic
              ? 'محادثاتك ومهامك مؤقتة على هذا المتصفح. أنشئ حسابك مجاناً لحفظها والوصول إليها من أي جهاز آخر.'
              : 'Your chat & tasks are stored locally in this browser. Create a free account or log in to sync them across all devices.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
        <button
          onClick={onOpenAuth}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <UserPlus className="w-3.5 h-3.5 shrink-0" />
          <span>{isArabic ? 'إنشاء حساب / تسجيل الدخول' : 'Sign Up / Log In'}</span>
        </button>
      </div>
    </div>
  );
};
