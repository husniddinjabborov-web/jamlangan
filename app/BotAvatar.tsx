'use client';

import { useState } from 'react';

export default function BotAvatar({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  const [broken, setBroken] = useState(false);

  if (!avatarUrl || broken) {
    return (
      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={username}
      onError={() => setBroken(true)}
      className="w-16 h-16 rounded-full object-cover"
    />
  );
}