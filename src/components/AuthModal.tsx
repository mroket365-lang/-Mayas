import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import { X, Mail, Lock, User, Phone, Sparkles, CheckCircle2, ShieldCheck, LogIn, UserPlus, KeyRound, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  profile: UserProfile;
  authMethods?: {
    googleAuthEnabled: boolean;
    emailPasswordEnabled: boolean;
  };
  serverGoogleClientId?: string;
  onClose: () => void;
  onLoginSuccess: (user: {
    id: string;
    accountId: string;
    email: string;
    username?: string;
    phone?: string;
    name: string;
    role: string;
    profileData?: any;
    messagesData?: any;
    itemsData?: any;
  }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  profile,
  authMethods,
  serverGoogleClientId,
  onClose,
  onLoginSuccess,
}) => {
  const isGoogleOnly = authMethods?.emailPasswordEnabled === false;
  const isEmailEnabled = authMethods?.emailPasswordEnabled !== false;
  const isGoogleEnabled = authMethods?.googleAuthEnabled !== false;

  const [mode, setMode] = useState<'login' | 'register' | 'recover' | 'reset' | 'verify-otp'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFoundUser, setIsNotFoundUser] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [codeOrToken, setCodeOrToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email, username, or phone for login/recovery

  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';

  // Timer for OTP resend cooldown
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/send-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail || email || identifier,
          userId: pendingUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال رمز التحقق');
      setSuccessMsg(data.message || 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني بنجاح!');
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل إعادة الإرسال');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToRegisterWithIdentifier = () => {
    setIsNotFoundUser(false);
    setError(null);
    if (identifier.includes('@')) {
      setEmail(identifier);
    } else if (/^\+?[0-9]{7,15}$/.test(identifier)) {
      setPhone(identifier);
    } else if (identifier) {
      setUsername(identifier);
    }
    setMode('register');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsNotFoundUser(false);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: name || (email.split('@')[0]),
            username,
            phone,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل إنشاء الحساب');

        if (data.requiresVerification) {
          setPendingEmail(data.email || email);
          setPendingUserId(data.userId || '');
          setSuccessMsg('تم إنشاء الحساب! تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني لتأكيد ملكيته ✉️');
          setMode('verify-otp');
          setResendCooldown(60);
        } else if (data.user) {
          setSuccessMsg('تم إنشاء الحساب بنجاح وتفعيل المزامنة! جاري فتح حسابك...');
          setTimeout(() => {
            onLoginSuccess(data.user);
            onClose();
          }, 1200);
        }
      } else if (mode === 'login') {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifier || email,
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404 || data.code === 'USER_NOT_FOUND') {
            setIsNotFoundUser(true);
          }
          throw new Error(data.error || 'فشل تسجيل الدخول');
        }

        if (data.requiresVerification) {
          setPendingEmail(data.email || email || identifier);
          setPendingUserId(data.userId || '');
          setSuccessMsg(data.message || 'بريدك الإلكتروني يحتاج إلى تفعيل. أدخل الرمز المرسل لإيميلك.');
          setMode('verify-otp');
          setResendCooldown(60);
        } else if (data.user) {
          setSuccessMsg('تم تسجيل الدخول بنجاح!');
          setTimeout(() => {
            onLoginSuccess(data.user);
            onClose();
          }, 1000);
        }
      } else if (mode === 'verify-otp') {
        const res = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: pendingEmail || email || identifier,
            userId: pendingUserId,
            code: otpCode,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'رمز التحقق غير صحيح');

        setSuccessMsg('تم تأكيد بريدك الإلكتروني وتفعيل الحساب بنجاح! 🎉');
        setTimeout(() => {
          if (data.user) {
            onLoginSuccess(data.user);
          }
          onClose();
        }, 1200);
      } else if (mode === 'recover') {
        const res = await fetch('/api/recover-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier || email }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404 || data.code === 'USER_NOT_FOUND') {
            setIsNotFoundUser(true);
          }
          throw new Error(data.error || 'لم يتم العثور على الحساب');
        }

        setSuccessMsg(data.message || data.hint || 'تم إرسال رمز استعادة كلمة السر لبريدك بنجاح');
        if (data.hint) {
          setError(`تنبيه للتأكيد الاختباري: ${data.hint}`);
        }
        setMode('reset');
      } else if (mode === 'reset') {
        const res = await fetch('/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifier || email,
            codeOrToken,
            newPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشلت إعادة تعيين كلمة السر');

        setSuccessMsg(data.message || 'تمت إعادة تعيين كلمة السر بنجاح. يمكنك الآن تسجيل الدخول.');
        setTimeout(() => {
          setMode('login');
          setPassword(newPassword);
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (
      serverGoogleClientId ||
      (window as any).__GOOGLE_CLIENT_ID__ ||
      (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
      ''
    );
  });
  const [showClientIdPrompt, setShowClientIdPrompt] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState('');

  // Fetch system settings to retrieve backend-configured googleClientId if any
  React.useEffect(() => {
    if (serverGoogleClientId) {
      setGoogleClientId(serverGoogleClientId);
      return;
    }
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.googleClientId && !googleClientId) {
          setGoogleClientId(data.googleClientId);
        }
      })
      .catch(() => {});
  }, [serverGoogleClientId, googleClientId]);

  const executeGoogleOAuth = (clientIdToUse: string) => {
    const googleObj = (window as any).google;
    if (!googleObj?.accounts?.oauth2) {
      setError('جاري تحميل مكتبة تسجيل الدخول من جوجل، يرجى المحاولة بعد ثوانٍ');
      setLoading(false);
      return;
    }

    try {
      const client = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientIdToUse.trim(),
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setLoading(false);
            if (tokenResponse.error !== 'access_denied') {
              setError(`خطأ أثناء تسجيل الدخول بجوجل: ${tokenResponse.error_description || tokenResponse.error}`);
            }
            return;
          }

          try {
            setLoading(true);
            setSuccessMsg('جاري جلب بيانات حساب جوجل المعتمد...');

            // Fetch real profile from Google's official userinfo endpoint
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            if (!userRes.ok) {
              throw new Error('تعذر جلب معلومات الحساب من خوادم Google');
            }

            const googleProfile = await userRes.json();
            if (!googleProfile.email) {
              throw new Error('لم نتمكن من الحصول على البريد الإلكتروني لحساب جوجل');
            }

            // Send real authenticated Google account to backend
            const res = await fetch('/api/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                googleEmail: googleProfile.email,
                name: googleProfile.name || googleProfile.given_name || googleProfile.email.split('@')[0],
                picture: googleProfile.picture || '',
                googleId: googleProfile.sub,
                accessToken: tokenResponse.access_token,
              }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل التسجيل بحساب جوجل');

            setSuccessMsg(`تم بنجاح ربط حسابك الحقيقي (${googleProfile.email}) وتم إرسال رسالة الترحيب لبريدك!`);
            setTimeout(() => {
              onLoginSuccess(data.user);
              onClose();
            }, 1200);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'فشل الاتصال بخوادم جوجل';
            setError(msg);
          } finally {
            setLoading(false);
          }
        },
      });

      // Triggers Google's official account selector dialog popup
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'تعذر بدء نافذة تسجيل جوجل';
      setError(msg);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const activeClientId = googleClientId || customClientIdInput;

    if (!activeClientId) {
      setLoading(false);
      setShowClientIdPrompt(true);
      return;
    }

    executeGoogleOAuth(activeClientId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rtl:right-4 rtl:left-auto p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--accent-sage)] text-white shadow-md">
            {mode === 'verify-otp' ? (
              <Mail className="w-6 h-6 animate-bounce" />
            ) : (
              <Sparkles className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            {isGoogleOnly
              ? isArabic
                ? 'تسجيل الدخول والمزامنة السحابية'
                : 'Sign In & Cloud Sync'
              : mode === 'verify-otp'
              ? isArabic
                ? 'تأكيد بريدك الإلكتروني'
                : 'Verify Your Email'
              : mode === 'register'
              ? isArabic
                ? 'إنشاء حساب جديد وتأمين بياناتك'
                : 'Create Account & Save Data'
              : mode === 'login'
              ? isArabic
                ? 'تسجيل الدخول إلى حسابك'
                : 'Login to Your Account'
              : isArabic
              ? 'استعادة كلمة السر'
              : 'Recover Password'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-medium max-w-xs mx-auto">
            {isGoogleOnly
              ? isArabic
                ? 'سجل دخولك بنقرة واحدة عبر حساب جوجل لحفظ واسترجاع كافة محادثاتك بأمان تام'
                : 'Sign in with one click via Google to secure and restore all your conversations.'
              : mode === 'verify-otp'
              ? isArabic
                ? `أدخل رمز التحقق المكون من 6 أرقام المرسل إلى (${pendingEmail || email || identifier})`
                : `Enter the 6-digit code sent to (${pendingEmail || email || identifier})`
              : isArabic
              ? 'احفظ جميع محادثاتك وملاحظاتك بأمان ومزامنتها عبر الأجهزة'
              : 'Securely sync your companion chats and memory across devices'}
          </p>
        </div>

        {/* Primary Google Login Button (Highlighted prominently when Google is enabled) */}
        {isGoogleEnabled && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3.5 px-4 border-2 border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-sm shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isArabic ? 'المتابعة والتسجيل عبر حساب جوجل الرسمي (Google)' : 'Continue with Google Account'}</span>
            </button>

            {isGoogleOnly && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{isArabic ? 'الدخول محمي ومعتمد عبر Google بدون الحاجة لكلمات سر' : 'Seamless & passwordless authentication via Google'}</span>
              </div>
            )}
          </div>
        )}

        {/* Mode Selector Tabs (Hidden if Google Only or when verifying OTP) */}
        {isEmailEnabled && mode !== 'verify-otp' && (
          <>
            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-[var(--border-color)] w-full" />
              <span className="bg-[var(--bg-surface)] px-3 text-[10px] text-[var(--text-muted)] font-bold uppercase shrink-0">
                {isArabic ? 'أو التسجيل عبر البريد وكلمة السر' : 'Or with Email & Password'}
              </span>
              <div className="border-t border-[var(--border-color)] w-full" />
            </div>

            <div className="grid grid-cols-2 p-1 bg-[var(--bg-hover)] rounded-2xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-sage)] shadow-sm font-extrabold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isArabic ? 'إنشاء حساب' : 'Sign Up'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-sage)] shadow-sm font-extrabold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{isArabic ? 'تسجيل الدخول' : 'Login'}</span>
              </button>
            </div>
          </>
        )}

        {isNotFoundUser && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-700 dark:text-amber-300 text-xs space-y-2 animate-fade-in">
            <p className="font-bold leading-relaxed">
              {isArabic
                ? 'هذا البريد الإلكتروني أو رقم الهاتف غير مسجل لدينا في النظام. نقترح عليك إنشاء حساب جديد للتأكد من حفظ بياناتك ومحادثاتك.'
                : 'This email or phone number is not registered in our system. We suggest creating a new account.'}
            </p>
            <button
              type="button"
              onClick={handleSwitchToRegisterWithIdentifier}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isArabic
                  ? 'إنشاء حساب جديد بـ ' + (identifier || 'هذه البيانات')
                  : 'Create account with ' + (identifier || 'this info')}
              </span>
            </button>
          </div>
        )}

        {error && !isNotFoundUser && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-fade-in">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form (Only rendered when email auth is enabled, or during recovery/OTP mode) */}
        {(isEmailEnabled || mode === 'verify-otp' || mode === 'recover' || mode === 'reset') && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'الاسم' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isArabic ? 'اسمك الكامل (مثال: محمد علي)' : 'Full Name'}
                      className="w-full px-9 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-9 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'كلمة المرور' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full ps-9 pe-10 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rtl:left-3 rtl:right-auto text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1"
                      title={showPassword ? (isArabic ? 'إخفاء كلمة السر' : 'Hide password') : (isArabic ? 'إظهار كلمة السر' : 'Show password')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === 'login' && (
              <>
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'البريد الإلكتروني / اسم المستخدم / الهاتف' : 'Email / Username / Phone'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={isArabic ? 'أدخل بريدك أو اسم المستخدم أو رقم هاتفك' : 'Email, Username or Phone'}
                      className="w-full px-9 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-[var(--text-muted)] uppercase">
                      {isArabic ? 'كلمة المرور' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('recover')}
                      className="text-[11px] text-[var(--accent-sage)] font-bold hover:underline"
                    >
                      {isArabic ? 'نسيت كلمة السر؟' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full ps-9 pe-10 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rtl:left-3 rtl:right-auto text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1"
                      title={showPassword ? (isArabic ? 'إخفاء كلمة السر' : 'Hide password') : (isArabic ? 'إظهار كلمة السر' : 'Show password')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === 'recover' && (
              <div className="space-y-2">
                <label className="font-bold text-[var(--text-muted)] uppercase">
                  {isArabic ? 'أدخل بريدك أو اسم المستخدم أو هاتفك المسجل' : 'Enter Registered Email / Phone'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-9 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'رمز التحقق المرسل لبريدك' : 'Verification Code'}
                  </label>
                  <input
                    type="text"
                    required
                    value={codeOrToken}
                    onChange={(e) => setCodeOrToken(e.target.value)}
                    placeholder="e.g. 849201"
                    className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full ps-9 pe-10 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rtl:left-3 rtl:right-auto text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1"
                      title={showNewPassword ? (isArabic ? 'إخفاء كلمة السر' : 'Hide password') : (isArabic ? 'إظهار كلمة السر' : 'Show password')}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'verify-otp' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'رمز التحقق (OTP)' : 'Verification Code'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-mono text-center text-xl font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)] shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-[var(--accent-sage)] font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    {resendCooldown > 0
                      ? isArabic
                        ? `إعادة الإرسال بعد (${resendCooldown} ثانية)`
                        : `Resend in (${resendCooldown}s)`
                      : isArabic
                      ? '🔄 إعادة إرسال رمز جديد'
                      : '🔄 Resend new code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium underline"
                  >
                    {isArabic ? 'تغيير البريد' : 'Change Email'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent-sage)] hover:opacity-90 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'verify-otp' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : mode === 'register' ? (
                    <UserPlus className="w-4 h-4" />
                  ) : mode === 'login' ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>
                    {mode === 'verify-otp'
                      ? isArabic
                        ? 'تأكيد وتفعيل الحساب'
                        : 'Verify & Activate Account'
                      : mode === 'register'
                      ? isArabic
                        ? 'إنشاء وتأكيد الحساب'
                        : 'Create Account'
                      : mode === 'login'
                      ? isArabic
                        ? 'تسجيل الدخول'
                        : 'Sign In'
                      : isArabic
                      ? 'إرسال رابط الاستعادة'
                      : 'Send Recovery Email'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Google Client ID Config Prompt if needed */}
        {showClientIdPrompt && (
          <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3 text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-main)]">
                {isArabic ? '⚙️ إعداد معرف حساب جوجل (Google Client ID)' : '⚙️ Configure Google Client ID'}
              </span>
              <button
                type="button"
                onClick={() => setShowClientIdPrompt(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-[var(--text-muted)] leading-relaxed">
              {isArabic
                ? 'لفتح نافذة اختيار حسابات جوجل الرسمية، أدخل معرف العميل (Client ID) المأخوذ من Google Cloud Console، أو قم بضبطه في متغيرات البيئة باسم GOOGLE_CLIENT_ID:'
                : 'Enter your OAuth Client ID from Google Cloud Console, or configure GOOGLE_CLIENT_ID in your environment variables:'}
            </p>
            <input
              type="text"
              value={customClientIdInput}
              onChange={(e) => setCustomClientIdInput(e.target.value)}
              placeholder="123456789-xxxxx.apps.googleusercontent.com"
              className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (customClientIdInput.trim()) {
                    setGoogleClientId(customClientIdInput.trim());
                    setShowClientIdPrompt(false);
                    executeGoogleOAuth(customClientIdInput.trim());
                  } else {
                    setError('يرجى إدخال معرف عميل جوجل صالح');
                  }
                }}
                className="flex-1 py-2 bg-[var(--accent-sage)] text-white font-bold rounded-xl hover:opacity-90 transition-all"
              >
                {isArabic ? 'متابعة عبر جوجل' : 'Continue with Google'}
              </button>
              <button
                type="button"
                onClick={() => setShowClientIdPrompt(false)}
                className="px-3 py-2 border border-[var(--border-color)] text-[var(--text-muted)] rounded-xl hover:bg-[var(--bg-hover)] transition-all"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isArabic ? 'تشفير تام لحفظ وسرية البيانات والمحادثات' : 'End-to-end encryption for all conversations'}</span>
        </div>
      </div>
    </div>
  );
};
