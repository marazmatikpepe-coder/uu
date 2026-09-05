'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVoiceOptions {
  onFinalTranscript: (text: string) => void;
  onVolumeChange?: (volume: number) => void;
  voiceURI?: string;
  volume?: number;
  rate?: number;
  enabled?: boolean;
}

/**
 * Голосовой режим на основе браузерных Web Speech API
 * (SpeechRecognition для STT, SpeechSynthesis для TTS) и Web Audio API
 * для анализа громкости микрофона в реальном времени — всё это
 * работает полностью в браузере, без внешних сервисов и ключей.
 *
 * Ограничение: SpeechRecognition официально хорошо поддержан в Chrome/Edge
 * (webkitSpeechRecognition). В Safari/Firefox поддержка ограничена —
 * компонент аккуратно деградирует и сообщает об этом.
 */
export function useVoice({
  onFinalTranscript,
  onVolumeChange,
  voiceURI,
  volume = 1,
  rate = 1,
  enabled = true,
}: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSupported(Boolean(SpeechRecognition));
  }, []);

  const stopVolumeAnalysis = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const startVolumeAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        onVolumeChange?.(Math.min(1, avg / 128));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      // Микрофон недоступен/запрещён — молча продолжаем без визуализации громкости.
    }
  }, [onVolumeChange]);

  const startListening = useCallback(() => {
    if (!enabled) return;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      setInterimTranscript(interim);
      if (final.trim()) {
        onFinalTranscript(final.trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      stopVolumeAnalysis();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    startVolumeAnalysis();
  }, [enabled, onFinalTranscript, startVolumeAnalysis, stopVolumeAnalysis]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    stopVolumeAnalysis();
  }, [stopVolumeAnalysis]);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) {
        onDone?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.volume = volume;
      utterance.rate = rate;
      if (voiceURI) {
        const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI);
        if (voice) utterance.voice = voice;
      }
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onDone?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onDone?.();
      };
      window.speechSynthesis.speak(utterance);
    },
    [enabled, volume, rate, voiceURI]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => () => stopVolumeAnalysis(), [stopVolumeAnalysis]);

  return {
    isListening,
    isSpeaking,
    supported,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
