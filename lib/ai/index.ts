import { MockAIProvider } from './mockProvider';
import type { AIProvider } from './types';

// Единая точка подключения AI-бэкенда. Когда появится реальный backend
// (Cloud Function / API route со своим ключом на сервере), создай
// httpProvider.ts, реализующий AIProvider, и подставь его сюда —
// остальной код приложения не изменится.
export const aiProvider: AIProvider = new MockAIProvider();

export * from './types';
