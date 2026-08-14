import { CompanionItem, UserProfile, ActionSummary } from '../../src/types';
import { ToolCallRequest } from './types';

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

      const newItem: CompanionItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId: 'user_local',
        type: (args.type as CompanionItem['type']) || 'task',
        title,
        description: args.description || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: args.dueDate || currentDateStr,
        dueTime: args.dueTime || undefined,
        location: args.location || undefined,
        person: args.person || undefined,
        priority: (args.priority as CompanionItem['priority']) || 'medium',
        repeatRule: (args.repeatRule as CompanionItem['repeatRule']) || 'none',
        subtasks: parsedSubtasks.length > 0 ? parsedSubtasks : undefined,
        progressPercent: 0,
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
