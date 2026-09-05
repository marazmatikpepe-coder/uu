'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuth } from '@/lib/firebase/auth';
import { initPresence } from '@/lib/firebase/presence';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = initPresence(user.uid);
    return () => unsub();
  }, [user]);

  return { user, loading };
}
