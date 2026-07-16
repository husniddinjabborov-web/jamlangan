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

export default function AdminPage() {
  const { ready, initData, user } = useTelegram();
  const [bots, setBots] = useState<Bot[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [actingId, setActingId] = useState<number | null>(null);

  const authHeader = () => ({ Authorization: `tma ${initData}` });

  const loadBots = async () => {
    const res = await fetch('/api/admin/bots', { headers: authHeader() });
    if (res.status === 401) {
      setAuthorized(false);
      return;
    }
    const data = await res.json();
    setBots(data);
    setAuthorized(true);
  };

  useEffect(() => {
    if (ready && initData) {
      loadBots();
    } else if (ready && !initData) {
      setAuthorized(false);
    }
  }, [ready, initData]);

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/bots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBots((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      }
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`@${username} ni butunlay o'chirishni tasdiqlaysizmi?`)) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/bots/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (res.ok) {
        setBots((prev) => prev.filter((b) => b.id !== id));
      }
    } finally {
      setActingId(null);
    }
  };

  if (authorized === null) {
    return <div className="p-8 text-center text-gray-400">Yuklanmoqda...</div>;
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Ruxsat yo'q</p>
          <p className="text-gray-500 text-sm">
            Bu sahifa faqat botning admini uchun. Iltimos, botning Mini App'i orqali kiring.
          </p>
          {user && (
            <p className="text-gray-400 text-xs mt-2">Sizning ID: {user.id}</p>
          )}
        </div>
      </div>
    );
  }

  const filtered = filter === 'all' ? bots : bots.filter((b) => b.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin panel — Botlar</h1>

        <div className="flex gap-2 mb-4">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'
              }`}
            >
              {f === 'pending' && 'Kutilmoqda'}
              {f === 'approved' && 'Tasdiqlangan'}
              {f === 'rejected' && 'Rad etilgan'}
              {f === 'all' && 'Barchasi'}
              {' '}
              ({f === 'all' ? bots.length : bots.filter((b) => b.status === f).length})
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow divide-y">
          {filtered.map((bot) => (
            <div key={bot.id} className="p-4 flex items-center gap-4">
              {bot.avatar_url ? (
                <img src={bot.avatar_url} alt={bot.username} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  {bot.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{bot.name || `@${bot.username}`}</div>
                <div className="text-sm text-gray-400">@{bot.username}</div>
                {bot.bio && <div className="text-sm text-gray-500 truncate">{bot.bio}</div>}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  bot.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : bot.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {bot.status}
              </span>
              <div className="flex gap-2">
                {bot.status !== 'approved' && (
                  <button
                    onClick={() => handleAction(bot.id, 'approved')}
                    disabled={actingId === bot.id}
                    className="text-green-600 hover:text-green-800 text-sm disabled:opacity-40"
                  >
                    Tasdiqlash
                  </button>
                )}
                {bot.status !== 'rejected' && (
                  <button
                    onClick={() => handleAction(bot.id, 'rejected')}
                    disabled={actingId === bot.id}
                    className="text-orange-600 hover:text-orange-800 text-sm disabled:opacity-40"
                  >
                    Rad etish
                  </button>
                )}
                <button
                  onClick={() => handleDelete(bot.id, bot.username)}
                  disabled={actingId === bot.id}
                  className="text-red-500 hover:text-red-700 text-sm disabled:opacity-40"
                >
                  O'chirish
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-gray-400">Bu bo'limda bot yo'q</div>
          )}
        </div>
      </div>
    </div>
  );
}