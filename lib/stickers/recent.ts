const KEY = 'nexus_recent_stickers';
const MAX = 24;

export function getRecentStickerIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function pushRecentSticker(id: string) {
  if (typeof window === 'undefined') return;
  const current = getRecentStickerIds().filter((x) => x !== id);
  current.unshift(id);
  localStorage.setItem(KEY, JSON.stringify(current.slice(0, MAX)));
}
