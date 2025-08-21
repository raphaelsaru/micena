import { NextRequest, NextResponse } from 'next/server'
import { generateAuthUrl } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const authUrl = generateAuthUrl()
    
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


