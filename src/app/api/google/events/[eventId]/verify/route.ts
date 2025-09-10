import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { getGoogleClient } from '@/lib/google-calendar-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
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

    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId') || 'primary'
    const { eventId } = await params
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${googleClient.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 404) {
      return NextResponse.json({
        success: true,
        exists: false
      })
    }

    if (!response.ok) {
      console.error('❌ Erro ao verificar evento no Google Calendar:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Erro ao verificar evento no Google Calendar' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      exists: true
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar evento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
