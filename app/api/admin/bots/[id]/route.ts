import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAdminAuth } from '@/lib/adminAuth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: "Noto'g'ri status" }, { status: 400 });
  }

  const result = await pool.query(
    'UPDATE bots SET status = $1 WHERE id = $2 RETURNING id',
    [status, id]
  );
  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const result = await pool.query('DELETE FROM bots WHERE id = $1 RETURNING id', [id]);
  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}