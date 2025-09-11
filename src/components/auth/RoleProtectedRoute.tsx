'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { UserRole } from '@/types/database'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = '/routes-colaborador' 
}: RoleProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    if (!loading && user && userProfile) {
      // Verificar se o usuário tem permissão para acessar esta página
      if (!allowedRoles.includes(userProfile.role)) {
        console.log(`🚫 Acesso negado para role: ${userProfile.role}`)
        router.push(fallbackPath)
      }
    }
  }, [user, userProfile, loading, router, mounted, allowedRoles, fallbackPath])

  // Evitar renderização durante SSR
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  // Verificar se o usuário tem permissão
  if (!allowedRoles.includes(userProfile.role)) {
    return null
  }

  return <>{children}</>
}


