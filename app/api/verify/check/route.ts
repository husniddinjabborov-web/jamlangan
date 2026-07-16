import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateInitData } from '@/lib/telegramAuth';
import { fetchTelegramPage, extractProfileInfo } from '@/lib/telegramScrape';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const initData = authHeader.replace(/^tma\s+/i, '').trim();

  const { valid, user } = validateInitData(initData);
  if (!valid || !user) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { botId } = await req.json();
  if (!botId) {
    return NextResponse.json({ error: 'botId kerak' }, { status: 400 });
  }

  const result = await pool.query(
    'SELECT id, username, added_by_id, verification_code FROM bots WHERE id = $1',
    [botId]
  );
  const bot = result.rows[0];
  if (!bot) {
    return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 });
  }
  if (String(bot.added_by_id) !== String(user.id)) {
    return NextResponse.json({ error: 'Bu bot sizga tegishli emas' }, { status: 403 });
  }
  if (!bot.verification_code) {
    return NextResponse.json({ error: 'Avval tasdiqlashni boshlang' }, { status: 400 });
  }

  const page = await fetchTelegramPage(bot.username);
  if (!page) {
    return NextResponse.json({ error: 'Telegram sahifasi topilmadi' }, { status: 404 });
  }

  const { bio } = extractProfileInfo(page.html);
  if (!bio || !bio.includes(bot.verification_code)) {
    return NextResponse.json(
      { error: "Kod bio'da topilmadi. Bio saqlanganiga ishonch hosil qiling va qayta urinib ko'ring." },
      { status: 400 }
    );
  }

  await pool.query(
    `UPDATE bots SET verified = true, status = 'approved', verification_code = NULL WHERE id = $1`,
    [botId]
  );

  return NextResponse.json({ success: true });
}