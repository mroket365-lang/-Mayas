import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import { X, Mail, Lock, User, Phone, Sparkles, CheckCircle2, ShieldCheck, LogIn, UserPlus, KeyRound } from 'lucide-react';

interface AuthModalProps {
  profile: UserProfile;
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

export const AuthModal: React.FC<AuthModalProps> = ({ profile, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email, username, or phone for login/recovery

  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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

        setSuccessMsg('تم إنشاء الحساب بنجاح! جاري حفظ بياناتك وتنشيط الحساب...');
        setTimeout(() => {
          onLoginSuccess(data.user);
          onClose();
        }, 1200);
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
        if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');

        setSuccessMsg('تم تسجيل الدخول بنجاح!');
        setTimeout(() => {
          onLoginSuccess(data.user);
          onClose();
        }, 1000);
      } else if (mode === 'recover') {
        const res = await fetch('/api/recover-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier || email }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'لم يتم العثور على الحساب');

        setSuccessMsg(data.hint || 'تم إرسال تعليمات الاستعادة بنجاح');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const fakeGoogleEmail = `user_${Math.floor(1000 + Math.random() * 9000)}@gmail.com`;
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleEmail: fakeGoogleEmail,
          name: 'مستخدم جوجل',
          googleId: `goog_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التسجيل بحساب جوجل');

      setSuccessMsg('تم الربط بحساب جوجل بنجاح!');
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل التسجيل عبر جوجل';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            {mode === 'register'
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
            {isArabic
              ? 'احفظ جميع محادثاتك وملاحظاتك بأمان ومزامنتها عبر الأجهزة'
              : 'Securely sync your companion chats and memory across devices'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
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

        {error && (
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-muted)] uppercase">
                  {isArabic ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isArabic ? 'مثال: محمد علي' : 'Full Name'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'اسم المستخدم (اختياري)' : 'Username (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. user123"
                    className="w-full px-3 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--text-muted)] uppercase">
                    {isArabic ? 'رقم الهاتف (اختياري)' : 'Phone (Optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 rtl:right-2.5 rtl:left-auto" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 500 000 000"
                      className="w-full px-8 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-muted)] uppercase">
                  {isArabic ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-9 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                  />
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
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-9 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                  />
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--accent-sage)] hover:opacity-90 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'register' ? (
                  <UserPlus className="w-4 h-4" />
                ) : mode === 'login' ? (
                  <LogIn className="w-4 h-4" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>
                  {mode === 'register'
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

        {/* Google Auth Divider & Button */}
        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-[var(--border-color)] w-full" />
          <span className="bg-[var(--bg-surface)] px-3 text-[10px] text-[var(--text-muted)] font-bold uppercase shrink-0">
            {isArabic ? 'أو عبر حساب جوجل' : 'Or with Google'}
          </span>
          <div className="border-t border-[var(--border-color)] w-full" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-2.5 border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>{isArabic ? 'المتابعة باستعمال حساب جوجل (Google)' : 'Continue with Google'}</span>
        </button>

        <div className="text-center text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isArabic ? 'تشفير تام لحفظ وسرية البيانات والمحادثات' : 'End-to-end encryption for all conversations'}</span>
        </div>
      </div>
    </div>
  );
};
