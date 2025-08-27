import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConnectionStatus } from '@/lib/google-calendar-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }
    
    const status = await getGoogleConnectionStatus(userId)
    
    return NextResponse.json({
      connected: status.connected,
      expiresAt: status.expiresAt,
      needsReconnect: status.needsReconnect
    })
    
  } catch (error) {
    console.error('Erro ao verificar status do Google Calendar:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
