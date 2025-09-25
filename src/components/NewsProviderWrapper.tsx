'use client';

import { NewsProvider } from '@/contexts/NewsContext';
import { useAuth } from '@/contexts/AuthContext';

export function NewsProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  return (
    <NewsProvider isAuthenticated={!loading && !!user}>
      {children}
    </NewsProvider>
  );
}
