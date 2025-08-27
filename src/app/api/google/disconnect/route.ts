import { NextRequest, NextResponse } from 'next/server'
import { disconnectGoogleCalendar } from '@/lib/google-calendar-server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }
    
    const success = await disconnectGoogleCalendar(userId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao desconectar Google Calendar' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erro ao desconectar Google Calendar:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
