import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getGoogleClient } from '@/lib/google-calendar-server'
import { createServiceEvent } from '@/lib/google-calendar'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Obter usuário autenticado
    const supabase = createServerClient()
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
    const { eventId } = await params

    // Criar evento atualizado
    const event = createServiceEvent(clientName, serviceType, serviceDate, notes, nextServiceDate)
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${googleClient.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    if (!response.ok) {
      console.error('❌ Erro ao atualizar evento no Google Calendar:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Erro ao atualizar evento no Google Calendar' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Evento atualizado com sucesso'
    })
    
  } catch (error) {
    console.error('❌ Erro ao atualizar evento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Obter usuário autenticado
    const supabase = createServerClient()
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
    const { calendarId } = body
    const { eventId } = await params
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${googleClient.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro ao deletar evento no Google Calendar:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Erro ao deletar evento no Google Calendar' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Evento deletado com sucesso'
    })
    
  } catch (error) {
    console.error('❌ Erro ao deletar evento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
