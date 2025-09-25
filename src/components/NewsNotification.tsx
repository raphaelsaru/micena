'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNews } from '@/contexts/NewsContext';

export function NewsNotification() {
  const { unreadCount, openPopup } = useNews();

  if (unreadCount === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={openPopup}
      className="relative p-2 hover:bg-blue-50 transition-colors"
    >
      <Bell className="w-5 h-5 text-blue-600" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount}
        </Badge>
      )}
    </Button>
  );
}
