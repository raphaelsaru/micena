import { NextRequest, NextResponse } from 'next/server'
import { generateAuthUrl } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'GOOGLE_CLIENT_ID não configurado' },
        { status: 500 }
      )
    }

    if (!process.env.GOOGLE_REDIRECT_URI) {
      return NextResponse.json(
        { error: 'GOOGLE_REDIRECT_URI não configurado' },
        { status: 500 }
      )
    }

    // Gerar URL de autenticação
    const authUrl = generateAuthUrl()
    
    return NextResponse.json({
      success: true,
      url: authUrl,
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        scopes: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao gerar URL de autenticação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
