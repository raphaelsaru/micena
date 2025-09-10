import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { getGoogleClient } from '@/lib/google-calendar-server'

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

    // Obter client do Google
    const googleClient = await getGoogleClient(user.id)
    
    if (!googleClient) {
      return NextResponse.json(
        { error: 'Google Calendar não conectado' },
        { status: 400 }
      )
    }

    if (googleClient.needsReconnect) {
      return NextResponse.json(
        { error: 'Reconexão necessária', needsReconnect: true },
        { status: 400 }
      )
    }

    // Buscar calendários
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${googleClient.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro ao buscar calendários:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Erro ao buscar calendários do Google' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data.items || []
    })
    
  } catch (error) {
    console.error('❌ Erro ao buscar calendários:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
