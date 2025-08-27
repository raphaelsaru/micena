'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: 'Contexto não inicializado' }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Verificar sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN') {
          router.push('/')
        } else if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, mounted])

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      // O Supabase por padrão mantém a sessão persistente
      // A opção "lembrar-me" é principalmente para UX, mas a sessão já é persistente
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: 'Erro inesperado durante o login' }
    }
  }

  const signOut = async () => {
    try {
      // Primeiro, limpar o estado local
      setUser(null)
      setSession(null)
      
      // Tentar fazer logout no Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.warn('Erro no logout do Supabase:', error)
        // Mesmo com erro, continuar com o logout local
      }
      
      // Limpar qualquer token armazenado localmente
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')
      
      // Redirecionar para login
      router.push('/login')
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, limpar o estado e redirecionar
      setUser(null)
      setSession(null)
      router.push('/login')
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
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
