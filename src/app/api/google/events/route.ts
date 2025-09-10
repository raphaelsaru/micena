import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { getGoogleClient } from '@/lib/google-calendar-server'
import { createServiceEvent } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { clientName, serviceType, serviceDate, notes, nextServiceDate, calendarId } = body

    // Criar evento
    const event = createServiceEvent(clientName, serviceType, serviceDate, notes, nextServiceDate)
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleClient.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    if (!response.ok) {
      console.error('❌ Erro ao criar evento no Google Calendar:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Erro ao criar evento no Google Calendar' },
        { status: response.status }
      )
    }

    const eventData = await response.json()
    
    return NextResponse.json({
      success: true,
      eventId: eventData.id
    })
    
  } catch (error) {
    console.error('❌ Erro ao criar evento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
