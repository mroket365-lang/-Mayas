import { CompanionItem } from '../types';

/**
 * Returns YYYY-MM-DD date string in local timezone
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD date string to local Date object
 */
export function parseLocalDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format date for display in Arabic / English
 */
export function formatDayLabel(dateStr: string, lang: string = 'ar'): { dayName: string; dayNum: number; fullDate: string } {
  const date = parseLocalDateStr(dateStr);
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  const dayName = date.toLocaleDateString(locale, { weekday: 'narrow' });
  const dayNum = date.getDate();
  const fullDate = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return { dayName, dayNum, fullDate };
}

export interface DayStreakStatus {
  dateStr: string;
  dayName: string;
  dayNum: number;
  fullDate: string;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface HabitStreakResult {
  currentStreak: number;
  bestStreak: number;
  isCompletedToday: boolean;
  weekHistory: DayStreakStatus[];
  totalCompletions: number;
}

/**
 * Calculates current streak, best streak, and week history for a habit item
 */
export function calculateHabitStreak(
  completedDates: string[] = [],
  todayStr: string = getLocalDateStr(),
  lang: string = 'ar'
): HabitStreakResult {
  const uniqueDates = Array.from(new Set(completedDates)).filter(Boolean).sort();
  const dateSet = new Set(uniqueDates);

  const isCompletedToday = dateSet.has(todayStr);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  const todayDate = parseLocalDateStr(todayStr);

  if (isCompletedToday) {
    currentStreak = 1;
    let curr = new Date(todayDate);
    while (true) {
      curr.setDate(curr.getDate() - 1);
      const prevStr = getLocalDateStr(curr);
      if (dateSet.has(prevStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    // Check if yesterday was completed
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    if (dateSet.has(yesterdayStr)) {
      currentStreak = 1;
      let curr = new Date(yesterday);
      while (true) {
        curr.setDate(curr.getDate() - 1);
        const prevStr = getLocalDateStr(curr);
        if (dateSet.has(prevStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  // 2. Calculate Best Streak across all history
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dStr of uniqueDates) {
    const d = parseLocalDateStr(dStr);
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffTime = d.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    lastDate = d;
  }

  bestStreak = Math.max(bestStreak, currentStreak);

  // 3. Generate Week History (Last 7 days ending today)
  const weekHistory: DayStreakStatus[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    const { dayName, dayNum, fullDate } = formatDayLabel(dateStr, lang);
    const isToday = dateStr === todayStr;

    weekHistory.push({
      dateStr,
      dayName,
      dayNum,
      fullDate,
      completed: dateSet.has(dateStr),
      isToday,
      isFuture: d > todayDate,
    });
  }

  return {
    currentStreak,
    bestStreak,
    isCompletedToday,
    weekHistory,
    totalCompletions: uniqueDates.length,
  };
}

/**
 * Toggles habit completion state for a target date
 */
export function toggleHabitCompletion(
  item: CompanionItem,
  targetDateStr: string = getLocalDateStr()
): CompanionItem {
  const currentDates = item.completedDates || [];
  const exists = currentDates.includes(targetDateStr);

  let newCompletedDates: string[];
  if (exists) {
    newCompletedDates = currentDates.filter((d) => d !== targetDateStr);
  } else {
    newCompletedDates = [...currentDates, targetDateStr];
  }

  const todayStr = getLocalDateStr();
  const { currentStreak, bestStreak, isCompletedToday } = calculateHabitStreak(newCompletedDates, todayStr);

  return {
    ...item,
    completedDates: newCompletedDates,
    streak: currentStreak,
    bestStreak: Math.max(bestStreak, item.bestStreak || 0),
    status: isCompletedToday ? 'completed' : 'pending',
    completedAt: isCompletedToday ? new Date().toISOString() : item.completedAt,
    updatedAt: new Date().toISOString(),
  };
}
