import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Simular um callback do Google com parâmetros de teste
    const testCode = 'test_authorization_code_123'
    
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Variáveis de ambiente do Google não configuradas' },
        { status: 500 }
      )
    }

    // Obter usuário autenticado
    const supabase = createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado', details: userError },
        { status: 401 }
      )
    }

    // Testar troca de código por token
    const tokenRequestBody = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code: testCode,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
    }
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestBody),
    })
    
    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      success: true,
      test: 'Google Callback Simulation',
      results: {
        userAuthenticated: !!user,
        userId: user.id,
        tokenRequestStatus: tokenResponse.status,
        tokenRequestOk: tokenResponse.ok,
        tokenResponse: {
          error: tokenData.error || null,
          errorDescription: tokenData.error_description || null,
          hasAccessToken: !!tokenData.access_token,
          hasRefreshToken: !!tokenData.refresh_token
        },
        config: {
          clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
          redirectUri: process.env.GOOGLE_REDIRECT_URI,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
        }
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao testar callback do Google',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
