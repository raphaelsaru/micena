'use client';

import { NewsPopup } from './NewsPopup';
import { useNews } from '@/contexts/NewsContext';

export function NewsWrapper() {
  const { isPopupOpen, closePopup, markAsRead, unreadNewsItems } = useNews();

  return (
    <NewsPopup
      isOpen={isPopupOpen}
      onClose={closePopup}
      onMarkAsRead={markAsRead}
      newsItems={unreadNewsItems}
    />
  );
}
