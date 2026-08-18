import { ChatMessage } from '../types';

/**
 * Sanitizes and deduplicates chat messages:
 * 1. Filters out empty messages unless it's an active streaming AI placeholder.
 * 2. Deduplicates messages matching by exact ID or matching by identical sender + text content within 3 minutes.
 * 3. Keeps stable message IDs and merges rich metadata (media, actions).
 * 4. Sorts messages chronologically by timestamp.
 */
export function sanitizeAndDeduplicateMessages(
  messages: ChatMessage[],
  isStreaming: boolean = false
): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  const result: ChatMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object' || !msg.sender) continue;

    const isLastMessage = i === messages.length - 1;
    const textTrimmed = (msg.text || '').trim();

    // 1. Remove empty messages unless it's the active streaming placeholder
    if (!textTrimmed) {
      if (isLastMessage && isStreaming && msg.sender === 'ai') {
        // Keep active streaming placeholder
      } else {
        continue; // Skip empty message
      }
    }

    const msgTime = new Date(msg.timestamp || Date.now()).getTime();

    // 2. Check if already present in result
    const existingIndex = result.findIndex((existing) => {
      // Direct ID match
      if (existing.id && msg.id && existing.id === msg.id) return true;

      // Semantic match: same sender, same text, within 3 minutes (180,000 ms)
      if (
        existing.sender === msg.sender &&
        (existing.text || '').trim() === textTrimmed &&
        textTrimmed.length > 0
      ) {
        const existingTime = new Date(existing.timestamp || Date.now()).getTime();
        const diffMs = Math.abs(msgTime - existingTime);
        if (isNaN(diffMs) || diffMs <= 180000) return true; // 3 minutes window
      }

      return false;
    });

    if (existingIndex === -1) {
      result.push({ ...msg, text: msg.text || '' });
    } else {
      // Merge properties if newer item has richer fields
      const existing = result[existingIndex];
      const merged: ChatMessage = {
        ...existing,
        ...msg,
        // Keep ID of existing if present to keep stable React keys
        id: existing.id || msg.id,
        // Prefer longer text if one was cut off
        text: textTrimmed.length >= (existing.text || '').trim().length ? msg.text : existing.text,
        mediaUrl: msg.mediaUrl || existing.mediaUrl,
        mediaType: msg.mediaType || existing.mediaType,
        mediaName: msg.mediaName || existing.mediaName,
        actionsTaken:
          msg.actionsTaken && msg.actionsTaken.length > 0 ? msg.actionsTaken : existing.actionsTaken,
      };
      result[existingIndex] = merged;
    }
  }

  // Sort chronologically
  return result.sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return timeA - timeB;
  });
}
