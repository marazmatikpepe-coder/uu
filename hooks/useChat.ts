'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message, MessageAttachment } from '@/types';
import {
  addMessage,
  deleteMessage,
  getLongTermMemory,
  subscribeToMessages,
  updateMessage,
} from '@/lib/firebase/firestore';
import { aiProvider } from '@/lib/ai';
import { selectRelevantHistory } from '@/lib/ai/contextSelector';
import type { AIState } from '@/types';

interface UseChatOptions {
  uid: string | null;
  chatId: string | null;
  onAIState?: (state: AIState) => void;
}

export function useChat({ uid, chatId, onAIState }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!uid || !chatId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToMessages(uid, chatId, setMessages);
    return unsub;
  }, [uid, chatId]);

  const sendText = useCallback(
    async (text: string, attachments?: MessageAttachment[]) => {
      if (!uid || !chatId || !text.trim()) return;

      await addMessage(uid, chatId, {
        role: 'user',
        type: attachments && attachments.length > 0 ? 'file' : 'text',
        content: text,
        attachments,
      });

      const memory = await getLongTermMemory(uid);
      const relevantHistory = selectRelevantHistory(messages);

      const suggested = aiProvider.suggestState(text);
      onAIState?.(suggested);
      setIsGenerating(true);

      const assistantMsgId = await addMessage(uid, chatId, {
        role: 'assistant',
        type: 'text',
        content: '',
        pending: true,
      });

      const controller = new AbortController();
      abortRef.current = controller;
      let accumulated = '';
      let stickerId: string | undefined;

      try {
        await aiProvider.stream(
          text,
          { chatId, history: relevantHistory, longTermMemory: memory },
          (chunk) => {
            if (chunk.textDelta) accumulated += chunk.textDelta;
            if (chunk.stickerId) stickerId = chunk.stickerId;
            if (chunk.done) {
              onAIState?.('success');
              setTimeout(() => onAIState?.('idle'), 1200);
            } else {
              onAIState?.('speaking');
            }
          },
          controller.signal
        );

        await updateMessage(uid, chatId, assistantMsgId, accumulated);
        if (stickerId) {
          await addMessage(uid, chatId, { role: 'assistant', type: 'sticker', content: '', stickerId });
        }
      } catch (err) {
        onAIState?.('error');
        await updateMessage(uid, chatId, assistantMsgId, 'Произошла ошибка при генерации ответа.');
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [uid, chatId, messages, onAIState]
  );

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
    onAIState?.('cancelled');
    setTimeout(() => onAIState?.('idle'), 1000);
  }, [onAIState]);

  const sendSticker = useCallback(
    async (stickerId: string) => {
      if (!uid || !chatId) return;
      await addMessage(uid, chatId, { role: 'user', type: 'sticker', content: '', stickerId });
    },
    [uid, chatId]
  );

  const editUserMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!uid || !chatId) return;
      await updateMessage(uid, chatId, messageId, newContent);
    },
    [uid, chatId]
  );

  const regenerate = useCallback(
    async (userMessageContent: string) => {
      await sendText(userMessageContent);
    },
    [sendText]
  );

  const removeMessage = useCallback(
    async (messageId: string) => {
      if (!uid || !chatId) return;
      await deleteMessage(uid, chatId, messageId);
    },
    [uid, chatId]
  );

  return {
    messages,
    isGenerating,
    sendText,
    sendSticker,
    editUserMessage,
    regenerate,
    cancelGeneration,
    removeMessage,
  };
}
