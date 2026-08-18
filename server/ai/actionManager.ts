import { CompanionItem, UserProfile, ActionSummary, TaskCategory } from '../../src/types';
import { ToolCallRequest } from './types';

/**
 * Automatically infers and tags an item as 'urgent', 'work', or 'personal' (or domain-specific)
 * based on the title, description, priority, and surrounding context.
 */
export function inferItemCategory(
  title: string,
  description?: string,
  explicitCategory?: string,
  priority?: string,
  dueDate?: string,
  currentDateStr?: string
): TaskCategory {
  if (explicitCategory && explicitCategory.trim()) {
    const rawCat = explicitCategory.trim().toLowerCase();
    if (['urgent', 'work', 'personal', 'health', 'finance', 'education', 'home', 'other'].includes(rawCat)) {
      return rawCat as TaskCategory;
    }
    if (rawCat.includes('عاجل') || rawCat.includes('طارئ') || rawCat.includes('urgent') || rawCat.includes('asap')) return 'urgent';
    if (rawCat.includes('عمل') || rawCat.includes('شغل') || rawCat.includes('work') || rawCat.includes('مكتب') || rawCat.includes('مشروع')) return 'work';
    if (rawCat.includes('شخص') || rawCat.includes('بيت') || rawCat.includes('personal') || rawCat.includes('اهل') || rawCat.includes('حياة')) return 'personal';
    return rawCat as TaskCategory;
  }

  const combined = `${title || ''} ${description || ''}`.toLowerCase();

  // 1. Check Urgent keywords & indicators
  const urgentKeywords = [
    'عاجل', 'طارئ', 'ضروري جدا', 'حالاً', 'فورا', 'فوراً', 'أهمية قصوى', 'مستعجل',
    'ضروري اليوم', 'لا تؤجل', 'أمر طارئ', 'حرج', 'حالا',
    'urgent', 'asap', 'critical', 'immediately', 'emergency', 'right now', 'high priority', 'deadline today'
  ];
  if (
    priority === 'high' && (combined.includes('اليوم') || combined.includes('today') || combined.includes('سريع') || combined.includes('الان') || combined.includes('الآن')) ||
    urgentKeywords.some((kw) => combined.includes(kw))
  ) {
    return 'urgent';
  }

  // 2. Check Work keywords & indicators
  const workKeywords = [
    'عمل', 'شغل', 'وظيفة', 'مشروع', 'مكتب', 'اجتماع', 'عميل', 'زبون', 'تقرير', 'بريد عمل',
    'شركة', 'مدير', 'فريق العمل', 'عرض تقديمي', 'تسليم مشروع', 'مبيعات', 'تسويق', 'فاتورة عمل',
    'دوام', 'مهنة', 'كود', 'برمجة', 'تصميم للعميل', 'مقابلة عمل', 'ميتنج', 'سيرفر',
    'work', 'job', 'project', 'client', 'meeting', 'report', 'presentation', 'office',
    'boss', 'manager', 'company', 'deadline', 'sales', 'marketing', 'code', 'deploy', 'interview'
  ];
  if (workKeywords.some((kw) => combined.includes(kw))) {
    return 'work';
  }

  // 3. Check Personal keywords & indicators (health, family, leisure, home, personal chores)
  const personalKeywords = [
    'شخصي', 'بيت', 'منزل', 'أهل', 'عائلة', 'زوجتي', 'زوجي', 'ولدي', 'بنتي', 'امي', 'أمي', 'ابوي', 'أبي',
    'سوبرماركت', 'بقالة', 'صيدلية', 'دواء', 'جيم', 'نادي', 'رياضة', 'مشي', 'صلاة', 'مسجد', 'قراءة',
    'كتاب', 'راحة', 'نوم', 'حلاقة', 'سيارة', 'غسيل', 'طبخ', 'عشاء', 'غداء', 'فطور', 'تسوق',
    'personal', 'home', 'family', 'mom', 'dad', 'wife', 'husband', 'son', 'daughter', 'grocery',
    'gym', 'workout', 'doctor', 'pharmacy', 'medicine', 'prayer', 'read', 'relax', 'shopping', 'dinner'
  ];
  if (personalKeywords.some((kw) => combined.includes(kw))) {
    return 'personal';
  }

  // If priority is high, tag as urgent
  if (priority === 'high') {
    return 'urgent';
  }

  // Default to personal for everyday companion tasks
  return 'personal';
}

export function validateAndExecuteActions(
  toolCalls: ToolCallRequest[],
  currentItems: CompanionItem[],
  currentDateStr: string
): {
  actions: ActionSummary[];
  createdOrUpdatedItems: CompanionItem[];
  updatedProfile?: Partial<UserProfile>;
} {
  const actions: ActionSummary[] = [];
  const createdOrUpdatedItems: CompanionItem[] = [];
  let updatedProfile: Partial<UserProfile> | undefined;

  const processedKeys = new Set<string>();

  for (const call of toolCalls) {
    const args = call.args || {};
    const key = `${call.name}:${JSON.stringify(args)}`;
    if (processedKeys.has(key)) continue; // Prevent idempotency / duplicate execution
    processedKeys.add(key);

    if (call.name === 'create_item') {
      const title = (args.title || 'Untitled').trim();
      if (!title) continue;

      const rawSubtasks = Array.isArray(args.subtasks) ? args.subtasks : [];
      const parsedSubtasks = rawSubtasks
        .map((st: any, idx: number) => {
          const stTitle = typeof st === 'string' ? st : st?.title || st?.name || '';
          return {
            id: 'st_' + Date.now() + '_' + idx,
            title: String(stTitle).trim(),
            completed: false,
          };
        })
        .filter((st: { title: string }) => st.title.length > 0);

      const rawMilestones = Array.isArray(args.milestones) ? args.milestones : [];
      const parsedMilestones = rawMilestones
        .map((m: any, idx: number) => {
          const mTitle = typeof m === 'string' ? m : m?.title || m?.name || '';
          return {
            id: 'm_' + Date.now() + '_' + idx,
            title: String(mTitle).trim(),
            completed: false,
          };
        })
        .filter((m: { title: string }) => m.title.length > 0);

      const inferredCategory = inferItemCategory(
        title,
        args.description,
        args.category,
        args.priority,
        args.dueDate || args.endDate,
        currentDateStr
      );

      const priorityVal = (args.priority as CompanionItem['priority']) || (inferredCategory === 'urgent' ? 'high' : 'medium');

      const newItem: CompanionItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId: 'user_local',
        type: (args.type as CompanionItem['type']) || 'task',
        title,
        description: args.description || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: args.dueDate || args.endDate || currentDateStr,
        dueTime: args.dueTime || undefined,
        location: args.location || undefined,
        person: args.person || undefined,
        priority: priorityVal,
        repeatRule: (args.repeatRule as CompanionItem['repeatRule']) || 'none',
        category: inferredCategory,
        subtasks: parsedSubtasks.length > 0 ? parsedSubtasks : undefined,
        progressPercent: args.targetValue && args.targetValue > 0 ? 0 : 0,
        // Long notes & Goal fields
        startDate: args.startDate || currentDateStr,
        endDate: args.endDate || args.dueDate || undefined,
        targetGoal: args.targetGoal || args.description || undefined,
        targetMetric: args.targetMetric || undefined,
        targetValue: typeof args.targetValue === 'number' ? args.targetValue : undefined,
        currentValue: 0,
        milestones: parsedMilestones.length > 0 ? parsedMilestones : undefined,
        imageUrl: args.imageUrl || undefined,
        isLongNote: args.isLongNote || args.type === 'note' || undefined,
      };

      createdOrUpdatedItems.push(newItem);
      actions.push({
        type: 'created',
        itemType: newItem.type,
        title: newItem.title,
        details: newItem.dueTime ? `${newItem.dueDate || ''} ${newItem.dueTime}` : newItem.dueDate,
        itemId: newItem.id,
      });
    } else if (call.name === 'update_item_status') {
      const titleQuery = (args.itemSearchTitle || '').trim().toLowerCase();
      const targetStatus = args.status as CompanionItem['status'];
      if (!titleQuery) continue;

      const matched = currentItems.find((i) => i.title.toLowerCase().includes(titleQuery));
      if (matched) {
        const updated = {
          ...matched,
          status: targetStatus,
          updatedAt: new Date().toISOString(),
          completedAt: targetStatus === 'completed' ? new Date().toISOString() : matched.completedAt,
        };
        createdOrUpdatedItems.push(updated);
        actions.push({
          type: 'completed',
          itemType: matched.type,
          title: matched.title,
          details: `Status set to ${targetStatus}`,
          itemId: matched.id,
        });
      }
    } else if (call.name === 'reschedule_item') {
      const titleQuery = (args.itemSearchTitle || '').trim().toLowerCase();
      if (!titleQuery) continue;

      const matched = currentItems.find((i) => i.title.toLowerCase().includes(titleQuery));
      if (matched) {
        const updated = {
          ...matched,
          dueDate: args.newDueDate || matched.dueDate,
          dueTime: args.newDueTime || matched.dueTime,
          status: 'rescheduled' as const,
          updatedAt: new Date().toISOString(),
        };
        createdOrUpdatedItems.push(updated);
        actions.push({
          type: 'updated',
          itemType: matched.type,
          title: matched.title,
          details: `Rescheduled to ${args.newDueDate || ''} ${args.newDueTime || ''}`,
          itemId: matched.id,
        });
      }
    } else if (call.name === 'save_personal_memory') {
      const fact = (args.fact || '').trim();
      if (!fact) continue;

      const memoryItem: CompanionItem = {
        id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId: 'user_local',
        type: 'memory',
        title: fact,
        category: args.category || 'general',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdOrUpdatedItems.push(memoryItem);
      actions.push({
        type: 'remembered',
        itemType: 'memory',
        title: fact,
        itemId: memoryItem.id,
      });
    } else if (call.name === 'update_user_profile_preference') {
      updatedProfile = updatedProfile || {};
      if (args.addressAs) updatedProfile.addressAs = args.addressAs;
      if (args.personality) updatedProfile.personality = args.personality;
      if (typeof args.useEmojis === 'boolean') updatedProfile.useEmojis = args.useEmojis;

      actions.push({
        type: 'updated',
        itemType: 'note',
        title: 'تخصيص الرفيق',
        details: 'تم تحديث التفضيلات الشخصية',
      });
    }
  }

  return { actions, createdOrUpdatedItems, updatedProfile };
}
