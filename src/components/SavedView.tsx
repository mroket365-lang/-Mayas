import React, { useState } from 'react';
import { CompanionItem, ItemType, UserProfile } from '../types';
import { getTranslation } from '../locales/translations';
import { Search, Plus, Trash2, CheckCircle2, Clock, Calendar, Bell, BookmarkCheck, Lightbulb, Repeat, AlertCircle, Edit3 } from 'lucide-react';
import { EditItemModal } from './EditItemModal';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ItemType | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CompanionItem | null>(null);

  // New item form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ItemType>('task');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('09:00');

  const t = getTranslation(profile.language);

  const filterTabs: { id: ItemType | 'all'; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'task', label: t.filterTasks },
    { id: 'appointment', label: t.filterAppointments },
    { id: 'reminder', label: t.filterReminders },
    { id: 'alarm', label: t.filterAlarms },
    { id: 'habit', label: t.filterHabits },
    { id: 'idea', label: t.filterIdeas },
    { id: 'note', label: t.filterNotes },
    { id: 'memory', label: t.filterMemories },
  ];

  const filteredItems = items.filter((item) => {
    const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: CompanionItem = {
      id: 'item_' + Date.now(),
      userId: 'user_local',
      type: newType,
      title: newTitle,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: newDate,
      dueTime: newTime,
    };

    onAddItem(newItem);
    setNewTitle('');
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
    <div className="max-w-2xl mx-auto p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t.savedTitle}</h2>
          <p className="text-xs text-[var(--text-muted)]">{t.savedSubtitle}</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-2.5 rounded-2xl bg-[var(--accent-sage)] text-white hover:opacity-90 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addNewItem}</span>
        </button>
      </div>

      {/* Learned Memory Quick Summary Banner */}
      {items.some((i) => i.type === 'memory') && (
        <div className="p-3.5 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-500 text-white shrink-0">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold">
                {profile.language === 'ar' ? 'ذاكرة رفيق الذكية' : "Rafiq's Smart Memories"}
              </p>
              <p className="opacity-80 text-[11px]">
                {profile.language === 'ar'
                  ? `تذكّر الرفيق ${items.filter((i) => i.type === 'memory').length} معلومات وتفضيلات شخصية عنك.`
                  : `Rafiq learned ${items.filter((i) => i.type === 'memory').length} personal facts & preferences.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedFilter('memory')}
            className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-[11px] shrink-0 hover:bg-purple-700 transition-colors shadow-sm"
          >
            {profile.language === 'ar' ? 'استعراض الذاكرة' : 'View Memories'}
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-sage)]"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedFilter === tab.id
                ? 'border-[var(--accent-sage)] bg-[var(--accent-sage)] text-white'
                : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-3xl border-[var(--border-color)] text-[var(--text-muted)] text-sm space-y-1">
            <AlertCircle className="w-8 h-8 mx-auto opacity-40 mb-2" />
            <p>{t.noItemsFound}</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-[var(--bg-hover)]">{getItemIcon(item.type)}</span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                    {t[`type${item.type.charAt(0).toUpperCase() + item.type.slice(1)}` as keyof typeof t] || item.type}
                  </span>
                  {item.status === 'completed' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                      {t.statusCompleted}
                    </span>
                  )}
                </div>

                <h4
                  className={`text-base font-bold text-[var(--text-main)] ${
                    item.status === 'completed' ? 'line-through opacity-50' : ''
                  }`}
                >
                  {item.title}
                </h4>

                {item.description && <p className="text-xs text-[var(--text-muted)]">{item.description}</p>}

                {(item.dueDate || item.dueTime) && (
                  <div className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
                    <span>
                      {item.dueDate || ''} {item.dueTime || ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-sage)] hover:bg-[var(--bg-hover)] transition-all"
                  title={profile.language === 'ar' ? 'تعديل' : 'Edit'}
                >
                  <Edit3 className="w-5 h-5" />
                </button>

                {item.status !== 'completed' && item.type !== 'memory' && (
                  <button
                    onClick={() => onUpdateItem({ ...item, status: 'completed', completedAt: new Date().toISOString() })}
                    className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all"
                    title={t.statusCompleted}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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

      {/* Manual Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--text-main)]">{t.addNewItem}</h3>

            <form onSubmit={handleCreateManual} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)]">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ItemType)}
                  className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm"
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
                <label className="text-xs font-bold text-[var(--text-muted)]">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)]">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)]">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[var(--accent-sage)] text-white font-bold text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-3 rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
