'use client'

import { Dashboard } from '@/components/dashboard/Dashboard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleBasedRedirect } from '@/components/auth/RoleBasedRedirect'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Desabilitar SSR para esta página
export const dynamic = 'force-dynamic'

function HomeContent() {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirecionamento imediato para colaboradores
    if (!loading && userProfile?.role === 'colaborador') {
      console.log('🚀 Redirecionamento imediato para colaborador')
      router.replace('/routes-colaborador')
    }
  }, [userProfile, loading, router])

  // Se for colaborador, mostrar loading enquanto redireciona
  if (!loading && userProfile?.role === 'colaborador') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Redirecionando para suas rotas...</p>
        </div>
      </div>
    )
  }

  // Para admins, mostrar o dashboard
  return <Dashboard />
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  )
}
