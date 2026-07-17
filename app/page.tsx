'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTelegram } from '@/hooks/useTelegram';

type Bot = {
  id: number;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export default function Home() {
  const { user } = useTelegram();
  const [bots, setBots] = useState<Bot[]>([]);

  const loadBots = async () => {
    const res = await fetch('/api/bots');
    const data = await res.json();
    setBots(data);
  };

  useEffect(() => {
    loadBots();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Telegram Botlar</h1>
          <Link href="/profile" className="flex items-center gap-2">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Profil" className="w-10 h-10 rounded-full object-cover border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                {user?.first_name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </Link>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={`/bot/${bot.id}`}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {bot.avatar_url ? (
                <img
                  src={bot.avatar_url}
                  alt={bot.username}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
                  {bot.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-700 text-center leading-tight line-clamp-2 max-w-full">
                {bot.name || `@${bot.username}`}
              </span>
            </Link>
          ))}
        </div>

        {bots.length === 0 && (
          <p className="text-center text-gray-400 mt-10">Hali bot qo'shilmagan</p>
        )}
      </div>
    </div>
  );
}