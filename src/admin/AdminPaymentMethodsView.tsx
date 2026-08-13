import React, { useState, useEffect } from 'react';
import { CreditCard, Landmark, Wallet, Plus, Edit2, Trash2, CheckCircle2, XCircle, RefreshCw, AlertCircle, Save, X } from 'lucide-react';

export interface PaymentMethodItem {
  id: string;
  type: 'bank' | 'wallet' | 'card';
  title: string;
  accountNumberOrDetails: string;
  accountHolder?: string;
  instructions?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminPaymentMethodsViewProps {
  token: string;
}

export const AdminPaymentMethodsView: React.FC<AdminPaymentMethodsViewProps> = ({ token }) => {
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentMethodItem | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<'bank' | 'wallet' | 'card'>('bank');
  const [formTitle, setFormTitle] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formHolder, setFormHolder] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMethods(data);
      }
    } catch (err) {
      console.error('Fetch payment methods error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormType('bank');
    setFormTitle('');
    setFormDetails('');
    setFormHolder('');
    setFormInstructions('');
    setFormEnabled(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PaymentMethodItem) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormDetails(item.accountNumberOrDetails);
    setFormHolder(item.accountHolder || '');
    setFormInstructions(item.instructions || '');
    setFormEnabled(item.enabled);
    setIsModalOpen(true);
  };

  const notifySettingsUpdated = () => {
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
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDetails.trim()) {
      setMsg('يرجى إدخال اسم طريقة الدفع وتفاصيل الحساب / الرقم');
      return;
    }

    setSubmitting(true);
    setMsg(null);

    try {
      const payload = {
        type: formType,
        title: formTitle,
        accountNumberOrDetails: formDetails,
        accountHolder: formHolder,
        instructions: formInstructions,
        enabled: formEnabled,
      };

      const url = editingItem
        ? `/api/admin/payment-methods/${editingItem.id}`
        : '/api/admin/payment-methods';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشلت عملية الحفظ');

      setMsg(editingItem ? 'تم تحديث طريقة الدفع بنجاح' : 'تمت إضافة طريقة الدفع الجديدة بنجاح');
      setIsModalOpen(false);
      notifySettingsUpdated();
      fetchPaymentMethods();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'فشل الحفظ';
      setMsg(`خطأ: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnabled = async (item: PaymentMethodItem) => {
    try {
      const res = await fetch(`/api/admin/payment-methods/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      if (res.ok) {
        notifySettingsUpdated();
        fetchPaymentMethods();
      }
    } catch (err) {
      console.error('Toggle payment method error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return;
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      if (res.ok) {
        setMsg('تم حذف طريقة الدفع بنجاح');
        notifySettingsUpdated();
        fetchPaymentMethods();
      }
    } catch (err) {
      console.error('Delete payment method error:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-5 h-5 text-indigo-400" />;
      case 'wallet':
        return <Wallet className="w-5 h-5 text-emerald-400" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-amber-400" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'bank':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">تحويل بنكي</span>;
      case 'wallet':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">محفظة إلكترونية</span>;
      case 'card':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">بطاقة ائتمان / Stripe</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            <span>إدارة طرق الدفع الحسابية / Payment Methods Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وتعديل الحسابات البنكية والمحافظ الإلكترونية وبوابات البطاقات المتاحة للمستخدمين لشراء الاشتراكات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPaymentMethods}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            title="تحديث القائمة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طريقة دفع جديدة</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Methods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            جاري تحميل طرق الدفع...
          </div>
        ) : methods.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            لا توجد طرق دفع مضافة حالياً. انقر على "إضافة طريقة دفع جديدة" للبدء.
          </div>
        ) : (
          methods.map((pm) => (
            <div
              key={pm.id}
              className={`bg-slate-900 border ${
                pm.enabled ? 'border-slate-800 hover:border-indigo-500/50' : 'border-slate-800/60 opacity-60'
              } rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                      {getTypeIcon(pm.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-snug">{pm.title}</h3>
                      <div className="mt-1">{getTypeBadge(pm.type)}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleEnabled(pm)}
                    className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                      pm.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    }`}
                    title={pm.enabled ? 'مفعلة - انقر للتعطيل' : 'معطلة - انقر للتفعيل'}
                  >
                    {pm.enabled ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">رقم الحساب / التفاصيل / IBAN:</span>
                    <span className="font-mono font-medium text-slate-200 select-all dir-ltr text-[11px]">
                      {pm.accountNumberOrDetails}
                    </span>
                  </div>

                  {pm.accountHolder && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">اسم صاحب الحساب / الجهة:</span>
                      <span className="font-medium text-slate-300">{pm.accountHolder}</span>
                    </div>
                  )}

                  {pm.instructions && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">تعليمات الدفع للمستخدم:</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{pm.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(pm.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(pm)}
                    className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 rounded-lg transition-all"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(pm.id)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-lg transition-all"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-5 text-xs text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span>{editingItem ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">نوع طريقة الدفع</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="bank">حساب بنكي / تحويل بنكي (Bank Account)</option>
                  <option value="wallet">محفظة إلكترونية (Vodafone Cash / STC Pay / InstaPay)</option>
                  <option value="card">بطاقة ائتمان / بوابة دفع إلكترونية (Stripe / Visa)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">عنوان الميزة / اسم طريقة الدفع</label>
                <input
                  type="text"
                  placeholder="e.g. تحويل بنكي - البنك الأهلي / الراجحي"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  رقم الحساب / التفاصيل / رقم المحفظة / IBAN
                </label>
                <input
                  type="text"
                  placeholder="e.g. EG120002000100000000012345678 أو 01012345678"
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">اسم صاحب الحساب / المستفيد (اختياري)</label>
                <input
                  type="text"
                  placeholder="e.g. شركة رفيق للذكاء الاصطناعي"
                  value={formHolder}
                  onChange={(e) => setFormHolder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">تعليمات وتوجيهات الدفع للعميل (اختياري)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. قم بتحويل المبلغ ثم أرسل صورة الإيصال مع رقم الحساب للتفعيل الفوري."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formEnabled"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <label htmlFor="formEnabled" className="text-slate-300 text-xs font-medium cursor-pointer">
                  تفعيل طريقة الدفع هذه فوراً للعملاء
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'جاري الحفظ...' : 'حفظ طريقة الدفع'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
