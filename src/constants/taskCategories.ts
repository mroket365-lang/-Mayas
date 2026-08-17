export interface TaskCategoryConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  badgeClass: string;
  activeChipClass: string;
}

export const TASK_CATEGORIES: TaskCategoryConfig[] = [
  {
    id: 'work',
    nameAr: 'عمل ومشاريع',
    nameEn: 'Work & Projects',
    icon: '💼',
    bgClass: 'bg-blue-500/15 dark:bg-blue-950/30',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-500/30 dark:border-blue-500/40',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    activeChipClass: 'bg-blue-600 text-white border-blue-600 shadow-sm',
  },
  {
    id: 'personal',
    nameAr: 'شخصي وحياة',
    nameEn: 'Personal Life',
    icon: '🌿',
    bgClass: 'bg-emerald-500/15 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-500/30 dark:border-emerald-500/40',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    activeChipClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
  },
  {
    id: 'health',
    nameAr: 'صحة ولياقة',
    nameEn: 'Health & Fitness',
    icon: '❤️',
    bgClass: 'bg-rose-500/15 dark:bg-rose-950/30',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-500/30 dark:border-rose-500/40',
    dotClass: 'bg-rose-500',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    activeChipClass: 'bg-rose-600 text-white border-rose-600 shadow-sm',
  },
  {
    id: 'finance',
    nameAr: 'مالية وميزانية',
    nameEn: 'Finance & Money',
    icon: '💰',
    bgClass: 'bg-amber-500/15 dark:bg-amber-950/30',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-500/30 dark:border-amber-500/40',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    activeChipClass: 'bg-amber-600 text-white border-amber-600 shadow-sm',
  },
  {
    id: 'education',
    nameAr: 'تعليم وتطوير',
    nameEn: 'Education & Growth',
    icon: '📚',
    bgClass: 'bg-purple-500/15 dark:bg-purple-950/30',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-500/30 dark:border-purple-500/40',
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    activeChipClass: 'bg-purple-600 text-white border-purple-600 shadow-sm',
  },
  {
    id: 'home',
    nameAr: 'منزل وعائلة',
    nameEn: 'Home & Family',
    icon: '🏠',
    bgClass: 'bg-orange-500/15 dark:bg-orange-950/30',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-500/30 dark:border-orange-500/40',
    dotClass: 'bg-orange-500',
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
    activeChipClass: 'bg-orange-600 text-white border-orange-600 shadow-sm',
  },
  {
    id: 'other',
    nameAr: 'أخرى وعام',
    nameEn: 'Other & General',
    icon: '📌',
    bgClass: 'bg-slate-500/15 dark:bg-slate-900/40',
    textClass: 'text-slate-700 dark:text-slate-300',
    borderClass: 'border-slate-500/30 dark:border-slate-500/40',
    dotClass: 'bg-slate-500',
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
    activeChipClass: 'bg-slate-600 text-white border-slate-600 shadow-sm',
  },
];

export function getTaskCategoryConfig(categoryId?: string, isArabic: boolean = true): TaskCategoryConfig | null {
  if (!categoryId) return null;
  const normalized = categoryId.toLowerCase().trim();
  const matched = TASK_CATEGORIES.find(
    (c) => c.id.toLowerCase() === normalized || c.nameEn.toLowerCase() === normalized || c.nameAr === normalized
  );

  if (matched) return matched;

  // Custom Category fallback
  return {
    id: normalized,
    nameAr: categoryId,
    nameEn: categoryId,
    icon: '🏷️',
    bgClass: 'bg-teal-500/15 dark:bg-teal-950/30',
    textClass: 'text-teal-700 dark:text-teal-300',
    borderClass: 'border-teal-500/30 dark:border-teal-500/40',
    dotClass: 'bg-teal-500',
    badgeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    activeChipClass: 'bg-teal-600 text-white border-teal-600 shadow-sm',
  };
}
