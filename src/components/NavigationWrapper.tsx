'use client'

import { usePathname } from 'next/navigation'
import { Navigation } from './Navigation'

export function NavigationWrapper() {
  const pathname = usePathname()
  
  // Não mostrar a Navigation na página de login
  if (pathname === '/login') {
    return null
  }
  
  return <Navigation />
}
