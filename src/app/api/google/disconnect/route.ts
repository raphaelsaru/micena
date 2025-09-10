import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { disconnectGoogleCalendar } from '@/lib/google-calendar-server'

export async function POST(request: NextRequest) {
  try {
    // Obter usuário autenticado
    const supabase = createUserServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Desconectar Google Calendar
    const success = await disconnectGoogleCalendar(user.id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao desconectar Google Calendar' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Google Calendar desconectado com sucesso'
    })
    
  } catch (error) {
    console.error('❌ Erro ao desconectar Google Calendar:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}