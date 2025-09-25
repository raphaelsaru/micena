'use client';

import { useState, useEffect } from 'react';
import { X, Check, Search, Calendar, Printer, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  location: string;
  date: string;
  isRead: boolean;
}

interface NewsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (newsId: string) => void;
  newsItems: NewsItem[];
}

export function NewsPopup({ isOpen, onClose, onMarkAsRead, newsItems }: NewsPopupProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const count = newsItems.filter(item => !item.isRead).length;
    setUnreadCount(count);
  }, [newsItems]);

  if (!mounted || !isOpen) return null;

  const handleMarkAsRead = (newsId: string) => {
    onMarkAsRead(newsId);
  };

  const handleMarkAllAsRead = () => {
    newsItems.forEach(item => {
      if (!item.isRead) {
        onMarkAsRead(item.id);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-2 sm:p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] bg-white animate-in slide-in-from-bottom-4 duration-300 mx-2 sm:mx-0">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-wrap">
              <span className="text-blue-600">🚀</span>
              <span className="truncate">Novidades do Sistema</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 flex-shrink-0">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              Confira as últimas funcionalidades adicionadas ao sistema
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs flex-1 sm:flex-none"
              >
                <Check className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Marcar todas como lidas</span>
                <span className="sm:hidden">Marcar todas</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6">
          <div className="h-[50vh] sm:h-[400px] overflow-y-auto pr-2 sm:pr-4">
            <div className="space-y-3 sm:space-y-4">
              {newsItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                    item.isRead 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                        item.isRead ? 'bg-gray-100' : 'bg-blue-100'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium text-sm sm:text-base ${
                            item.isRead ? 'text-gray-700' : 'text-blue-900'
                          }`}>
                            {item.title}
                          </h3>
                          {!item.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className={`text-xs sm:text-sm mb-2 leading-relaxed ${
                          item.isRead ? 'text-gray-600' : 'text-blue-800'
                        }`}>
                          {item.description}
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!item.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 flex-shrink-0 p-1 sm:p-2"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
