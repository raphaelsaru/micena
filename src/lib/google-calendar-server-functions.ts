import { getGoogleClient } from './google-calendar-server'
import { createServiceEvent } from './google-calendar'

// Interface para evento do calendário
export interface GoogleCalendarEvent {
  summary: string
  description?: string
  start: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  end: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  reminders?: {
    useDefault: boolean
    overrides: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

// Função para criar evento no calendário via API (server-side)
export async function createCalendarEventServer(
  userId: string,
  event: GoogleCalendarEvent,
  calendarId: string = 'primary'
): Promise<string> {
  try {
    const client = await getGoogleClient(userId)
    
    if (!client) {
      throw new Error('Usuário não autenticado com Google Calendar')
    }
    
    if (client.needsReconnect) {
      throw new Error('Usuário precisa reautenticar com Google Calendar')
    }
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Se for unauthorized, marcar para reconexão
      if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED')
      }
      
      throw new Error(`Erro ao criar evento: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`)
    }
    
    const data = await response.json()
    return data.id || ''
  } catch (error) {
    console.error('Erro ao criar evento no calendário:', error)
    throw error
  }
}

// Função para atualizar evento no calendário via API (server-side)
export async function updateCalendarEventServer(
  userId: string,
  eventId: string,
  event: GoogleCalendarEvent,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    const client = await getGoogleClient(userId)
    
    if (!client) {
      throw new Error('Usuário não autenticado com Google Calendar')
    }
    
    if (client.needsReconnect) {
      throw new Error('Usuário precisa reautenticar com Google Calendar')
    }
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Se for unauthorized, marcar para reconexão
      if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED')
      }
      
      throw new Error(`Erro ao atualizar evento: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`)
    }
  } catch (error) {
    console.error('Erro ao atualizar evento no calendário:', error)
    throw error
  }
}

// Função para deletar evento do calendário via API (server-side)
export async function deleteCalendarEventServer(
  userId: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    const client = await getGoogleClient(userId)
    
    if (!client) {
      throw new Error('Usuário não autenticado com Google Calendar')
    }
    
    if (client.needsReconnect) {
      throw new Error('Usuário precisa reautenticar com Google Calendar')
    }
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${client.accessToken}`
        }
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Se for unauthorized, marcar para reconexão
      if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED')
      }
      
      throw new Error(`Erro ao deletar evento: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`)
    }
  } catch (error) {
    console.error('Erro ao deletar evento do calendário:', error)
    throw error
  }
}

// Função para verificar se um evento ainda existe no calendário (server-side)
export async function checkEventExistsServer(
  userId: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<boolean> {
  try {
    const client = await getGoogleClient(userId)
    
    if (!client) {
      return false
    }
    
    if (client.needsReconnect) {
      return false
    }
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`
        }
      }
    )
    
    return response.ok
  } catch (error) {
    console.error('Erro ao verificar se evento existe:', error)
    return false
  }
}

// Função para listar agendas do usuário (server-side)
export async function listUserCalendarsServer(userId: string): Promise<Array<{
  id: string
  summary: string
  description?: string
  primary?: boolean
  accessRole: string
  backgroundColor?: string
  foregroundColor?: string
}>> {
  try {
    const client = await getGoogleClient(userId)
    
    if (!client) {
      throw new Error('Usuário não autenticado com Google Calendar')
    }
    
    if (client.needsReconnect) {
      throw new Error('Usuário precisa reautenticar com Google Calendar')
    }
    
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Se for unauthorized, marcar para reconexão
      if (response.status === 401) {
        throw new Error('TOKEN_EXPIRED')
      }
      
      throw new Error(`Erro ao listar agendas: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`)
    }
    
    const data = await response.json()
    
    // Filtrar apenas agendas onde o usuário pode criar eventos
    return (data.items || []).filter((calendar: { accessRole?: string }) => 
      calendar.accessRole === 'owner' || calendar.accessRole === 'writer'
    ).map((calendar: { 
      id: string; 
      summary: string; 
      description?: string; 
      primary?: boolean; 
      accessRole?: string; 
      backgroundColor?: string; 
      foregroundColor?: string; 
    }) => ({
      id: calendar.id,
      summary: calendar.summary,
      description: calendar.description,
      primary: calendar.primary || false,
      accessRole: calendar.accessRole,
      backgroundColor: calendar.backgroundColor,
      foregroundColor: calendar.foregroundColor
    }))
  } catch (error) {
    console.error('Erro ao listar agendas:', error)
    throw error
  }
}

// Função para criar evento de serviço e salvar no banco (server-side)
export async function createServiceEventAndSaveServer(
  userId: string,
  serviceId: string,
  clientName: string,
  serviceType: string,
  serviceDate: string,
  notes?: string,
  nextServiceDate?: string,
  calendarId: string = 'primary'
): Promise<string> {
  try {
    const event = createServiceEvent(clientName, serviceType, serviceDate, notes, nextServiceDate)
    const eventId = await createCalendarEventServer(userId, event, calendarId)
    
    // Salvar o google_event_id no banco de dados
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://micena.vercel.app'}/api/services/${serviceId}/google-event`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ google_event_id: eventId }),
    })
    
    if (!response.ok) {
      // Se falhar ao salvar no banco, deletar o evento do Google Calendar para evitar duplicação
      try {
        await deleteCalendarEventServer(userId, eventId, calendarId)
      } catch (deleteError) {
        console.error('Erro ao deletar evento do Google Calendar após falha no banco:', deleteError)
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(`Falha ao sincronizar: ${errorData.error || 'Erro no servidor'}`)
    }
    
    return eventId
  } catch (error) {
    console.error('Erro ao criar evento de serviço:', error)
    throw error
  }
}
