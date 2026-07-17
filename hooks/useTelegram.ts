'use client';

import { useEffect, useState } from 'react';

type TelegramUser = {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
};

export function useTelegram() {
  const [ready, setReady] = useState(false);
  const [initData, setInitData] = useState('');
  const [user, setUser] = useState<TelegramUser | null>(null);

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

  const openTelegramLink = (username: string) => {
    const url = `https://t.me/${username}`;
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return { ready, initData, user, openTelegramLink };
}