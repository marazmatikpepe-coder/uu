'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Message, AIState } from '@/types';
import { MessageBubble } from './MessageBubble';
import { AIAvatar } from '@/components/avatar/AIAvatar';

interface ChatWindowProps {
  messages: Message[];
  aiState: AIState;
  onEdit: (id: string, content: string) => void;
  onRegenerate: (content: string) => void;
  onDelete: (id: string) => void;
}

export function ChatWindow({ messages, aiState, onEdit, onRegenerate, onDelete }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
          <AIAvatar state={aiState} size={140} />
          <div>
            <h2 className="text-lg font-medium text-white/80">Привет! Я твой AI-ассистент</h2>
            <p className="text-sm text-white/40 mt-1">Напиши что-нибудь, прикрепи файл или включи голосовой режим</p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onEdit={msg.role === 'user' ? onEdit : undefined}
                onRegenerate={msg.role === 'user' ? onRegenerate : undefined}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
