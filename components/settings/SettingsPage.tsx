'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserSettings } from '@/types';
import { IconButton } from '@/components/ui/IconButton';
import {
  getUserSettings,
  saveUserSettings,
  exportAllUserData,
  clearLongTermMemory,
} from '@/lib/firebase/firestore';
import { logout } from '@/lib/firebase/auth';

interface SettingsPageProps {
  uid: string;
  userEmail?: string | null;
  onClose: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  voiceEnabled: true,
  voiceVolume: 1,
  voiceRate: 1,
  animationsEnabled: true,
  theme: 'dark',
};

export function SettingsPage({ uid, userEmail, onClose }: SettingsPageProps) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    getUserSettings(uid).then((s) => s && setSettings((prev) => ({ ...prev, ...s })));
  }, [uid]);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  const update = (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveUserSettings(uid, patch);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllUserData(uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleClearMemory = async () => {
    setClearing(true);
    try {
      await clearLongTermMemory(uid);
    } finally {
      setClearing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-medium">Настройки</h1>
          <IconButton icon="close" label="Закрыть" size={20} onClick={onClose} />
        </div>

        <Section title="Профиль">
          <Row label="Email" value={userEmail ?? '—'} />
          <button
            onClick={logout}
            className="mt-2 text-sm text-red-300 hover:text-red-200 bg-red-500/10 rounded-xl px-4 py-2 w-fit"
          >
            Выйти из аккаунта
          </button>
        </Section>

        <Section title="Голос">
          <ToggleRow
            label="Голосовой ответ включён"
            checked={settings.voiceEnabled}
            onChange={(v) => update({ voiceEnabled: v })}
          />
          <div className="flex flex-col gap-1 mt-3">
            <label className="text-xs text-white/40">Голос синтеза речи</label>
            <select
              value={settings.voiceURI ?? ''}
              onChange={(e) => update({ voiceURI: e.target.value })}
              className="bg-white/[0.04] border border-border rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option value="">По умолчанию</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
          <SliderRow
            label={`Громкость: ${Math.round(settings.voiceVolume * 100)}%`}
            value={settings.voiceVolume}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => update({ voiceVolume: v })}
          />
          <SliderRow
            label={`Скорость речи: ${settings.voiceRate.toFixed(1)}x`}
            value={settings.voiceRate}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(v) => update({ voiceRate: v })}
          />
        </Section>

        <Section title="Внешний вид">
          <ToggleRow
            label="Анимации включены"
            checked={settings.animationsEnabled}
            onChange={(v) => update({ animationsEnabled: v })}
          />
        </Section>

        <Section title="Память">
          <p className="text-xs text-white/40 mb-2">
            Долговременная память хранит важные факты о тебе, которые AI учитывает в разговоре.
          </p>
          <button
            onClick={handleClearMemory}
            disabled={clearing}
            className="text-sm bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2 w-fit disabled:opacity-50"
          >
            {clearing ? 'Очищаю...' : 'Очистить долговременную память'}
          </button>
        </Section>

        <Section title="Данные">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-sm bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2 w-fit disabled:opacity-50"
          >
            {exporting ? 'Готовлю экспорт...' : 'Экспортировать все данные (JSON)'}
          </button>
        </Section>
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 pb-8 border-b border-border last:border-0">
      <h2 className="text-sm font-medium text-white/60 mb-3">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-accent' : 'bg-white/10'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 mt-2">
      <label className="text-xs text-white/40">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-[#7c5cff]"
      />
    </div>
  );
}
