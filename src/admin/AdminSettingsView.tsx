import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, CheckCircle2, Save, RefreshCw, KeyRound, Eye, Lock, UserCheck, HeartHandshake } from 'lucide-react';
import { FeatureFlagConfig } from '../types';

interface SystemSettings {
  maintenanceMode: boolean;
  newRegistrationsEnabled: boolean;
  defaultPlan: string;
  multiAIEnabled: boolean;
  voiceEnabled: boolean;
  privateCandidVisibility?: FeatureFlagConfig;
  maritalSupportVisibility?: FeatureFlagConfig;
}

interface AdminSettingsViewProps {
  token: string;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ token }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Admin Credentials form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);
  const [credMsg, setCredMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setSettings(json);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setMsg('تم حفظ إعدادات النظام وتغييرات الميزات بنجاح!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Save failed';
      setMsg(`خطأ: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminPassword) {
      setCredMsg('يرجى إدخال البريد الإلكتروني وكلمة السر الجديدة');
      return;
    }

    setCredSaving(true);
    setCredMsg(null);

    try {
      const res = await fetch('/api/admin/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail: newAdminEmail, newPassword: newAdminPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update credentials');

      setCredMsg('تم تحديث بيانات دخول المسؤول بنجاح!');
      setNewAdminPassword('');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Update failed';
      setCredMsg(`خطأ: ${errorMsg}`);
    } finally {
      setCredSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        جاري تحميل الإعدادات العامة...
      </div>
    );
  }

  const pConfig = settings.privateCandidVisibility || { mode: 'hidden' };
  const mConfig = settings.maritalSupportVisibility || { mode: 'hidden' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            <span>إعدادات النظام العامة وأعلام الميزات / System Settings & Feature Flags</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            التحكم الشامل بإظهار وإخفاء الميزات (نمط الحوارات الصريحة، الاستشارة الزوجية)، تغيير بيانات المسؤول، والصيانة
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-xs text-slate-300">
        {/* Maintenance Mode */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              وضع الصيانة (Maintenance Mode)
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              عند تفعيله، يتم إيقاف معالجة جميع الطلبات مؤقتًا وإبراز تنبيه صيانة آمن للعملاء.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            className="w-5 h-5 accent-indigo-600 rounded"
          />
        </div>

        {/* Feature Flags: Private Candid & Marital Intimacy Support */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>التحكم في رؤية وإتاحة الميزات الحساسة (Feature Visibility Flags)</span>
          </h3>

          {/* 1. Private Candid Mode Visibility */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>نمط الحوارات الخاصة والصريحة (Private Candid Mode)</span>
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  حدد لمن تظهر خيارات الحوارات الصريحة الجريئة في إعدادات التطبيق.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">حالة الإتاحة (Mode)</label>
                <select
                  value={pConfig.mode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privateCandidVisibility: { ...pConfig, mode: e.target.value as any },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="hidden">إخفاء الميزة عن الجميع (Hidden)</option>
                  <option value="everyone">إتاحة الميزة للجميع (Everyone)</option>
                  <option value="specific_user">مستخدم محدد فقط (Specific User ID/Email)</option>
                  <option value="allowed_users_list">قائمة مستخدمين مسموحين (Allowed List)</option>
                  <option value="region">حسب الدولة / المنطقة (Region/Country)</option>
                </select>
              </div>

              {pConfig.mode === 'specific_user' && (
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[11px] mb-1">المعرف أو البريد للمستخدم المسموح له</label>
                  <input
                    type="text"
                    value={pConfig.allowedUserId || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privateCandidVisibility: { ...pConfig, allowedUserId: e.target.value },
                      })
                    }
                    placeholder="e.g. USR-123456 or user@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {pConfig.mode === 'allowed_users_list' && (
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[11px] mb-1">قائمة المعرفات/الإيميلات (مفصولة بفواصل)</label>
                  <input
                    type="text"
                    value={pConfig.allowedUsersList || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privateCandidVisibility: { ...pConfig, allowedUsersList: e.target.value },
                      })
                    }
                    placeholder="USR-101, USR-102, test@domain.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {pConfig.mode === 'region' && (
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[11px] mb-1">رمز الدولة/المنطقة (e.g. SA, AE, KW)</label>
                  <input
                    type="text"
                    value={pConfig.allowedRegion || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        privateCandidVisibility: { ...pConfig, allowedRegion: e.target.value },
                      })
                    }
                    placeholder="SA, AE, EG"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Marital Support Visibility */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-rose-400" />
                  <span>جلسة الدعم والاستشارة الزوجية (18+ Marital Support Session)</span>
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  التحكم في إتاحة زر التفعيل والتعهد الاستشاري الزوجي في إعدادات المستخدمين.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">حالة الإتاحة (Mode)</label>
                <select
                  value={mConfig.mode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maritalSupportVisibility: { ...mConfig, mode: e.target.value as any },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="hidden">إخفاء الميزة عن الجميع (Hidden)</option>
                  <option value="everyone">إتاحة الميزة للجميع (Everyone)</option>
                  <option value="specific_user">مستخدم محدد فقط (Specific User ID/Email)</option>
                  <option value="allowed_users_list">قائمة مستخدمين مسموحين (Allowed List)</option>
                  <option value="region">حسب الدولة / المنطقة (Region/Country)</option>
                </select>
              </div>

              {mConfig.mode === 'specific_user' && (
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[11px] mb-1">المعرف أو البريد للمستخدم المسموح له</label>
                  <input
                    type="text"
                    value={mConfig.allowedUserId || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maritalSupportVisibility: { ...mConfig, allowedUserId: e.target.value },
                      })
                    }
                    placeholder="e.g. USR-123456 or user@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {mConfig.mode === 'allowed_users_list' && (
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[11px] mb-1">قائمة المعرفات/الإيميلات (مفصولة بفواصل)</label>
                  <input
                    type="text"
                    value={mConfig.allowedUsersList || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maritalSupportVisibility: { ...mConfig, allowedUsersList: e.target.value },
                      })
                    }
                    placeholder="USR-101, USR-102, test@domain.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {mConfig.mode === 'region' && (
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[11px] mb-1">رمز الدولة/المنطقة (e.g. SA, AE, KW)</label>
                  <input
                    type="text"
                    value={mConfig.allowedRegion || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maritalSupportVisibility: { ...mConfig, allowedRegion: e.target.value },
                      })
                    }
                    placeholder="SA, AE, EG"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Other Feature Flags */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <h3 className="font-bold text-white text-sm">ميزات الذكاء والصوت العامة</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">تخصيص Multi-AI Orchestration</p>
                <p className="text-slate-400 text-[11px]">سماح بتحليل الاستجابات عبر عدة نماذج في نفس الوقت</p>
              </div>
              <input
                type="checkbox"
                checked={settings.multiAIEnabled}
                onChange={(e) => setSettings({ ...settings, multiAIEnabled: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">تفعيل التفاعل الصوتي (Voice Engine)</p>
                <p className="text-slate-400 text-[11px]">ميزة الصوت والمحادثات المباشرة</p>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => setSettings({ ...settings, voiceEnabled: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات وأعلام الميزات'}</span>
          </button>
        </div>
      </form>

      {/* Admin Credentials Change Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs text-slate-300">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>تحديث بيانات دخول مسؤول النظام (Super Admin Credentials)</span>
        </h3>
        <p className="text-slate-400 text-xs">
          قم بتحديد البريد الإلكتروني وكلمة المرور الجديدة للوحة التحكم لمنع الدخول بالبيانات الافتراضية.
        </p>

        {credMsg && (
          <div className="p-3 bg-slate-950 border border-indigo-800/80 text-indigo-300 text-xs rounded-xl">
            {credMsg}
          </div>
        )}

        <form onSubmit={handleSaveCredentials} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1">البريد الإلكتروني الجديد للمسؤول</label>
            <input
              type="email"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="e.g. admin@yourdomain.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={credSaving}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{credSaving ? 'جاري التحديث...' : 'حفظ كلمة المرور والبريد الجديد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

