import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Noto'g'ri ID" }, { status: 400 });
  }

  try {
    const result = await pool.query('DELETE FROM bots WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "O'chirishda xatolik" }, { status: 500 });
  }
}