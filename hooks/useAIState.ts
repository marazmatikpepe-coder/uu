'use client';

import { useCallback, useRef, useState } from 'react';
import type { AIState } from '@/types';

/**
 * Центральный state manager состояния AI. Любой компонент, которому
 * нужно менять "настроение"/статус аватара, использует этот хук.
 * setState с временным состоянием (например 'success' на 1.5с) потом
 * сам возвращает состояние к 'idle'.
 */
export function useAIState(initial: AIState = 'idle') {
  const [state, setState] = useState<AIState>(initial);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setTemporary = useCallback((next: AIState, ms = 1500, fallback: AIState = 'idle') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState(next);
    timeoutRef.current = setTimeout(() => setState(fallback), ms);
  }, []);

  const set = useCallback((next: AIState) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState(next);
  }, []);

  return { state, setState: set, setTemporary };
}
