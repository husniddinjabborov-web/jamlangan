import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateInitData } from '@/lib/telegramAuth';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const initData = authHeader.replace(/^tma\s+/i, '').trim();

  const { valid, user } = validateInitData(initData);
  if (!valid || !user) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT id, username, name, bio, avatar_url, status, verified, created_at
     FROM bots WHERE added_by_id = $1 ORDER BY created_at DESC`,
    [user.id]
  );

  return NextResponse.json(result.rows);
}