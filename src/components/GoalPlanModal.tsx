import React, { useState } from 'react';
import { CompanionItem, GoalMilestone, UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import {
  Target,
  Calendar,
  Sparkles,
  X,
  Save,
  Plus,
  Trash2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
  BarChart2,
  Brain,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface GoalPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: CompanionItem) => void;
  profile: UserProfile;
  initialItem?: CompanionItem | null;
}

export const GoalPlanModal: React.FC<GoalPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profile,
  initialItem,
}) => {
  if (!isOpen) return null;

  const isArabic = profile.language === 'ar';
  const t = getTranslation(profile.language);

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const [title, setTitle] = useState(initialItem?.title || '');
  const [targetGoal, setTargetGoal] = useState(initialItem?.targetGoal || initialItem?.description || '');
  const [startDate, setStartDate] = useState(initialItem?.startDate || todayStr);
  const [endDate, setEndDate] = useState(initialItem?.endDate || initialItem?.dueDate || thirtyDaysLater);
  const [targetMetric, setTargetMetric] = useState(initialItem?.targetMetric || (isArabic ? 'متابع / خطوة' : 'Metric'));
  const [targetValue, setTargetValue] = useState<number>(initialItem?.targetValue || 100);
  const [currentValue, setCurrentValue] = useState<number>(initialItem?.currentValue || 0);

  // Milestones State
  const [milestones, setMilestones] = useState<GoalMilestone[]>(
    initialItem?.milestones || [
      { id: 'm_1', title: isArabic ? 'المرحلة الأولى: البداية والإعداد (25%)' : 'Phase 1: Setup', targetValue: Math.round((initialItem?.targetValue || 100) * 0.25), completed: false },
      { id: 'm_2', title: isArabic ? 'المرحلة الثانية: بناء الزخم (50%)' : 'Phase 2: Momentum', targetValue: Math.round((initialItem?.targetValue || 100) * 0.50), completed: false },
      { id: 'm_3', title: isArabic ? 'المرحلة الثالثة: التسريع والتوسع (75%)' : 'Phase 3: Scaling', targetValue: Math.round((initialItem?.targetValue || 100) * 0.75), completed: false },
      { id: 'm_4', title: isArabic ? 'المرحلة الأخيرة: تحريك الهدف والتثبيت (100%)' : 'Phase 4: Completion', targetValue: initialItem?.targetValue || 100, completed: false },
    ]
  );

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(initialItem?.aiAnalysis || null);

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    const newM: GoalMilestone = {
      id: 'm_' + Date.now(),
      title: newMilestoneTitle.trim(),
      completed: false,
    };
    setMilestones([...milestones, newM]);
    setNewMilestoneTitle('');
  };

  const handleToggleMilestone = (id: string) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleAutoGenerateMilestones = () => {
    const val = targetValue || 100;
    const q1 = Math.round(val * 0.25);
    const q2 = Math.round(val * 0.50);
    const q3 = Math.round(val * 0.75);

    const generated: GoalMilestone[] = [
      { id: 'm_' + Date.now() + '_1', title: isArabic ? `الأسبوع الأول: الوصول لـ ${q1} ${targetMetric}` : `Week 1: Reach ${q1}`, targetValue: q1, completed: false },
      { id: 'm_' + Date.now() + '_2', title: isArabic ? `الأسبوع الثاني: الوصول لـ ${q2} ${targetMetric}` : `Week 2: Reach ${q2}`, targetValue: q2, completed: false },
      { id: 'm_' + Date.now() + '_3', title: isArabic ? `الأسبوع الثالث: الوصول لـ ${q3} ${targetMetric}` : `Week 3: Reach ${q3}`, targetValue: q3, completed: false },
      { id: 'm_' + Date.now() + '_4', title: isArabic ? `الأسبوع الرابع: تحقيق الهدف النهائي ${val} ${targetMetric}` : `Week 4: Final Target ${val}`, targetValue: val, completed: false },
    ];
    setMilestones(generated);
  };

  // Run AI Analysis for the Goal Progress
  const handleRunAIAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/companion/analyze-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          targetGoal,
          startDate,
          endDate,
          targetMetric,
          targetValue,
          currentValue,
          milestones,
          language: profile.language,
        }),
      });

      const data = await res.json();
      if (res.ok && data.analysis) {
        setAiAnalysisResult(data.analysis);
      }
    } catch (e) {
      console.error('Failed to run AI goal analysis:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const calculatedProgress =
      targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;

    const updatedItem: CompanionItem = {
      id: initialItem?.id || 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: initialItem?.userId || profile.id || 'user_local',
      type: 'goal',
      title: title.trim(),
      description: targetGoal.trim(),
      status: calculatedProgress >= 100 ? 'completed' : 'pending',
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: endDate,
      startDate,
      endDate,
      targetGoal: targetGoal.trim(),
      targetMetric: targetMetric.trim(),
      targetValue,
      currentValue,
      progressPercent: calculatedProgress,
      milestones,
      aiAnalysis: aiAnalysisResult || undefined,
    };

    onSave(updatedItem);
    onClose();
  };

  const progressPercent = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[var(--text-main)]">
                {initialItem ? (isArabic ? 'تعديل الخطة والهدف' : 'Edit Goal & Plan') : (isArabic ? 'إنشاء خطة / هدف استراتيجي محدد بوقت' : 'New Goal & Timed Plan')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {isArabic ? 'حدد نطاقك الزمني، مقاييس الإنجاز ومراحل التنفيذ مع تحليل الذكاء الاصطناعي' : 'Set timeline, target metrics, milestones and AI progress analysis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Title */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">
              {isArabic ? 'اسم الخطة / الهدف الرئيسي:' : 'Goal Title:'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isArabic ? 'مثال: جمع 1000 متابع، كتابة رواية، حفظ القرآن...' : 'e.g., Reach 1,000 followers, Learn Coding...'}
              className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
              required
            />
          </div>

          {/* Target Goal Motivation / Details */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">
              {isArabic ? 'ما هو هدفك من الخطة وما هي استراتيجيتك؟' : 'Goal Purpose & Strategy:'}
            </label>
            <textarea
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              rows={2}
              placeholder={isArabic ? 'اكتب الهدف النهائي وكيف تنوي الوصول إليه...' : 'Describe what you want to achieve and how...'}
              className="w-full p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)] resize-none"
            />
          </div>

          {/* Timeline: Start & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)]">
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>{isArabic ? 'تاريخ بداية الخطة:' : 'Start Date:'}</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>{isArabic ? 'تاريخ انتهاء الخطة والهدف:' : 'End Date:'}</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold"
                required
              />
            </div>
          </div>

          {/* Metric & Target Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)]">
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">
                {isArabic ? 'وحدة القياس:' : 'Metric Unit:'}
              </label>
              <input
                type="text"
                value={targetMetric}
                onChange={(e) => setTargetMetric(e.target.value)}
                placeholder={isArabic ? 'متابع / صفحة / ريال' : 'followers / pages'}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">
                {isArabic ? 'الهدف المطلوب (Target):' : 'Target Value:'}
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold"
                min={1}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">
                {isArabic ? 'المحقّق حالياً (Current):' : 'Current Progress:'}
              </label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold text-amber-600"
                min={0}
              />
            </div>
          </div>

          {/* Progress Bar Visualizer */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-300">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{isArabic ? 'نسبة الإنجاز الحالية:' : 'Progress:'}</span>
              </span>
              <span className="font-mono text-sm">{currentValue} / {targetValue} {targetMetric} ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-amber-500/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Milestone Phases Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <span>{isArabic ? 'تقسيم الخطة على مراحل فرعية:' : 'Milestones Breakdown:'}</span>
              </label>
              <button
                type="button"
                onClick={handleAutoGenerateMilestones}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-600 font-bold hover:bg-teal-500/20 transition-all flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>{isArabic ? 'تقسيم أسبوعي تلقائي ✨' : 'Auto Split ✨'}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-all ${
                    m.completed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 line-through'
                      : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleMilestone(m.id)}
                    className="flex items-center gap-2 flex-1 text-start min-w-0"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${m.completed ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}
                    />
                    <span className="truncate">{m.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(m.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder={isArabic ? 'إضافة مرحلة أو مستهدف فرعي جديد...' : 'Add milestone step...'}
                className="flex-1 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent-sage)] text-white font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إضافة' : 'Add'}</span>
              </button>
            </div>
          </div>

          {/* AI Analysis Trigger Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-600 animate-pulse" />
                <span>{isArabic ? 'تحليل الذكاء الاصطناعي لمستوى التقدم:' : 'AI Progress Analytics:'}</span>
              </span>

              <button
                type="button"
                onClick={handleRunAIAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isArabic ? 'جاري التحليل...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'تشغيل تقرير الذكاء الاصطناعي 🧠' : 'Analyze Now 🧠'}</span>
                  </>
                )}
              </button>
            </div>

            {aiAnalysisResult && (
              <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-purple-500/20 text-xs space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-purple-700 dark:text-purple-300">{aiAnalysisResult.summary}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    aiAnalysisResult.status === 'excellent' ? 'bg-emerald-500/20 text-emerald-600' :
                    aiAnalysisResult.status === 'good' ? 'bg-blue-500/20 text-blue-600' :
                    aiAnalysisResult.status === 'behind' ? 'bg-amber-500/20 text-amber-600' : 'bg-rose-500/20 text-rose-600'
                  }`}>
                    {aiAnalysisResult.status.toUpperCase()}
                  </span>
                </div>
                {aiAnalysisResult.advice && aiAnalysisResult.advice.length > 0 && (
                  <ul className="list-disc list-inside text-[11px] text-[var(--text-muted)] space-y-0.5">
                    {aiAnalysisResult.advice.map((adv, idx) => (
                      <li key={idx}>{adv}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-[var(--accent-sage)] hover:opacity-90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isArabic ? 'حفظ الخطة والهدف ✨' : 'Save Goal & Plan ✨'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] font-bold text-xs sm:text-sm hover:bg-[var(--bg-hover)] transition-all"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
