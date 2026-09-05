'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAIState } from '@/hooks/useAIState';
import { useChat } from '@/hooks/useChat';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageInput } from '@/components/chat/MessageInput';
import { VoiceMode } from '@/components/voice/VoiceMode';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { AIAvatar } from '@/components/avatar/AIAvatar';
import { IconButton } from '@/components/ui/IconButton';
import type { Chat, UserSettings } from '@/types';
import {
  createChat,
  deleteChat,
  renameChat,
  setChatArchived,
  setChatFavorite,
  subscribeToChats,
  subscribeToFavoriteStickers,
  subscribeToSettings,
  toggleFavoriteSticker,
  appendLongTermMemory,
} from '@/lib/firebase/firestore';
import { aiProvider } from '@/lib/ai';
import { selectRelevantHistory } from '@/lib/ai/contextSelector';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { state: aiState, setState: setAiState, setTemporary } = useAIState('idle');

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [favoriteStickerIds, setFavoriteStickerIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const { messages, isGenerating, sendText, sendSticker, editUserMessage, regenerate, cancelGeneration, removeMessage } =
    useChat({ uid: user?.uid ?? null, chatId: activeChatId, onAIState: setTemporary });

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToChats(user.uid, (list) => {
      setChats(list);
      if (!activeChatId && list.length > 0) setActiveChatId(list[0].id);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToFavoriteStickers(user.uid, setFavoriteStickerIds);
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSettings(user.uid, setSettings);
    return unsub;
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <AIAvatar state="idle" size={100} />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const handleNewChat = async () => {
    const id = await createChat(user.uid);
    setActiveChatId(id);
    setMobileMenuOpen(false);
  };

  const handleVoiceSpeech = async (text: string): Promise<string> => {
    if (!activeChatId) {
      const id = await createChat(user.uid, text.slice(0, 40));
      setActiveChatId(id);
    }
    // Для голосового режима используем провайдер напрямую (без записи
    // промежуточных чанков в чат), чтобы получить финальный текст для TTS,
    // и параллельно сохраняем реплики в историю текущего чата.
    const chatId = activeChatId ?? (await createChat(user.uid, text.slice(0, 40)));
    const memory = await import('@/lib/firebase/firestore').then((m) => m.getLongTermMemory(user.uid));
    const relevant = selectRelevantHistory(messages);
    const { text: reply } = await aiProvider.chat(text, { chatId, history: relevant, longTermMemory: memory });
    await sendText(text);
    return reply;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setMobileMenuOpen(false);
        }}
        onNewChat={handleNewChat}
        onRenameChat={(id, title) => renameChat(user.uid, id, title)}
        onDeleteChat={(id) => {
          deleteChat(user.uid, id);
          if (activeChatId === id) setActiveChatId(null);
        }}
        onArchiveChat={(id, archived) => setChatArchived(user.uid, id, archived)}
        onFavoriteChat={(id, favorite) => setChatFavorite(user.uid, id, favorite)}
        onOpenSettings={() => setSettingsOpen(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        userEmail={user.email}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border md:hidden">
          <IconButton icon="menu" label="Меню" onClick={() => setMobileMenuOpen(true)} />
          <span className="text-sm font-medium truncate">
            {chats.find((c) => c.id === activeChatId)?.title ?? 'Nexus AI'}
          </span>
        </header>

        {activeChatId ? (
          <>
            <ChatWindow
              messages={messages}
              aiState={aiState}
              onEdit={(id, content) => editUserMessage(id, content)}
              onRegenerate={(content) => regenerate(content)}
              onDelete={(id) => removeMessage(id)}
            />
            <MessageInput
              onSend={(text, attachments) => sendText(text, attachments)}
              onSendSticker={(id) => sendSticker(id)}
              onOpenVoiceMode={() => setVoiceOpen(true)}
              isGenerating={isGenerating}
              onCancel={cancelGeneration}
              favoriteStickerIds={favoriteStickerIds}
              onToggleFavoriteSticker={(id) => toggleFavoriteSticker(user.uid, id)}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <AIAvatar state="idle" size={140} />
            <button
              onClick={handleNewChat}
              className="text-sm bg-accent/20 hover:bg-accent/30 rounded-xl px-5 py-2.5 transition-colors"
            >
              Начать новый чат
            </button>
          </div>
        )}
      </div>

      <VoiceMode
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onUserSpeech={handleVoiceSpeech}
        voiceURI={settings?.voiceURI}
        volume={settings?.voiceVolume ?? 1}
        rate={settings?.voiceRate ?? 1}
      />

      {settingsOpen && (
        <SettingsPage uid={user.uid} userEmail={user.email} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
