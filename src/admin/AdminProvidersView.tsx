import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ProvidersData {
  gemini: { enabled: boolean; model: string };
  openai: { enabled: boolean; model: string };
}

interface AdminProvidersViewProps {
  token: string;
}

export const AdminProvidersView: React.FC<AdminProvidersViewProps> = ({ token }) => {
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/providers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setProviders(json);
      }
    } catch (err) {
      console.error('Fetch providers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleUpdateProvider = async (provider: 'gemini' | 'openai', enabled: boolean, model: string) => {
    setSaveMessage(null);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider, enabled, model }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      setProviders(data);
      setSaveMessage(`تم تحديث إعدادات ${provider} بنجاح!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setSaveMessage(`خطأ: ${msg}`);
    }
  };

  if (loading || !providers) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        جاري تحميل إعدادات المزودين...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <span>إدارة مزودي الذكاء الاصطناعي والنماذج / AI Providers Control</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            التحكم الديناميكي بتفعيل وتناوب النماذج بدون تسريب المفاتيح السرية
          </p>
        </div>

        <button
          onClick={fetchProviders}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs rounded-xl">
          {saveMessage}
        </div>
      )}

      {/* Cards for each Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini Provider */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Google Gemini Provider</h3>
              <p className="text-xs text-slate-400">المزود الأساسي السريع والدقيق للمحاور الذكي</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                providers.gemini.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {providers.gemini.enabled ? 'مفعل Active' : 'معطل Disabled'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">النموذج المعتمد (Model Alias)</label>
              <select
                value={providers.gemini.model}
                onChange={(e) => handleUpdateProvider('gemini', providers.gemini.enabled, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (موصى به)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-300">حالة التفعيل:</span>
              <button
                onClick={() => handleUpdateProvider('gemini', !providers.gemini.enabled, providers.gemini.model)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  providers.gemini.enabled
                    ? 'bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30'
                    : 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30'
                }`}
              >
                {providers.gemini.enabled ? 'تعطيل Gemini' : 'تفعيل Gemini'}
              </button>
            </div>
          </div>
        </div>

        {/* OpenAI Provider */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">OpenAI Provider</h3>
              <p className="text-xs text-slate-400">مزود الاحتياط والتحليل المتعدد Multi-AI</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                providers.openai.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {providers.openai.enabled ? 'مفعل Active' : 'معطل Disabled'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">النموذج المعتمد (Model Alias)</label>
              <select
                value={providers.openai.model}
                onChange={(e) => handleUpdateProvider('openai', providers.openai.enabled, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (موصى به)</option>
                <option value="gpt-4o">gpt-4o</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-300">حالة التفعيل:</span>
              <button
                onClick={() => handleUpdateProvider('openai', !providers.openai.enabled, providers.openai.model)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  providers.openai.enabled
                    ? 'bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30'
                    : 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30'
                }`}
              >
                {providers.openai.enabled ? 'تعطيل OpenAI' : 'تفعيل OpenAI'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
