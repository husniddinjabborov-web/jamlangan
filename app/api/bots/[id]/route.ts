import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateInitData, isAdmin } from '@/lib/telegramAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT id, username, name, bio, avatar_url, status, verified, added_by_id, added_by_name, created_at
     FROM bots WHERE id = $1`,
    [id]
  );
  const bot = result.rows[0];
  if (!bot) {
    return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const initData = authHeader.replace(/^tma\s+/i, '').trim();
  const { valid, userId } = validateInitData(initData);
  const requesterIsAdmin = valid && isAdmin(userId);
  const requesterIsOwner = valid && userId && String(userId) === String(bot.added_by_id);

  if (bot.status !== 'approved' && !requesterIsAdmin && !requesterIsOwner) {
    return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 });
  }

  if (!requesterIsAdmin) {
    delete bot.added_by_id;
    delete bot.added_by_name;
  }

  return NextResponse.json(bot);
}