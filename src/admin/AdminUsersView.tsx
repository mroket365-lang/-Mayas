import React, { useState, useEffect } from 'react';
import { Search, Filter, Shield, UserX, UserCheck, RefreshCw, Crown, MoreHorizontal, Calendar, Mail, CheckCircle2, X } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastActiveAt: string;
  subscription: {
    id?: string;
    planId: string;
    planName: string;
    status: string;
    endDate?: string;
    paymentProvider?: string;
  };
}

interface AdminUsersViewProps {
  token: string;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ token }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal State for Action
  const [actionType, setActionType] = useState<'grant_premium' | 'suspend' | 'reactivate' | 'reset_usage' | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('premium');
  const [durationDays, setDurationDays] = useState(30);
  const [actionReason, setActionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        plan: planFilter,
        page: page.toString(),
        limit: '10',
      });

      const res = await fetch(`/api/admin/users?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, planFilter, page]);

  const openUserDetails = async (user: UserItem) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserDetails(data);
      }
    } catch (err) {
      console.error('Fetch user details error:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedUser || !actionType) return;
    setProcessingAction(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: actionType,
          planId: selectedPlanId,
          durationDays,
          reason: actionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setActionMessage(data.message || 'تم تنفيذ العملية بنجاح');
      setActionType(null);
      fetchUsers();
      if (selectedUser) openUserDetails(selectedUser);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setActionMessage(`خطأ: ${msg}`);
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الايميل..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط (Active)</option>
            <option value="suspended">معلق (Suspended)</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">جميع الخطط</option>
            <option value="free">المجانية Free</option>
            <option value="premium">المتقدمة Premium</option>
            <option value="pro">الاحترافية Pro</option>
          </select>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs rounded-xl flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">المستخدم</th>
                <th className="px-4 py-3">الخطة الحالية</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">تاريخ التسجيل</th>
                <th className="px-4 py-3">آخر نشاط</th>
                <th className="px-4 py-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    جاري تحميل المستخدمين...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    لا يوجد مستخدمون مطابقون للبحث
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">
                      <div>{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                          u.subscription.planId === 'premium' || u.subscription.planId === 'pro'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.subscription.planId === 'premium' && <Crown className="w-3 h-3 text-amber-400" />}
                        {u.subscription.planName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {u.status === 'active' ? 'نشط' : 'معلق'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(u.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openUserDetails(u)}
                        className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      >
                        إدارة / تفاصيل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950">
          <span>الصفحة {page} من {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-40"
            >
              السابق
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* User Details & Action Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>إدارة حساب المستخدم</span>
                  <span className="text-xs font-mono text-slate-400">({selectedUser.id})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedUser.name} &bull; {selectedUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserDetails(null);
                  setActionType(null);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-8 text-center text-slate-500">جاري تحميل تفاصيل الاستخدام...</div>
            ) : userDetails ? (
              <div className="space-y-6 text-xs text-slate-300">
                {/* Subscription Info */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-semibold text-white text-sm text-indigo-400">الاشتراك الحالي</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">الخطة:</span>{' '}
                      <span className="font-bold text-amber-400">{userDetails.plan?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">حالة الاشتراك:</span>{' '}
                      <span className="font-bold text-emerald-400">{userDetails.subscription?.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">تاريخ الانتهاء:</span>{' '}
                      <span className="font-mono">{new Date(userDetails.subscription?.endDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">طريقة الدفع:</span>{' '}
                      <span className="font-mono">{userDetails.subscription?.paymentProvider}</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Usage Counters */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-semibold text-white text-sm text-purple-400">
                    استخدام الشهر الحالي ({userDetails.usagePeriod})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    {Object.entries(userDetails.plan?.limits || {}).map(([key, limitVal]: [string, any]) => {
                      const featKey = key.replace('_per_month', '');
                      const rec = userDetails.usageRecords?.find((r: any) => r.feature === featKey);
                      const used = rec ? rec.count : 0;
                      return (
                        <div key={key} className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                          <p className="text-[10px] text-slate-400">{featKey}</p>
                          <p className="text-sm font-bold text-white mt-0.5">
                            {used} / {limitVal}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Admin Quick Action Controls */}
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="font-semibold text-white text-sm">إجراءات الإدارة السريعة</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActionType('grant_premium')}
                      className="px-3 py-2 bg-amber-600/20 border border-amber-500/40 text-amber-300 rounded-xl hover:bg-amber-600/30 transition-all font-medium flex items-center gap-1.5"
                    >
                      <Crown className="w-4 h-4" />
                      منح Premium يدويًا
                    </button>

                    <button
                      onClick={() => setActionType('reset_usage')}
                      className="px-3 py-2 bg-blue-600/20 border border-blue-500/40 text-blue-300 rounded-xl hover:bg-blue-600/30 transition-all font-medium flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      إعادة تصفير الاستخدام
                    </button>

                    {selectedUser.status === 'active' ? (
                      <button
                        onClick={() => setActionType('suspend')}
                        className="px-3 py-2 bg-rose-600/20 border border-rose-500/40 text-rose-300 rounded-xl hover:bg-rose-600/30 transition-all font-medium flex items-center gap-1.5"
                      >
                        <UserX className="w-4 h-4" />
                        تعليق الحساب
                      </button>
                    ) : (
                      <button
                        onClick={() => setActionType('reactivate')}
                        className="px-3 py-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-xl hover:bg-emerald-600/30 transition-all font-medium flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        إعادة تفعيل الحساب
                      </button>
                    )}
                  </div>

                  {/* Form depending on ActionType */}
                  {actionType && (
                    <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-fade-in">
                      <p className="font-semibold text-white">
                        تأكيد الإجراء: {actionType === 'grant_premium' ? 'منح ترقية خطة' : actionType}
                      </p>

                      {actionType === 'grant_premium' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">الخطة المطلوبة</label>
                            <select
                              value={selectedPlanId}
                              onChange={(e) => setSelectedPlanId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                            >
                              <option value="premium">Premium Plan</option>
                              <option value="pro">Pro Plan</option>
                              <option value="free">Free Plan</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">المدة (بالأيام)</label>
                            <input
                              type="number"
                              value={durationDays}
                              onChange={(e) => setDurationDays(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                            />
                          </div>
                        </div>
                      )}

                      {actionType === 'suspend' && (
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">سبب تعليق الحساب</label>
                          <input
                            type="text"
                            placeholder="سبب التعليق..."
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setActionType(null)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                        >
                          إلغاء
                        </button>
                        <button
                          disabled={processingAction}
                          onClick={handleExecuteAction}
                          className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {processingAction ? 'جاري التنفيذ...' : 'تنفيذ الإجراء وتسجيله'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
