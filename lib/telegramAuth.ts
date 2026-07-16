import crypto from 'crypto';

const BOT_TOKEN = process.env.BOT_TOKEN!;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID!;

export function validateInitData(initData: string): {
  valid: boolean;
  userId?: number;
  user?: { id: number; first_name: string; username?: string };
} {
  if (!initData) return { valid: false };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { valid: false };
  params.delete('hash');

  const dataCheckArr: string[] = [];
  params.forEach((value, key) => dataCheckArr.push(`${key}=${value}`));
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return { valid: false };

  // initData 24 soatdan eski bo'lmasin
  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > 86400) return { valid: false };

  const userStr = params.get('user');
  const user = userStr ? JSON.parse(userStr) : undefined;

  return { valid: true, userId: user?.id, user };
}

export function isAdmin(userId?: number): boolean {
  return !!userId && String(userId) === ADMIN_TELEGRAM_ID;
}