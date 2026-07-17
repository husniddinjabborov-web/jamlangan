import pool from '@/lib/db';
import BotDetailView from './BotDetailView';
import BotDetailPending from './BotDetailPending';

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

async function getBot(id: string): Promise<Bot | null> {
  if (!id || isNaN(Number(id))) return null;
  const result = await pool.query(
    `SELECT id, username, name, bio, avatar_url, status, verified, created_at
     FROM bots WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export default async function BotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bot = await getBot(id);

  if (!bot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <p className="text-gray-500 text-sm">Bot topilmadi</p>
      </div>
    );
  }

  // Tasdiqlangan botlar — darhol, kechikishsiz ko'rsatiladi
  if (bot.status === 'approved') {
    return <BotDetailView bot={bot} />;
  }

  // Tasdiqlanmagan botlar — faqat egasi/admin ko'rishi mumkin, autentifikatsiya client tarafda
  return <BotDetailPending botId={id} />;
}