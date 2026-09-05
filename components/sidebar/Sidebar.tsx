'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { Chat } from '@/types';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/ui/Icon';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, title: string) => void;
  onDeleteChat: (id: string) => void;
  onArchiveChat: (id: string, archived: boolean) => void;
  onFavoriteChat: (id: string, favorite: boolean) => void;
  onOpenSettings: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userEmail?: string | null;
}

type Tab = 'chats' | 'favorites' | 'archive';

export function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onArchiveChat,
  onFavoriteChat,
  onOpenSettings,
  mobileOpen,
  onCloseMobile,
  userEmail,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>('chats');
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const filtered = useMemo(() => {
    let list = chats;
    if (tab === 'favorites') list = list.filter((c) => c.favorite);
    else if (tab === 'archive') list = list.filter((c) => c.archived);
    else list = list.filter((c) => !c.archived);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.lastMessagePreview?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [chats, tab, search]);

  const content = (
    <div className="flex flex-col h-full w-[280px] bg-panel border-r border-border">
      <div className="p-3 flex items-center gap-2 border-b border-border">
        <button
          onClick={onNewChat}
          className="flex-1 flex items-center gap-2 justify-center rounded-xl bg-accent/15 hover:bg-accent/25 text-sm py-2.5 transition-colors"
        >
          <Icon name="newChat" size={16} />
          Новый чат
        </button>
        <IconButton icon="close" label="Закрыть меню" onClick={onCloseMobile} className="md:hidden" />
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-3 py-2">
          <Icon name="search" size={14} className="opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по чатам..."
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex px-3 gap-1 pb-2">
        <TabButton icon="history" label="Чаты" active={tab === 'chats'} onClick={() => setTab('chats')} />
        <TabButton icon="favorite" label="Избранное" active={tab === 'favorites'} onClick={() => setTab('favorites')} />
        <TabButton icon="archive" label="Архив" active={tab === 'archive'} onClick={() => setTab('archive')} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-xs text-white/30 text-center py-8">Пока пусто</div>
        ) : (
          filtered.map((chat) => (
            <div
              key={chat.id}
              className={clsx(
                'group relative rounded-xl px-3 py-2.5 cursor-pointer transition-colors',
                activeChatId === chat.id ? 'bg-accent/15' : 'hover:bg-white/[0.04]'
              )}
              onClick={() => onSelectChat(chat.id)}
            >
              {renamingId === chat.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRenameChat(chat.id, renameValue);
                      setRenamingId(null);
                    }
                  }}
                  onBlur={() => setRenamingId(null)}
                  className="w-full bg-black/20 rounded px-2 py-1 text-sm outline-none"
                />
              ) : (
                <>
                  <div className="text-sm truncate pr-14">{chat.title}</div>
                  <div className="text-xs text-white/35 truncate pr-14">{chat.lastMessagePreview}</div>
                </>
              )}

              <div className="absolute right-2 top-1.5 hidden group-hover:flex gap-0.5">
                <IconButton
                  icon="edit"
                  label="Переименовать"
                  size={13}
                  onClick={(e: any) => {
                    e?.stopPropagation?.();
                    setRenamingId(chat.id);
                    setRenameValue(chat.title);
                  }}
                />
                <IconButton
                  icon="favorite"
                  label="В избранное"
                  size={13}
                  active={chat.favorite}
                  onClick={(e: any) => {
                    e?.stopPropagation?.();
                    onFavoriteChat(chat.id, !chat.favorite);
                  }}
                />
                <IconButton
                  icon="archive"
                  label="Архивировать"
                  size={13}
                  onClick={(e: any) => {
                    e?.stopPropagation?.();
                    onArchiveChat(chat.id, !chat.archived);
                  }}
                />
                <IconButton
                  icon="trash"
                  label="Удалить"
                  size={13}
                  onClick={(e: any) => {
                    e?.stopPropagation?.();
                    onDeleteChat(chat.id);
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-white/40 truncate max-w-[160px]">{userEmail}</span>
        <IconButton icon="settings" label="Настройки" onClick={onOpenSettings} />
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{content}</div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed inset-y-0 left-0 z-40 md:hidden"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onCloseMobile} />
      )}
    </>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-colors',
        active ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'
      )}
    >
      <Icon name={icon} size={13} />
      {label}
    </button>
  );
}
