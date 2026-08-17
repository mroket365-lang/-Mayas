import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, Sparkles, Zap, Shield, X, CreditCard, Building2, Wallet, Send, Check, MapPin, Upload, FileText } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'checkout' | 'receipt'>('checkout');

  // Location tracking state
  const [userCountryCode, setUserCountryCode] = useState<string>('SA');
  const [userCountryName, setUserCountryName] = useState<string>('المملكة العربية السعودية');
  const [userCity, setUserCity] = useState<string>('');
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>('unknown');

  // Manual Receipt Form State
  const [receiptPlanId, setReceiptPlanId] = useState<string>('premium');
  const [receiptRef, setReceiptRef] = useState<string>('');
  const [receiptMethodName, setReceiptMethodName] = useState<string>('تحويل بانكي / الراجحي');
  const [receiptNote, setReceiptNote] = useState<string>('');
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptSuccessMsg, setReceiptSuccessMsg] = useState<string | null>(null);

  // Auto-detect Geolocation
  const detectUserLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocationPermissionStatus('granted');

          try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`);
            let country = 'السعودية';
            let countryCode = 'SA';
            let city = '';
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              country = geoData.countryName || 'السعودية';
              countryCode = geoData.countryCode || 'SA';
              city = geoData.city || geoData.locality || '';
            }

            setUserCountryCode(countryCode);
            setUserCountryName(country);
            setUserCity(city);

            await fetch('/api/user/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                latitude: lat,
                longitude: lng,
                country,
                countryCode,
                city,
                locationStatus: 'granted',
              }),
            });
          } catch (e) {
            console.error('Reverse geocode error:', e);
          }
        },
        async (error) => {
          console.warn('Geolocation permission denied or error:', error.message);
          setLocationPermissionStatus('denied');
          await fetch('/api/user/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              locationStatus: 'denied',
            }),
          });
        },
        { timeout: 8000 }
      );
    }
  };

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
        const activePlans = plansJson.filter((p: any) => p.active);
        setPlans(activePlans);
        if (activePlans.length > 0) setReceiptPlanId(activePlans[0].id);
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
    detectUserLocation();

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

  // Filter plans based on regional configuration
  const visiblePlans = plans.filter((p) => {
    if (!p.targetRegions || p.targetRegions.length === 0 || p.targetRegions.includes('ALL')) {
      return true;
    }
    return p.targetRegions.includes(userCountryCode);
  });

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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      setMessage(
        isArabic
          ? 'تمت ترقية اشتراكك بنجاح! استمتع بكافة ميزات الذكاء الاصطناعي غير المحدودة 🎉'
          : 'Subscription upgraded successfully! Enjoy unlimited AI capabilities 🎉'
      );

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

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptRef.trim()) return;
    setReceiptSubmitting(true);
    setReceiptSuccessMsg(null);

    try {
      const chosenPlan = plans.find((p) => p.id === receiptPlanId) || { name: 'باقة رفيق', monthlyPrice: 19, yearlyPrice: 180, currency: 'USD' };
      const amount = billingCycle === 'monthly' ? chosenPlan.monthlyPrice : chosenPlan.yearlyPrice;

      const res = await fetch('/api/subscriptions/submit-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail: profile.email || 'user@example.com',
          userName: profile.name || 'المستخدم',
          planId: receiptPlanId,
          planName: chosenPlan.name,
          amountPaid: amount,
          currency: chosenPlan.currency || 'USD',
          billingCycle,
          transactionReference: receiptRef,
          paymentMethodName: receiptMethodName,
          receiptNote: receiptNote || 'تم رفع إيصال الدفع اليدوي',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit receipt');

      setReceiptSuccessMsg(
        isArabic
          ? 'تم إرسال إيصال السداد بنجاح! جاري المراجعة والتحقق من قبل الإدارة وتفعيل اشتراكك ⏳'
          : 'Receipt submitted successfully! Pending verification by support ⏳'
      );
      setReceiptRef('');
      setReceiptNote('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit';
      setReceiptSuccessMsg(`خطأ: ${msg}`);
    } finally {
      setReceiptSubmitting(false);
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
              <h2 className="text-lg md:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                <span>{isArabic ? 'باقات الاشتراك وطرق الدفع والتحقق' : 'Subscription Plans & Payments'}</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {locationPermissionStatus === 'granted'
                    ? `الموقع المحدد: ${userCountryName} ${userCity ? `(${userCity})` : ''}`
                    : 'الموقع: غير معروف (لم يمنح العميل الإذن للوصول للموقع)'}
                </span>
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

        {/* Modal Main Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <button
            onClick={() => setActiveTab('checkout')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'checkout'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isArabic ? 'باقات الاشتراك المتاحة' : 'Available Plans'}</span>
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'receipt'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isArabic ? 'إرسال إيصال سداد يدوي' : 'Submit Payment Receipt'}</span>
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
        ) : activeTab === 'receipt' ? (
          /* Manual Payment Receipt Submission Form */
          <form onSubmit={handleReceiptSubmit} className="space-y-4 p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs">
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 text-purple-400">
              <FileText className="w-4 h-4" />
              <span>{isArabic ? 'نموذج التحقق وإرسال إيصال التحويل اليدوي' : 'Manual Receipt Verification Form'}</span>
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              {isArabic
                ? 'إذا قمت بالتحويل البنكي أو السداد عبر المحفظة، يرجى إدخال مرجع التحويل أدناه لمراجعة طلبك وتفعيل الباقة مباشرة.'
                : 'Enter your transaction reference number for manual admin verification.'}
            </p>

            {receiptSuccessMsg && (
              <div className="p-3 bg-purple-950/80 border border-purple-800 text-purple-200 text-xs rounded-xl flex items-center justify-between">
                <span>{receiptSuccessMsg}</span>
                <button type="button" onClick={() => setReceiptSuccessMsg(null)} className="text-purple-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-semibold">اختر الباقة المراد تفعيلها</label>
                <select
                  value={receiptPlanId}
                  onChange={(e) => setReceiptPlanId(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-2.5 text-[var(--text-main)] focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - (${billingCycle === 'monthly' ? p.monthlyPrice : p.yearlyPrice} {p.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 font-semibold font-sans">طريقة التحويل / البنك</label>
                <input
                  type="text"
                  required
                  value={receiptMethodName}
                  onChange={(e) => setReceiptMethodName(e.target.value)}
                  placeholder="مثال: تحويل بنك الراجحي / STC Pay"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-2.5 text-[var(--text-main)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-muted)] mb-1 font-semibold">رقم مرجع الحوالة / Transaction Ref # *</label>
              <input
                type="text"
                required
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                placeholder="e.g. TXN-893018402"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-2.5 text-[var(--text-main)] font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[var(--text-muted)] mb-1 font-semibold">ملاحظات إضافية / رابط الإيصال</label>
              <textarea
                rows={2}
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
                placeholder="أدخل أي ملاحظات أو اسم المحول للإسراع من عملية التأكيد..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-2.5 text-[var(--text-main)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={receiptSubmitting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              {receiptSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isArabic ? 'إرسال إيصال السداد للمراجعة والتأكيد' : 'Submit Receipt for Approval'}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Checkout & Plans List View */
          <div className="space-y-6">
            {/* Current Active Plan Card */}
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
                  </div>

                  {statusData.plan?.id === 'free' && (
                    <span className="text-xs text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                      {isArabic ? 'ترقية متاحة الآن ✨' : 'Upgrade Available ✨'}
                    </span>
                  )}
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
                {paymentMethods.map((m) => {
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
                })}
              </div>

              {/* Bank Details View */}
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
                </div>
              )}
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visiblePlans.map((p) => {
                const isCurrent = statusData?.plan?.id === p.id;
                const price = billingCycle === 'monthly' ? p.monthlyPrice : p.yearlyPrice;
                const cycleText = billingCycle === 'monthly' ? (isArabic ? '/ شهر' : '/ month') : (isArabic ? '/ سنة' : '/ year');

                return (
                  <div
                    key={p.id}
                    className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                      p.id === 'premium' || p.id === 'pro'
                        ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)]/5 shadow-xl relative overflow-hidden'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                    }`}
                  >
                    {p.badgeText && (
                      <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                        {p.badgeText}
                      </div>
                    )}

                    <div className={p.badgeText ? 'pt-3' : ''}>
                      <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        {p.id !== 'free' && <Crown className="w-5 h-5 text-amber-500" />}
                        {p.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{p.description}</p>

                      <div className="my-4 p-3 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-center">
                        <span className="text-2xl font-bold text-[var(--accent-sage)]">${price}</span>
                        <span className="text-xs text-[var(--text-muted)]"> {p.currency} {cycleText}</span>
                      </div>

                      {/* Custom Features List */}
                      <div className="space-y-2 text-xs text-[var(--text-main)] my-4">
                        <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                          {isArabic ? 'الميزات والحدود المضمنة:' : 'Included Features:'}
                        </p>
                        {(p.featuresList && p.featuresList.length > 0
                          ? p.featuresList
                          : [
                              { text: `${p.limits?.ai_messages_per_month || 100} رسائل ذكاء اصطناعي`, enabled: true },
                              { text: `${p.limits?.voice_minutes_per_month || 30} دقائق محادثة صوتية`, enabled: true },
                            ]
                        ).map((feat: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            {feat.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className={feat.enabled ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] line-through'}>
                              {feat.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={isCurrent || processingPlanId === p.id}
                      onClick={() => handleCheckout(p.id)}
                      className={`w-full py-3 rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-slate-700 text-slate-400 cursor-default shadow-none'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
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
