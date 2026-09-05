import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fbLimit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './config';
import type { Chat, Message, ProjectDoc, UserSettings } from '@/types';

const chatsCol = (uid: string) => collection(firestore, 'users', uid, 'chats');
const chatDoc = (uid: string, chatId: string) => doc(firestore, 'users', uid, 'chats', chatId);
const messagesCol = (uid: string, chatId: string) =>
  collection(firestore, 'users', uid, 'chats', chatId, 'messages');
const projectsCol = (uid: string) => collection(firestore, 'users', uid, 'projects');
const settingsDoc = (uid: string) => doc(firestore, 'users', uid, 'meta', 'settings');
const memoryDoc = (uid: string) => doc(firestore, 'users', uid, 'meta', 'memory');
const favStickersDoc = (uid: string) => doc(firestore, 'users', uid, 'meta', 'favoriteStickers');

// ---------- Chats ----------

export async function createChat(uid: string, title = 'Новый чат'): Promise<string> {
  const ref = await addDoc(chatsCol(uid), {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    archived: false,
    favorite: false,
    lastMessagePreview: '',
  });
  return ref.id;
}

export async function renameChat(uid: string, chatId: string, title: string) {
  await updateDoc(chatDoc(uid, chatId), { title, updatedAt: serverTimestamp() });
}

export async function deleteChat(uid: string, chatId: string) {
  // Удаляем сообщения батчем, затем сам чат
  const msgs = await getDocs(messagesCol(uid, chatId));
  const batch = writeBatch(firestore);
  msgs.forEach((m) => batch.delete(m.ref));
  batch.delete(chatDoc(uid, chatId));
  await batch.commit();
}

export async function setChatArchived(uid: string, chatId: string, archived: boolean) {
  await updateDoc(chatDoc(uid, chatId), { archived, updatedAt: serverTimestamp() });
}

export async function setChatFavorite(uid: string, chatId: string, favorite: boolean) {
  await updateDoc(chatDoc(uid, chatId), { favorite, updatedAt: serverTimestamp() });
}

export function subscribeToChats(uid: string, cb: (chats: Chat[]) => void): Unsubscribe {
  const q = query(chatsCol(uid), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const chats: Chat[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(chats);
  });
}

// ---------- Messages ----------

export async function addMessage(
  uid: string,
  chatId: string,
  message: Omit<Message, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(messagesCol(uid, chatId), {
    ...message,
    createdAt: serverTimestamp(),
  });
  const preview =
    message.type === 'sticker' ? '📎 стикер' : (message.content || '').slice(0, 80);
  await updateDoc(chatDoc(uid, chatId), {
    updatedAt: serverTimestamp(),
    lastMessagePreview: preview,
  });
  return ref.id;
}

export async function updateMessage(uid: string, chatId: string, messageId: string, content: string) {
  await updateDoc(doc(messagesCol(uid, chatId), messageId), { content, edited: true });
}

export async function deleteMessage(uid: string, chatId: string, messageId: string) {
  await deleteDoc(doc(messagesCol(uid, chatId), messageId));
}

export function subscribeToMessages(
  uid: string,
  chatId: string,
  cb: (messages: Message[]) => void
): Unsubscribe {
  const q = query(messagesCol(uid, chatId), orderBy('createdAt', 'asc'), fbLimit(500));
  return onSnapshot(q, (snap) => {
    const messages: Message[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(messages);
  });
}

// ---------- Projects ----------

export async function createProject(uid: string, name: string): Promise<string> {
  const ref = await addDoc(projectsCol(uid), {
    name,
    files: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToProjects(uid: string, cb: (projects: ProjectDoc[]) => void): Unsubscribe {
  const q = query(projectsCol(uid), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

export async function addFileToProject(
  uid: string,
  projectId: string,
  file: { name: string; path: string; content: string; language: string }
) {
  const ref = doc(projectsCol(uid), projectId);
  const snap = await getDoc(ref);
  const data = snap.data() as ProjectDoc | undefined;
  const files = data?.files ?? [];
  const idx = files.findIndex((f) => f.path === file.path);
  if (idx >= 0) files[idx] = file;
  else files.push(file);
  await updateDoc(ref, { files, updatedAt: serverTimestamp() });
}

// ---------- Settings / Memory / Favorite stickers ----------

export async function getUserSettings(uid: string): Promise<UserSettings | null> {
  const snap = await getDoc(settingsDoc(uid));
  return snap.exists() ? (snap.data() as UserSettings) : null;
}

export async function saveUserSettings(uid: string, settings: Partial<UserSettings>) {
  await setDoc(settingsDoc(uid), settings, { merge: true });
}

export function subscribeToSettings(uid: string, cb: (s: UserSettings | null) => void): Unsubscribe {
  return onSnapshot(settingsDoc(uid), (snap) => cb(snap.exists() ? (snap.data() as UserSettings) : null));
}

export async function getLongTermMemory(uid: string): Promise<string[]> {
  const snap = await getDoc(memoryDoc(uid));
  return snap.exists() ? (snap.data().facts as string[]) ?? [] : [];
}

export async function appendLongTermMemory(uid: string, fact: string) {
  const existing = await getLongTermMemory(uid);
  await setDoc(memoryDoc(uid), { facts: [...existing, fact] }, { merge: true });
}

export async function clearLongTermMemory(uid: string) {
  await setDoc(memoryDoc(uid), { facts: [] }, { merge: true });
}

export async function toggleFavoriteSticker(uid: string, stickerId: string) {
  const snap = await getDoc(favStickersDoc(uid));
  const current: string[] = snap.exists() ? snap.data().ids ?? [] : [];
  const next = current.includes(stickerId)
    ? current.filter((id) => id !== stickerId)
    : [...current, stickerId];
  await setDoc(favStickersDoc(uid), { ids: next }, { merge: true });
  return next;
}

export function subscribeToFavoriteStickers(uid: string, cb: (ids: string[]) => void): Unsubscribe {
  return onSnapshot(favStickersDoc(uid), (snap) => cb(snap.exists() ? snap.data().ids ?? [] : []));
}

// ---------- Экспорт всех данных пользователя ----------

export async function exportAllUserData(uid: string) {
  const [chatsSnap, projectsSnap, settings, memory, favSnap] = await Promise.all([
    getDocs(chatsCol(uid)),
    getDocs(projectsCol(uid)),
    getUserSettings(uid),
    getLongTermMemory(uid),
    getDoc(favStickersDoc(uid)),
  ]);

  const chats = await Promise.all(
    chatsSnap.docs.map(async (chatSnapDoc) => {
      const msgsSnap = await getDocs(messagesCol(uid, chatSnapDoc.id));
      return {
        id: chatSnapDoc.id,
        ...chatSnapDoc.data(),
        messages: msgsSnap.docs.map((m) => ({ id: m.id, ...m.data() })),
      };
    })
  );

  return {
    exportedAt: new Date().toISOString(),
    chats,
    projects: projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    settings,
    longTermMemory: memory,
    favoriteStickers: favSnap.exists() ? favSnap.data().ids ?? [] : [],
  };
}
