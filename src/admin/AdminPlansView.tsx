import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit3, DollarSign, Check, X, ShieldAlert } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  active: boolean;
  features: string[];
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

export const AdminPlansView: React.FC<AdminPlansViewProps> = ({ token }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

      setSaveMessage('تم حفظ الخطة بنجاح!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('system_settings_updated'));
        try {
          const bc = new BroadcastChannel('rafiq_settings_sync');
          bc.postMessage('updated');
          bc.close();
        } catch (e) {
          // ignore
        }
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
      id: 'custom_plan_' + Math.random().toString(36).substring(2, 6),
      name: 'خطة جديدة',
      description: 'وصف الخطة الجديدة',
      monthlyPrice: 14.99,
      yearlyPrice: 129.99,
      currency: 'USD',
      active: true,
      features: ['ai_basic', 'ai_advanced', 'voice', 'multi_ai'],
      limits: {
        ai_messages_per_month: 1000,
        voice_minutes_per_month: 200,
        multi_ai_requests_per_month: 50,
        advanced_ai_requests_per_month: 100,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>إدارة الخطط والأسعار والدعم متعدد العملات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وتعديل الحدود الشهرية والأسعار دون الحاجة إلى تعديل الكود
          </p>
        </div>

        <button
          onClick={startCreateNewPlan}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة خطة جديدة</span>
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
                  <span className="text-xs font-mono bg-slate-950 text-indigo-400 px-2.5 py-1 rounded-lg border border-slate-800">
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

                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{p.description}</p>

                <div className="my-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                  <span className="text-2xl font-bold text-emerald-400">
                    ${p.monthlyPrice}
                  </span>
                  <span className="text-xs text-slate-400"> {p.currency} / شهر</span>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    السعر السنوي: ${p.yearlyPrice} {p.currency}
                  </div>
                </div>

                {/* Limits summary */}
                <div className="space-y-1.5 text-xs text-slate-300 mb-6">
                  <p className="font-semibold text-slate-400 text-[11px]">الحدود الشهرية:</p>
                  <div className="flex justify-between text-slate-300">
                    <span>رسائل الـAI:</span>
                    <span className="font-mono font-bold text-indigo-300">{p.limits.ai_messages_per_month}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>دقائق الصوت:</span>
                    <span className="font-mono font-bold text-purple-300">{p.limits.voice_minutes_per_month}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>طلبات Multi-AI:</span>
                    <span className="font-mono font-bold text-amber-300">{p.limits.multi_ai_requests_per_month}</span>
                  </div>
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
                <span>تعديل الحدود والأسعار</span>
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
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isCreating ? 'إنشاء خطة اشتراك جديدة' : `تعديل الخطة: ${editingPlan.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">اسم الخطة</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">معرف الخطة (ID)</label>
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
              <label className="block text-slate-400 mb-1">وصف الخطة</label>
              <input
                type="text"
                value={editingPlan.description}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">السعر الشهري</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPlan.monthlyPrice}
                  onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">السعر السنوي</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPlan.yearlyPrice}
                  onChange={(e) => setEditingPlan({ ...editingPlan, yearlyPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">العملة</label>
                <input
                  type="text"
                  value={editingPlan.currency}
                  onChange={(e) => setEditingPlan({ ...editingPlan, currency: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono uppercase"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <p className="font-semibold text-indigo-400 mb-2">تعديل حدود الاستخدام الشهرية:</p>
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
              <label htmlFor="activePlanToggle" className="text-slate-300">
                تفعيل الخطة للعملاء الأوفياء
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
                className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500"
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
