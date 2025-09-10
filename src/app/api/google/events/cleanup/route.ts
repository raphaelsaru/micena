import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { getGoogleClient } from '@/lib/google-calendar-server'

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
    const { clientName, serviceDate, calendarId } = body

    // Buscar eventos com o título específico na data
    const searchQuery = `Atendimento Micena — ${clientName}`
    const timeMin = new Date(serviceDate).toISOString()
    const timeMax = new Date(new Date(serviceDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
    
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?q=${encodeURIComponent(searchQuery)}&timeMin=${timeMin}&timeMax=${timeMax}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${googleClient.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Erro ao buscar eventos no Google Calendar:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Erro ao buscar eventos no Google Calendar' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const events = data.items || []
    
    // Se há mais de um evento, deletar os extras (manter apenas o primeiro)
    if (events.length > 1) {
      const eventsToDelete = events.slice(1) // Pegar todos exceto o primeiro
      const deletedEventIds = []
      
      for (const event of eventsToDelete) {
        try {
          const deleteResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${googleClient.accessToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (deleteResponse.ok) {
            deletedEventIds.push(event.id)
          }
        } catch (error) {
          console.error('Erro ao deletar evento duplicado:', error)
        }
      }
      
      return NextResponse.json({
        success: true,
        deletedEventIds,
        message: `${deletedEventIds.length} eventos duplicados removidos`
      })
    }
    
    return NextResponse.json({
      success: true,
      deletedEventIds: [],
      message: 'Nenhum evento duplicado encontrado'
    })
    
  } catch (error) {
    console.error('❌ Erro ao limpar eventos duplicados:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
