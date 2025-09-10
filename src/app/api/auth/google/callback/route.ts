import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { saveInitialTokens } from '@/lib/google-calendar-server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

// URI de redirecionamento para produção
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://micena.vercel.app/api/auth/google/callback'

export async function GET(request: NextRequest) {
  // Log da requisição completa para debug
  console.log('🔍 Callback Google recebido:', {
    url: request.url,
    searchParams: new URL(request.url).searchParams.toString(),
    timestamp: new Date().toISOString()
  })

  // Validar variáveis de ambiente obrigatórias
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Variáveis de ambiente do Google OAuth não configuradas:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI
    })
    return NextResponse.json(
      { error: 'Configuração do Google OAuth incompleta' },
      { status: 500 }
    )
  }

  // Obter usuário autenticado
  const supabase = createUserServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('❌ Usuário não autenticado:', userError)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://micena.vercel.app'}/login?error=not_authenticated`
    )
  }

  console.log('✅ Usuário autenticado:', { userId: user.id })

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')
    
    console.log('📋 Parâmetros recebidos:', { code: !!code, error, state })
    
    if (error) {
      console.error('❌ Erro na autorização Google:', {
        error,
        description: searchParams.get('error_description'),
        uri: searchParams.get('error_uri')
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://micena.vercel.app'}/services?error=auth_failed&details=${encodeURIComponent(error)}`
      )
    }
    
    if (!code) {
      console.error('❌ Código de autorização não recebido')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://micena.vercel.app'}/services?error=no_code`
      )
    }
    
    // Trocar código por tokens
    console.log('🔄 Iniciando troca de código por tokens...')
    const tokenRequestBody = {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }
    
    console.log('📤 Request para Google OAuth:', {
      url: 'https://oauth2.googleapis.com/token',
      redirectUri: GOOGLE_REDIRECT_URI,
      hasCode: !!code,
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET
    })
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestBody),
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Erro ao trocar código por tokens:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorText,
        headers: Object.fromEntries(tokenResponse.headers.entries())
      })
      throw new Error(`Erro ao trocar código por tokens: ${tokenResponse.status} - ${errorText}`)
    }
    
    const tokens = await tokenResponse.json()
    console.log('✅ Tokens recebidos do Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope
    })
    
    if (!tokens.access_token) {
      console.error('❌ Access token não recebido:', tokens)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://micena.vercel.app'}/services?error=no_access_token`
      )
    }
    
    console.log('✅ Tokens do Google Calendar recebidos com sucesso')
    console.log('💾 Salvando tokens no Supabase...')
    
    // Salvar tokens no Supabase
    const saved = await saveInitialTokens(
      user.id,
      tokens.access_token,
      tokens.refresh_token || '',
      tokens.expires_in
    )
    
    if (!saved) {
      console.error('❌ Erro ao salvar tokens no Supabase')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://micena.vercel.app'}/services?error=save_tokens_failed`
      )
    }
    
    console.log('✅ Tokens salvos com sucesso no Supabase')
    
    // Redirecionar para a página de serviços com sucesso
    const redirectUrl = new URL('/services', process.env.NEXT_PUBLIC_APP_URL || 'https://micena.vercel.app')
    redirectUrl.searchParams.set('google_auth', 'success')
    
    console.log('🔄 Redirecionando para:', redirectUrl.toString())
    
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('❌ Erro no callback do Google:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://micena.vercel.app'}/services?error=callback_failed&timestamp=${Date.now()}`
    )
  }
}
