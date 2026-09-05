import type { AIProvider, ChatContext, AIReplyChunk } from './types';
import type { AIState } from '@/types';

/**
 * Рабочий локальный провайдер "из коробки" — не требует ни одного
 * внешнего API-ключа. Генерирует осмысленные ответы через простые
 * правила + эхо контекста, стримит их по словам (чтобы UI для
 * стриминга был реально протестирован), и умеет "видеть" изображения
 * на базовом уровне (по имени файла/URL).
 *
 * Когда подключишь реальную модель — реализуй этот же интерфейс
 * (см. lib/ai/types.ts) в новом файле, например lib/ai/httpProvider.ts,
 * который будет ходить в твой собственный backend-эндпоинт
 * (Cloud Function / серверless), и просто замени провайдера в
 * lib/ai/index.ts. Реальный API-ключ модели туда прописывать нельзя —
 * он должен жить только на сервере.
 */
export class MockAIProvider implements AIProvider {
  suggestState(prompt: string): AIState {
    const p = prompt.toLowerCase();
    if (/код|function|bug|ошибк|напиши.*(html|css|js|python|react)/.test(p)) return 'working';
    if (/найди|поищи|search|последние новости/.test(p)) return 'searching';
    if (/спасибо|отлично|получилось|ура/.test(p)) return 'happy';
    if (/не работает|ошибка|упал|сломал/.test(p)) return 'confused';
    return 'thinking';
  }

  private buildReply(prompt: string, context: ChatContext): { text: string; stickerId?: string } {
    const trimmed = prompt.trim();
    const memoryHint =
      context.longTermMemory.length > 0
        ? `\n\n_Учитываю, что ты говорил ранее: ${context.longTermMemory.slice(-2).join('; ')}_`
        : '';

    if (/```|напиши код|function|компонент/i.test(trimmed)) {
      return {
        text:
          `Вот пример структуры для твоего запроса «${trimmed}»:\n\n` +
          '```ts\n' +
          `function example(input: string): string {\n  return input.trim();\n}\n` +
          '```\n\n' +
          'Скажи, на каком языке нужен реальный код — сгенерирую полностью рабочий вариант.' +
          memoryHint,
      };
    }

    if (/привет|здравств/i.test(trimmed)) {
      return { text: 'Привет! Чем займёмся сегодня?' + memoryHint, stickerId: undefined };
    }

    if (/спасибо/i.test(trimmed)) {
      return { text: 'Рад помочь! 🙂' + memoryHint };
    }

    return {
      text:
        `Понял: «${trimmed}». Пока я работаю на локальном демо-провайдере без ` +
        `подключения к реальной языковой модели — подключи свой backend в ` +
        `lib/ai/index.ts, чтобы получать полноценные ответы. Архитектура ` +
        `(история, стриминг, состояния, стикеры) уже полностью рабочая.` +
        memoryHint,
    };
  }

  async chat(prompt: string, context: ChatContext) {
    await delay(400);
    return this.buildReply(prompt, context);
  }

  async stream(
    prompt: string,
    context: ChatContext,
    onChunk: (chunk: AIReplyChunk) => void,
    signal?: AbortSignal
  ) {
    const { text, stickerId } = this.buildReply(prompt, context);
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) return;
      await delay(28);
      onChunk({ textDelta: (i === 0 ? '' : ' ') + words[i], done: false });
    }
    if (stickerId && !signal?.aborted) {
      onChunk({ stickerId, done: false });
    }
    onChunk({ done: true });
  }

  async generateCode(instruction: string, language: string, existingCode?: string) {
    await delay(500);
    const base = existingCode ? `${existingCode}\n\n// --- изменения ---\n` : '';
    return {
      code: `${base}// ${language}: ${instruction}\n// TODO: подключи реальную модель для полной генерации`,
      explanation: `Заглушка для языка ${language}. Подключи реальный AI backend для рабочей генерации.`,
    };
  }

  async analyzeImage(imageUrl: string, question?: string) {
    await delay(500);
    return {
      text:
        `Изображение получено (${imageUrl.slice(0, 60)}...). ` +
        `${question ? `Твой вопрос: «${question}». ` : ''}` +
        `Для реального анализа контента подключи vision-модель через AIProvider.analyzeImage.`,
    };
  }

  async generateEmbedding(text: string) {
    // Простейший детерминированный "эмбеддинг" на основе хэша символов —
    // только чтобы механизм выборки релевантного контекста был рабочим
    // архитектурно. Замени на реальные эмбеддинги при подключении модели.
    const vec = new Array(16).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % 16] += text.charCodeAt(i);
    }
    const max = Math.max(...vec, 1);
    return vec.map((v) => v / max);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
