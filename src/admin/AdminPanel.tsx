import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  Package,
  Cpu,
  BarChart2,
  ShieldCheck,
  Settings,
  LogOut,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboardView } from './AdminDashboardView';
import { AdminUsersView } from './AdminUsersView';
import { AdminSubscriptionsView } from './AdminSubscriptionsView';
import { AdminPaymentMethodsView } from './AdminPaymentMethodsView';
import { AdminPlansView } from './AdminPlansView';
import { AdminFeaturesView } from './AdminFeaturesView';
import { AdminAIUsageView } from './AdminAIUsageView';
import { AdminProvidersView } from './AdminProvidersView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminSettingsView } from './AdminSettingsView';

export const AdminPanel: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('rafiq_admin_token'));
  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('rafiq_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);

  const handleLoginSuccess = (newToken: string, admin: any) => {
    setToken(newToken);
    setAdminUser(admin);
    localStorage.setItem('rafiq_admin_token', newToken);
    localStorage.setItem('rafiq_admin_user', JSON.stringify(admin));
  };

  const handleLogout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('rafiq_admin_token');
    localStorage.removeItem('rafiq_admin_user');
  };

  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Fetch admin stats error:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  if (!token) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'features', label: 'إدارة الميزات والواجهات', icon: SlidersHorizontal },
    { id: 'users', label: 'المستخدمون', icon: Users },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCard },
    { id: 'payment_methods', label: 'طرق الدفع', icon: Wallet },
    { id: 'plans', label: 'الخطط والأسعار', icon: Package },
    { id: 'usage', label: 'تحليل الذكاء الاصطناعي', icon: BarChart2 },
    { id: 'providers', label: 'مزودو الذكاء الاصطناعي', icon: Cpu },
    { id: 'audit', label: 'سجل العمليات', icon: ShieldCheck },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ];

  return (
    <div className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800 p-4 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[35vh] md:max-h-full">
        <div>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm">لوحة رفيق الإدارية</h1>
                <p className="text-[10px] text-slate-400">Admin Control Center</p>
              </div>
            </div>

            <a
              href="/"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs"
              title="العودة للتطبيق"
            >
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Profile */}
        <div className="pt-4 border-t border-slate-800 mt-6 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{adminUser?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-400 truncate">{adminUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-xl transition-all"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto h-full">
        {activeTab === 'dashboard' && (
          <AdminDashboardView stats={stats} onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'features' && <AdminFeaturesView token={token} />}
        {activeTab === 'users' && <AdminUsersView token={token} />}
        {activeTab === 'subscriptions' && <AdminSubscriptionsView token={token} />}
        {activeTab === 'payment_methods' && <AdminPaymentMethodsView token={token} />}
        {activeTab === 'plans' && <AdminPlansView token={token} />}
        {activeTab === 'usage' && <AdminAIUsageView token={token} />}
        {activeTab === 'providers' && <AdminProvidersView token={token} />}
        {activeTab === 'audit' && <AdminAuditLogsView token={token} />}
        {activeTab === 'settings' && <AdminSettingsView token={token} />}
      </main>
    </div>
  );
};
