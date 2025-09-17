'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from './Navigation'

export function NavigationWrapper() {
  const pathname = usePathname()
  const { loading, user } = useAuth()

  // Não mostrar a Navigation na página de login
  if (pathname === '/login') {
    return null
  }

  // Não mostrar Navigation durante o loading ou se não há usuário
  if (loading || !user) {
    return null
  }

  return <Navigation />
}
