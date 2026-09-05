import type { AIState, Message } from '@/types';

export interface ChatContext {
  chatId: string;
  history: Message[];
  longTermMemory: string[];
  projectFiles?: { path: string; content: string }[];
}

export interface AIReplyChunk {
  textDelta?: string;
  stickerId?: string;
  done: boolean;
}

/**
 * Единый контракт для любого AI-бэкенда: собственная модель, локальная
 * модель, сторонний API и т.д. UI никогда не обращается к конкретному
 * провайдеру напрямую — только через этот интерфейс, поэтому провайдер
 * можно заменить, не трогая компоненты.
 */
export interface AIProvider {
  /** Обычный запрос-ответ без стриминга. */
  chat(prompt: string, context: ChatContext): Promise<{ text: string; stickerId?: string }>;

  /** Потоковая генерация — колбэк вызывается по мере получения токенов. */
  stream(
    prompt: string,
    context: ChatContext,
    onChunk: (chunk: AIReplyChunk) => void,
    signal?: AbortSignal
  ): Promise<void>;

  /** Генерация/правка кода с учётом языка и (опционально) существующего файла. */
  generateCode(
    instruction: string,
    language: string,
    existingCode?: string
  ): Promise<{ code: string; explanation?: string }>;

  /** Анализ изображения (vision). */
  analyzeImage(imageUrl: string, question?: string): Promise<{ text: string }>;

  /** Эмбеддинг для будущего смыслового поиска по памяти/истории. */
  generateEmbedding(text: string): Promise<number[]>;

  /** Оценка состояния, которое стоит показать на аватаре во время запроса. */
  suggestState(prompt: string): AIState;
}
