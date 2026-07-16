import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  const result = await pool.query(
    'SELECT id, username, name, bio, avatar_url, status, created_at FROM bots ORDER BY created_at DESC'
  );
  return NextResponse.json(result.rows);
}