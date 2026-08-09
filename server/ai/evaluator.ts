import { ProviderResponse } from './types';
import { UserProfile } from '../../src/types';

export function synthesizeResponses(
  responses: ProviderResponse[],
  profile: UserProfile
): string {
  if (responses.length === 0) {
    return profile.language === 'ar'
      ? 'أنا معك يا غالي. تفضل كلي آذان صاغية.'
      : 'I am right here with you. How can I support you?';
  }

  if (responses.length === 1) {
    return cleanResponseText(responses[0].text, profile);
  }

  // Filter out empty responses
  const validResponses = responses.map((r) => cleanResponseText(r.text, profile)).filter((t) => t.length > 0);

  if (validResponses.length === 0) {
    return profile.language === 'ar'
      ? 'سجلت ملاحظتك يا غالي. كيف أقدر أساعدك أكثر؟'
      : 'Got your message! How else can I assist you?';
  }

  if (validResponses.length === 1) {
    return validResponses[0];
  }

  // Multi-model synthesis: Combine the core insights into a single unified advice
  const primary = validResponses[0];
  const secondary = validResponses[1];

  // If primary answer is already detailed and comprehensive, return it directly
  if (primary.length > 250) {
    return primary;
  }

  // Combine unique key points
  return `${primary}\n\n${secondary}`;
}

function cleanResponseText(text: string, profile: UserProfile): string {
  if (!text) return '';

  // Remove any leaked json code blocks or raw system instructions if any
  let cleaned = text
    .replace(/```json[\s\S]*?```/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .replace(/Gemini|ChatGPT|OpenAI|GPT-4|GPT-3\.5/gi, 'Rafiq')
    .trim();

  return cleaned;
}
