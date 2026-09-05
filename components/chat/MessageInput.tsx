'use client';

import { useCallback, useRef, useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { StickerKeyboard } from '@/components/stickers/StickerKeyboard';
import { uploadImageToImgbb } from '@/lib/imgbb/upload';
import type { MessageAttachment } from '@/types';

interface MessageInputProps {
  onSend: (text: string, attachments?: MessageAttachment[]) => void;
  onSendSticker: (stickerId: string) => void;
  onOpenVoiceMode: () => void;
  isGenerating: boolean;
  onCancel: () => void;
  favoriteStickerIds: string[];
  onToggleFavoriteSticker: (id: string) => void;
}

const SUPPORTED_EXTENSIONS = [
  'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'json', 'xml',
  'html', 'css', 'js', 'ts', 'py', 'zip', 'png', 'jpg', 'jpeg', 'gif', 'webp',
];

export function MessageInput({
  onSend,
  onSendSticker,
  onOpenVoiceMode,
  isGenerating,
  onCancel,
  favoriteStickerIds,
  onToggleFavoriteSticker,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<{ file: File; previewUrl?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [unsupportedMsg, setUnsupportedMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const accepted: { file: File; previewUrl?: string }[] = [];
    const rejected: string[] = [];

    for (const file of arr) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        rejected.push(file.name);
        continue;
      }
      const isImage = file.type.startsWith('image/');
      accepted.push({ file, previewUrl: isImage ? URL.createObjectURL(file) : undefined });
    }

    if (rejected.length > 0) {
      setUnsupportedMsg(`Неподдерживаемый формат: ${rejected.join(', ')}`);
      setTimeout(() => setUnsupportedMsg(null), 3500);
    }
    setPendingFiles((prev) => [...prev, ...accepted]);
  }, []);

  const removePending = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (isGenerating) return;
    if (!text.trim() && pendingFiles.length === 0) return;

    let attachments: MessageAttachment[] | undefined;

    if (pendingFiles.length > 0) {
      setUploading(true);
      try {
        attachments = await Promise.all(
          pendingFiles.map(async ({ file }): Promise<MessageAttachment> => {
            const isImage = file.type.startsWith('image/');
            if (isImage) {
              const result = await uploadImageToImgbb(file);
              return {
                id: crypto.randomUUID(),
                name: file.name,
                url: result.url,
                mimeType: file.type,
                size: file.size,
                kind: 'image',
              };
            }
            // Для не-изображений: локальный object URL (для полноценного
            // хранения не-графических файлов подключи Firebase Storage
            // или свой backend — imgbb принимает только изображения).
            return {
              id: crypto.randomUUID(),
              name: file.name,
              url: URL.createObjectURL(file),
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              kind: 'file',
            };
          })
        );
      } catch (err: any) {
        setUnsupportedMsg(err?.message ?? 'Не удалось загрузить файл');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSend(text, attachments);
    setText('');
    setPendingFiles([]);
  };

  return (
    <div
      className="relative border-t border-border bg-panel/60 backdrop-blur-xl p-3 md:p-4"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
      }}
    >
      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-accent/10 border-2 border-dashed border-accent rounded-2xl z-20 text-sm">
          Отпусти файл, чтобы прикрепить
        </div>
      )}

      {unsupportedMsg && (
        <div className="mb-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
          {unsupportedMsg}
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="relative group">
              {pf.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pf.previewUrl} alt={pf.file.name} className="w-16 h-16 object-cover rounded-xl border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-xl border border-border bg-white/5 flex items-center justify-center text-[10px] text-center px-1 text-white/60">
                  {pf.file.name.slice(0, 12)}
                </div>
              )}
              <button
                onClick={() => removePending(i)}
                className="absolute -top-1.5 -right-1.5 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconButton icon="close" label="Удалить вложение" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />

        <div className="flex gap-0.5">
          <IconButton icon="attachFile" label="Прикрепить файл" onClick={() => fileInputRef.current?.click()} />
          <IconButton icon="image" label="Изображение" onClick={() => imageInputRef.current?.click()} />
          <div className="relative">
            <IconButton
              icon="gif"
              label="Стикеры"
              active={stickersOpen}
              onClick={() => setStickersOpen((v) => !v)}
            />
            <StickerKeyboard
              open={stickersOpen}
              onClose={() => setStickersOpen(false)}
              onSelect={(id) => {
                onSendSticker(id);
                setStickersOpen(false);
              }}
              favoriteIds={favoriteStickerIds}
              onToggleFavorite={onToggleFavoriteSticker}
            />
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Напиши сообщение..."
          rows={1}
          className="flex-1 resize-none bg-white/[0.04] border border-border rounded-2xl px-4 py-2.5 outline-none focus:border-accent/50 text-sm max-h-32 min-h-[42px]"
        />

        <IconButton icon="voiceMode" label="Голосовой режим" onClick={onOpenVoiceMode} />

        {isGenerating ? (
          <IconButton icon="stop" label="Остановить генерацию" onClick={onCancel} className="bg-red-500/20" />
        ) : (
          <IconButton
            icon="send"
            label="Отправить"
            onClick={handleSend}
            disabled={uploading || (!text.trim() && pendingFiles.length === 0)}
            className="bg-accent/20"
          />
        )}
      </div>
    </div>
  );
}
