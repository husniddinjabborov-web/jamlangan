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
  const isAdmin = user && String(user.id) === process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_ID;

  const [bots, setBots] = useState<Bot[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'unauthorized'>('loading');

  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadMyBots = async () => {
    if (!initData) return;
    const res = await fetch('/api/my-bots', {
      headers: { Authorization: `tma ${initData}` },
    });
    if (res.status === 401) {
      setStatus('unauthorized');
      return;
    }
    const data = await res.json();
    setBots(data);
    setStatus('ok');
  };

  useEffect(() => {
    if (!ready) return;
    if (!initData) {
      setStatus('unauthorized');
      return;
    }
    loadMyBots();
  }, [ready, initData]);

  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');

    if (!initData) {
      setError("Bot qo'shish uchun Telegram orqali kirish kerak");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `tma ${initData}`,
        },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Xatolik yuz berdi');
      } else {
        setInput('');
        setSuccessMsg(data.message || "So'rov yuborildi. Admin tasdiqlashini kuting.");
        loadMyBots();
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg('');
        }, 2000);
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

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
        <Link href="/" className="text-sm text-gray-400 hover:underline mb-4 inline-block">
          ← Orqaga
        </Link>

        <div className="flex items-center gap-4 mb-6">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt="Profil"
              className="w-14 h-14 rounded-full object-cover border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium">
              {user?.first_name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div>
            <div className="text-lg font-semibold">{user?.first_name}</div>
            {user?.username && <div className="text-gray-400 text-sm">@{user.username}</div>}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            + Bot qo'shish
          </button>
          {isAdmin && (
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg border hover:bg-gray-100 text-sm flex items-center"
            >
              Admin panel
            </Link>
          )}
        </div>

        <h2 className="text-lg font-semibold mb-3">Mening botlarim</h2>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Bot qo'shish</h2>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="@username yoki https://t.me/username"
              className="w-full border rounded-lg p-2 mb-3"
              disabled={!!successMsg}
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            {successMsg && <p className="text-green-600 text-sm mb-3">{successMsg}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowModal(false); setError(''); setSuccessMsg(''); setInput(''); }}
                className="px-4 py-2 rounded-lg border"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !!successMsg}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
              >
                {loading ? 'Tekshirilmoqda...' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}