import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, Sparkles, Zap, Shield, X, CreditCard, Building2, Wallet, Send, Check } from 'lucide-react';
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
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('stripe');
  const [transferRefNumber, setTransferRefNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const fetchOpts = {
        cache: 'no-store' as RequestCache,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      };
      const [statusRes, plansRes, methodsRes] = await Promise.all([
        fetch(`/api/subscription/status?userId=${userId}&_t=${Date.now()}`, fetchOpts),
        fetch(`/api/subscription/plans?_t=${Date.now()}`, fetchOpts),
        fetch(`/api/payment-methods?_t=${Date.now()}`, fetchOpts),
      ]);

      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        setStatusData(statusJson);
      }

      if (plansRes.ok) {
        const plansJson = await plansRes.json();
        setPlans(plansJson.filter((p: any) => p.active));
      }

      if (methodsRes.ok) {
        const methodsJson = await methodsRes.json();
        setPaymentMethods(methodsJson);
        if (methodsJson.length > 0 && !methodsJson.find((m: any) => m.id === selectedMethodId)) {
          setSelectedMethodId(methodsJson[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch subscription data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();

    // Listen for realtime server push and local admin updates (< 1s sync)
    const handleRealtimeUpdate = () => {
      fetchData();
    };

    window.addEventListener('payment_methods_updated', handleRealtimeUpdate);
    window.addEventListener('plans_updated', handleRealtimeUpdate);
    window.addEventListener('subscription_updated', handleRealtimeUpdate);
    window.addEventListener('system_settings_updated', handleRealtimeUpdate);
    window.addEventListener('rafiq_realtime_event', handleRealtimeUpdate);

    return () => {
      window.removeEventListener('payment_methods_updated', handleRealtimeUpdate);
      window.removeEventListener('plans_updated', handleRealtimeUpdate);
      window.removeEventListener('subscription_updated', handleRealtimeUpdate);
      window.removeEventListener('system_settings_updated', handleRealtimeUpdate);
      window.removeEventListener('rafiq_realtime_event', handleRealtimeUpdate);
    };
  }, [userId]);

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

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
          paymentProvider: selectedMethodId || 'stripe',
          transferReference: transferRefNumber || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      setMessage(
        isArabic
          ? 'تمت ترقية اشتراكك بنجاح! استمتع بكافة ميزات الذكاء الاصطناعي غير المحدودة 🎉'
          : 'Subscription upgraded successfully! Enjoy unlimited AI capabilities 🎉'
      );

      // Re-fetch status
      const statusRes = await fetch(`/api/subscription/status?userId=${userId}`);
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        setStatusData(statusJson);
      }

      if (onProfileUpdated) {
        onProfileUpdated({ ...profile, dailyMessageLimit: 99999 });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error during checkout';
      setMessage(msg);
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 md:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[var(--text-main)]">
                {isArabic ? 'ترقية الاشتراك إلى رفيق المتقدم' : 'Rafiq Premium Subscription Upgrade'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {isArabic ? 'محادثات غير محدودة، سرعة فائقة ودعم لجميع نماذج الذكاء الاصطناعي' : 'Unlimited messages, priority models, and voice interaction'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{message}</span>
            </span>
            <button onClick={() => setMessage(null)} className="text-[var(--text-muted)] hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            {isArabic ? 'جاري تحميل تفاصيل خطط الاشتراك وطرق الدفع...' : 'Loading subscription plans and payment methods...'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Active Plan & Usage Statistics Card */}
            {statusData && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">{isArabic ? 'خطتك الحالية:' : 'Current Plan:'}</span>
                      <span className="font-extrabold text-amber-500 text-sm flex items-center gap-1">
                        {statusData.plan?.id !== 'free' && <Crown className="w-4 h-4" />}
                        {statusData.plan?.name}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        {statusData.subscription?.status || statusData.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {isArabic ? 'فترة الاستخدام الحالية:' : 'Billing Period:'}{' '}
                      <span className="font-mono text-[var(--text-main)] font-semibold">{statusData.period}</span>
                    </p>
                  </div>

                  {statusData.plan?.id === 'free' && (
                    <span className="text-xs text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                      {isArabic ? 'ترقية متاحة الآن ✨' : 'Upgrade Available ✨'}
                    </span>
                  )}
                </div>

                {/* Detailed Usage Statistics Grid (Tokens, Points: 1 pt = 5 tokens, Messages, Voice) */}
                <div className="pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[var(--text-main)] flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>{isArabic ? 'إحصائيات الاستهلاك والنقاط' : 'Consumption & Points Stats'}</span>
                    </span>
                    <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      {isArabic ? '1 نقطة = 5 توكن' : '1 Point = 5 Tokens'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    {/* 1. Tokens Used */}
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">
                        {isArabic ? 'التوكنات المستخدمة' : 'Tokens Used'}
                      </span>
                      <p className="text-base sm:text-lg font-black text-indigo-500 dark:text-indigo-400 mt-1 font-mono">
                        {(statusData.stats?.tokensUsed ?? 0).toLocaleString()}
                      </p>
                    </div>

                    {/* 2. Points (1 point = 5 tokens) */}
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-purple-500/30 bg-purple-500/5">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">
                        {isArabic ? 'النقاط المستهلكة' : 'Points Used'}
                      </span>
                      <p className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
                        {(statusData.stats?.pointsUsed ?? Math.floor((statusData.stats?.tokensUsed || 0) / 5)).toLocaleString()}
                      </p>
                    </div>

                    {/* 3. Messages Count */}
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">
                        {isArabic ? 'عدد الرسائل' : 'Messages'}
                      </span>
                      <p className="text-base sm:text-lg font-black text-[var(--text-main)] mt-1 font-mono">
                        {statusData.stats?.messagesCount ?? (statusData.usage?.ai_messages || 0)}
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">
                          {' '}/ {statusData.plan?.limits?.ai_messages_per_month ?? 50}
                        </span>
                      </p>
                    </div>

                    {/* 4. Voice Minutes / Seconds */}
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">
                        {isArabic ? 'دقائق الصوت' : 'Voice Minutes'}
                      </span>
                      <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                        {statusData.stats?.voiceMinutes ?? (statusData.usage?.voice_minutes || 0)}
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">
                          {' '}/ {statusData.plan?.limits?.voice_minutes_per_month ?? 15}د
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly / Yearly Billing Switcher */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-[var(--accent-sage)] text-white shadow-md'
                    : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {isArabic ? 'الدفع الشهري' : 'Monthly Billing'}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-[var(--accent-sage)] text-white shadow-md'
                    : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>{isArabic ? 'الدفع السنوي' : 'Yearly Billing'}</span>
                <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {isArabic ? 'توفير 20%' : 'Save 20%'}
                </span>
              </button>
            </div>

            {/* Payment Methods Choice Center */}
            <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-[var(--text-muted)] tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--accent-sage)]" />
                <span>{isArabic ? 'اختر طريقة الدفع المناسبة لك' : 'Select Payment Method'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((m) => {
                    const isSelected = selectedMethodId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/15 text-[var(--accent-sage)] ring-1 ring-[var(--accent-sage)] shadow-sm'
                            : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        {m.type === 'bank' ? (
                          <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : m.type === 'wallet' ? (
                          <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="truncate">{m.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-2 text-xs text-[var(--text-muted)]">
                    {isArabic ? 'الدفع الآمن عبر البطاقة الائتمانية' : 'Secure Credit Card Payment'}
                  </div>
                )}
              </div>

              {/* Display details for Bank / Wallet methods */}
              {selectedMethod && (selectedMethod.type === 'bank' || selectedMethod.type === 'wallet') && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2 text-xs animate-fade-in">
                  <div className="flex items-center justify-between font-bold text-[var(--text-main)]">
                    <span>{selectedMethod.name}</span>
                    <span className="text-[10px] text-[var(--accent-sage)] bg-[var(--accent-sage)]/10 px-2 py-0.5 rounded-full">
                      {selectedMethod.accountName || 'حساب السداد'}
                    </span>
                  </div>
                  {selectedMethod.accountNumber && (
                    <p className="font-mono text-sm bg-[var(--bg-main)] p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-main)] font-bold text-center tracking-wider">
                      {selectedMethod.accountNumber}
                    </p>
                  )}
                  {selectedMethod.instructions && (
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      {selectedMethod.instructions}
                    </p>
                  )}

                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">
                      {isArabic ? 'رقم الحوالة / العملية للتأكيد (اختياري)' : 'Reference / Transaction Number (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={transferRefNumber}
                      onChange={(e) => setTransferRefNumber(e.target.value)}
                      placeholder="e.g. TXN-9482019"
                      className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
                    />
                  </div>
                </div>
              )}
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
                        ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/5 shadow-xl relative overflow-hidden'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                    }`}
                  >
                    {p.id === 'premium' && (
                      <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                        {isArabic ? 'الخطة الأكثر شعبية 🔥' : 'Most Popular Plan 🔥'}
                      </div>
                    )}

                    <div className={p.id === 'premium' ? 'pt-3' : ''}>
                      <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        {p.id !== 'free' && <Crown className="w-5 h-5 text-amber-500" />}
                        {p.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{p.description}</p>

                      <div className="my-4 p-3 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-center">
                        <span className="text-2xl font-bold text-[var(--accent-sage)]">${price}</span>
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
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
                          : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {processingPlanId === p.id ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : isCurrent ? (
                        isArabic ? 'الخطة المفعلة حالياً' : 'Active Plan'
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{isArabic ? `تأكيد الترقية إلى ${p.name}` : `Upgrade to ${p.name}`}</span>
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

