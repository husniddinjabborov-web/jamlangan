'use client';

import Link from 'next/link';
import { useTelegram } from '@/hooks/useTelegram';

export default function ProfileLink() {
  const { user } = useTelegram();

  return (
    <Link href="/profile" className="flex items-center gap-2">
      {user?.photo_url ? (
        <img src={user.photo_url} alt="Profil" className="w-10 h-10 rounded-full object-cover border" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
          {user?.first_name?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
    </Link>
  );
}