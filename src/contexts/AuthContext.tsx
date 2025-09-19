'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { UserProfile } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  checkAuthStatus: () => Promise<{ isAuthenticated: boolean; session: Session | null; user: User | null }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  signIn: async () => ({ error: 'Contexto não inicializado' }),
  signOut: async () => {},
  checkAuthStatus: async () => ({ isAuthenticated: false, session: null, user: null }),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirectedRef = useRef(false)

  // Cache para evitar múltiplas chamadas do mesmo perfil
  const profileCache = useRef<Map<string, UserProfile | null>>(new Map())

  // Função para carregar o perfil do usuário
  const loadUserProfile = useCallback(async (userId: string) => {
    // Verificar cache primeiro
    if (profileCache.current.has(userId)) {
      console.log('📊 Perfil do usuário carregado do cache:', userId)
      return profileCache.current.get(userId)
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Erro ao carregar perfil do usuário:', error)
        profileCache.current.set(userId, null)
        return null
      }

      console.log('📊 Perfil do usuário carregado:', data)
      profileCache.current.set(userId, data)
      return data
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar perfil:', error)
      profileCache.current.set(userId, null)
      return null
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    
    // Verificar se o storage está funcionando
    if (typeof window !== 'undefined') {
      try {
        const testKey = 'supabase-auth-test'
        localStorage.setItem(testKey, 'test')
        const testValue = localStorage.getItem(testKey)
        localStorage.removeItem(testKey)
        
        if (testValue !== 'test') {
          console.warn('⚠️ localStorage pode não estar funcionando corretamente')
        } else {
          console.log('✅ localStorage funcionando corretamente')
        }
      } catch (error) {
        console.warn('⚠️ Erro ao testar localStorage:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isInitialized = false

    // Função para processar mudanças de sessão
    const processSessionChange = async (session: Session | null, event?: string) => {
      try {
        console.log('🔄 Processando mudança de sessão:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          pathname
        })
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Carregar perfil do usuário se existir sessão
        if (session?.user?.id) {
          try {
            console.log('👤 Carregando perfil do usuário:', session.user.id)
            
            // Adicionar timeout para o carregamento do perfil
            const profilePromise = loadUserProfile(session.user.id)
            const timeoutPromise = new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout no carregamento do perfil')), 5000)
            )
            
            const profile = await Promise.race([profilePromise, timeoutPromise])
            setUserProfile(profile)
            console.log('✅ Perfil carregado:', profile ? 'sim' : 'não')
          } catch (error) {
            console.error('❌ Erro ao carregar perfil:', error)
            setUserProfile(null)
          }
        } else {
          setUserProfile(null)
        }
        
        // Marcar como não carregando se for a sessão inicial ou se já foi inicializado
        if (event === 'INITIAL_SESSION' || isInitialized) {
          setLoading(false)
        }
        
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
        console.error('❌ Erro ao processar mudança de sessão:', error)
        if (isInitialized) {
          setLoading(false)
        }
      }
    }

    // Verificar sessão inicial
    const initializeAuth = async () => {
      try {
        console.log('🔍 Inicializando autenticação...')

        // Adicionar um pequeno delay para garantir que o DOM esteja pronto
        await new Promise(resolve => setTimeout(resolve, 100))

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Erro ao verificar sessão inicial:', error)
          // Mesmo com erro, marcar como inicializado para evitar loops
          isInitialized = true
          setLoading(false)
          return
        }

        console.log('📋 Sessão inicial obtida:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        })

        // Processar sessão de forma mais simples
        setSession(session)
        setUser(session?.user ?? null)
        
        // Carregar perfil de forma assíncrona sem bloquear a inicialização
        if (session?.user?.id) {
          loadUserProfile(session.user.id)
            .then(profile => {
              setUserProfile(profile)
              console.log('✅ Perfil carregado assincronamente:', profile ? 'sim' : 'não')
            })
            .catch(error => {
              console.error('❌ Erro ao carregar perfil assincronamente:', error)
              setUserProfile(null)
            })
        } else {
          setUserProfile(null)
        }
        
        isInitialized = true
        setLoading(false)
        console.log('✅ Inicialização da autenticação concluída')

      } catch (error) {
        console.error('❌ Erro inesperado na inicialização:', error)
        isInitialized = true
        setLoading(false)
        // Garantir que o estado seja limpo em caso de erro
        setSession(null)
        setUser(null)
        setUserProfile(null)
      }
    }

    // Inicializar autenticação
    initializeAuth()

    // Timeout de segurança para evitar loading infinito
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.warn('⚠️ Timeout na inicialização da autenticação, forçando finalização')
        isInitialized = true
        setLoading(false)
        // Tentar verificar se há uma sessão válida mesmo com timeout
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log('🔄 Sessão encontrada após timeout, atualizando estado...')
            setSession(session)
            setUser(session.user)
            if (session.user?.id) {
              loadUserProfile(session.user.id).then(setUserProfile)
            }
          }
        }).catch(console.error)
      }
    }, 5000) // 5 segundos de timeout (reduzido)

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', { event, hasSession: !!session, isInitialized })
        
        // Evitar processar eventos durante a inicialização, exceto INITIAL_SESSION
        if (!isInitialized && event !== 'INITIAL_SESSION') {
          console.log('⏳ Pulando evento durante inicialização:', event)
          return
        }

        await processSessionChange(session, event)
      }
    )

    // Verificação adicional após um delay para garantir que a sessão seja recuperada
    const delayedSessionCheck = setTimeout(async () => {
      if (!isInitialized) {
        try {
          const { data: { session: delayedSession } } = await supabase.auth.getSession()
          if (delayedSession && !session) {
            console.log('🔄 Sessão encontrada em verificação tardia, atualizando estado...')
            await processSessionChange(delayedSession, 'DELAYED_CHECK')
            isInitialized = true
            setLoading(false)
          }
        } catch (error) {
          console.warn('Erro na verificação tardia de sessão:', error)
        }
      }
    }, 2000) // 2 segundos após a inicialização

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
      clearTimeout(delayedSessionCheck)
    }
  }, [router, mounted, pathname, loadUserProfile])

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
      setUserProfile(null)
      
      // Limpar cache de perfis
      profileCache.current.clear()
      
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
      setUserProfile(null)
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
    userProfile,
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
