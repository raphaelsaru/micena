'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function RoleBasedRedirect() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && userProfile) {
      // Só redirecionar colaboradores se estiverem na página inicial
      if (userProfile.role === 'colaborador' && window.location.pathname === '/') {
        router.push('/routes-colaborador')
      }
      // Admins podem ficar em qualquer página
    }
  }, [user, userProfile, loading, router])

  return null
}
