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
  const { initData, user } = useTelegram();
  const isAdmin = user && String(user.id) === process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_ID;

  const [bots, setBots] = useState<Bot[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadBots = async () => {
    const res = await fetch('/api/bots');
    const data = await res.json();
    setBots(data);
  };

  useEffect(() => {
    loadBots();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Telegram Botlar</h1>
          <div className="flex gap-2">
            <Link
              href="/profile"
              className="text-gray-500 px-4 py-2 rounded-lg border hover:bg-gray-100 text-sm flex items-center"
            >
              Profil
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-gray-500 px-4 py-2 rounded-lg border hover:bg-gray-100 text-sm flex items-center"
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Bot qo'shish
            </button>
          </div>
        </div>

        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Bot</th>
              <th className="text-left p-3">Bio</th>
              <th className="text-left p-3">Qo'shilgan sana</th>
            </tr>
          </thead>
          <tbody>
            {bots.map((bot, i) => (
              <tr key={bot.id} className="border-t">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">
                  
                <a    href={`https://t.me/${bot.username}`}
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
                <td className="p-3 text-gray-500">
                  {new Date(bot.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {bots.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-400">
                  Hali bot qo'shilmagan
                </td>
              </tr>
            )}
          </tbody>
        </table>
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