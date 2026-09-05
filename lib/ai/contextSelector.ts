import type { Message } from '@/types';

const MAX_RECENT_MESSAGES = 12;
const MAX_TOTAL_CHARS = 4000;

/**
 * Механизм выборки релевантного контекста (short-term memory).
 * Вместо отправки всей истории чата модели на каждый запрос:
 *  1. Берём последние N сообщений (недавний контекст — обычно самый релевантный).
 *  2. Обрезаем по общему бюджету символов, чтобы не раздувать запрос.
 *
 * Это простая, но реально рабочая реализация. При подключении реальной
 * модели с эмбеддингами её легко расширить: посчитать эмбеддинг текущего
 * промпта, отранжировать все прошлые сообщения по косинусной близости и
 * подмешать top-K, а не только "последние по времени".
 */
export function selectRelevantHistory(history: Message[]): Message[] {
  const recent = history.slice(-MAX_RECENT_MESSAGES);
  let budget = MAX_TOTAL_CHARS;
  const result: Message[] = [];

  for (let i = recent.length - 1; i >= 0; i--) {
    const msg = recent[i];
    const len = msg.content?.length ?? 0;
    if (budget - len < 0 && result.length > 0) break;
    budget -= len;
    result.unshift(msg);
  }

  return result;
}
