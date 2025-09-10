import { createServerClient } from '@/lib/supabase'

// Configurações do Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

// Interface para tokens do Google
interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_at: string
  needs_reconnect: boolean
}

// Interface para resposta de refresh de token
interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

// Função para obter tokens de um usuário do banco
async function getUserGoogleTokens(userId: string): Promise<GoogleTokens | null> {
  const supabase = createServerClient()
  
  try {
    const { data, error } = await supabase.rpc('get_user_google_tokens', {
      p_user_id: userId
    })
    
    if (error) {
      console.error('Erro ao obter tokens do usuário:', error)
      return null
    }
    
    if (!data || data.length === 0) {
      return null
    }
    
    const tokens = data[0]
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      needs_reconnect: tokens.needs_reconnect
    }
  } catch (error) {
    console.error('Erro ao obter tokens do usuário:', error)
    return null
  }
}

// Função para salvar tokens de um usuário no banco
async function saveUserGoogleTokens(
  userId: string, 
  accessToken: string, 
  refreshToken: string, 
  expiresIn: number
): Promise<boolean> {
  const supabase = createServerClient()
  
  try {
    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    
    const { error } = await supabase.rpc('upsert_user_google_tokens', {
      p_user_id: userId,
      p_access_token: accessToken,
      p_refresh_token: refreshToken,
      p_expires_at: expiresAt,
      p_calendar_id: null
    })
    
    if (error) {
      console.error('❌ Erro ao salvar tokens do usuário:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Erro ao salvar tokens do usuário:', error)
    return false
  }
}

// Função para marcar tokens como precisando de reconexão
async function markTokensNeedReconnect(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  
  try {
    const { error } = await supabase.rpc('mark_user_google_tokens_needs_reconnect', {
      p_user_id: userId
    })
    
    if (error) {
      console.error('Erro ao marcar tokens para reconexão:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Erro ao marcar tokens para reconexão:', error)
    return false
  }
}

// Função para deletar tokens de um usuário
async function deleteUserGoogleTokens(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  
  try {
    const { error } = await supabase.rpc('delete_user_google_tokens', {
      p_user_id: userId
    })
    
    if (error) {
      console.error('Erro ao deletar tokens do usuário:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Erro ao deletar tokens do usuário:', error)
    return false
  }
}

// Função para verificar se um usuário tem tokens válidos
async function hasValidGoogleTokens(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  
  try {
    const { data, error } = await supabase.rpc('has_valid_google_tokens', {
      p_user_id: userId
    })
    
    if (error) {
      console.error('Erro ao verificar tokens válidos:', error)
      return false
    }
    
    return data || false
  } catch (error) {
    console.error('Erro ao verificar tokens válidos:', error)
    return false
  }
}

// Função para atualizar access_token usando refresh_token
async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Se for invalid_grant, o refresh_token expirou
      if (errorData.error === 'invalid_grant') {
        return null
      }
      
      throw new Error(`Erro ao atualizar token: ${response.status} - ${errorData.error || 'Erro desconhecido'}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erro ao atualizar access_token:', error)
    return null
  }
}

// Função principal para obter um client válido do Google Calendar
export async function getGoogleClient(userId: string): Promise<{
  accessToken: string
  needsReconnect: boolean
} | null> {
  try {
    // Obter tokens do usuário
    const tokens = await getUserGoogleTokens(userId)
    
    if (!tokens) {
      return null
    }
    
    // Se os tokens precisam de reconexão, retornar null
    if (tokens.needs_reconnect) {
      return { accessToken: '', needsReconnect: true }
    }
    
    // Verificar se o access_token ainda é válido
    const now = new Date()
    const expiresAt = new Date(tokens.expires_at)
    
    if (now < expiresAt) {
      // Token ainda válido
      return { accessToken: tokens.access_token, needsReconnect: false }
    }
    
    // Token expirado, tentar renovar
    console.log('Access token expirado, tentando renovar...')
    
    const refreshResponse = await refreshAccessToken(tokens.refresh_token)
    
    if (!refreshResponse) {
      // Refresh token inválido, marcar para reconexão
      await markTokensNeedReconnect(userId)
      return { accessToken: '', needsReconnect: true }
    }
    
    // Salvar novos tokens
    const saved = await saveUserGoogleTokens(
      userId,
      refreshResponse.access_token,
      refreshResponse.refresh_token || tokens.refresh_token, // Usar novo se fornecido
      refreshResponse.expires_in
    )
    
    if (!saved) {
      console.error('Erro ao salvar tokens renovados')
      return null
    }
    
    return { accessToken: refreshResponse.access_token, needsReconnect: false }
    
  } catch (error) {
    console.error('Erro ao obter client do Google Calendar:', error)
    return null
  }
}

// Função para salvar tokens após autenticação inicial
export async function saveInitialTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<boolean> {
  return saveUserGoogleTokens(userId, accessToken, refreshToken, expiresIn)
}

// Função para verificar status da conexão
export async function getGoogleConnectionStatus(userId: string): Promise<{
  connected: boolean
  expiresAt?: string
  needsReconnect: boolean
}> {
  try {
    const tokens = await getUserGoogleTokens(userId)
    
    if (!tokens) {
      return { connected: false, needsReconnect: false }
    }
    
    if (tokens.needs_reconnect) {
      return { connected: false, needsReconnect: true }
    }
    
    const now = new Date()
    const expiresAt = new Date(tokens.expires_at)
    
    if (now >= expiresAt) {
      // Token expirado, tentar renovar
      const refreshResponse = await refreshAccessToken(tokens.refresh_token)
      
      if (refreshResponse) {
        // Renovação bem-sucedida
        await saveUserGoogleTokens(
          userId,
          refreshResponse.access_token,
          refreshResponse.refresh_token || tokens.refresh_token,
          refreshResponse.expires_in
        )
        
        const newExpiresAt = new Date(Date.now() + refreshResponse.expires_in * 1000)
        return { 
          connected: true, 
          expiresAt: newExpiresAt.toISOString(),
          needsReconnect: false
        }
      } else {
        // Falha na renovação, marcar para reconexão
        await markTokensNeedReconnect(userId)
        return { connected: false, needsReconnect: true }
      }
    }
    
    return { 
      connected: true, 
      expiresAt: tokens.expires_at,
      needsReconnect: false
    }
    
  } catch (error) {
    console.error('Erro ao verificar status da conexão:', error)
    return { connected: false, needsReconnect: false }
  }
}

// Função para desconectar usuário
export async function disconnectGoogleCalendar(userId: string): Promise<boolean> {
  return deleteUserGoogleTokens(userId)
}

// Função para marcar tokens como precisando de reconexão (para casos de erro)
export async function markForReconnection(userId: string): Promise<boolean> {
  return markTokensNeedReconnect(userId)
}
