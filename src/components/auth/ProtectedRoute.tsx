'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sessionCheckAttempts, setSessionCheckAttempts] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Só redirecionar se não estiver carregando e não houver usuário
    if (!loading && !user) {
      console.log('🚫 Usuário não autenticado, tentativa:', sessionCheckAttempts + 1)
      
      // Verificar se há uma sessão válida no localStorage como fallback
      const hasLocalSession = localStorage.getItem('supabase.auth.token') || 
                             sessionStorage.getItem('supabase.auth.token')
      
      if (hasLocalSession && sessionCheckAttempts < 3) {
        console.log('💾 Sessão encontrada no storage, aguardando verificação...')
        setSessionCheckAttempts(prev => prev + 1)
        
        // Tentar novamente em 2 segundos
        const retryTimer = setTimeout(() => {
          console.log('🔄 Tentativa de verificação de sessão...')
        }, 2000)
        
        return () => clearTimeout(retryTimer)
      }
      
      // Se não há sessão local ou excedeu tentativas, redirecionar
      console.log('🚫 Redirecionando para login após verificações...')
      
      const redirectTimer = setTimeout(() => {
        console.log('⏰ Executando redirecionamento para login...')
        router.push('/login')
      }, 1000)
      
      return () => clearTimeout(redirectTimer)
    } else if (user) {
      // Reset do contador se usuário for encontrado
      setSessionCheckAttempts(0)
    }
  }, [user, loading, router, mounted, sessionCheckAttempts])

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
          <p className="mt-2 text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
