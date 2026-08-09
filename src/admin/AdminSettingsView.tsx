import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, CheckCircle2, Save, RefreshCw } from 'lucide-react';

interface SystemSettings {
  maintenanceMode: boolean;
  newRegistrationsEnabled: boolean;
  defaultPlan: string;
  multiAIEnabled: boolean;
  voiceEnabled: boolean;
}

interface AdminSettingsViewProps {
  token: string;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ token }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
      setMsg('تم حفظ إعدادات النظام بنجاح!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Save failed';
      setMsg(`خطأ: ${errorMsg}`);
    } finally {
      setSaving(false);
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
            وضع الصيانة الشامل وتفعيل الميزات والمزودين عالميًا
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
        <div className="p-3 bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs rounded-xl">
          {msg}
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

        {/* Feature Flags */}
        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm">أعلام الميزات (Feature Flags)</h3>

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
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
