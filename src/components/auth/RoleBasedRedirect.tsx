'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function RoleBasedRedirect() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && userProfile) {
      // Redirecionar colaboradores se estiverem na página inicial
      if (userProfile.role === 'colaborador' && window.location.pathname === '/') {
        console.log('🔄 RoleBasedRedirect: Redirecionando colaborador para /routes-colaborador')
        router.replace('/routes-colaborador')
      }
      // Admins podem ficar em qualquer página
    }
  }, [user, userProfile, loading, router])

  return null
}
