'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Search, Calendar, Printer } from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  location: string;
  date: string;
  isRead: boolean;
}

interface NewsContextType {
  newsItems: NewsItem[];
  isPopupOpen: boolean;
  unreadCount: number;
  openPopup: () => void;
  closePopup: () => void;
  markAsRead: (newsId: string) => void;
  markAllAsRead: () => void;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

const STORAGE_KEY = 'micena-news-read';

// Dados das novidades - pode ser movido para um arquivo separado no futuro
const initialNewsItems: NewsItem[] = [
  {
    id: 'search-clients-routes',
    title: 'Busca de Clientes em Rotas',
    description: 'Agora você pode buscar clientes diretamente nas rotas usando o campo de busca. Digite o nome do cliente para filtrar rapidamente a lista.',
    icon: <Search className="w-5 h-5 text-blue-600" />,
    location: 'Página de Rotas',
    date: '24/09/2025',
    isRead: false,
  },
  {
    id: 'filter-clients-date',
    title: 'Filtro por Data de Início',
    description: 'Novo filtro permite visualizar clientes baseado na data de início do serviço. Use o seletor de data para filtrar por período específico.',
    icon: <Calendar className="w-5 h-5 text-green-600" />,
    location: 'Página de Clientes',
    date: '24/09/2025',
    isRead: false,
  },
  {
    id: 'print-clients-list',
    title: 'Impressão de Lista de Clientes',
    description: 'Funcionalidade de impressão adicionada para listar todos os clientes. Clique no botão de impressão para gerar uma lista formatada.',
    icon: <Printer className="w-5 h-5 text-purple-600" />,
    location: 'Página de Clientes',
    date: '24/09/2025',
    isRead: false,
  },
];

export function NewsProvider({ children, isAuthenticated = false }: { children: ReactNode; isAuthenticated?: boolean }) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(initialNewsItems);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Carregar notificações lidas do localStorage
  useEffect(() => {
    const savedReadItems = localStorage.getItem(STORAGE_KEY);
    if (savedReadItems) {
      try {
        const readIds: string[] = JSON.parse(savedReadItems);
        setNewsItems(prev => 
          prev.map(item => ({
            ...item,
            isRead: readIds.includes(item.id)
          }))
        );
      } catch (error) {
        console.error('Erro ao carregar notificações lidas:', error);
      }
    }
  }, []);

  // Verificar se há notificações não lidas na inicialização - apenas se usuário estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const hasUnread = newsItems.some(item => !item.isRead);
    if (hasUnread) {
      // Aguardar mais tempo para garantir que a página carregou completamente
      const timer = setTimeout(() => {
        // Verificar se a página está completamente carregada
        if (document.readyState === 'complete') {
          setIsPopupOpen(true);
        } else {
          // Se ainda não estiver carregada, aguardar o evento load
          const handleLoad = () => {
            setTimeout(() => setIsPopupOpen(true), 1000);
            window.removeEventListener('load', handleLoad);
          };
          window.addEventListener('load', handleLoad);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newsItems, isAuthenticated]);

  const unreadCount = newsItems.filter(item => !item.isRead).length;

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const markAsRead = (newsId: string) => {
    setNewsItems(prev => {
      const updated = prev.map(item => 
        item.id === newsId ? { ...item, isRead: true } : item
      );
      
      // Salvar no localStorage
      const readIds = updated.filter(item => item.isRead).map(item => item.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
      
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNewsItems(prev => {
      const updated = prev.map(item => ({ ...item, isRead: true }));
      
      // Salvar no localStorage
      const readIds = updated.map(item => item.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
      
      return updated;
    });
  };

  return (
    <NewsContext.Provider
      value={{
        newsItems,
        isPopupOpen,
        unreadCount,
        openPopup,
        closePopup,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews deve ser usado dentro de um NewsProvider');
  }
  return context;
}
