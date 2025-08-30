'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  checkAuthStatus: () => Promise<{ isAuthenticated: boolean; session: Session | null; user: User | null }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: 'Contexto não inicializado' }),
  signOut: async () => {},
  checkAuthStatus: async () => ({ isAuthenticated: false, session: null, user: null }),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirectedRef = useRef(false)


  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Verificar sessão atual
    const getSession = async () => {
      try {
        console.log('🔍 Verificando sessão do Supabase...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error)
        }
        
        console.log('📊 Sessão encontrada:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        })
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('❌ Erro inesperado ao verificar sessão:', error)
        setLoading(false)
      }
    }

    getSession()

        // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de estado de autenticação:', event, {
          hasSession: !!session,
          hasUser: !!session?.user,
          pathname
        })
        
        try {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
          
          // Só redirecionar se for SIGNED_OUT e não estiver na página de login
          if (event === 'SIGNED_OUT' && !hasRedirectedRef.current && pathname !== '/login') {
            console.log('🚪 Usuário deslogado, redirecionando para login...')
            hasRedirectedRef.current = true
            router.push('/login')
          }
          
          // Reset do flag se o usuário fizer login
          if (event === 'SIGNED_IN') {
            hasRedirectedRef.current = false
          }
          
        } catch (error) {
          console.error('❌ Erro ao processar evento de auth:', error)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, mounted, pathname])

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      // O Supabase por padrão mantém a sessão persistente
      // A opção "lembrar-me" é principalmente para UX, mas a sessão já é persistente
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Traduzir mensagens de erro comuns do Supabase
        let errorMessage = 'Erro durante o login'
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'E-mail ou senha incorretos'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'E-mail não confirmado. Verifique sua caixa de entrada'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos'
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Usuário não encontrado'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Formato de e-mail inválido'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres'
        } else {
          // Para outros erros, usar a mensagem original mas em português
          errorMessage = 'Erro de autenticação. Verifique suas credenciais'
        }
        
        return { error: errorMessage }
      }

      // Redirecionar para dashboard após login bem-sucedido
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        router.push('/')
      }

      return { error: null }
    } catch (error) {
      return { error: 'Erro inesperado durante o login' }
    }
  }

  const signOut = async () => {
    try {
      // Primeiro, verificar se existe uma sessão ativa
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      // Limpar o estado local primeiro
      setUser(null)
      setSession(null)
      
      // Só tentar fazer logout no Supabase se houver uma sessão ativa
      if (currentSession) {
        try {
          const { error } = await supabase.auth.signOut()
          
          if (error) {
            console.warn('Erro no logout do Supabase:', error)
            // Mesmo com erro, continuar com o logout local
          }
        } catch (supabaseError) {
          console.warn('Erro ao tentar logout no Supabase:', supabaseError)
          // Continuar com o logout local mesmo com erro
        }
      } else {
        console.log('Nenhuma sessão ativa encontrada, pulando logout do Supabase')
      }
      
      // Limpar qualquer token armazenado localmente
      try {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
      } catch (storageError) {
        console.warn('Erro ao limpar storage:', storageError)
      }
      
      // Redirecionar para login
      router.push('/login')
      
    } catch (error) {
      console.error('Erro geral ao fazer logout:', error)
      // Mesmo com erro, limpar o estado e redirecionar
      setUser(null)
      setSession(null)
      router.push('/login')
    }
  }

  // Função para verificar se o usuário está realmente autenticado
  const checkAuthStatus = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      return {
        isAuthenticated: !!currentSession?.user,
        session: currentSession,
        user: currentSession?.user || null
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status de auth:', error)
      return { isAuthenticated: false, session: null, user: null }
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    checkAuthStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context
}
