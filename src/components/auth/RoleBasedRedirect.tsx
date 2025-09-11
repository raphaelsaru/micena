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
        router.replace('/routes-colaborador')
      }
      // Admins podem ficar em qualquer página
    }
  }, [user, userProfile, loading, router])

  // Se for colaborador e estiver na página inicial, mostrar loading
  if (!loading && user && userProfile?.role === 'colaborador' && window.location.pathname === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return null
}
