import React, { useState } from 'react';
import { CompanionItem, UserProfile, TaskStatus } from '../types';
import { getTranslation } from '../locales/translations';
import { Calendar, Clock, CheckCircle2, Sparkles, AlertCircle, PlayCircle, Trophy, Edit3 } from 'lucide-react';
import { EditItemModal } from './EditItemModal';

interface TodayViewProps {
  items: CompanionItem[];
  profile: UserProfile;
  onUpdateItem: (item: CompanionItem) => void;
  onStartEndReview: () => void;
  reviewText?: string;
  isReviewing?: boolean;
}

export const TodayView: React.FC<TodayViewProps> = ({
  items,
  profile,
  onUpdateItem,
  onStartEndReview,
  reviewText,
  isReviewing,
}) => {
  const [editingItem, setEditingItem] = useState<CompanionItem | null>(null);
  const t = getTranslation(profile.language);
  const todayStr = new Date().toISOString().split('T')[0];

  const todayItems = items.filter(
    (i) =>
      i.dueDate === todayStr ||
      i.repeatRule === 'daily' ||
      i.status === 'pending'
  );

  const completedCount = todayItems.filter(
    (i) => i.status === 'completed' || i.status === 'completed_late'
  ).length;
  const totalCount = todayItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const currentHour = new Date().getHours();
  let greetingText = t.goodMorning;
  if (currentHour >= 12 && currentHour < 17) greetingText = t.goodAfternoon;
  if (currentHour >= 17) greetingText = t.goodEvening;

  const handleStatusChange = (item: CompanionItem, newStatus: TaskStatus) => {
    onUpdateItem({
      ...item,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : item.completedAt,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-20">
      {/* Top Banner Greeting */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[var(--accent-sage)] to-emerald-700 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <span>{greetingText} {profile.addressAs} ❤️</span>
            </h2>
            <p className="text-xs text-emerald-100 font-medium mt-1">
              {new Date().toLocaleDateString(profile.language === 'ar' ? 'ar-SA' : 'en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md">
            <Trophy className="w-6 h-6 text-amber-300 mb-0.5" />
            <span className="text-lg font-black">{progressPercent}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 relative z-10">
          <div className="flex justify-between text-xs text-emerald-100 font-bold">
            <span>{completedCount} / {totalCount} {t.itemsCount}</span>
            <span>{t.performanceRate}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-amber-300 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[var(--accent-sage)]" />
          <span>{t.todayTitle}</span>
        </h3>

        {todayItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-3xl border-[var(--border-color)] text-[var(--text-muted)] space-y-2">
            <Clock className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-sm font-medium">لا توجد مواعيد أو مهام مسجلة لليوم حتى الآن</p>
          </div>
        ) : (
          todayItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[var(--bg-hover)] text-[var(--accent-sage)] font-extrabold text-xs">
                  {item.dueTime || 'All Day'}
                </div>

                <div>
                  <h4 className={`text-base font-bold text-[var(--text-main)] ${item.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] font-medium capitalize">
                    {t[`type${item.type.charAt(0).toUpperCase() + item.type.slice(1)}` as keyof typeof t] || item.type}
                    {item.location && ` • ${item.location}`}
                  </p>
                </div>
              </div>

              {/* Action buttons & Status Select */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-2 rounded-2xl bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-sage)] transition-all"
                  title={profile.language === 'ar' ? 'تعديل' : 'Edit'}
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item, e.target.value as TaskStatus)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all ${
                    item.status === 'completed'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : item.status === 'missed'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)]'
                  }`}
                >
                  <option value="pending">{t.statusPending}</option>
                  <option value="completed">{t.statusCompleted}</option>
                  <option value="completed_late">{t.statusCompletedLate}</option>
                  <option value="missed">{t.statusMissed}</option>
                  <option value="snoozed">{t.statusSnoozed}</option>
                  <option value="cancelled">{t.statusCancelled}</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Item Modal */}
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

      {/* End-of-Day Review Card */}
      <div className="p-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-[var(--text-main)]">{t.reviewHeader}</h3>
          </div>

          <button
            onClick={onStartEndReview}
            disabled={isReviewing}
            className="px-4 py-2 rounded-2xl bg-[var(--accent-sage)] text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{t.startReview}</span>
          </button>
        </div>

        {reviewText ? (
          <div className="p-4 rounded-2xl bg-[var(--bg-hover)] text-sm text-[var(--text-main)] leading-relaxed border border-[var(--border-color)] italic">
            "{reviewText}"
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            عند نهاية اليوم، اضغط على مراجعة اليوم ليتحدث معك رفيقك عن إنجازاتك ويعينك على ترتيب المهام المتبقية بشكل إنساني ودافئ.
          </p>
        )}
      </div>
    </div>
  );
};
