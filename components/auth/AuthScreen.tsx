'use client';

import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } from '@/lib/firebase/auth';
import { AIAvatar } from '@/components/avatar/AIAvatar';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        await registerWithEmail(email, password, name);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (err: any) {
      setError(translateFirebaseError(err?.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(translateFirebaseError(err?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-panel border border-border rounded-3xl p-8 shadow-soft flex flex-col items-center"
      >
        <AIAvatar state="idle" size={100} />
        <h1 className="text-lg font-medium mt-4 mb-1">Nexus AI</h1>
        <p className="text-xs text-white/40 mb-6">
          {mode === 'login' ? 'Войди в свой аккаунт' : mode === 'register' ? 'Создай аккаунт' : 'Восстановление доступа'}
        </p>

        {resetSent ? (
          <div className="text-sm text-center text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            Письмо для сброса пароля отправлено на {email}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            {mode === 'register' && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                className="bg-white/[0.04] border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent/50"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-white/[0.04] border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent/50"
            />
            {mode !== 'reset' && (
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="bg-white/[0.04] border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent/50"
              />
            )}

            {error && <div className="text-xs text-red-300 bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent/85 transition-colors rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {mode === 'login' ? 'Войти' : mode === 'register' ? 'Зарегистрироваться' : 'Отправить письмо'}
            </button>
          </form>
        )}

        {mode !== 'reset' && (
          <>
            <div className="flex items-center gap-2 w-full my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-white/30">или</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full bg-white/[0.06] hover:bg-white/[0.1] transition-colors rounded-xl py-2.5 text-sm flex items-center justify-center gap-2"
            >
              Продолжить с Google
            </button>
          </>
        )}

        <div className="flex justify-between w-full mt-5 text-xs text-white/40">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('register')} className="hover:text-white">Создать аккаунт</button>
              <button onClick={() => setMode('reset')} className="hover:text-white">Забыл пароль</button>
            </>
          ) : (
            <button onClick={() => { setMode('login'); setResetSent(false); }} className="hover:text-white">
              ← Назад ко входу
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function translateFirebaseError(code?: string): string {
  const map: Record<string, string> = {
    'auth/invalid-email': 'Некорректный email',
    'auth/user-not-found': 'Пользователь не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/email-already-in-use': 'Email уже используется',
    'auth/weak-password': 'Пароль слишком простой (минимум 6 символов)',
    'auth/invalid-credential': 'Неверные учётные данные',
    'auth/popup-closed-by-user': 'Окно входа было закрыто',
  };
  return map[code ?? ''] ?? 'Что-то пошло не так. Попробуй снова.';
}
