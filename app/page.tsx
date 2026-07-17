import Link from 'next/link';
import pool from '@/lib/db';
import ProfileLink from './ProfileLink';
import BotAvatar from './BotAvatar';

type Bot = {
  id: number;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

async function getBots(): Promise<Bot[]> {
  const result = await pool.query(
    "SELECT id, username, name, bio, avatar_url, created_at FROM bots WHERE status = 'approved' ORDER BY created_at DESC"
  );
  return result.rows;
}

export default async function Home() {
  const bots = await getBots();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Telegram Botlar</h1>
          <ProfileLink />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-3 gap-y-5">
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={`/bot/${bot.id}`}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <BotAvatar username={bot.username} avatarUrl={bot.avatar_url} />
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