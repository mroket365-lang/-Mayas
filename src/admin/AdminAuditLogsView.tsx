import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, FileText } from 'lucide-react';

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
}

interface AdminAuditLogsViewProps {
  token: string;
}

export const AdminAuditLogsView: React.FC<AdminAuditLogsViewProps> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json);
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>سجل عمليات الإدارة والحماية / Admin Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل وتتبع كافة التغييرات الحساسة (تغيير الخطط، الترقية اليدوية، تعليق الحسابات)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">المسؤول (Admin)</th>
                <th className="px-4 py-3">نوع الإجراء</th>
                <th className="px-4 py-3">المستهدف (Target User)</th>
                <th className="px-4 py-3">التفاصيل</th>
                <th className="px-4 py-3">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    جاري تحميل سجل السجلات...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    لا توجد عمليات مسجلة بعد
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{log.adminEmail}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{log.targetUserId || '-'}</td>
                    <td className="px-4 py-3 text-slate-200">{log.details}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
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
