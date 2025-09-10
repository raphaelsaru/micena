import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { getGoogleConnectionStatus } from '@/lib/google-calendar-server'

export async function GET(request: NextRequest) {
  try {
    // Obter usuário autenticado
    const supabase = createUserServerClient(request)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar status da conexão Google
    const status = await getGoogleConnectionStatus(user.id)
    
    return NextResponse.json({
      success: true,
      data: status
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar status do Google Calendar:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}