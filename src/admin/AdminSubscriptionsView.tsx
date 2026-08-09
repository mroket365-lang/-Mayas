import React, { useState, useEffect } from 'react';
import { CreditCard, Filter, Search, Crown, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface SubItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' | 'paused';
  startDate: string;
  endDate: string;
  paymentProvider: string;
  monthlyPrice: number;
  currency: string;
}

interface AdminSubscriptionsViewProps {
  token: string;
}

export const AdminSubscriptionsView: React.FC<AdminSubscriptionsViewProps> = ({ token }) => {
  const [subs, setSubs] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/subscriptions?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubs(data);
      }
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              placeholder="بحث بالمستخدم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشطة Active</option>
            <option value="expired">منتهية Expired</option>
            <option value="cancelled">ملغاة Cancelled</option>
            <option value="past_due">متأخرة Past Due</option>
            <option value="trialing">تجريبية Trialing</option>
          </select>
        </div>

        <button
          onClick={fetchSubscriptions}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">معرف الاشتراك</th>
                <th className="px-4 py-3">المستخدم</th>
                <th className="px-4 py-3">الخطة والسعر</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">مزود الدفع</th>
                <th className="px-4 py-3">تاريخ الانتهاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    جاري تحميل الاشتراكات...
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    لا توجد اشتراكات مطابقة
                  </td>
                </tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{s.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{s.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-amber-300 flex items-center gap-1">
                        {s.planId !== 'free' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        {s.planName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ${s.monthlyPrice} {s.currency} / شهر
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : s.status === 'expired'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 uppercase text-[11px]">
                      {s.paymentProvider}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {new Date(s.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
