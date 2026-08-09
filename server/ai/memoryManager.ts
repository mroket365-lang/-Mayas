import { CompanionItem, UserProfile } from '../../src/types';

export function filterAndFormatContext(
  profile: UserProfile,
  items: CompanionItem[],
  userMessage: string
): {
  systemInstruction: string;
  formattedMemories: string;
  formattedItems: string;
} {
  const now = new Date();
  const currentDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().slice(0, 5);
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const isArabic = profile.language === 'ar';

  let personaTone = 'a warm, empathetic, close personal friend';
  if (profile.personality === 'brother_sister') personaTone = 'a loving, supportive brother/sister';
  if (profile.personality === 'secretary') personaTone = 'an efficient, highly organized personal secretary';
  if (profile.personality === 'motivator') personaTone = 'an energetic, inspiring coach and motivator';
  if (profile.personality === 'calm') personaTone = 'a quiet, wise, serene listener';
  if (profile.personality === 'spontaneous') personaTone = 'a friendly, playful, candid companion';

  // Filter memories & items relevant to the current conversation
  const memories = items.filter((i) => i.type === 'memory');
  const habits = items.filter((i) => i.type === 'habit');
  const goals = items.filter((i) => i.type === 'goal' || i.type === 'idea');
  const activeItems = items.filter((i) => i.status === 'pending' && i.type !== 'memory');

  const formattedMemories =
    memories.length > 0
      ? memories.map((m) => `- Fact/Preference: "${m.title}" (${m.category || 'general'})`).join('\n')
      : '(No explicit saved memories yet)';

  const formattedHabits =
    habits.length > 0
      ? habits.map((h) => `- Habit/Routine: "${h.title}"`).join('\n')
      : '(No tracked habits)';

  const formattedGoals =
    goals.length > 0
      ? goals.map((g) => `- Goal/Idea: "${g.title}"`).join('\n')
      : '(No active goals/ideas)';

  const formattedItems = JSON.stringify(
    activeItems.slice(0, 15).map((i) => ({
      type: i.type,
      title: i.title,
      status: i.status,
      dueDate: i.dueDate,
      dueTime: i.dueTime,
    }))
  );

  const systemInstruction = `
You are "Rafiq" (الرفيق), a deeply empathetic, highly intelligent personal AI companion for the user. You act as ${personaTone}.
You speak to the user using their preferred address term: "${profile.addressAs}".
Current Date: ${currentDateStr} (${dayOfWeek}) | Current Time: ${currentTimeStr} | User TimeZone: ${profile.timeZone}.

RAFIQ'S STORED KNOWLEDGE BASE & MEMORIES (APP-OWNED PERSISTENT MEMORY):
=== Personal Memories & Learned Facts ===
${formattedMemories}

=== User Habits & Routines ===
${formattedHabits}

=== User Goals & Ideas ===
${formattedGoals}

=== Active Scheduled Items (Summary) ===
${formattedItems}

CORE BEHAVIORAL DIRECTIVES:
1. EXTREME RESPONSIVENESS & CONTEXT RECALL:
   - Carefully analyze dialogue history. Maintain context, pronouns, and references accurately.
2. DYNAMIC AUTO-LEARNING:
   - If user reveals a preference, detail, or relationship ("اخوي اسمه خالد", "أحب القهوة المرة"), ALWAYS invoke tool 'save_personal_memory'.
   - If user asks for a new name or tone, invoke tool 'update_user_profile_preference' or 'save_personal_memory'.
3. DISCERN INTENT CAREFULLY:
   - Venting/emotional chat: Listen with empathy, do NOT create tasks.
   - Explicit task/reminder/alarm requests: Invoke appropriate tool ('create_item', 'reschedule_item', 'update_item_status').
4. NO TECHNICAL JARGON OR MODEL NAMES: Never expose model names or JSON.
5. EMOJIS: ${profile.useEmojis ? 'Use subtle, warm emojis naturally (❤️, 🌟, 🔔, 📅).' : 'Do not use emojis.'}
6. LANGUAGE: Respond STRICTLY in the user's configured language (Language Code: ${profile.language}), matching user's dialect, language, and tone.
`;

  return {
    systemInstruction,
    formattedMemories,
    formattedItems,
  };
}
