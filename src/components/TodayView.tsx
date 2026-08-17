import React, { useState } from 'react';
import { CompanionItem, UserProfile, TaskStatus, TaskCategory } from '../types';
import { getTranslation } from '../locales/translations';
import {
  Calendar,
  Clock,
  Sparkles,
  PlayCircle,
  Trophy,
  Edit3,
  Flame,
  Plus,
  Trash2,
  Check,
  Zap,
  X,
  Award,
  CheckCircle2,
  ListTodo,
  BarChart3,
  Tag,
} from 'lucide-react';
import { EditItemModal } from './EditItemModal';
import { StatsModal } from './StatsModal';
import { TaskItemCard } from './TaskItemCard';
import {
  calculateHabitStreak,
  toggleHabitCompletion,
  getLocalDateStr,
} from '../utils/habitUtils';
import { useFeatureGate } from '../context/FeatureGateContext';
import { TASK_CATEGORIES, getTaskCategoryConfig } from '../constants/taskCategories';

interface TodayViewProps {
  items: CompanionItem[];
  profile: UserProfile;
  onUpdateItem: (item: CompanionItem) => void;
  onAddItem?: (item: CompanionItem) => void;
  onDeleteItem?: (id: string) => void;
  onStartEndReview: () => void;
  reviewText?: string;
  isReviewing?: boolean;
}

const DEFAULT_HABIT_TEMPLATES = [
  { title: 'تأمل ورواق صباحي', icon: '🧘', time: '08:00', type: 'habit' as const, category: 'personal' },
  { title: 'شرب 2 لتر ماء', icon: '💧', time: '09:00', type: 'habit' as const, category: 'health' },
  { title: 'قراءة 15 دقيقة', icon: '📖', time: '20:00', type: 'habit' as const, category: 'education' },
  { title: 'تمارين رياضية ومشي', icon: '🏃', time: '17:00', type: 'habit' as const, category: 'health' },
  { title: 'تناول الفيتامينات', icon: '💊', time: '09:30', type: 'habit' as const, category: 'health' },
];

export const TodayView: React.FC<TodayViewProps> = ({
  items,
  profile,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onStartEndReview,
  reviewText,
  isReviewing,
}) => {
  const { isFeatureVisible, isFeatureEnabled, triggerLockedPrompt } = useFeatureGate();
  const [editingItem, setEditingItem] = useState<CompanionItem | null>(null);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [expandedHabitIds, setExpandedHabitIds] = useState<Record<string, boolean>>({});

  // New Habit Modal State
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🔥');
  const [newHabitTime, setNewHabitTime] = useState('08:00');
  const [newHabitCategory, setNewHabitCategory] = useState<TaskCategory>('health');

  const toggleHabitExpand = (id: string) => {
    setExpandedHabitIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';
  const todayStr = getLocalDateStr();

  // Separate Habits from regular Tasks
  const habitItems = items.filter(
    (i) => i.type === 'habit' || i.repeatRule === 'daily'
  );

  const todayTaskItems = items.filter(
    (i) =>
      i.type !== 'habit' &&
      i.repeatRule !== 'daily' &&
      (i.dueDate === todayStr || i.status === 'pending')
  );

  // Stats calculation
  const completedHabitsCount = habitItems.filter((i) =>
    (i.completedDates || []).includes(todayStr)
  ).length;

  const completedTasksCount = todayTaskItems.filter(
    (i) => i.status === 'completed' || i.status === 'completed_late'
  ).length;

  const totalItemsCount = habitItems.length + todayTaskItems.length;
  const totalCompletedCount = completedHabitsCount + completedTasksCount;
  const progressPercent =
    totalItemsCount > 0 ? Math.round((totalCompletedCount / totalItemsCount) * 100) : 0;

  const currentHour = new Date().getHours();
  let greetingText = t.goodMorning;
  if (currentHour >= 12 && currentHour < 17) greetingText = t.goodAfternoon;
  if (currentHour >= 17) greetingText = t.goodEvening;

  const handleToggleHabit = (item: CompanionItem, dateStr: string = todayStr) => {
    const updated = toggleHabitCompletion(item, dateStr);
    onUpdateItem(updated);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim() || !onAddItem) return;

    const newHabit: CompanionItem = {
      id: 'habit_' + Date.now(),
      userId: 'user_local',
      type: 'habit',
      title: newHabitTitle.trim(),
      category: newHabitCategory ? newHabitCategory : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueTime: newHabitTime,
      repeatRule: 'daily',
      icon: newHabitIcon,
      streak: 0,
      bestStreak: 0,
      completedDates: [],
    };

    onAddItem(newHabit);
    setNewHabitTitle('');
    setIsAddHabitModalOpen(false);
  };

  const handleQuickAddTemplate = (template: typeof DEFAULT_HABIT_TEMPLATES[0]) => {
    if (!onAddItem) return;
    const newHabit: CompanionItem = {
      id: 'habit_' + Date.now(),
      userId: 'user_local',
      type: 'habit',
      title: isArabic ? template.title : template.title,
      category: template.category,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueTime: template.time,
      repeatRule: 'daily',
      icon: template.icon,
      streak: 0,
      bestStreak: 0,
      completedDates: [],
    };
    onAddItem(newHabit);
  };

  const handleStatusChange = (item: CompanionItem, newStatus: TaskStatus) => {
    onUpdateItem({
      ...item,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : item.completedAt,
    });
  };

  const habitIcons = ['🔥', '🧘', '💧', '📖', '🏃', '☕', '💊', '🚴', '🧠', '☀️', '🏋️', '🎯', '🥗', '😴'];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
      {/* Top Banner Greeting & Performance Summary */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[var(--accent-sage)] to-teal-800 text-white shadow-md space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 sm:gap-3 relative z-10">
          <div className="min-w-0 flex-1 me-1">
            <h2 className="text-base sm:text-xl font-bold flex items-center gap-1.5 truncate leading-tight">
              <span className="truncate">{greetingText} {profile.addressAs}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5 truncate">
              {new Date().toLocaleDateString(profile.language === 'ar' ? 'ar-SA' : 'en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isFeatureVisible('tool_stats') && (
              <button
                onClick={() => {
                  if (!isFeatureEnabled('tool_stats')) {
                    triggerLockedPrompt('tool_stats');
                    return;
                  }
                  setIsStatsModalOpen(true);
                }}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all relative"
                title={isArabic ? 'فتح الإحصائيات' : 'Open Stats'}
              >
                <BarChart3 className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">{isArabic ? 'الإحصائيات' : 'Stats'}</span>
                {!isFeatureEnabled('tool_stats') && (
                  <span className="p-0.5 rounded-full bg-amber-400 text-stone-900">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-sm font-black">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Combined Progress Bar */}
        <div className="space-y-1 relative z-10">
          <div className="flex justify-between text-[11px] text-emerald-100 font-semibold">
            <span>
              {totalCompletedCount} / {totalItemsCount} {isArabic ? 'مكتمل' : 'Done'}
            </span>
            <span>{t.performanceRate}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
            <div
              className="h-full bg-amber-300 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: HABITS & DAILY ROUTINES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <span>{isArabic ? 'العادات اليومية' : 'Daily Habits'}</span>
                {habitItems.length > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                    {completedHabitsCount}/{habitItems.length} {isArabic ? 'منجز' : 'Done'}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsAddHabitModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--accent-sage)] text-white hover:opacity-90 font-bold text-xs flex items-center gap-1 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isArabic ? 'عادة جديدة' : 'New Habit'}</span>
          </button>
        </div>

        {/* Quick Add Suggestion Templates (Shown if habits count < 2) */}
        {habitItems.length < 2 && (
          <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2">
            <p className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{isArabic ? 'مقترحات سريعة بنقرة واحدة:' : 'Quick suggestions:'}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_HABIT_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAddTemplate(tmpl)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--accent-sage)] text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1 transition-all"
                >
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.title}</span>
                  <Plus className="w-3 h-3 text-[var(--accent-sage)]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Habit List */}
        {habitItems.length === 0 ? (
          <div className="p-6 text-center border border-dashed rounded-2xl border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] space-y-2">
            <Flame className="w-6 h-6 text-amber-500 mx-auto" />
            <p className="text-xs font-bold text-[var(--text-main)]">
              {isArabic ? 'لم تسجل أي عادة حتى الآن' : 'No habits tracked yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {habitItems.map((item) => {
              const streakInfo = calculateHabitStreak(
                item.completedDates || [],
                todayStr,
                profile.language
              );
              const isExpanded = !!expandedHabitIds[item.id];

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-200 shadow-sm hover:shadow ${
                    streakInfo.isCompletedToday
                      ? 'border-emerald-500/25 bg-emerald-500/[0.03] dark:bg-emerald-950/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent-sage)]/50'
                  }`}
                >
                  {/* COMPACT MAIN ROW - Height constrained to <= 3cm (~70px) */}
                  <div className="flex items-center justify-between gap-2.5 p-3 sm:px-4 min-h-[64px]">
                    {/* 1. START: 1-Tap Toggle Circle */}
                    <button
                      onClick={() => handleToggleHabit(item, todayStr)}
                      className="p-1 rounded-xl hover:scale-110 active:scale-95 transition-transform shrink-0"
                      title={
                        streakInfo.isCompletedToday
                          ? (isArabic ? 'إلغاء الإنجاز' : 'Mark pending')
                          : (isArabic ? 'تسجيل إنجاز اليوم' : 'Mark done today')
                      }
                    >
                      {streakInfo.isCompletedToday ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[var(--text-muted)] hover:border-amber-500 flex items-center justify-center transition-colors">
                          <Flame className="w-3 h-3 text-[var(--text-muted)] hover:text-amber-500" />
                        </div>
                      )}
                    </button>

                    {/* 2. MIDDLE: Bold Title + Meta Info */}
                    <div
                      onClick={() => toggleHabitExpand(item.id)}
                      className="flex-1 min-w-0 cursor-pointer select-none space-y-0.5"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="text-xs shrink-0">{item.icon || '🔥'}</span>
                        <h4
                          className={`text-sm sm:text-base font-bold text-[var(--text-main)] truncate ${
                            streakInfo.isCompletedToday ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {item.title}
                        </h4>

                        {(() => {
                          const catConf = getTaskCategoryConfig(item.category, isArabic);
                          if (!catConf) return null;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold border shrink-0 ${catConf.badgeClass}`}
                            >
                              <span className={`w-1 h-1 rounded-full ${catConf.dotClass}`} />
                              <span>{catConf.icon}</span>
                              <span>{isArabic ? catConf.nameAr.split(' ')[0] : catConf.nameEn.split(' ')[0]}</span>
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)] font-medium">
                        {item.dueTime && (
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-[var(--accent-sage)]" />
                            <span>{item.dueTime}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-amber-500" />
                          <span>{streakInfo.currentStreak} {isArabic ? 'أيام متتالية' : 'days streak'}</span>
                        </span>
                      </div>
                    </div>

                    {/* 3. END: 7-Day History Trigger, Edit, Delete */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleHabitExpand(item.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                          isExpanded
                            ? 'bg-[var(--accent-sage)] text-white border-[var(--accent-sage)]'
                            : 'bg-[var(--bg-hover)] text-[var(--text-muted)] border-[var(--border-color)]'
                        }`}
                        title={isArabic ? 'عرض سجل الأسبوع' : '7-Day History'}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>7{isArabic ? 'أيام' : 'd'}</span>
                      </button>

                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-sage)] hover:bg-[var(--bg-hover)] transition-colors"
                        title={isArabic ? 'تعديل' : 'Edit'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {onDeleteItem && (
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title={isArabic ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 7-DAY MINI MATRIX (Progressive Disclosure on Demand) */}
                  {isExpanded && (
                    <div className="px-3 pb-3 sm:px-4 sm:pb-3.5 pt-1 space-y-2 border-t border-[var(--border-color)]/60 bg-[var(--bg-main)]/40 rounded-b-2xl animate-fade-in text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                        <span>{isArabic ? 'سجل الأيام السبعة الماضية:' : 'Past 7 Days:'}</span>
                        <span>{streakInfo.totalCompletions} {isArabic ? 'إجمالي المرات' : 'Total'}</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {streakInfo.weekHistory.map((day) => (
                          <button
                            key={day.dateStr}
                            onClick={() => handleToggleHabit(item, day.dateStr)}
                            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl border text-center transition-all ${
                              day.completed
                                ? 'border-emerald-500 bg-emerald-500 text-white font-bold'
                                : day.isToday
                                ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-bold ring-1 ring-amber-500/30'
                                : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                            }`}
                          >
                            <span className="text-[9px] uppercase font-bold opacity-80">{day.dayName}</span>
                            <span className="text-xs font-bold mt-0.5">
                              {day.completed ? <Check className="w-3 h-3 stroke-[3] mx-auto" /> : day.dayNum}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: SCHEDULED TASKS & APPOINTMENTS TIMELINE */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[var(--accent-sage)]" />
          <span>{isArabic ? 'المهام والمواعيد المجدولة لليوم' : 'Scheduled Tasks & Appointments'}</span>
        </h3>

        {todayTaskItems.length === 0 ? (
          <div className="p-6 text-center border border-dashed rounded-2xl border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] space-y-1.5">
            <Clock className="w-6 h-6 mx-auto opacity-40" />
            <p className="text-xs font-medium">
              {isArabic
                ? 'لا توجد مهام أو مواعيد مجدولة أخرى لليوم'
                : 'No extra scheduled tasks for today'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTaskItems.map((item) => (
              <TaskItemCard
                key={item.id}
                item={item}
                profile={profile}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onEditItem={(itm) => setEditingItem(itm)}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: END-OF-DAY REVIEW WITH AI COMPANION */}
      {isFeatureVisible('tool_daily_review') && (
        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <span>{t.reviewHeader}</span>
                {!isFeatureEnabled('tool_daily_review') && (
                  <span className="p-0.5 rounded-full bg-amber-400 text-stone-900">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </h3>
            </div>

            <button
              onClick={() => {
                if (!isFeatureEnabled('tool_daily_review')) {
                  triggerLockedPrompt('tool_daily_review');
                  return;
                }
                onStartEndReview();
              }}
              disabled={isReviewing}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-sage)] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{t.startReview}</span>
            </button>
          </div>

          {reviewText ? (
            <div className="p-3.5 rounded-xl bg-[var(--bg-hover)] text-xs sm:text-sm text-[var(--text-main)] leading-relaxed border border-[var(--border-color)] italic">
              "{reviewText}"
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {isArabic
                ? 'عند نهاية اليوم، اضغط على مراجعة اليوم ليتحدث معك رفيقك عن إنجازاتك اليومية ويعينك على مراجعة ما تبقى بهدوء.'
                : 'At the end of your day, review your completed achievements with your companion.'}
            </p>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT ITEM MODAL */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          profile={profile}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            onUpdateItem(updated);
            setEditingItem(null);
          }}
        />
      )}

      {/* MODAL 2: ADD NEW HABIT MODAL */}
      {isAddHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Flame className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)]">
                    {isArabic ? 'إضافة عادة يومية جديدة' : 'Add New Habit'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {isArabic ? 'حدد العنوان، الوقت، والأيقونة لبدء السلسلة' : 'Set title, time, and icon'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddHabitModalOpen(false)}
                className="p-2 rounded-2xl bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-[var(--text-muted)] mb-1">
                  {isArabic ? 'اسم العادة / الروتين' : 'Habit Title'}
                </label>
                <input
                  type="text"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                  placeholder={isArabic ? 'مثال: قراءة 15 دقيقة، شرب الماء، رياضة...' : 'e.g., Read 15 mins, Drink water...'}
                  required
                />
              </div>

              <div>
                <label className="block font-extrabold text-[var(--text-muted)] mb-1">
                  {isArabic ? 'الأيقونة' : 'Icon / Emoji'}
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)]">
                  {habitIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewHabitIcon(ic)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        newHabitIcon === ic
                          ? 'bg-[var(--accent-sage)] text-white shadow-md scale-110'
                          : 'hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-extrabold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
                  <span>{isArabic ? 'تصنيف العادة' : 'Habit Category'}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)]">
                  {TASK_CATEGORIES.map((cat) => {
                    const isSelected = newHabitCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewHabitCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 transition-all ${
                          isSelected
                            ? cat.activeChipClass
                            : `${cat.bgClass} ${cat.textClass} ${cat.borderClass} hover:opacity-80`
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{isArabic ? cat.nameAr.split(' ')[0] : cat.nameEn.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-extrabold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
                  <span>{isArabic ? 'وقت التذكير اليومي' : 'Reminder Time'}</span>
                </label>
                <input
                  type="time"
                  value={newHabitTime}
                  onChange={(e) => setNewHabitTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-semibold text-xs"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[var(--accent-sage)] hover:opacity-90 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isArabic ? 'إنشاء وتتبع العادة' : 'Create & Track'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddHabitModalOpen(false)}
                  className="px-5 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-[var(--text-muted)] font-bold text-xs"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 3: STATS & ANALYTICS MODAL */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        items={items}
        profile={profile}
      />
    </div>
  );
};
