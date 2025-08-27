import { NextRequest, NextResponse } from 'next/server'
import { saveInitialTokens } from '@/lib/google-calendar-server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

// URI de redirecionamento baseada no ambiente
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.GOOGLE_REDIRECT_URI_PRODUCTION || 'https://micena.vercel.app/api/auth/google/callback'
  }
  return process.env.GOOGLE_REDIRECT_URI_DEVELOPMENT || 'http://localhost:3000/api/auth/google/callback'
}

const GOOGLE_REDIRECT_URI = getRedirectUri()

export async function GET(request: NextRequest) {
  // Validar variáveis de ambiente obrigatórias
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Variáveis de ambiente do Google OAuth não configuradas')
    return NextResponse.json(
      { error: 'Configuração do Google OAuth incompleta' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      console.error('Erro na autorização Google:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/services?error=auth_failed`
      )
    }
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/services?error=no_code`
      )
    }
    
    // Trocar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    })
    
    if (!tokenResponse.ok) {
      throw new Error(`Erro ao trocar código por tokens: ${tokenResponse.status}`)
    }
    
    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/services?error=no_access_token`
      )
    }
    
    // Salvar tokens no banco de dados (usando ID fixo para usuário principal)
    const userId = '00000000-0000-0000-0000-000000000001' // ID fixo para usuário principal
    const saved = await saveInitialTokens(
      userId,
      tokens.access_token,
      tokens.refresh_token || '',
      tokens.expires_in || 3600
    )
    
    if (!saved) {
      console.error('Erro ao salvar tokens no banco')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/services?error=save_failed`
      )
    }
    
    // Redirecionar para a página de serviços com os tokens
    const redirectUrl = new URL('/services', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    redirectUrl.searchParams.set('auth_success', 'true')
    redirectUrl.searchParams.set('access_token', tokens.access_token)
    
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)
    }
    
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Erro no callback do Google:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/services?error=callback_failed`
    )
  }
}
