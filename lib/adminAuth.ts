import { NextRequest } from 'next/server';
import { validateInitData, isAdmin } from './telegramAuth';

export function checkAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const initData = authHeader.replace(/^tma\s+/i, '').trim();
  if (!initData) return false;

  const { valid, userId } = validateInitData(initData);
  return valid && isAdmin(userId);
}