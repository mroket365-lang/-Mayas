import React, { useState, useEffect } from 'react';
import { UserProfile, CompanionItem } from '../types';
import { getTranslation } from '../locales/translations';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Crown,
  Zap,
  MessageSquare,
  Mic,
  Cpu,
  Calendar,
  BookmarkCheck,
  MessageCircle,
  Settings,
  Sliders,
  LogOut,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  Sparkles,
  KeyRound,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { SystemPublicSettings } from '../App';

interface ProfileViewProps {
  profile: UserProfile;
  items: CompanionItem[];
  systemSettings?: SystemPublicSettings | null;
  onUpdateProfile: (updated: UserProfile) => void;
  onNavigateTab: (tab: 'companion' | 'saved' | 'today' | 'profile') => void;
  onOpenSettings: () => void;
  onOpenSubscription: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  items,
  systemSettings,
  onUpdateProfile,
  onNavigateTab,
  onOpenSettings,
  onOpenSubscription,
  onOpenAuth,
  onLogout,
}) => {
  const isArabic = profile.language === 'ar';
  const t = getTranslation(profile.language);

  // Check if user is logged in (has an email or non-default ID)
  const isLoggedIn = Boolean(profile.email || (profile.id && profile.id.startsWith('USR-') && profile.id !== 'user_default_01'));

  // Editing Profile Name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profile.displayName || profile.addressAs || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Companion Calling Name (نداء الرفيق) State & Handlers
  const [companionNickname, setCompanionNickname] = useState(profile.addressAs || (isArabic ? 'يا غالي' : 'Friend'));
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  // Keep state in sync with profile
  useEffect(() => {
    if (profile.addressAs) {
      setCompanionNickname(profile.addressAs);
    }
  }, [profile.addressAs]);

  // Handle saving Companion Calling Name (نداء الرفيق) - Updates AI Calling Name without modifying registered user.name in Admin Panel
  const handleSaveCompanionNickname = async (customValue?: string) => {
    const val = (customValue !== undefined ? customValue : companionNickname).trim();
    if (!val) return;
    setIsSavingNickname(true);
    setSaveSuccessMsg(null);

    const updated: UserProfile = {
      ...profile,
      addressAs: val,
    };

    onUpdateProfile(updated);
    setCompanionNickname(val);

    try {
      const uid = profile.id || profile.email || 'user_default_01';
      await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          addressAs: val, // Only updates addressAs, leaves user.name intact in admin panel!
          language: profile.language,
          theme: profile.theme,
          companionGender: profile.companionGender,
        }),
      });

      setSaveSuccessMsg(
        isArabic
          ? `تم تحديث نداء الرفيق إلى "${val}" وسيناديك به الذكاء الاصطناعي فوراً! ✨`
          : `Companion calling name updated to "${val}"! ✨`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update companion nickname:', err);
    } finally {
      setIsSavingNickname(false);
    }
  };

  // Email Verification OTP State
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(() => {
    return true; // Default to true or check from server
  });

  // Real-time Stats State (Tokens, Points: 1 pt = 5 tokens, Messages, Voice)
  const [userStats, setUserStats] = useState<{
    tokensUsed: number;
    pointsUsed: number;
    messagesCount: number;
    voiceMinutes: number;
    voiceSeconds: number;
    period: string;
  } | null>(null);

  const [planInfo, setPlanInfo] = useState<{
    name: string;
    id: string;
    limits: {
      ai_messages_per_month: number;
      voice_minutes_per_month: number;
    };
  } | null>(null);

  // Fetch live stats & user verification status
  const fetchLiveStats = async () => {
    try {
      const uid = profile.id || profile.email || 'user_default_01';
      const res = await fetch(`/api/user/usage-stats?userId=${encodeURIComponent(uid)}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setUserStats(data.stats);
        if (data.plan) setPlanInfo(data.plan);
      }
    } catch (e) {
      console.warn('Failed to fetch user usage stats:', e);
    }
  };

  useEffect(() => {
    fetchLiveStats();

    const handleSync = () => {
      fetchLiveStats();
    };

    window.addEventListener('subscription_updated', handleSync);
    window.addEventListener('rafiq_realtime_event', handleSync);

    return () => {
      window.removeEventListener('subscription_updated', handleSync);
      window.removeEventListener('rafiq_realtime_event', handleSync);
    };
  }, [profile.id, profile.email]);

  // Handle saving modified name to local state and backend
  const handleSaveName = async () => {
    if (!editNameValue.trim()) return;
    setIsSavingName(true);
    setSaveSuccessMsg(null);

    const updated: UserProfile = {
      ...profile,
      displayName: editNameValue.trim(),
    };

    onUpdateProfile(updated);

    try {
      const uid = profile.id || profile.email || 'user_default_01';
      await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          name: editNameValue.trim(),
          language: profile.language,
          theme: profile.theme,
          companionGender: profile.companionGender,
        }),
      });

      setSaveSuccessMsg(isArabic ? 'تم تحديث الاسم وحفظه بنجاح ✨' : 'Name updated successfully ✨');
      setIsEditingName(false);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to sync updated profile to backend:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  // Send Email OTP verification code
  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError(null);
    setOtpMessage(null);

    try {
      const res = await fetch('/api/auth/send-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          userId: profile.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال رمز التحقق');

      setOtpMessage(data.message || data.hint || 'تم إرسال رمز التحقق لبريدك الإلكتروني');
      if (data.code) {
        setOtpCode(data.code); // auto-fill for testing ease
      }
      setIsVerifyingEmail(true);
    } catch (err: any) {
      setOtpError(err.message || 'حدث خطأ أثناء إرسال رمز التحقق');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Email OTP
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return;
    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          userId: profile.id,
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'رمز التحقق غير صحيح');

      setIsEmailVerified(true);
      setIsVerifyingEmail(false);
      setSaveSuccessMsg(isArabic ? 'تم توثيق بريدك الإلكتروني بنجاح ✨' : 'Email verified successfully ✨');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setOtpError(err.message || 'فشل التحقق من الرمز');
    } finally {
      setOtpLoading(false);
    }
  };

  // Calculate items summary
  const pendingTasksCount = items.filter((i) => i.status === 'pending').length;
  const completedTasksCount = items.filter((i) => i.status === 'completed' || i.status === 'completed_late').length;

  return (
    <div className="h-full overflow-y-auto w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-5 animate-fade-in pb-20">
      {/* 1. Header with Page Title & Settings Shortcut */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[var(--accent-sage)]/15 text-[var(--accent-sage)]">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
              {isArabic ? 'الملف الشخصي (البروفايل)' : 'User Profile'}
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {isArabic ? 'إدارة حسابك، بياناتك، استهلاكك والتفضيلات' : 'Manage your account, details, usage and preferences'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
          title={isArabic ? 'الإعدادات العامة' : 'General Settings'}
        >
          <Settings className="w-4 h-4 text-[var(--accent-sage)]" />
          <span className="hidden sm:inline">{isArabic ? 'الإعدادات' : 'Settings'}</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Main Profile / Account Card */}
      {!isLoggedIn ? (
        /* GUEST / NOT LOGGED IN STATE */
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-main)] to-[var(--bg-hover)] border border-[var(--border-color)] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
            <div className="w-16 h-16 rounded-3xl bg-[var(--accent-sage)]/20 border border-[var(--accent-sage)]/30 text-[var(--accent-sage)] flex items-center justify-center font-black text-2xl shrink-0 shadow-inner">
              👤
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-black text-[var(--text-main)]">
                  {isArabic ? 'أهلاً بك يا ضيفنا الكريم' : 'Welcome, Guest User'}
                </h2>
                <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  {isArabic ? 'حساب زائر محلي' : 'Local Guest'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xl">
                {isArabic
                  ? 'أنشئ حسابك الآن أو سجّل الدخول لحفظ جميع ذكرياتك، مواعيدك ومحادثات الرفيق بأمان سحابياً والوصول إليها من أي جهاز في أي وقت.'
                  : 'Create an account or login to backup your companion memory, tasks, and sync across all your devices.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="flex-1 sm:flex-none px-6 py-3 bg-[var(--accent-sage)] hover:opacity-90 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isArabic ? 'إنشاء حساب جديد / تسجيل الدخول' : 'Sign Up / Login'}</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="px-4 py-3 border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5"
            >
              <Sliders className="w-4 h-4 text-[var(--accent-sage)]" />
              <span>{isArabic ? 'تخصيص التفضيلات' : 'Preferences'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED USER STATE */
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm space-y-5">
          {/* Top User Info Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[var(--accent-sage)] to-emerald-600 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md">
                  {(profile.displayName || profile.addressAs || 'ر').charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full border-2 border-[var(--bg-surface)] shadow" title={isArabic ? 'متصل ونشط' : 'Online'}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Name & Details */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {!isEditingName ? (
                    <>
                      <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
                        {profile.displayName || profile.addressAs || (profile.email ? profile.email.split('@')[0] : 'مستخدم الرفيق')}
                      </h2>
                      <button
                        onClick={() => {
                          setEditNameValue(profile.displayName || profile.addressAs || '');
                          setIsEditingName(true);
                        }}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-sage)] rounded-lg transition-all"
                        title={isArabic ? 'تعديل الاسم' : 'Edit name'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        placeholder={isArabic ? 'الاسم' : 'Name'}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[var(--accent-sage)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none ring-1 ring-[var(--accent-sage)]"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="p-1.5 bg-[var(--accent-sage)] text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:opacity-90 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'حفظ' : 'Save'}</span>
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="px-2 py-1.5 border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-xl text-xs"
                      >
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  )}

                  {/* Plan Badge */}
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span>{planInfo?.name || 'Free Plan'}</span>
                  </span>
                </div>

                {/* Email and Verification */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[var(--text-muted)] pt-0.5">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="font-mono text-[var(--text-main)]">{profile.email || 'user@rafiq.local'}</span>
                  </div>

                  {isEmailVerified ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isArabic ? 'مؤكد وموثق' : 'Verified'}</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>{isArabic ? 'تأكيد البريد (OTP)' : 'Verify Email'}</span>
                    </button>
                  )}
                </div>

                {/* Account ID & Join Date */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-[var(--text-muted)] pt-1">
                  <span>
                    {isArabic ? 'معرف الحساب:' : 'Account ID:'}{' '}
                    <strong className="font-mono text-[var(--text-main)] font-semibold">{profile.id || 'USR-842910'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {isArabic ? 'نداء الرفيق:' : 'Addressed as:'}{' '}
                    <strong className="text-[var(--text-main)] font-semibold">{profile.addressAs || 'يا غالي'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Logout and Subscription Quick Actions */}
            <div className="flex items-center gap-2 self-center sm:self-start">
              <button
                onClick={onOpenSubscription}
                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
              >
                <Crown className="w-3.5 h-3.5 text-amber-100" />
                <span>{isArabic ? 'ترقية الخطة' : 'Upgrade Plan'}</span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 sm:px-3 sm:py-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5"
                title={isArabic ? 'تسجيل الخروج' : 'Logout'}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </div>
          </div>

          {/* OTP Verification Modal/Box if prompted */}
          {isVerifyingEmail && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>{isArabic ? 'التحقق من البريد الإلكتروني عبر رمز (OTP)' : 'Email OTP Verification'}</span>
                </span>
                <button
                  onClick={() => setIsVerifyingEmail(false)}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  {isArabic ? 'إغلاق' : 'Close'}
                </button>
              </div>

              {otpMessage && <p className="text-[11px] text-[var(--text-main)]">{otpMessage}</p>}
              {otpError && <p className="text-[11px] text-rose-500 font-bold">{otpError}</p>}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder={isArabic ? 'أدخل الرمز المكون من 6 أرقام' : '6-digit OTP code'}
                  className="px-3 py-2 text-xs font-mono text-center tracking-widest rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)] flex-1"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpLoading}
                  className="px-4 py-2 bg-[var(--accent-sage)] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all"
                >
                  {otpLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    isArabic ? 'تأكيد الرمز' : 'Verify'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2.5 Dedicated Companion Calling Name Card (نداء الرفيق للمستخدم) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-[var(--text-main)]">
                  {isArabic ? 'نداء الرفيق (الاسم الذي يناديك به الذكاء الاصطناعي)' : 'Companion Calling Name'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] border border-[var(--accent-sage)]/30">
                  {profile.addressAs || (isArabic ? 'يا غالي' : 'Friend')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                {isArabic
                  ? 'اختر أو اكتب اللقب الذي ترغب أن يناديك به رفيقك الذكي أثناء المحادثات والصوت'
                  : 'Customize how your AI companion addresses and speaks to you'}
              </p>
            </div>
          </div>
        </div>

        {/* Informative Privacy Note: Calling name is for AI companion, does NOT alter admin/registered name */}
        <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-2.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {isArabic
              ? '🔒 خصوصية وتخصيص: هذا اللقب مخصص للذكاء الاصطناعي أثناء التحدث والصوت، ولا يغير اسم حسابك الرسمي المسجل في لوحة التحكم أو النظام.'
              : '🔒 Privacy & Persona: This calling name is strictly for your AI companion and will not alter your registered account name in the admin dashboard.'}
          </span>
        </div>

        {/* Live Interactive Companion Greeting Preview */}
        <div className="p-3.5 rounded-2xl bg-[var(--accent-sage)]/10 border border-[var(--accent-sage)]/25 space-y-1.5 animate-fade-in">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-sage)]">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{isArabic ? 'معاينة نداء الرفيق المباشرة:' : 'Live Companion Voice Preview:'}</span>
          </div>
          <p className="text-xs font-semibold text-[var(--text-main)] italic">
            {isArabic
              ? `« أهلاً وسهلاً بك ${profile.addressAs || 'يا غالي'} ❤️ أنا معك ومستعد لسماعك ومساعدتك في أي وقت! »`
              : `« Hello ${profile.addressAs || 'Friend'} ❤️ I am right here and ready to help you conquer your day! »`}
          </p>
        </div>

        {/* Quick Presets / Nickname Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--text-main)] block">
            {isArabic ? 'اختيارات سريعة شائعة:' : 'Quick Presets:'}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'يا غالي ❤️', value: 'يا غالي' },
              { label: 'يا كابتن ⚡', value: 'يا كابتن' },
              { label: 'صديقي العزيز 🤝', value: 'صديقي العزيز' },
              { label: 'يا بطل 🏆', value: 'يا بطل' },
              { label: 'أبو فهد 👑', value: 'أبو فهد' },
              { label: 'أم سارة 🌸', value: 'أم سارة' },
              { label: 'المبدع ✨', value: 'المبدع' },
              { label: 'يا باشا 🌟', value: 'يا باشا' },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setCompanionNickname(preset.value);
                  handleSaveCompanionNickname(preset.value);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 shadow-sm ${
                  profile.addressAs === preset.value
                    ? 'bg-[var(--accent-sage)] text-white border-[var(--accent-sage)] scale-[1.02]'
                    : 'bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border-[var(--border-color)]'
                }`}
              >
                <span>{preset.label}</span>
                {profile.addressAs === preset.value && <CheckCircle2 className="w-3 h-3 ml-1" />}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Edit Input & Save */}
        <div className="pt-2 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={companionNickname}
              onChange={(e) => setCompanionNickname(e.target.value)}
              placeholder={isArabic ? 'اكتب لقباً مخصصاً (مثال: دكتور، سارة، أبو عبد الله)...' : 'Type custom nickname (e.g. Doctor, Sam, Mate)...'}
              className="w-full px-4 py-2.5 text-xs font-bold rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)] transition-all"
            />
          </div>

          <button
            type="button"
            disabled={isSavingNickname || !companionNickname.trim() || companionNickname.trim() === profile.addressAs}
            onClick={() => handleSaveCompanionNickname()}
            className="px-5 py-2.5 bg-[var(--accent-sage)] hover:opacity-90 active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {isSavingNickname ? (
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isArabic ? 'حفظ وتفعيل النداء' : 'Save Calling Name'}</span>
          </button>
        </div>
      </div>

      {/* 3. AI & Resource Consumption Statistics Card (1 point = 5 tokens) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--text-main)]">
                {isArabic ? 'إحصائيات الاستهلاك والنقاط' : 'Consumption & Points Stats'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {userStats?.period
                  ? isArabic
                    ? `فترة الاستخدام الحالية: ${userStats.period}`
                    : `Current Period: ${userStats.period}`
                  : isArabic
                  ? 'متابعة حية للاستهلاك الشهري'
                  : 'Live monthly usage tracking'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full">
            {isArabic ? '✨ 1 نقطة = 5 توكن' : '✨ 1 Point = 5 Tokens'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center pt-1">
          {/* Tokens Count */}
          <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block flex items-center justify-between">
              <span>{isArabic ? 'التوكنات' : 'Tokens'}</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            </span>
            <p className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
              {(userStats?.tokensUsed ?? 0).toLocaleString()}
            </p>
            <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
              {isArabic ? 'المستخدمة' : 'Used'}
            </span>
          </div>

          {/* Points (1 pt = 5 tokens) */}
          <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-purple-500/30 bg-purple-500/5">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block flex items-center justify-between">
              <span>{isArabic ? 'النقاط المستهلكة' : 'Points'}</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            </span>
            <p className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
              {(userStats?.pointsUsed ?? Math.floor((userStats?.tokensUsed || 0) / 5)).toLocaleString()}
            </p>
            <span className="text-[9px] text-purple-500/80 block mt-0.5 font-bold">
              {isArabic ? '1 نقطة / 5 توكن' : '1 pt / 5 tokens'}
            </span>
          </div>

          {/* Messages */}
          <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block flex items-center justify-between">
              <span>{isArabic ? 'رسائل الذكاء' : 'AI Messages'}</span>
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            </span>
            <p className="text-base sm:text-lg font-black text-[var(--text-main)] mt-1 font-mono">
              {userStats?.messagesCount ?? 0}
              <span className="text-[10px] text-[var(--text-muted)] font-normal">
                {' '}/ {planInfo?.limits?.ai_messages_per_month ?? 50}
              </span>
            </p>
            <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
              {isArabic ? 'رسائل محادثة' : 'Messages'}
            </span>
          </div>

          {/* Voice */}
          <div className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] block flex items-center justify-between">
              <span>{isArabic ? 'دقائق الصوت' : 'Voice Mins'}</span>
              <Mic className="w-3.5 h-3.5 text-emerald-500" />
            </span>
            <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {userStats?.voiceMinutes ?? 0}د
              <span className="text-[10px] text-[var(--text-muted)] font-normal">
                {' '}/ {planInfo?.limits?.voice_minutes_per_month ?? 15}د
              </span>
            </p>
            <span className="text-[9px] text-[var(--text-muted)] block mt-0.5 font-mono">
              {userStats?.voiceSeconds ?? 0} {isArabic ? 'ثانية' : 'sec'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Quick Navigation Hub (العودة للرئيسية، يومي، المحفوظات) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider px-1">
          {isArabic ? 'التنقل السريع في أقسام التطبيق' : 'Quick Navigation Hub'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Main Companion View */}
          <button
            onClick={() => onNavigateTab('companion')}
            className="p-4 rounded-3xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-start transition-all shadow-sm flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] group-hover:scale-110 transition-all">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)]">
                  {isArabic ? 'العودة للواجهة الرئيسية' : 'Return to Companion'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {isArabic ? 'محادثة الرفيق الذكي الصوتي والكتابي' : 'Smart Voice & Text Companion'}
                </p>
              </div>
            </div>
            {isArabic ? <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>

          {/* 2. Today View */}
          <button
            onClick={() => onNavigateTab('today')}
            className="p-4 rounded-3xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-start transition-all shadow-sm flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-all">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)]">
                  {isArabic ? 'قائمة يومي والجدول' : 'Today Schedule'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {isArabic ? `${pendingTasksCount} مهام معلقة لهذا اليوم` : `${pendingTasksCount} pending items today`}
                </p>
              </div>
            </div>
            {isArabic ? <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>

          {/* 3. Saved View */}
          <button
            onClick={() => onNavigateTab('saved')}
            className="p-4 rounded-3xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-start transition-all shadow-sm flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-all">
                <BookmarkCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)]">
                  {isArabic ? 'قائمة المحفوظات والذاكرة' : 'Saved & Memories'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {isArabic ? `${items.length} عنصر وملاحظة محفوظة` : `${items.length} saved memories & notes`}
                </p>
              </div>
            </div>
            {isArabic ? <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>
        </div>
      </div>

      {/* 5. Tools & General Preferences Hub */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--text-main)]">
                {isArabic ? 'الأدوات والتفضيلات السريعة' : 'Tools & Preferences'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {isArabic ? 'تخصيص المظهر، اللغة وتفضيلات النظام' : 'Theme, language and system preferences'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] transition-all flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
            <span>{isArabic ? 'الإعدادات الكاملة' : 'Full Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Theme Quick Toggle */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                {profile.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)]">
                  {isArabic ? 'مظهر التطبيق' : 'App Theme'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {profile.theme === 'dark'
                    ? isArabic
                      ? 'الوضع الليلي (داكن)'
                      : 'Dark Mode'
                    : isArabic
                    ? 'الوضع النهاري (فاتح)'
                    : 'Light Mode'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const nextTheme = profile.theme === 'dark' ? 'light' : 'dark';
                onUpdateProfile({ ...profile, theme: nextTheme });
              }}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] transition-all"
            >
              {profile.theme === 'dark' ? (isArabic ? '☀️ تفعيل الفاتح' : '☀️ Light') : (isArabic ? '🌙 تفعيل الداكن' : '🌙 Dark')}
            </button>
          </div>

          {/* Companion Persona Shortcut */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-main)]">
                  {isArabic ? 'شخصية الرفيق' : 'Companion Persona'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {isArabic
                    ? profile.personality === 'close_friend'
                      ? 'صديق مقرب'
                      : profile.personality === 'bold'
                      ? 'جريء وصريح'
                      : profile.personality === 'secretary'
                      ? 'سكرتير شخصي'
                      : 'محفز ومشجع'
                    : profile.personality}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-xs font-bold text-[var(--text-main)] transition-all"
            >
              {isArabic ? 'تغيير' : 'Change'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
