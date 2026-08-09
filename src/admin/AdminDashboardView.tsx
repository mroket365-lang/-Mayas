import React from 'react';
import { Users, Crown, CreditCard, Cpu, DollarSign, Activity, AlertCircle, ShieldCheck } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  freeUsers: number;
  premiumUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  totalAIRequests: number;
  estimatedAICostUSD: number;
  settings: any;
  plansCount: number;
  activePlansCount: number;
}

interface AdminDashboardViewProps {
  stats: StatsData | null;
  onNavigate: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ stats, onNavigate }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>نظرة عامة على النظام والاشتراكات</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
              الخادم يعمل
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            مراقبة المستخدمين، الاشتراكات الفعالة وتكلفة الذكاء الاصطناعي في الوقت الفعلي
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('users')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl transition-all font-medium"
          >
            إدارة المستخدمين
          </button>
          <button
            onClick={() => onNavigate('plans')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-xl transition-all font-medium border border-slate-700"
          >
            تعديل الخطط
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">إجمالي المستخدمين</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{stats.totalUsers}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
            <span className="text-emerald-400 font-medium">{stats.activeUsers} نشط</span>
            <span>&bull;</span>
            <span className="text-rose-400">{stats.suspendedUsers} معلق</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">المشتركون المتميزون (Premium)</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-3">{stats.premiumUsers}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
            <span>{stats.freeUsers} مجاني</span>
            <span>&bull;</span>
            <span className="text-amber-300 font-medium">{Math.round((stats.premiumUsers / (stats.totalUsers || 1)) * 100)}% تحويل</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">طلبات الذكاء الاصطناعي (AI Requests)</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-3">{stats.totalAIRequests}</div>
          <div className="text-xs text-purple-300 mt-2">
            موزعة بين Gemini & OpenAI
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">التكلفة التقديرية (Estimated Cost)</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-3">${stats.estimatedAICostUSD}</div>
          <div className="text-xs text-slate-400 mt-2">
            بناءً على التوكنات المستخدمة
          </div>
        </div>
      </div>

      {/* Subscriptions & AI Health Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <span>حالات الاشتراكات / Subscriptions Breakdown</span>
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                اشتراكات نشطة (Active)
              </span>
              <span className="font-bold text-emerald-400 text-sm">{stats.activeSubscriptions}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                منتهية الصلاحية (Expired)
              </span>
              <span className="font-bold text-amber-400 text-sm">{stats.expiredSubscriptions}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                ملغاة (Cancelled)
              </span>
              <span className="font-bold text-rose-400 text-sm">{stats.cancelledSubscriptions}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span>حالة مزودي الذكاء الاصطناعي / AI Providers Status</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200 text-sm">Google Gemini (Primary)</p>
                <p className="text-xs text-slate-400 font-mono">
                  Model: {stats.settings?.providers?.gemini?.model || 'gemini-3.6-flash'}
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {stats.settings?.providers?.gemini?.enabled ? 'مفعل Active' : 'معطل Disabled'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200 text-sm">OpenAI (Fallback / Multi-AI)</p>
                <p className="text-xs text-slate-400 font-mono">
                  Model: {stats.settings?.providers?.openai?.model || 'gpt-4o-mini'}
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {stats.settings?.providers?.openai?.enabled ? 'مفعل Active' : 'معطل Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
