import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Variáveis de ambiente do Google não configuradas' },
        { status: 500 }
      )
    }

    // Testar conexão com Google OAuth fazendo uma requisição de teste
    const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const testData = await testResponse.json()

    // Testar se conseguimos fazer uma requisição para o endpoint de token
    const tokenEndpointResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: 'test_code', // Código de teste
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || ''
      })
    })

    const tokenData = await tokenEndpointResponse.json()

    return NextResponse.json({
      success: true,
      tests: {
        googleApiReachable: testResponse.ok,
        tokenEndpointReachable: tokenEndpointResponse.status !== 0,
        tokenEndpointResponse: {
          status: tokenEndpointResponse.status,
          error: tokenData.error || null,
          errorDescription: tokenData.error_description || null
        }
      },
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao testar conexão Google OAuth',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
