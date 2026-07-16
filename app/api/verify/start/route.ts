import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateInitData } from '@/lib/telegramAuth';
import crypto from 'crypto';

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

  const result = await pool.query('SELECT id, added_by_id FROM bots WHERE id = $1', [botId]);
  const bot = result.rows[0];
  if (!bot) {
    return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 });
  }
  if (String(bot.added_by_id) !== String(user.id)) {
    return NextResponse.json({ error: 'Bu bot sizga tegishli emas' }, { status: 403 });
  }

  const code = `verify-${crypto.randomBytes(4).toString('hex')}`;
  await pool.query('UPDATE bots SET verification_code = $1 WHERE id = $2', [code, botId]);

  return NextResponse.json({ success: true, code });
}