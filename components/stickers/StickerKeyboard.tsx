'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { STICKER_LIBRARY, searchStickers, getStickerById } from '@/lib/stickers/library';
import { getRecentStickerIds, pushRecentSticker } from '@/lib/stickers/recent';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/ui/Icon';
import type { StickerItem } from '@/types';

interface StickerKeyboardProps {
  open: boolean;
  onClose: () => void;
  onSelect: (stickerId: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (stickerId: string) => void;
}

function LazySticker({
  sticker,
  onClick,
  isFavorite,
  onToggleFavorite,
}: {
  sticker: StickerItem;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title={sticker.name}
      className="relative group aspect-square rounded-xl bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center p-2 transition-colors"
    >
      {visible ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sticker.url} alt={sticker.name} className="w-full h-full object-contain select-none" draggable={false} loading="lazy" />
      ) : (
        <div className="w-full h-full rounded-lg bg-white/5 animate-pulse" />
      )}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={clsx(
          'absolute top-1 right-1 text-[10px] rounded-full px-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isFavorite && 'opacity-100'
        )}
      >
        <Icon name="favorite" size={12} className={isFavorite ? 'opacity-100' : 'opacity-50'} />
      </span>
    </button>
  );
}

export function StickerKeyboard({ open, onClose, onSelect, favoriteIds, onToggleFavorite }: StickerKeyboardProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'recent' | 'favorites' | string>(
    STICKER_LIBRARY[0]?.name ?? 'recent'
  );
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) setRecentIds(getRecentStickerIds());
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const searchResults = useMemo(() => searchStickers(debouncedQuery), [debouncedQuery]);

  const handleSelect = (id: string) => {
    pushRecentSticker(id);
    onSelect(id);
  };

  const activeStickers: StickerItem[] = useMemo(() => {
    if (debouncedQuery.trim()) return searchResults;
    if (activeCategory === 'recent') {
      return recentIds.map((id) => getStickerById(id)).filter(Boolean) as StickerItem[];
    }
    if (activeCategory === 'favorites') {
      return favoriteIds.map((id) => getStickerById(id)).filter(Boolean) as StickerItem[];
    }
    return STICKER_LIBRARY.find((c) => c.name === activeCategory)?.stickers ?? [];
  }, [debouncedQuery, searchResults, activeCategory, recentIds, favoriteIds]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full mb-2 left-0 right-0 md:left-auto md:right-0 md:w-[380px] h-[420px] max-h-[70vh] rounded-2xl border border-border bg-panel/95 backdrop-blur-xl shadow-soft flex flex-col overflow-hidden z-30"
        >
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <Icon name="search" size={16} className="opacity-50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск стикеров..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30"
            />
            <IconButton icon="close" label="Закрыть" size={14} onClick={onClose} />
          </div>

          {!debouncedQuery && (
            <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-border scrollbar-none">
              <CategoryTab label="Недавние" active={activeCategory === 'recent'} onClick={() => setActiveCategory('recent')} />
              <CategoryTab label="Избранные" active={activeCategory === 'favorites'} onClick={() => setActiveCategory('favorites')} />
              {STICKER_LIBRARY.map((cat) => (
                <CategoryTab
                  key={cat.name}
                  label={cat.name}
                  active={activeCategory === cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                />
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3">
            {activeStickers.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-white/30 text-center px-6">
                {debouncedQuery
                  ? 'Ничего не найдено'
                  : activeCategory === 'recent'
                  ? 'Здесь появятся недавно использованные стикеры'
                  : activeCategory === 'favorites'
                  ? 'Добавь стикеры в избранное, нажав на закладку'
                  : 'Пусто'}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {activeStickers.map((sticker) => (
                  <LazySticker
                    key={sticker.id}
                    sticker={sticker}
                    onClick={() => handleSelect(sticker.id)}
                    isFavorite={favoriteIds.includes(sticker.id)}
                    onToggleFavorite={() => onToggleFavorite(sticker.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CategoryTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors',
        active ? 'bg-accent/20 text-white' : 'text-white/50 hover:bg-white/5'
      )}
    >
      {label}
    </button>
  );
}
