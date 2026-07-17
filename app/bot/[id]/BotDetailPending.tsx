'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';

type Bot = {
  id: number;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: string;
  verified: boolean;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  pending: 'Kutilmoqda',
  rejected: 'Rad etilgan',
};

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function BotDetailPending({ botId }: { botId: string }) {
  const router = useRouter();
  const { ready, initData, openTelegramLink } = useTelegram();
  const [bot, setBot] = useState<Bot | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!initData) {
      setNotFound(true);
      return;
    }
    fetch(`/api/bots/${botId}`, {
      headers: { Authorization: `tma ${initData}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBot(data);
        else setNotFound(true);
      });
  }, [ready, initData, botId]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <p className="text-gray-500 text-sm">Bot topilmadi</p>
      </div>
    );
  }

  if (!bot) {
    return <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:underline mb-4 inline-block"
        >
          ← Orqaga
        </button>

        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center">
          {bot.avatar_url ? (
            <img src={bot.avatar_url} alt={bot.username} className="w-24 h-24 rounded-full object-cover mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl mb-4">
              {bot.username.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 className="text-xl font-bold flex items-center gap-1">
            {bot.name || `@${bot.username}`}
            {bot.verified && <span className="text-blue-500 text-base">✔</span>}
          </h1>
          <p className="text-gray-400 mb-3">@{bot.username}</p>

          <span className={`text-xs px-2 py-1 rounded-full mb-3 ${statusColor[bot.status]}`}>
            {statusLabel[bot.status] || bot.status}
          </span>

          {bot.bio && <p className="text-gray-600 text-sm mb-4 whitespace-pre-line">{bot.bio}</p>}

          <p className="text-gray-400 text-xs mb-6">
            Qo'shilgan: {new Date(bot.created_at).toLocaleString()}
          </p>

          <button
            onClick={() => openTelegramLink(bot.username)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Botga o'tish
          </button>
        </div>
      </div>
    </div>
  );
}