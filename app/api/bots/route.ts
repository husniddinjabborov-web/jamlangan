import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bots (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT,
      bio TEXT,
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS name TEXT`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS bio TEXT`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
  await pool.query(`ALTER TABLE bots ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`);
}

function extractUsername(input: string): string | null {
  let value = input.trim();
  const tmeMatch = value.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i);
  if (tmeMatch) return tmeMatch[1];
  if (value.startsWith('@')) value = value.slice(1);
  if (/^[a-zA-Z0-9_]{3,32}$/.test(value)) return value;
  return null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractProfileInfo(html: string): { name: string | null; bio: string | null; avatarUrl: string | null } {
  let name: string | null = null;
  let bio: string | null = null;
  let avatarUrl: string | null = null;

  const nameMatch = html.match(/<div class="tgme_page_title"><span dir="auto">([\s\S]*?)<\/span>/i);
  if (nameMatch) name = decodeHtmlEntities(nameMatch[1].trim());

  const bioMatch = html.match(/<div class="tgme_page_description\s*">([\s\S]*?)<\/div>/i);
  if (bioMatch) {
    const cleaned = decodeHtmlEntities(bioMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim());
    bio = cleaned.length > 0 ? cleaned : null;
  }

  const avatarMatch = html.match(/<img class="tgme_page_photo_image" src="([^"]+)"/i);
  if (avatarMatch) avatarUrl = decodeHtmlEntities(avatarMatch[1]);

  return { name, bio, avatarUrl };
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
  const body = await req.json();
  const input = body.input as string;

  const username = extractUsername(input);
  if (!username) {
    return NextResponse.json({ error: "Noto'g'ri username yoki havola" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(`https://t.me/${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Bunday Telegram sahifasi topilmadi' }, { status: 404 });
    }
    html = await res.text();
  } catch {
    return NextResponse.json({ error: 'Telegramga ulanishda xatolik' }, { status: 500 });
  }

  const isBot = html.includes('Start Bot');
  if (!isBot) {
    return NextResponse.json({ error: `@${username} bot emas` }, { status: 400 });
  }

  const { name, bio, avatarUrl } = extractProfileInfo(html);

  await ensureTable();
  try {
    // Status'ga tegilmaydi — allaqachon approved bo'lsa shunday qoladi,
    // pending/rejected bo'lsa pending holatida qayta ko'rib chiqiladi
    await pool.query(
      `INSERT INTO bots (username, name, bio, avatar_url, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (username) DO UPDATE
       SET name = EXCLUDED.name,
           bio = EXCLUDED.bio,
           avatar_url = EXCLUDED.avatar_url,
           status = CASE WHEN bots.status = 'approved' THEN bots.status ELSE 'pending' END`,
      [username, name, bio, avatarUrl]
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