'use client'

import { Dashboard } from '@/components/dashboard/Dashboard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleBasedRedirect } from '@/components/auth/RoleBasedRedirect'
import { useAuth } from '@/contexts/AuthContext'

// Desabilitar SSR para esta página
export const dynamic = 'force-dynamic'

function HomeContent() {
  const { userProfile, loading } = useAuth()

  // Se for colaborador, não renderizar o dashboard
  if (!loading && userProfile?.role === 'colaborador') {
    return <RoleBasedRedirect />
  }

  return (
    <>
      <RoleBasedRedirect />
      <Dashboard />
    </>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  )
}
