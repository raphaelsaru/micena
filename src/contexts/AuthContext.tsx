'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { authClient, getAuthToken, syncSessionCookie, clearSessionCookie } from '@/lib/auth-client'
import { useRouter, usePathname } from 'next/navigation'
import { UserProfile } from '@/types/database'

interface AuthUser {
  id: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  session: { token: string } | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  checkAuthStatus: () => Promise<{ isAuthenticated: boolean; session: { token: string } | null; user: AuthUser | null }>
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
  const { data: sessionData, isPending } = authClient.useSession()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  // id do usuário pro qual perfil + cookie de sessão já foram sincronizados.
  // Derivar `loading` disso (em vez de um booleano setado só dentro do efeito)
  // evita uma janela onde `user` já mudou mas o "loading" antigo ainda não
  // tinha sido atualizado (Server Actions viam "Não autenticado" nesse meio-tempo).
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null)
  const [safetyTimedOut, setSafetyTimedOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirectedRef = useRef(false)
  const profileCache = useRef<Map<string, UserProfile | null>>(new Map())

  const user: AuthUser | null = sessionData?.user
    ? { id: sessionData.user.id, email: sessionData.user.email }
    : null

  const loadUserProfile = useCallback(async (userId: string) => {
    if (profileCache.current.has(userId)) {
      return profileCache.current.get(userId) ?? null
    }
    try {
      const token = await getAuthToken()
      const res = await fetch('/api/auth/profile', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        profileCache.current.set(userId, null)
        return null
      }
      const { profile } = await res.json()
      profileCache.current.set(userId, profile)
      return profile as UserProfile | null
    } catch {
      profileCache.current.set(userId, null)
      return null
    }
  }, [])

  // Timeout de segurança: se a sessão/perfil nunca resolverem (ex. rede
  // travada ao serviço de auth hospedado), não deixa a UI presa em loading.
  useEffect(() => {
    const timeoutId = setTimeout(() => setSafetyTimedOut(true), 8000)
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    let isMounted = true

    if (isPending) return

    if (!user) {
      setUserProfile(null)
      setSyncedUserId(null)
      if (!hasRedirectedRef.current && pathname !== '/login') {
        hasRedirectedRef.current = true
      }
      return
    }

    hasRedirectedRef.current = false
    // O cookie de sessão precisa estar setado ANTES de `loading` virar false,
    // já que outros providers (ex. MensalistasNotificationsProvider) disparam
    // Server Actions assim que deixam de ver `loading=true` — se o cookie
    // ainda não tiver sido gravado, essas chamadas veem "Não autenticado".
    Promise.all([loadUserProfile(user.id), syncSessionCookie()]).then(([profile]) => {
      if (isMounted) {
        setUserProfile(profile)
        setSyncedUserId(user.id)
      }
    })

    // Renova o cookie periodicamente, já que o JWT expira em ~15min.
    const interval = setInterval(syncSessionCookie, 10 * 60 * 1000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isPending])

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      })

      if (error) {
        let errorMessage = 'Erro durante o login'
        const msg = error.message ?? ''

        if (msg.includes('Invalid email or password') || msg.includes('invalid credentials')) {
          errorMessage = 'E-mail ou senha incorretos'
        } else if (msg.includes('not found')) {
          errorMessage = 'Usuário não encontrado'
        } else {
          errorMessage = 'Erro de autenticação. Verifique suas credenciais'
        }

        return { error: errorMessage }
      }

      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        router.push('/')
      }

      return { error: null }
    } catch {
      return { error: 'Erro inesperado durante o login' }
    }
  }

  const signOut = async () => {
    try {
      profileCache.current.clear()
      setUserProfile(null)
      await clearSessionCookie()
      await authClient.signOut()
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  const checkAuthStatus = useCallback(async () => {
    return {
      isAuthenticated: !!user,
      session: user ? { token: (await getAuthToken()) ?? '' } : null,
      user,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const value: AuthContextType = {
    user,
    session: user ? { token: '' } : null,
    // Nota: token acima é só um placeholder de compatibilidade de forma —
    // nenhum consumidor lê session.token hoje; use getAuthToken()/checkAuthStatus() para o JWT real.
    userProfile,
    loading: (isPending || (!!user && syncedUserId !== user.id)) && !safetyTimedOut,
    signIn,
    signOut,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
