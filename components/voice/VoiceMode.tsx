'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIAvatar } from '@/components/avatar/AIAvatar';
import { IconButton } from '@/components/ui/IconButton';
import { useVoice } from '@/hooks/useVoice';
import type { AIState } from '@/types';

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  onUserSpeech: (text: string) => Promise<string>; // возвращает финальный текст ответа AI
  voiceURI?: string;
  volume?: number;
  rate?: number;
}

export function VoiceMode({ open, onClose, onUserSpeech, voiceURI, volume = 1, rate = 1 }: VoiceModeProps) {
  const [aiState, setAiState] = useState<AIState>('idle');
  const [micVolume, setMicVolume] = useState(0);
  const [muted, setMuted] = useState(false);
  const [lastText, setLastText] = useState('');

  const {
    isListening,
    isSpeaking,
    supported,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoice({
    voiceURI,
    volume,
    rate,
    enabled: !muted,
    onVolumeChange: setMicVolume,
    onFinalTranscript: async (text) => {
      stopListening();
      setLastText(text);
      setAiState('thinking');
      try {
        const reply = await onUserSpeech(text);
        setAiState('speaking');
        speak(reply, () => {
          setAiState('idle');
          if (open) startListening();
        });
      } catch {
        setAiState('error');
      }
    },
  });

  useEffect(() => {
    if (open && !muted) {
      startListening();
      setAiState('listening');
    }
    if (!open) {
      stopListening();
      stopSpeaking();
      setAiState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (isListening) setAiState('listening');
    else if (isSpeaking) setAiState('speaking');
  }, [isListening, isSpeaking]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 p-6"
        >
          <IconButton icon="close" label="Закрыть голосовой режим" onClick={onClose} className="absolute top-6 right-6" size={22} />

          {!supported && (
            <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 max-w-sm text-center">
              Голосовой ввод не поддерживается в этом браузере. Попробуй Chrome или Edge.
            </div>
          )}

          <AIAvatar state={aiState} size={260} volume={isSpeaking ? 0.6 : micVolume} />

          <div className="text-center min-h-[3rem] max-w-md">
            <p className="text-white/70 text-sm">
              {interimTranscript || lastText || 'Скажи что-нибудь...'}
            </p>
            <p className="text-xs text-white/30 mt-1 capitalize">{aiStateLabel(aiState)}</p>
          </div>

          <div className="flex items-center gap-4">
            <IconButton
              icon={muted ? 'micOff' : 'mic'}
              label={muted ? 'Включить микрофон' : 'Выключить микрофон'}
              size={22}
              active={!muted}
              onClick={() => {
                setMuted((m) => {
                  const next = !m;
                  if (next) stopListening();
                  else startListening();
                  return next;
                });
              }}
              className="p-4 bg-white/5"
            />
            <IconButton
              icon="stop"
              label="Остановить"
              size={22}
              onClick={() => {
                stopListening();
                stopSpeaking();
                setAiState('idle');
              }}
              className="p-4 bg-white/5"
            />
            <IconButton
              icon={isSpeaking ? 'speakerOff' : 'speaker'}
              label={isSpeaking ? 'Выключить звук' : 'Динамик'}
              size={22}
              onClick={stopSpeaking}
              className="p-4 bg-white/5"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function aiStateLabel(state: AIState): string {
  const labels: Partial<Record<AIState, string>> = {
    idle: 'ожидание',
    listening: 'слушаю...',
    thinking: 'думаю...',
    speaking: 'говорю...',
    searching: 'ищу...',
    working: 'работаю...',
    error: 'ошибка',
    success: 'готово',
  };
  return labels[state] ?? state;
}
