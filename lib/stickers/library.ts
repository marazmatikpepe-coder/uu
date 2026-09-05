import rawLibrary from '@/data/stickerLibrary.json';
import type { StickerCategory, StickerItem } from '@/types';

/**
 * Источник данных для клавиатуры стикеров.
 *
 * Сейчас здесь лежит небольшой демонстрационный набор
 * (data/stickerLibrary.json). Чтобы подключить твою полную библиотеку:
 *
 * 1. Приведи её к формату:
 *    [{ "name": "Категория", "stickers": [{ "name": "...", "url": "..." }] }]
 * 2. Замени содержимое data/stickerLibrary.json (или подгружай его
 *    отдельным fetch-запросом, если файл очень большой — тогда замени
 *    импорт ниже на fetch('/stickers.json') и оберни в useEffect).
 *
 * Дальше по коду ничего менять не нужно — id стикеров генерируются
 * автоматически, поиск и ленивая загрузка уже работают с любым
 * количеством категорий и стикеров.
 */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/(^-|-$)/g, '');
}

function buildLibrary(): StickerCategory[] {
  const categories = rawLibrary as { name: string; stickers: { name: string; url: string }[] }[];
  const seen = new Set<string>();

  return categories.map((cat) => ({
    name: cat.name,
    stickers: cat.stickers.map((s): StickerItem => {
      let id = `${slugify(cat.name)}__${slugify(s.name)}`;
      while (seen.has(id)) id += '_';
      seen.add(id);
      return { id, name: s.name, url: s.url };
    }),
  }));
}

export const STICKER_LIBRARY: StickerCategory[] = buildLibrary();

const ALL_STICKERS_FLAT: StickerItem[] = STICKER_LIBRARY.flatMap((c) => c.stickers);
const STICKER_BY_ID = new Map(ALL_STICKERS_FLAT.map((s) => [s.id, s]));

export function getStickerById(id: string): StickerItem | undefined {
  return STICKER_BY_ID.get(id);
}

export function searchStickers(queryText: string): StickerItem[] {
  const q = queryText.trim().toLowerCase();
  if (!q) return [];
  return ALL_STICKERS_FLAT.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 60);
}

export const TOTAL_STICKER_COUNT = ALL_STICKERS_FLAT.length;
