import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit3, DollarSign, Check, X, ShieldAlert, Sparkles, Zap, Crown, Star, ShieldCheck, Rocket, Globe, MapPin, Trash2, Layers } from 'lucide-react';

interface PlanFeatureItem {
  text: string;
  enabled: boolean;
  highlighted?: boolean;
  icon?: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  active: boolean;
  icon?: string;
  badgeText?: string;
  highlightColor?: string;
  targetRegions?: string[];
  features: string[];
  featuresList?: PlanFeatureItem[];
  limits: {
    ai_messages_per_month: number;
    voice_minutes_per_month: number;
    multi_ai_requests_per_month: number;
    advanced_ai_requests_per_month: number;
  };
}

interface AdminPlansViewProps {
  token: string;
}

const REGION_OPTIONS = [
  { code: 'ALL', name: 'جميع الدول والمناطق (الكل)' },
  { code: 'SA', name: '🇸🇦 المملكة العربية السعودية' },
  { code: 'AE', name: '🇦🇪 الإمارات العربية المتحدة' },
  { code: 'EG', name: '🇪🇬 جمهورية مصر العربية' },
  { code: 'KW', name: '🇰🇼 دولة الكويت' },
  { code: 'QA', name: '🇶🇦 دولة قطر' },
  { code: 'US', name: '🇺🇸 الولايات المتحدة الأمريكية' },
  { code: 'EU', name: '🇪🇺 دول الاتحاد الأوروبي' },
];

const PLAN_ICONS = ['Sparkles', 'Zap', 'Crown', 'Star', 'ShieldCheck', 'Rocket', 'Layers'];

export const AdminPlansView: React.FC<AdminPlansViewProps> = ({ token }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newFeatureIcon, setNewFeatureIcon] = useState('CheckCircle2');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaveMessage(null);

    try {
      const url = isCreating ? '/api/admin/plans' : `/api/admin/plans/${editingPlan.id}`;
      const method = isCreating ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify(editingPlan),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan');

      setSaveMessage('تم حفظ الخطة وتحديث تخصيص المناطق والميزات بنجاح!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('system_settings_updated'));
      }
      setEditingPlan(null);
      setIsCreating(false);
      fetchPlans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setSaveMessage(`خطأ: ${msg}`);
    }
  };

  const startCreateNewPlan = () => {
    setIsCreating(true);
    setEditingPlan({
      id: 'plan_' + Math.random().toString(36).substring(2, 7),
      name: 'خطة إقليمية جديدة',
      description: 'وصف الخطة مع تخصيص الميزات والمناطق المستهدفة',
      monthlyPrice: 12.99,
      yearlyPrice: 119.99,
      currency: 'USD',
      active: true,
      icon: 'Crown',
      badgeText: 'خطة خاصة 🌟',
      highlightColor: 'indigo',
      targetRegions: ['ALL'],
      features: ['ai_basic', 'ai_advanced', 'voice', 'multi_ai'],
      featuresList: [
        { text: 'رسائل ذكاء اصطناعي غير محدودة', enabled: true, highlighted: true, icon: 'Sparkles' },
        { text: 'دعم المحادثة الصوتية فائقة السرعة', enabled: true, icon: 'Mic' },
        { text: 'تحليل الصور والملفات', enabled: true, icon: 'Paperclip' },
      ],
      limits: {
        ai_messages_per_month: 2000,
        voice_minutes_per_month: 300,
        multi_ai_requests_per_month: 100,
        advanced_ai_requests_per_month: 200,
      },
    });
  };

  const addFeatureItemToEditingPlan = () => {
    if (!newFeatureText.trim() || !editingPlan) return;
    const currentList = editingPlan.featuresList || [];
    const updatedList = [
      ...currentList,
      { text: newFeatureText.trim(), enabled: true, icon: newFeatureIcon || 'Check' },
    ];
    setEditingPlan({ ...editingPlan, featuresList: updatedList });
    setNewFeatureText('');
  };

  const removeFeatureItem = (index: number) => {
    if (!editingPlan) return;
    const currentList = [...(editingPlan.featuresList || [])];
    currentList.splice(index, 1);
    setEditingPlan({ ...editingPlan, featuresList: currentList });
  };

  const toggleFeatureEnabled = (index: number) => {
    if (!editingPlan) return;
    const currentList = [...(editingPlan.featuresList || [])];
    currentList[index].enabled = !currentList[index].enabled;
    setEditingPlan({ ...editingPlan, featuresList: currentList });
  };

  const toggleRegionInPlan = (code: string) => {
    if (!editingPlan) return;
    let regions = editingPlan.targetRegions || ['ALL'];
    if (code === 'ALL') {
      regions = ['ALL'];
    } else {
      regions = regions.filter((r) => r !== 'ALL');
      if (regions.includes(code)) {
        regions = regions.filter((r) => r !== code);
        if (regions.length === 0) regions = ['ALL'];
      } else {
        regions.push(code);
      }
    }
    setEditingPlan({ ...editingPlan, targetRegions: regions });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>إدارة الخطط والباقات والتحكم بالمناطق والميزات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إمكانية ربط الخطة بدول/مناطق محددة، وتخصيص الميزات والحدود والأيقونات بدقة متناهية
          </p>
        </div>

        <button
          onClick={startCreateNewPlan}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة باقة جديدة</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs rounded-xl flex items-center justify-between">
          <span>{saveMessage}</span>
          <button onClick={() => setSaveMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Plans List Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-500">جاري تحميل الخطط...</div>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className={`bg-slate-900 border rounded-2xl p-6 relative flex flex-col justify-between transition-all ${
                p.active ? 'border-slate-800' : 'border-rose-900/50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono bg-slate-950 text-indigo-400 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    ID: {p.id}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      p.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {p.active ? 'مفعلة Active' : 'معطلة Inactive'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  {p.badgeText && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {p.badgeText}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{p.description}</p>

                {/* Target Regions Badge */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] text-slate-400 font-medium">المناطق المستهدفة:</span>
                  {(p.targetRegions && p.targetRegions.length > 0 ? p.targetRegions : ['ALL']).map((r) => (
                    <span key={r} className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.2 rounded">
                      {r === 'ALL' ? 'جميع الدول' : r}
                    </span>
                  ))}
                </div>

                <div className="my-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                  <span className="text-2xl font-bold text-emerald-400">
                    ${p.monthlyPrice}
                  </span>
                  <span className="text-xs text-slate-400"> {p.currency} / شهر</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    السعر السنوي: ${p.yearlyPrice} {p.currency}
                  </div>
                </div>

                {/* Features list summary */}
                <div className="space-y-1 text-xs text-slate-300 mb-6">
                  <p className="font-semibold text-slate-400 text-[11px] mb-1">الميزات المضمنة في الباقة:</p>
                  {(p.featuresList && p.featuresList.length > 0
                    ? p.featuresList
                    : [
                        { text: `${p.limits.ai_messages_per_month} رسائل ذكاء اصطناعي`, enabled: true },
                        { text: `${p.limits.voice_minutes_per_month} دقيقة محادثة صوتية`, enabled: true },
                      ]
                  ).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {feat.enabled ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                      <span className={feat.enabled ? 'text-slate-200' : 'text-slate-500 line-through'}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingPlan({ ...p });
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2.5 rounded-xl font-medium transition-all border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل الميزات والمناطق والأسعار</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Edit / Create Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePlan}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-scale-up text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <span>{isCreating ? 'إنشاء خطة اشتراك جديدة' : `تعديل الباقة: ${editingPlan.name}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">اسم الخطة / الباقة</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">معرف الخطة (ID)</label>
                <input
                  type="text"
                  disabled={!isCreating}
                  value={editingPlan.id}
                  onChange={(e) => setEditingPlan({ ...editingPlan, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">وصف الخطة الجذاب</label>
              <input
                type="text"
                value={editingPlan.description}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">وسام الباقة (Badge Text)</label>
                <input
                  type="text"
                  placeholder="مثال: الأكثر شعبية"
                  value={editingPlan.badgeText || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, badgeText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">أيقونة الباقة</label>
                <select
                  value={editingPlan.icon || 'Sparkles'}
                  onChange={(e) => setEditingPlan({ ...editingPlan, icon: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {PLAN_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">العملة</label>
                <input
                  type="text"
                  value={editingPlan.currency}
                  onChange={(e) => setEditingPlan({ ...editingPlan, currency: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">السعر الشهري ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPlan.monthlyPrice}
                  onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">السعر السنوي ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPlan.yearlyPrice}
                  onChange={(e) => setEditingPlan({ ...editingPlan, yearlyPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            {/* Region Selector */}
            <div className="border-t border-slate-800 pt-3">
              <p className="font-semibold text-indigo-400 mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>التحكم بالدول والمناطق التي تظهر فيها هذه الباقة:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {REGION_OPTIONS.map((reg) => {
                  const isSelected = (editingPlan.targetRegions || ['ALL']).includes(reg.code);
                  return (
                    <button
                      key={reg.code}
                      type="button"
                      onClick={() => toggleRegionInPlan(reg.code)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      <span>{reg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Features List Builder */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <p className="font-semibold text-purple-400 flex items-center justify-between">
                <span>تخصيص بنود وميزات الباقة المعروضة للعميل:</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({(editingPlan.featuresList || []).length} ميزات حالية)
                </span>
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="أدخل نص ميزة جديدة (مثال: 500 دقيقة صوتية...)"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
                <button
                  type="button"
                  onClick={addFeatureItemToEditingPlan}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(editingPlan.featuresList || []).map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFeatureEnabled(idx)}
                        className={`p-1 rounded ${
                          feat.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {feat.enabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                      <span className={feat.enabled ? 'text-slate-200' : 'text-slate-500 line-through'}>
                        {feat.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFeatureItem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quota Limits */}
            <div className="border-t border-slate-800 pt-3">
              <p className="font-semibold text-indigo-400 mb-2">تعديل حدود الاستخدام البرمجية الشهيرة:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">حد رسائل الـAI الشهرية</label>
                  <input
                    type="number"
                    value={editingPlan.limits.ai_messages_per_month}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, ai_messages_per_month: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">دقائق الصوت الشهرية</label>
                  <input
                    type="number"
                    value={editingPlan.limits.voice_minutes_per_month}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, voice_minutes_per_month: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">طلبات Multi-AI الشهرية</label>
                  <input
                    type="number"
                    value={editingPlan.limits.multi_ai_requests_per_month}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, multi_ai_requests_per_month: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">طلبات التفكير المتقدم</label>
                  <input
                    type="number"
                    value={editingPlan.limits.advanced_ai_requests_per_month}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        limits: { ...editingPlan.limits, advanced_ai_requests_per_month: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
              <input
                type="checkbox"
                id="activePlanToggle"
                checked={editingPlan.active}
                onChange={(e) => setEditingPlan({ ...editingPlan, active: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800"
              />
              <label htmlFor="activePlanToggle" className="text-slate-300 font-semibold">
                تفعيل الخطة للعملاء فوراً
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
              >
                حفظ الخطة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
