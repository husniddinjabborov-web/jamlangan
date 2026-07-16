'use client';

import { useState, useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

type Bot = {
  id: number;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  pending: 'Kutilmoqda',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
};

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ProfilePage() {
  const { ready, initData, user } = useTelegram();
  const [bots, setBots] = useState<Bot[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'unauthorized'>('loading');

  useEffect(() => {
    if (!ready) return;
    if (!initData) {
      setStatus('unauthorized');
      return;
    }

    fetch('/api/my-bots', {
      headers: { Authorization: `tma ${initData}` },
    })
      .then((res) => {
        if (res.status === 401) {
          setStatus('unauthorized');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setBots(data);
          setStatus('ok');
        }
      });
  }, [ready, initData]);

  if (status === 'loading') {
    return <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>;
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <p className="text-gray-500 text-sm text-center">
          Bu sahifani ko'rish uchun Telegram orqali kiring.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Mening botlarim</h1>
        {user && (
          <p className="text-gray-400 text-sm mb-6">
            {user.first_name} {user.username ? `(@${user.username})` : ''}
          </p>
        )}

        <div className="bg-white rounded-lg shadow divide-y">
          {bots.map((bot) => (
            <div key={bot.id} className="p-4 flex items-center gap-4">
              {bot.avatar_url ? (
                <img
                  src={bot.avatar_url}
                  alt={bot.username}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                  {bot.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{bot.name || `@${bot.username}`}</div>
                <div className="text-sm text-gray-400">@{bot.username}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${statusColor[bot.status]}`}>
                {statusLabel[bot.status] || bot.status}
              </span>
            </div>
          ))}
          {bots.length === 0 && (
            <div className="p-6 text-center text-gray-400">
              Siz hali bot qo'shmagansiz
            </div>
          )}
        </div>
      </div>
    </div>
  );
}