import React, { useState } from 'react';
import { CompanionItem, SubTask, TaskStatus, UserProfile } from '../types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Trash2,
  Edit3,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp,
  MapPin,
  ListCheck,
  CheckSquare,
  Square,
  Loader2,
  Target,
} from 'lucide-react';
import { getTranslation } from '../locales/translations';

interface TaskItemCardProps {
  item: CompanionItem;
  profile: UserProfile;
  onUpdateItem: (item: CompanionItem) => void;
  onDeleteItem?: (id: string) => void;
  onEditItem?: (item: CompanionItem) => void;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  item,
  profile,
  onUpdateItem,
  onDeleteItem,
  onEditItem,
}) => {
  const isArabic = profile.language === 'ar';
  const t = getTranslation(profile.language);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const isCompleted = item.status === 'completed' || item.status === 'completed_late';
  const milestones = item.milestones || [];
  const completedMilestonesCount = milestones.filter((m) => m.completed).length;

  const subtasks = item.subtasks || [];
  const completedSubtasksCount = subtasks.filter((st) => st.completed).length;

  const currentProgress =
    milestones.length > 0
      ? Math.round((completedMilestonesCount / milestones.length) * 100)
      : subtasks.length > 0
      ? Math.round((completedSubtasksCount / subtasks.length) * 100)
      : item.progressPercent || (isCompleted ? 100 : 0);

  // Quick 1-tap complete toggle
  const handleQuickToggleComplete = () => {
    const nextCompleted = !isCompleted;
    const newStatus: TaskStatus = nextCompleted ? 'completed' : 'pending';
    
    // Also toggle subtasks & milestones if all are being marked complete/pending
    let updatedSubtasks = subtasks;
    if (subtasks.length > 0) {
      updatedSubtasks = subtasks.map((st) => ({
        ...st,
        completed: nextCompleted,
      }));
    }

    let updatedMilestones = milestones;
    if (milestones.length > 0) {
      updatedMilestones = milestones.map((m) => ({
        ...m,
        completed: nextCompleted,
      }));
    }

    onUpdateItem({
      ...item,
      status: newStatus,
      progressPercent: nextCompleted ? 100 : 0,
      subtasks: updatedSubtasks,
      milestones: updatedMilestones,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
    });
  };

  // Toggle milestone step
  const handleToggleMilestone = (mId: string) => {
    const updatedMilestones = milestones.map((m) =>
      m.id === mId ? { ...m, completed: !m.completed } : m
    );
    const newCompletedCount = updatedMilestones.filter((m) => m.completed).length;
    const newPercent = Math.round((newCompletedCount / updatedMilestones.length) * 100);
    const allDone = updatedMilestones.length > 0 && newCompletedCount === updatedMilestones.length;

    onUpdateItem({
      ...item,
      milestones: updatedMilestones,
      progressPercent: newPercent,
      status: allDone ? 'completed' : item.status === 'completed' ? 'pending' : item.status,
      completedAt: allDone ? new Date().toISOString() : undefined,
    });
  };

  // Toggle subtask step
  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const newCompletedCount = updatedSubtasks.filter((st) => st.completed).length;
    const newPercent = Math.round((newCompletedCount / updatedSubtasks.length) * 100);
    const allDone = updatedSubtasks.length > 0 && newCompletedCount === updatedSubtasks.length;

    onUpdateItem({
      ...item,
      subtasks: updatedSubtasks,
      progressPercent: newPercent,
      status: allDone ? 'completed' : item.status === 'completed' ? 'pending' : item.status,
      completedAt: allDone ? new Date().toISOString() : undefined,
    });
  };

  // Add new subtask
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: SubTask = {
      id: 'st_' + Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    const updatedSubtasks = [...subtasks, newSubtask];
    const newCompletedCount = updatedSubtasks.filter((st) => st.completed).length;
    const newPercent = Math.round((newCompletedCount / updatedSubtasks.length) * 100);

    onUpdateItem({
      ...item,
      subtasks: updatedSubtasks,
      progressPercent: newPercent,
    });

    setNewSubtaskTitle('');
  };

  // Delete subtask
  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter((st) => st.id !== subtaskId);
    const newCompletedCount = updatedSubtasks.filter((st) => st.completed).length;
    const newPercent =
      updatedSubtasks.length > 0 ? Math.round((newCompletedCount / updatedSubtasks.length) * 100) : 0;

    onUpdateItem({
      ...item,
      subtasks: updatedSubtasks,
      progressPercent: newPercent,
    });
  };

  // Quick set percentage
  const handleSetProgressPercent = (percent: number) => {
    const done = percent === 100;
    onUpdateItem({
      ...item,
      progressPercent: percent,
      status: done ? 'completed' : item.status === 'completed' ? 'pending' : item.status,
      completedAt: done ? new Date().toISOString() : undefined,
    });
  };

  // AI Task Decomposition
  const handleAIDecompose = async () => {
    try {
      setIsDecomposing(true);
      const res = await fetch('/api/companion/decompose-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          language: profile.language,
        }),
      });

      if (!res.ok) throw new Error('Decompose failed');

      const data = await res.json();
      if (data.subtaskTitles && Array.isArray(data.subtaskTitles)) {
        const generatedSubtasks: SubTask[] = data.subtaskTitles.map((stTitle: string, idx: number) => ({
          id: 'st_ai_' + Date.now() + '_' + idx,
          title: stTitle,
          completed: false,
        }));

        onUpdateItem({
          ...item,
          subtasks: [...subtasks, ...generatedSubtasks],
          progressPercent: 0,
        });
        setIsExpanded(true);
      }
    } catch (err) {
      console.error('Failed to decompose with AI:', err);
    } finally {
      setIsDecomposing(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 shadow-sm hover:shadow ${
        isCompleted
          ? 'border-emerald-500/25 bg-emerald-500/[0.03] dark:bg-emerald-950/10'
          : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent-sage)]/50'
      }`}
    >
      {/* COMPACT MAIN ROW - Height constrained to <= ~3cm (70px-85px) */}
      <div className="flex items-center justify-between gap-2.5 p-3 sm:px-4 sm:py-3 min-h-[64px]">
        {/* 1. START: Quick 1-Tap Toggle Circle */}
        <button
          onClick={handleQuickToggleComplete}
          className="p-1 rounded-xl hover:scale-110 active:scale-95 transition-transform shrink-0"
          title={isCompleted ? (isArabic ? 'إلغاء الإكمال' : 'Mark pending') : (isArabic ? 'إكمال المهمة' : 'Mark complete')}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 fill-emerald-500/20" />
          ) : (
            <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-muted)] hover:text-[var(--accent-sage)]" />
          )}
        </button>

        {/* 2. MIDDLE: Bold Title on Top + Small Description & Tags Below */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 min-w-0 cursor-pointer select-none space-y-0.5"
        >
          {/* Bold Title */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs shrink-0 opacity-80">
              {item.icon || (item.type === 'habit' ? '🔥' : item.type === 'appointment' ? '📅' : '📝')}
            </span>
            <h4
              className={`text-sm sm:text-base font-bold text-[var(--text-main)] truncate ${
                isCompleted ? 'line-through opacity-55' : ''
              }`}
            >
              {item.title}
            </h4>
          </div>

          {/* Small Subtitle / Description & Meta Tags */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)] font-medium leading-tight">
            {item.description ? (
              <span className="truncate max-w-[200px] sm:max-w-xs">{item.description}</span>
            ) : null}

            {item.type === 'goal' && item.targetValue ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
                🎯 {item.currentValue || 0} / {item.targetValue} {item.targetMetric || ''}
              </span>
            ) : null}

            {item.isLongNote && item.imageUrl ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-teal-500/15 text-teal-600 border border-teal-500/30 shrink-0">
                📷 صورة مرفقة
              </span>
            ) : null}

            {item.dueDate && (
              <span className="inline-flex items-center gap-0.5 shrink-0">
                <Calendar className="w-3 h-3 text-[var(--accent-sage)]" />
                <span>{item.dueDate}</span>
              </span>
            )}

            {item.dueTime && (
              <span className="inline-flex items-center gap-0.5 shrink-0">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{item.dueTime}</span>
              </span>
            )}

            {item.location && (
              <span className="inline-flex items-center gap-0.5 shrink-0 hidden sm:inline-flex">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span className="truncate max-w-[100px]">{item.location}</span>
              </span>
            )}

            {item.priority === 'high' && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0">
                {isArabic ? 'عالي' : 'High'}
              </span>
            )}
          </div>

          {/* Visual Progress Bar for Goal Item in main view */}
          {item.type === 'goal' && (
            <div className="w-full mt-2.5 space-y-1 pt-1 border-t border-[var(--border-color)]/50">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  🎯 {isArabic ? 'تقدم الخطة والهدف:' : 'Goal Progress:'}
                </span>
                <span className="font-mono text-xs text-[var(--accent-sage)] font-extrabold">{currentProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden border border-[var(--border-color)]/60">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-[var(--accent-sage)] rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              {(item.startDate || item.endDate) && (
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-medium pt-0.5">
                  <span>🗓️ {isArabic ? 'البداية:' : 'Start:'} {item.startDate || item.createdAt?.split('T')[0]}</span>
                  <span>🏁 {isArabic ? 'الهدف:' : 'End:'} {item.endDate || item.dueDate}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. END: Progress Pill, Action Icons & Expand Chevron */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Subtask or Progress Badge */}
          {(subtasks.length > 0 || currentProgress > 0) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border-color)]'
              }`}
              title={isArabic ? 'عرض الأجزاء والتقدم' : 'View subtasks & progress'}
            >
              {subtasks.length > 0 ? (
                <>
                  <ListCheck className="w-3 h-3 text-[var(--accent-sage)]" />
                  <span>
                    {completedSubtasksCount}/{subtasks.length}
                  </span>
                </>
              ) : (
                <span>{currentProgress}%</span>
              )}
            </button>
          )}

          {/* Quick Edit */}
          {onEditItem && (
            <button
              onClick={() => onEditItem(item)}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-sage)] hover:bg-[var(--bg-hover)] transition-colors"
              title={isArabic ? 'تعديل' : 'Edit'}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {/* Quick Delete */}
          {onDeleteItem && (
            <button
              onClick={() => onDeleteItem(item.id)}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title={isArabic ? 'حذف' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Expand/Collapse Chevron */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors"
            title={isExpanded ? (isArabic ? 'إخفاء التفاصيل' : 'Collapse') : (isArabic ? 'إظهار الخطوات والنسبة' : 'Expand')}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* EXPANDED SUBTASK & PROGRESS PANEL (Progressive Disclosure) */}
      {isExpanded && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 space-y-3 border-t border-[var(--border-color)]/60 bg-[var(--bg-main)]/50 rounded-b-2xl animate-fade-in text-xs">
          {/* Note Image Attachment Display */}
          {item.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-surface)] max-h-64 sm:max-h-80 shadow-sm">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-2xl" />
            </div>
          )}

          {/* Goal Metrics & Timeline Overview */}
          {item.type === 'goal' && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-800 dark:text-amber-300">
                <span>🎯 المستهدف: {item.currentValue || 0} من أصل {item.targetValue || 100} {item.targetMetric || ''}</span>
                <span className="font-mono text-sm">{currentProgress}%</span>
              </div>
              {item.startDate && item.endDate && (
                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                  🗓️ النطاق الزمني للخطة: {item.startDate} ← إلى → {item.endDate}
                </p>
              )}
              {item.aiAnalysis && (
                <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-purple-500/20 text-[11px] space-y-1">
                  <div className="font-bold text-purple-700 dark:text-purple-300">🧠 تقرير الذكاء الاصطناعي: {item.aiAnalysis.summary}</div>
                  {item.aiAnalysis.advice?.map((adv, i) => (
                    <div key={i} className="text-[10px] text-[var(--text-muted)]">• {adv}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Bar & Quick Percentage Selector */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
              <span>{isArabic ? 'نسبة الإنجاز:' : 'Progress:'} {currentProgress}%</span>
              <div className="flex items-center gap-1">
                {[0, 25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSetProgressPercent(p)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                      currentProgress === p
                        ? 'bg-[var(--accent-sage)] text-white'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent-sage)] rounded-full transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>

          {/* Goal Milestones List if exists */}
          {milestones.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-[var(--border-color)]/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-main)] flex items-center gap-1 text-[11px]">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isArabic ? 'مراحل الخطة والهدف' : 'Goal Milestones'} ({completedMilestonesCount}/{milestones.length})</span>
                </span>
              </div>

              {milestones.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-colors ${
                    m.completed
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 line-through'
                      : 'border-amber-500/20 bg-amber-500/5 text-[var(--text-main)]'
                  }`}
                >
                  <button
                    onClick={() => handleToggleMilestone(m.id)}
                    className="flex items-center gap-2 flex-1 text-right min-w-0"
                  >
                    {m.completed ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate text-xs font-semibold">{m.title}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Subtasks List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-main)] flex items-center gap-1 text-[11px]">
                <ListCheck className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
                <span>{isArabic ? 'خطوات المهمة الفرعية' : 'Subtask Steps'} ({completedSubtasksCount}/{subtasks.length})</span>
              </span>

              {/* AI Decompose Button */}
              <button
                onClick={handleAIDecompose}
                disabled={isDecomposing}
                className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1 transition-all disabled:opacity-50"
              >
                {isDecomposing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-500" />
                )}
                <span>{isDecomposing ? (isArabic ? 'تفكيك...' : 'Decomposing...') : (isArabic ? 'تفكيك بالذكاء الاصطناعي 🪄' : 'AI Decompose')}</span>
              </button>
            </div>

            {subtasks.map((st) => (
              <div
                key={st.id}
                className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-colors ${
                  st.completed
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 line-through'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)]'
                }`}
              >
                <button
                  onClick={() => handleToggleSubtask(st.id)}
                  className="flex items-center gap-2 flex-1 text-right min-w-0"
                >
                  {st.completed ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  )}
                  <span className="truncate text-xs font-semibold">{st.title}</span>
                </button>

                <button
                  onClick={() => handleDeleteSubtask(st.id)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Quick Add Subtask Input */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-1.5 pt-0.5">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder={isArabic ? '+ خطوة فرعية جديدة...' : '+ Add subtask...'}
                className="flex-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-2.5 py-1.5 rounded-xl bg-[var(--accent-sage)] text-white hover:opacity-90 font-bold text-xs disabled:opacity-40 shrink-0 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
