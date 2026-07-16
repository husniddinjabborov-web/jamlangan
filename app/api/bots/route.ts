import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateInitData } from '@/lib/telegramAuth';
import { extractUsername, extractProfileInfo, fetchTelegramPage } from '@/lib/telegramScrape';

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bots (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT,
      bio TEXT,
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      added_by_id BIGINT,
      added_by_name TEXT,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_code TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS name TEXT`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS bio TEXT`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS added_by_id BIGINT`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS added_by_name TEXT`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS verification_code TEXT`);
}

// Faqat tasdiqlangan botlarni qaytaradi (ommaviy sahifa uchun)
export async function GET() {
  await ensureTable();
  const result = await pool.query(
    "SELECT id, username, name, bio, avatar_url, created_at FROM bots WHERE status = 'approved' ORDER BY created_at DESC"
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const initData = authHeader.replace(/^tma\s+/i, '').trim();

  const { valid, user } = validateInitData(initData);
  if (!valid || !user) {
    return NextResponse.json(
      { error: "Bot qo'shish uchun Telegram orqali kirish kerak" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const input = body.input as string;

  const username = extractUsername(input);
  if (!username) {
    return NextResponse.json({ error: "Noto'g'ri username yoki havola" }, { status: 400 });
  }

  const page = await fetchTelegramPage(username);
  if (!page) {
    return NextResponse.json({ error: 'Bunday Telegram sahifasi topilmadi' }, { status: 404 });
  }
  if (!page.isBot) {
    return NextResponse.json({ error: `@${username} bot emas` }, { status: 400 });
  }

  const { name, bio, avatarUrl } = extractProfileInfo(page.html);
  const addedByName = user.username ? `@${user.username}` : user.first_name;

  await ensureTable();
  try {
    await pool.query(
      `INSERT INTO bots (username, name, bio, avatar_url, status, added_by_id, added_by_name)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       ON CONFLICT (username) DO UPDATE
       SET name = EXCLUDED.name,
           bio = EXCLUDED.bio,
           avatar_url = EXCLUDED.avatar_url,
           status = CASE WHEN bots.status = 'approved' THEN bots.status ELSE 'pending' END`,
      [username, name, bio, avatarUrl, user.id, addedByName]
    );
  } catch {
    return NextResponse.json({ error: 'Bazaga yozishda xatolik' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    username,
    message: "So'rovingiz yuborildi. Admin tasdiqlashini kuting.",
  });
}