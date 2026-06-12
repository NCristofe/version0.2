import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from './ui/utils';

interface UserAvatarProps {
  userId: 'user1' | 'user2';
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

export function UserAvatar({ userId, className, fallbackClassName, alt }: UserAvatarProps) {
  const { coupleProfile } = useAppData();
  const profile = coupleProfile[userId];

  return (
    <Avatar className={className}>
      {profile.avatarUrl ? (
        <AvatarImage src={profile.avatarUrl} alt={alt ?? profile.name} />
      ) : (
        <AvatarFallback className={cn('text-3xl', fallbackClassName)}>
          {profile.emoji}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
