import React, { useState, useMemo, useEffect } from 'react';
import { CompanionItem, UserProfile } from '../types';
import {
  X,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Flame,
  ListTodo,
  PieChart,
  Filter,
  Zap,
  Cpu,
  Mic,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CompanionItem[];
  profile: UserProfile;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  items,
  profile,
}) => {
  const isArabic = profile.language === 'ar';
  const userId = profile.id || 'user_default_01';
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // AI Usage & Point Stats State (1 point = 5 tokens)
  const [userStats, setUserStats] = useState<{
    tokensUsed: number;
    pointsUsed: number;
    messagesCount: number;
    voiceMinutes: number;
    voiceSeconds: number;
    multiAiCount: number;
    advancedAiCount: number;
    estimatedCostUSD: number;
    period: string;
  } | null>(null);

  const fetchUserUsageStats = async () => {
    try {
      const res = await fetch(`/api/user/usage-stats?userId=${userId}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setUserStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user usage stats:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserUsageStats();
    }

    const handleSync = () => {
      fetchUserUsageStats();
    };

    window.addEventListener('subscription_updated', handleSync);
    window.addEventListener('rafiq_realtime_event', handleSync);

    return () => {
      window.removeEventListener('subscription_updated', handleSync);
      window.removeEventListener('rafiq_realtime_event', handleSync);
    };
  }, [isOpen, userId]);

  // Filter items based on chosen period
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let start = new Date();
    let end = new Date();

    if (period === 'today') {
      start = new Date(todayStr + 'T00:00:00');
      end = new Date(todayStr + 'T23:59:59');
    } else if (period === 'week') {
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(todayStr + 'T23:59:59');
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(todayStr + 'T23:59:59');
    } else if (period === 'custom') {
      start = new Date(startDate + 'T00:00:00');
      end = new Date(endDate + 'T23:59:59');
    }

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const periodItems = items.filter((item) => {
      const itemDate = item.dueDate || item.createdAt.split('T')[0];
      return itemDate >= startIso.split('T')[0] && itemDate <= endIso.split('T')[0];
    });

    const completed = periodItems.filter((i) => i.status === 'completed' || i.status === 'completed_late');
    const pending = periodItems.filter((i) => i.status === 'pending' || i.status === 'snoozed');
    const missed = periodItems.filter((i) => i.status === 'missed' || i.status === 'cancelled');

    const totalCount = periodItems.length;
    const completedCount = completed.length;
    const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Subtask statistics
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    periodItems.forEach((item) => {
      if (item.subtasks && item.subtasks.length > 0) {
        totalSubtasks += item.subtasks.length;
        completedSubtasks += item.subtasks.filter((st) => st.completed).length;
      }
    });

    // Breakdown by type
    const byType: Record<string, { total: number; completed: number }> = {};
    periodItems.forEach((item) => {
      const t = item.type;
      if (!byType[t]) byType[t] = { total: 0, completed: 0 };
      byType[t].total += 1;
      if (item.status === 'completed' || item.status === 'completed_late') {
        byType[t].completed += 1;
      }
    });

    return {
      periodItems,
      completed,
      pending,
      missed,
      totalCount,
      completedCount,
      rate,
      totalSubtasks,
      completedSubtasks,
      byType,
    };
  }, [items, period, startDate, endDate]);

  if (!isOpen) return null;

  const typeLabels: Record<string, string> = {
    task: isArabic ? 'مهام' : 'Tasks',
    habit: isArabic ? 'عادات' : 'Habits',
    appointment: isArabic ? 'مواعيد' : 'Appointments',
    reminder: isArabic ? 'تذكيرات' : 'Reminders',
    idea: isArabic ? 'أفكار' : 'Ideas',
    note: isArabic ? 'ملاحظات' : 'Notes',
    goal: isArabic ? 'أهداف' : 'Goals',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--accent-sage)] to-emerald-700 text-white shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--text-main)]">
                {isArabic ? 'إحصائيات الإنجاز والنشاط' : 'Performance & Activity Stats'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {isArabic ? 'تحليل شامل لنسب الإنجاز والمهام المكتملة حسب الفترة' : 'Comprehensive review of completed tasks and habits'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Time Period Filter Tabs */}
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)]">
            <button
              onClick={() => setPeriod('today')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                period === 'today'
                  ? 'bg-[var(--accent-sage)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{isArabic ? 'اليوم' : 'Today'}</span>
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                period === 'week'
                  ? 'bg-[var(--accent-sage)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{isArabic ? 'هذا الأسبوع' : 'This Week'}</span>
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                period === 'month'
                  ? 'bg-[var(--accent-sage)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{isArabic ? 'هذا الشهر' : 'This Month'}</span>
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                period === 'custom'
                  ? 'bg-[var(--accent-sage)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isArabic ? 'مخصصة' : 'Custom'}</span>
            </button>
          </div>

          {/* Custom Date Inputs */}
          {period === 'custom' && (
            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-wrap items-center gap-3 text-xs animate-fade-in">
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">
                  {isArabic ? 'من تاريخ:' : 'From Date:'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] font-semibold"
                />
              </div>

              <div className="flex-1 min-w-[130px]">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">
                  {isArabic ? 'إلى تاريخ:' : 'To Date:'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] font-semibold"
                />
              </div>
            </div>
          )}
        </div>

        {/* AI & Resource Consumption Statistics (Tokens, Points: 1 pt = 5 tokens, Messages, Voice) */}
        {userStats && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-hover)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-main)]">
                    {isArabic ? 'إحصائيات استهلاك الذكاء الاصطناعي والنقاط' : 'AI Resource & Points Consumption'}
                  </h4>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">
                    {isArabic ? `فترة الاستخدام الحالية: ${userStats.period}` : `Current Period: ${userStats.period}`}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full">
                {isArabic ? '✨ 1 نقطة = 5 توكن' : '✨ 1 Point = 5 Tokens'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Tokens Count */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] block flex items-center justify-between">
                  <span>{isArabic ? 'التوكنات' : 'Tokens'}</span>
                  <Cpu className="w-3 h-3 text-indigo-500" />
                </span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                  {userStats.tokensUsed.toLocaleString()}
                </p>
                <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                  {isArabic ? 'إجمالي التوكنات' : 'Total Tokens'}
                </span>
              </div>

              {/* Points (1 pt = 5 tokens) */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-purple-500/30 bg-purple-500/5">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block flex items-center justify-between">
                  <span>{isArabic ? 'النقاط المستهلكة' : 'Points'}</span>
                  <Sparkles className="w-3 h-3 text-purple-500" />
                </span>
                <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
                  {userStats.pointsUsed.toLocaleString()}
                </p>
                <span className="text-[9px] text-purple-500/80 block mt-0.5 font-bold">
                  {isArabic ? '1 نقطة / 5 توكن' : '1 pt / 5 tokens'}
                </span>
              </div>

              {/* Messages Count */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] block flex items-center justify-between">
                  <span>{isArabic ? 'عدد الرسائل' : 'Messages'}</span>
                  <MessageSquare className="w-3 h-3 text-blue-500" />
                </span>
                <p className="text-lg font-black text-[var(--text-main)] mt-1 font-mono">
                  {userStats.messagesCount.toLocaleString()}
                </p>
                <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                  {isArabic ? 'رسائل الرفيق' : 'AI Messages'}
                </span>
              </div>

              {/* Voice Minutes / Seconds */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] block flex items-center justify-between">
                  <span>{isArabic ? 'الصوت' : 'Voice'}</span>
                  <Mic className="w-3 h-3 text-emerald-500" />
                </span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  {userStats.voiceMinutes} <span className="text-xs font-normal">{isArabic ? 'دقيقة' : 'm'}</span>
                </p>
                <span className="text-[9px] text-[var(--text-muted)] block mt-0.5 font-mono">
                  {userStats.voiceSeconds} {isArabic ? 'ثانية' : 'sec'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Primary Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)] space-y-1">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block">
              {isArabic ? 'إجمالي العناصر' : 'Total Items'}
            </span>
            <div className="text-2xl font-black text-[var(--text-main)]">{filteredData.totalCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1">
            <span className="text-[11px] font-bold opacity-80 block">
              {isArabic ? 'تم إنجازها' : 'Completed'}
            </span>
            <div className="text-2xl font-black">{filteredData.completedCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 space-y-1">
            <span className="text-[11px] font-bold opacity-80 block">
              {isArabic ? 'معدل الإنجاز' : 'Completion Rate'}
            </span>
            <div className="text-2xl font-black">{filteredData.rate}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 space-y-1">
            <span className="text-[11px] font-bold opacity-80 block">
              {isArabic ? 'الأجزاء الفرعية' : 'Subtasks Done'}
            </span>
            <div className="text-2xl font-black">
              {filteredData.completedSubtasks}/{filteredData.totalSubtasks}
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-color)] space-y-2">
          <div className="flex justify-between text-xs font-black text-[var(--text-main)]">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[var(--accent-sage)]" />
              <span>{isArabic ? 'نسبة إنجاز الأهداف في هذه الفترة' : 'Overall Completion Bar'}</span>
            </span>
            <span>{filteredData.rate}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-[var(--bg-main)] overflow-hidden p-0.5 border border-[var(--border-color)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-sage)] to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${filteredData.rate}%` }}
            />
          </div>
        </div>

        {/* Category / Type Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-[var(--text-muted)] flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-[var(--accent-sage)]" />
            <span>{isArabic ? 'التوزيع حسب نوع العنصر:' : 'Breakdown by Type:'}</span>
          </h4>

          {Object.keys(filteredData.byType).length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic p-4 text-center border border-dashed rounded-2xl border-[var(--border-color)]">
              {isArabic ? 'لا توجد بيانات مسجلة في هذه الفترة' : 'No items recorded for this period.'}
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(filteredData.byType).map(([typeKey, rawStat]) => {
                const stat = rawStat as { total: number; completed: number };
                const percent = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                return (
                  <div
                    key={typeKey}
                    className="p-3 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[var(--text-main)]">
                        {typeLabels[typeKey] || typeKey} ({stat.completed}/{stat.total})
                      </span>
                      <span className="text-[var(--accent-sage)]">{percent}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-sage)] rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* List of Recently Completed Items */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-black uppercase text-[var(--text-muted)] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{isArabic ? 'أبرز الإنجازات المكتملة في الفترة:' : 'Completed Items in Period:'}</span>
          </h4>

          {filteredData.completed.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic p-3 text-center">
              {isArabic ? 'لم تقم بإنهاء أي مهمة في هذه الفترة بعد' : 'No completed tasks yet in this period.'}
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {filteredData.completed.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-center justify-between gap-2"
                >
                  <span className="font-bold text-[var(--text-main)] truncate">{item.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold shrink-0">
                    {item.dueDate || item.completedAt?.split('T')[0] || 'Done'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
