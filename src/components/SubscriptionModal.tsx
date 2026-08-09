import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, Sparkles, Zap, Shield, X, CreditCard } from 'lucide-react';
import { UserProfile } from '../types';

interface SubscriptionModalProps {
  profile: UserProfile;
  onClose: () => void;
  onProfileUpdated?: (updatedProfile: UserProfile) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ profile, onClose, onProfileUpdated }) => {
  const isArabic = profile.language === 'ar';
  const userId = profile.id || 'user_default_01';

  const [statusData, setStatusData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statusRes, plansRes] = await Promise.all([
          fetch(`/api/subscription/status?userId=${userId}`),
          fetch('/api/subscription/plans'),
        ]);

        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          setStatusData(statusJson);
        }

        if (plansRes.ok) {
          const plansJson = await plansRes.json();
          setPlans(plansJson.filter((p: any) => p.active));
        }
      } catch (err) {
        console.error('Fetch subscription data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleCheckout = async (planId: string) => {
    setProcessingPlanId(planId);
    setMessage(null);

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planId,
          billingCycle,
          paymentProvider: 'stripe',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      setMessage(
        isArabic
          ? 'تمت ترقية اشتراكك بنجاح! استمتع بكافة الميزات غير المحدودة 🎉'
          : 'Subscription upgraded successfully! Enjoy unlimited AI capabilities 🎉'
      );

      // Re-fetch status
      const statusRes = await fetch(`/api/subscription/status?userId=${userId}`);
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        setStatusData(statusJson);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error during checkout';
      setMessage(msg);
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)]">
                {isArabic ? 'اشتراك رفيق المتقدم (Rafiq Premium)' : 'Rafiq Premium Subscription'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {isArabic ? 'احصل على محادثات غير محدودة، تحليل صوتي وميزات ذكاء اصطناعي فائقة' : 'Get unlimited chats, voice interaction, and multi-model AI capabilities'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-[var(--bg-main)] hover:opacity-80 rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs rounded-2xl flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="text-[var(--text-muted)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            {isArabic ? 'جاري تحميل تفاصيل الاشتراك...' : 'Loading subscription details...'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Active Plan Card */}
            {statusData && (
              <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">{isArabic ? 'خاطتك الحالية:' : 'Current Plan:'}</span>
                    <span className="font-bold text-amber-500 text-sm flex items-center gap-1">
                      {statusData.plan?.id !== 'free' && <Crown className="w-4 h-4" />}
                      {statusData.plan?.name}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                      {statusData.status}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--text-muted)] mt-2 space-y-1">
                    <p>
                      {isArabic ? 'استخدام رسائل الذكاء الاصطناعي هذا الشهر:' : 'AI Message usage this month:'}{' '}
                      <strong className="text-[var(--text-main)]">
                        {statusData.usage?.ai_messages?.count || 0} / {statusData.plan?.limits?.ai_messages_per_month}
                      </strong>
                    </p>
                  </div>
                </div>

                {statusData.plan?.id === 'free' && (
                  <span className="text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                    {isArabic ? 'ترقية متاحة الآن ✨' : 'Upgrade Available ✨'}
                  </span>
                )}
              </div>
            )}

            {/* Monthly / Yearly Billing Switcher */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {isArabic ? 'الدفع الشهري' : 'Monthly Billing'}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>{isArabic ? 'الدفع السنوي' : 'Yearly Billing'}</span>
                <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {isArabic ? 'توفير 20%' : 'Save 20%'}
                </span>
              </button>
            </div>

            {/* Plans List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((p) => {
                const isCurrent = statusData?.plan?.id === p.id;
                const price = billingCycle === 'monthly' ? p.monthlyPrice : p.yearlyPrice;
                const cycleText = billingCycle === 'monthly' ? (isArabic ? '/ شهر' : '/ month') : (isArabic ? '/ سنة' : '/ year');

                return (
                  <div
                    key={p.id}
                    className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                      p.id === 'premium'
                        ? 'border-indigo-500 bg-indigo-500/5 shadow-xl relative overflow-hidden'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                    }`}
                  >
                    {p.id === 'premium' && (
                      <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                        {isArabic ? 'الخطة الأكثر شعبية 🔥' : 'Most Popular Plan 🔥'}
                      </div>
                    )}

                    <div className={p.id === 'premium' ? 'pt-3' : ''}>
                      <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        {p.id !== 'free' && <Crown className="w-5 h-5 text-amber-500" />}
                        {p.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{p.description}</p>

                      <div className="my-4 p-3 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] text-center">
                        <span className="text-2xl font-bold text-indigo-400">${price}</span>
                        <span className="text-xs text-[var(--text-muted)]"> {p.currency} {cycleText}</span>
                      </div>

                      <div className="space-y-2 text-xs text-[var(--text-main)] my-4">
                        <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                          {isArabic ? 'الميزات والحدود:' : 'Features & Limits:'}
                        </p>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>
                            <strong>{p.limits?.ai_messages_per_month}</strong> {isArabic ? 'رسالة ذكاء اصطناعي / شهر' : 'AI messages / month'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>
                            <strong>{p.limits?.voice_minutes_per_month}</strong> {isArabic ? 'دقيقة محادثة صوتية' : 'minutes voice chat'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>
                            {isArabic ? 'تحليل ذكي متعدد (Multi-AI Models)' : 'Multi-Model AI Orchestration'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={isCurrent || processingPlanId === p.id}
                      onClick={() => handleCheckout(p.id)}
                      className={`w-full py-3 rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-slate-700 text-slate-400 cursor-default shadow-none'
                          : p.id === 'premium'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                      }`}
                    >
                      {processingPlanId === p.id ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : isCurrent ? (
                        isArabic ? 'الخطة المفعلة حالياً' : 'Active Plan'
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{isArabic ? `ترقية إلى ${p.name}` : `Upgrade to ${p.name}`}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
