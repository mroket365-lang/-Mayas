import React, { useState } from 'react';
import { CompanionItem, ItemType, TaskCategory, UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import { Search, Plus, Trash2, CheckCircle2, Clock, Calendar, Bell, BookmarkCheck, Lightbulb, Repeat, AlertCircle, Edit3, Flame, Target, Feather, Lock, Tag } from 'lucide-react';
import { EditItemModal } from './EditItemModal';
import { TaskItemCard } from './TaskItemCard';
import { LongNoteModal } from './LongNoteModal';
import { GoalPlanModal } from './GoalPlanModal';
import { useFeatureGate } from '../context/FeatureGateContext';
import { TASK_CATEGORIES, getTaskCategoryConfig } from '../constants/taskCategories';

interface SavedViewProps {
  items: CompanionItem[];
  profile: UserProfile;
  onUpdateItem: (item: CompanionItem) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (item: CompanionItem) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  items,
  profile,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
}) => {
  const { isFeatureVisible, isFeatureEnabled, triggerLockedPrompt } = useFeatureGate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ItemType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLongNoteModalOpen, setIsLongNoteModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CompanionItem | null>(null);

  // New item form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ItemType>('task');
  const [newCategory, setNewCategory] = useState<TaskCategory>('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('09:00');

  const t = getTranslation(profile.language);
  const isArabic = profile.language === 'ar';

  const filterTabs: { id: ItemType | 'all'; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'goal', label: isArabic ? 'الأهداف والخطط 🎯' : 'Goals & Plans 🎯' },
    { id: 'task', label: t.filterTasks },
    { id: 'note', label: isArabic ? 'الملاحظات والقصائد 📝' : 'Notes & Poetry 📝' },
    { id: 'appointment', label: t.filterAppointments },
    { id: 'reminder', label: t.filterReminders },
    { id: 'alarm', label: t.filterAlarms },
    { id: 'habit', label: t.filterHabits },
    { id: 'idea', label: t.filterIdeas },
    { id: 'memory', label: t.filterMemories },
  ];

  const filteredItems = items.filter((item) => {
    const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'uncategorized' ? !item.category : item.category === selectedCategory);
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesCategory && matchesSearch;
  });

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: CompanionItem = {
      id: 'item_' + Date.now(),
      userId: 'user_local',
      type: newType,
      title: newTitle.trim(),
      category: newCategory ? newCategory : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: newDate,
      dueTime: newTime,
    };

    onAddItem(newItem);
    setNewTitle('');
    setNewCategory('');
    setIsAddModalOpen(false);
  };

  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'alarm': return <Bell className="w-4 h-4 text-amber-500" />;
      case 'habit': return <Repeat className="w-4 h-4 text-blue-500" />;
      case 'idea': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'memory': return <BookmarkCheck className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-teal-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3.5 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-main)]">{t.savedTitle}</h2>
          <p className="text-xs text-[var(--text-muted)]">{t.savedSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {isFeatureVisible('feature_snippet_extractor') && (
            <button
              onClick={() => {
                if (!isFeatureEnabled('feature_snippet_extractor')) {
                  triggerLockedPrompt('feature_snippet_extractor');
                  return;
                }
                setIsLongNoteModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-600/15 hover:bg-teal-600/25 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center gap-1 transition-all relative"
              title={isArabic ? 'تدوين ملاحظة طويلة، قصيدة أو مقتطف' : 'New Long Note'}
            >
              <Feather className="w-3.5 h-3.5" />
              <span>{isArabic ? 'ملاحظة / قصيدة' : 'Long Note'}</span>
              {!isFeatureEnabled('feature_snippet_extractor') && (
                <Lock className="w-3 h-3 text-amber-500 ms-0.5" />
              )}
            </button>
          )}

          {isFeatureVisible('feature_goals_tracking') && (
            <button
              onClick={() => {
                if (!isFeatureEnabled('feature_goals_tracking')) {
                  triggerLockedPrompt('feature_goals_tracking');
                  return;
                }
                setIsGoalModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1 transition-all relative"
              title={isArabic ? 'إنشاء هدف محدد بوقت وخطة' : 'New Goal Plan'}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isArabic ? 'خطة / هدف' : 'Goal Plan'}</span>
              {!isFeatureEnabled('feature_goals_tracking') && (
                <Lock className="w-3 h-3 text-amber-500 ms-0.5" />
              )}
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--accent-sage)] text-white hover:opacity-90 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addNewItem}</span>
          </button>
        </div>
      </div>

      {/* Learned Memory Quick Summary Banner */}
      {items.some((i) => i.type === 'memory') && (
        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <p className="font-bold text-[11px] truncate">
              {profile.language === 'ar'
                ? `ذاكرة رفيق (${items.filter((i) => i.type === 'memory').length} معلومة)`
                : `Rafiq Memories (${items.filter((i) => i.type === 'memory').length})`}
            </p>
          </div>
          <button
            onClick={() => setSelectedFilter('memory')}
            className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px] shrink-0 hover:bg-purple-700 transition-colors shadow-sm"
          >
            {profile.language === 'ar' ? 'استعراض' : 'View'}
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-sage)]"
        />
      </div>

      {/* Filter Chips (Item Types) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedFilter === tab.id
                ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white'
                : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
        <span className="text-[10px] font-bold text-[var(--text-muted)] shrink-0 flex items-center gap-1">
          <Tag className="w-3 h-3 text-[var(--accent-sage)]" />
          <span>{isArabic ? 'المجال:' : 'Category:'}</span>
        </span>

        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
            selectedCategory === 'all'
              ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-200 dark:text-stone-900 shadow-sm'
              : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          {isArabic ? 'الكل' : 'All'}
        </button>

        {TASK_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all border ${
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

      {/* Cards List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-3xl border-[var(--border-color)] text-[var(--text-muted)] text-sm space-y-1">
            <AlertCircle className="w-8 h-8 mx-auto opacity-40 mb-2" />
            <p>{t.noItemsFound}</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <TaskItemCard
              key={item.id}
              item={item}
              profile={profile}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              onEditItem={(itm) => setEditingItem(itm)}
            />
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

      {/* Manual Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--text-main)]">{t.addNewItem}</h3>

            <form onSubmit={handleCreateManual} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)]">
                    {isArabic ? 'النوع' : 'Type'}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ItemType)}
                    className="w-full mt-1 px-3 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-semibold"
                  >
                    <option value="task">{t.filterTasks}</option>
                    <option value="appointment">{t.filterAppointments}</option>
                    <option value="reminder">{t.filterReminders}</option>
                    <option value="alarm">{t.filterAlarms}</option>
                    <option value="habit">{t.filterHabits}</option>
                    <option value="idea">{t.filterIdeas}</option>
                    <option value="note">{t.filterNotes}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)]">
                    {isArabic ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                    className="w-full mt-1 px-3 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-semibold"
                  >
                    <option value="">{isArabic ? 'بدون تصنيف' : 'None (General)'}</option>
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {isArabic ? cat.nameAr : cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)]">
                  {isArabic ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
                  placeholder={isArabic ? 'اكتب عنوان المهمة أو الموعد...' : 'Enter title...'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)]">
                    {isArabic ? 'التاريخ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)]">
                    {isArabic ? 'الوقت' : 'Time'}
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[var(--accent-sage)] text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
                >
                  {isArabic ? 'حفظ العنصر' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-3 rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] font-semibold text-sm hover:bg-[var(--bg-hover)]"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Long Note Modal */}
      <LongNoteModal
        isOpen={isLongNoteModalOpen}
        onClose={() => setIsLongNoteModalOpen(false)}
        profile={profile}
        onSave={(newItem) => {
          onAddItem(newItem);
          setIsLongNoteModalOpen(false);
        }}
      />

      {/* Goal & Plan Modal */}
      <GoalPlanModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        profile={profile}
        onSave={(newItem) => {
          onAddItem(newItem);
          setIsGoalModalOpen(false);
        }}
      />
    </div>
  );
};
