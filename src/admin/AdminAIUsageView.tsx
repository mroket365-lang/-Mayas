import React, { useState, useEffect } from 'react';
import { Cpu, DollarSign, Activity, BarChart2, RefreshCw } from 'lucide-react';

interface AIUsageData {
  totalLogsCount: number;
  recentLogs: Array<{
    id: string;
    userId: string;
    provider: string;
    model: string;
    tokensInput: number;
    tokensOutput: number;
    estimatedCost: number;
    success: boolean;
    feature: string;
    timestamp: string;
  }>;
  byProvider: Record<string, { requests: number; cost: number }>;
}

interface AdminAIUsageViewProps {
  token: string;
}

export const AdminAIUsageView: React.FC<AdminAIUsageViewProps> = ({ token }) => {
  const [data, setData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Fetch usage error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  if (loading || !data) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        جاري تحميل تحليل استخدام الذكاء الاصطناعي...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-purple-400" />
            <span>مراقبة استخدام الذكاء الاصطناعي والتكاليف التقديرية</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة استهلاك النماذج (Gemini vs OpenAI) والتوكنات والتكاليف لحظة بلحظة
          </p>
        </div>

        <button
          onClick={fetchUsage}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Provider Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data.byProvider || {}).map(([providerName, info]: [string, any]) => (
          <div key={providerName} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {providerName} Provider
              </span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{info.requests} طلب</div>
            <div className="text-xs text-emerald-400 font-mono mt-1">
              التكلفة التقديرية: ${info.cost.toFixed(4)} USD
            </div>
          </div>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            آخر سجلات الطلبات المنفذة (Recent Request Logs)
          </h3>
          <span className="text-[11px] text-slate-500">إجمالي الطلبات المسجلة: {data.totalLogsCount}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">المستخدم</th>
                <th className="px-4 py-3">المزود والنموذج</th>
                <th className="px-4 py-3">الميزة</th>
                <th className="px-4 py-3">التوكنات (In / Out)</th>
                <th className="px-4 py-3">التكلفة USD</th>
                <th className="px-4 py-3">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    لا توجد سجلات بعد
                  </td>
                </tr>
              ) : (
                data.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{log.userId}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-white uppercase">{log.provider}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{log.model}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-300">{log.feature}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {log.tokensInput} / {log.tokensOutput}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">
                      ${log.estimatedCost?.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
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
