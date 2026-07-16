'use client';

import { useEffect, useState } from 'react';

export function useTelegram() {
  const [ready, setReady] = useState(false);
  const [initData, setInitData] = useState('');
  const [user, setUser] = useState<{ id: number; first_name: string; username?: string } | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setInitData(tg.initData);
      setUser(tg.initDataUnsafe?.user || null);
    }
    setReady(true);
  }, []);

  return { ready, initData, user };
}