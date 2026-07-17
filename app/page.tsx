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
  added_by_id?: number;
  added_by_name?: string;
};

export default function Home() {
  const { initData, user } = useTelegram();
  const isAdmin = user && String(user.id) === process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_ID;

  const [bots, setBots] = useState<Bot[]>([]);

  const loadBots = async () => {
    const res = await fetch('/api/bots', {
      headers: initData ? { Authorization: `tma ${initData}` } : {},
    });
    const data = await res.json();
    setBots(data);
  };

  useEffect(() => {
    loadBots();
  }, [initData]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
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

        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Bot</th>
              <th className="text-left p-3">Bio</th>
              {isAdmin && <th className="text-left p-3">Egasi</th>}
              <th className="text-left p-3">Qo'shilgan sana</th>
            </tr>
          </thead>
          <tbody>
            {bots.map((bot, i) => (
              <tr key={bot.id} className="border-t">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">
                  
                  <a  href={`https://t.me/${bot.username}`}
                    target="_blank"
                    className="flex items-center gap-3 hover:underline"
                  >
                    {bot.avatar_url ? (
                      <img
                        src={bot.avatar_url}
                        alt={bot.username}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm flex-shrink-0">
                        {bot.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-blue-600 font-medium">
                        {bot.name || `@${bot.username}`}
                      </span>
                      <span className="text-gray-400 text-xs">@{bot.username}</span>
                    </div>
                  </a>
                </td>
                <td className="p-3 text-gray-500 text-sm max-w-xs truncate">
                  {bot.bio || '—'}
                </td>
                {isAdmin && (
                  <td className="p-3 text-sm">
                    {bot.added_by_id ? (
                      <Link
                        href={`/admin/user/${bot.added_by_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {bot.added_by_name || `ID: ${bot.added_by_id}`}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                )}
                <td className="p-3 text-gray-500">
                  {new Date(bot.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {bots.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="p-3 text-center text-gray-400">
                  Hali bot qo'shilmagan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}