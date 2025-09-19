import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Função para verificar se estamos no cliente
const isClient = () => typeof window !== 'undefined'

// Função para obter item do storage de forma segura
const safeGetItem = (key: string): string | null => {
  if (!isClient()) return null
  
  try {
    // Tentar localStorage primeiro
    const item = localStorage.getItem(key)
    if (item) return item
    
    // Se não encontrar no localStorage, tentar cookies
    if (document.cookie) {
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === key) {
          return decodeURIComponent(value)
        }
      }
    }
  } catch (error) {
    console.warn('Erro ao acessar storage:', error)
  }
  
  return null
}

// Função para definir item no storage de forma segura
const safeSetItem = (key: string, value: string): void => {
  if (!isClient()) return
  
  try {
    // Salvar no localStorage
    localStorage.setItem(key, value)
    
    // Também salvar como cookie para o servidor acessar
    const expires = new Date()
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 dias
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`
  } catch (error) {
    console.warn('Erro ao salvar no storage:', error)
  }
}

// Função para remover item do storage de forma segura
const safeRemoveItem = (key: string): void => {
  if (!isClient()) return
  
  try {
    localStorage.removeItem(key)
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  } catch (error) {
    console.warn('Erro ao remover do storage:', error)
  }
}

// Criar uma única instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Desabilitar para evitar conflitos
    flowType: 'pkce',
    storage: {
      getItem: safeGetItem,
      setItem: safeSetItem,
      removeItem: safeRemoveItem
    }
  }
})

// Cliente para operações server-side (com service role)
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está configurado')
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurado')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Cliente para operações que precisam verificar autenticação do usuário
export const createUserServerClient = (request?: Request) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está configurado')
  }
  
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurado')
  }
  
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          if (request) {
            // No servidor, ler dos cookies da requisição
            const cookies = request.headers.get('cookie')
            if (cookies) {
              const cookieList = cookies.split(';')
              for (const cookie of cookieList) {
                const [name, value] = cookie.trim().split('=')
                if (name === key) {
                  return decodeURIComponent(value)
                }
              }
            }
          }
          return null
        },
        setItem: () => {
          // No servidor, não podemos definir cookies
        },
        removeItem: () => {
          // No servidor, não podemos remover cookies
        }
      }
    }
  })
}
