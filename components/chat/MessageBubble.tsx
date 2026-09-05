'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import type { Message } from '@/types';
import { CodeBlock } from './CodeBlock';
import { IconButton } from '@/components/ui/IconButton';
import { getStickerById } from '@/lib/stickers/library';

interface MessageBubbleProps {
  message: Message;
  onEdit?: (id: string, content: string) => void;
  onRegenerate?: (content: string) => void;
  onDelete?: (id: string) => void;
}

export function MessageBubble({ message, onEdit, onRegenerate, onDelete }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (message.type === 'sticker' && message.stickerId) {
    const sticker = getStickerById(message.stickerId);
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx('flex mb-3', isUser ? 'justify-end' : 'justify-start')}
      >
        {sticker ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sticker.url} alt={sticker.name} width={96} height={96} className="select-none" draggable={false} />
        ) : (
          <div className="text-xs text-white/40">стикер недоступен</div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('group flex mb-3', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={clsx(
          'max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 relative',
          isUser
            ? 'bg-gradient-to-br from-accent/90 to-accent2/70 text-white rounded-br-md'
            : 'bg-panel2/80 backdrop-blur border border-border text-white/90 rounded-bl-md'
        )}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.attachments.map((att) =>
              att.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={att.id}
                  src={att.url}
                  alt={att.name}
                  className="max-h-48 rounded-xl border border-white/10"
                />
              ) : (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm bg-black/20 rounded-lg px-3 py-2 hover:bg-black/30"
                >
                  📎 {att.name}
                </a>
              )
            )}
          </div>
        )}

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full bg-black/20 rounded-lg p-2 text-sm outline-none resize-y min-h-[60px]"
            />
            <div className="flex gap-2 justify-end text-xs">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 rounded-lg hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  onEdit?.(message.id, draft);
                  setEditing(false);
                }}
                className="px-3 py-1 rounded-lg bg-accent hover:bg-accent/80"
              >
                Сохранить
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isBlock = Boolean(match);
                  if (isBlock) {
                    return <CodeBlock code={String(children).trim()} language={match![1]} />;
                  }
                  return (
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-[0.85em]" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content || (message.pending ? '…' : '')}
            </ReactMarkdown>
            {message.edited && <span className="text-[10px] text-white/40 ml-1">(изменено)</span>}
          </div>
        )}

        {!editing && (
          <div
            className={clsx(
              'absolute -bottom-7 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
              isUser ? 'right-0' : 'left-0'
            )}
          >
            <IconButton icon="copy" label={copied ? 'Скопировано' : 'Копировать'} size={13} onClick={handleCopy} />
            {isUser && onEdit && (
              <IconButton icon="edit" label="Редактировать" size={13} onClick={() => setEditing(true)} />
            )}
            {isUser && onRegenerate && (
              <IconButton
                icon="regenerate"
                label="Повторить генерацию"
                size={13}
                onClick={() => onRegenerate(message.content)}
              />
            )}
            {onDelete && <IconButton icon="trash" label="Удалить" size={13} onClick={() => onDelete(message.id)} />}
          </div>
        )}
      </div>
    </motion.div>
  );
}
