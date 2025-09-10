'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache por 5 minutos por padrão
            staleTime: 5 * 60 * 1000,
            // Refetch em background a cada 10 minutos
            refetchInterval: 10 * 60 * 1000,
            // Retry 3 vezes em caso de erro
            retry: 3,
            // Não refetch quando a janela ganha foco (evita chamadas desnecessárias)
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry 2 vezes para mutações
            retry: 2,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
