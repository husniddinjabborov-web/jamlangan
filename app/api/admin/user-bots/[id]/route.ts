import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT id, username, name, bio, avatar_url, status, verified, added_by_name, created_at
     FROM bots WHERE added_by_id = $1 ORDER BY created_at DESC`,
    [id]
  );

  return NextResponse.json(result.rows);
}