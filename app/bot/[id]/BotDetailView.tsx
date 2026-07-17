'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function BotDetailView({ bot }: { bot: Bot }) {
  const router = useRouter();
  const { initData, user, openTelegramLink } = useTelegram();
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [owner, setOwner] = useState<{ id: number; name: string } | null>(null);

  const isAdmin = user && String(user.id) === process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_ID;

  // Admin bo'lsa, egasi haqida ma'lumotni orqa fonda (bloklamasdan) yuklab olamiz
  useEffect(() => {
    if (!isAdmin || !initData) return;
    fetch(`/api/bots/${bot.id}`, {
      headers: { Authorization: `tma ${initData}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.added_by_id) {
          setOwner({ id: data.added_by_id, name: data.added_by_name || `ID: ${data.added_by_id}` });
        }
      });
  }, [isAdmin, initData, bot.id]);

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
          {bot.avatar_url && !avatarBroken ? (
            <img
              src={bot.avatar_url}
              alt={bot.username}
              onError={() => setAvatarBroken(true)}
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl mb-4">
              {bot.username.charAt(0).toUpperCase()}
            </div>
          )}

          <h1 className="text-xl font-bold flex items-center gap-1">
            {bot.name || `@${bot.username}`}
            {bot.verified && <span className="text-blue-500 text-base" title="Egalik tasdiqlangan">✔</span>}
          </h1>
          <p className="text-gray-400 mb-3">@{bot.username}</p>

          {bot.bio && (
            <p className="text-gray-600 text-sm mb-4 whitespace-pre-line">{bot.bio}</p>
          )}

          {owner && (
            <Link
              href={`/admin/user/${owner.id}`}
              className="text-xs text-blue-600 hover:underline mb-4"
            >
              Egasi: {owner.name}
            </Link>
          )}

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