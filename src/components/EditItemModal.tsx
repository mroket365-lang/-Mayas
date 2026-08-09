import React, { useState } from 'react';
import { CompanionItem, ItemType, UserProfile } from '../types';
import { X, Calendar, Clock, Type, Tag, Bell, Check, Edit3 } from 'lucide-react';
import { getTranslation } from '../locales/translations';

type PriorityLevel = NonNullable<CompanionItem['priority']>;
type RepeatRule = NonNullable<CompanionItem['repeatRule']>;

interface EditItemModalProps {
  item: CompanionItem;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: CompanionItem) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  profile,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [type, setType] = useState<ItemType>(item.type);
  const [dueDate, setDueDate] = useState(item.dueDate || new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState(item.dueTime || '09:00');
  const [priority, setPriority] = useState<PriorityLevel>(item.priority || 'medium');
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(item.repeatRule || 'none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedItem: CompanionItem = {
      ...item,
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      dueDate,
      dueTime,
      priority,
      repeatRule,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-[var(--accent-sage)]/10 text-[var(--accent-sage)]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-main)]">
                {isArabic ? 'تعديل العنصر' : 'Edit Item'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {isArabic ? 'تحديث النص، التاريخ، الوقت، والتفاصيل' : 'Update text, date, time, and settings'}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-extrabold text-[var(--text-muted)] mb-1">
              {isArabic ? 'العنوان / النص' : 'Title / Text'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                placeholder={isArabic ? 'أدخل عنوان التذكير أو المنبه' : 'Enter title'}
                required
              />
            </div>
          </div>

          {/* Type Select */}
          <div>
            <label className="block font-extrabold text-[var(--text-muted)] mb-1">
              {isArabic ? 'النوع' : 'Category Type'}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-semibold text-xs"
            >
              <option value="task">{t.filterTasks}</option>
              <option value="appointment">{t.filterAppointments}</option>
              <option value="reminder">{t.filterReminders}</option>
              <option value="alarm">{t.filterAlarms}</option>
              <option value="habit">{t.filterHabits}</option>
              <option value="idea">{t.filterIdeas}</option>
              <option value="note">{t.filterNotes}</option>
              <option value="memory">{t.filterMemories}</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
                <span>{isArabic ? 'التاريخ' : 'Date'}</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-semibold text-xs"
              />
            </div>

            <div>
              <label className="font-extrabold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
                <span>{isArabic ? 'الوقت' : 'Time'}</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-semibold text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-extrabold text-[var(--text-muted)] mb-1">
              {isArabic ? 'التفاصيل / ملاحظات إضافية' : 'Description / Notes'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
              placeholder={isArabic ? 'أي تفاصيل أخرى توضيحية...' : 'Additional details...'}
            />
          </div>

          {/* Priority & Repeat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold text-[var(--text-muted)] mb-1">
                {isArabic ? 'الأولوية' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-semibold text-xs"
              >
                <option value="low">{isArabic ? 'منخفضة' : 'Low'}</option>
                <option value="medium">{isArabic ? 'متوسطة' : 'Medium'}</option>
                <option value="high">{isArabic ? 'عالية' : 'High'}</option>
              </select>
            </div>

            <div>
              <label className="block font-extrabold text-[var(--text-muted)] mb-1">
                {isArabic ? 'التكرار' : 'Repeat'}
              </label>
              <select
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}
                className="w-full px-3 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-semibold text-xs"
              >
                <option value="none">{isArabic ? 'بدون تكرار' : 'None'}</option>
                <option value="daily">{isArabic ? 'يومي' : 'Daily'}</option>
                <option value="weekly">{isArabic ? 'أسبوعي' : 'Weekly'}</option>
                <option value="monthly">{isArabic ? 'شهري' : 'Monthly'}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-3">
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-[var(--accent-sage)] hover:opacity-90 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isArabic ? 'حفظ التغييرات' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-hover)] text-[var(--text-muted)] font-bold text-xs hover:text-[var(--text-main)] transition-colors"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
