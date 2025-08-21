// Configurações do Google OAuth
const GOOGLE_CLIENT_ID = 'process.env.GOOGLE_CLIENT_ID||'''
const GOOGLE_REDIRECT_URI = 'https://micena.vercel.app/api/auth/google/callback'

// Escopos necessários para Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
]

// Interface para evento do calendário
export interface GoogleCalendarEvent {
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  reminders?: {
    useDefault: boolean
    overrides: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

// Função para gerar URL de autorização
export function generateAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    scope: SCOPES.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  })
  
  return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`
}

// Função para criar evento de serviço
export function createServiceEvent(
  clientName: string,
  serviceType: string,
  serviceDate: string,
  notes?: string,
  nextServiceDate?: string
): GoogleCalendarEvent {
  const startDate = new Date(serviceDate)
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hora de duração
  
  // Formatar data para exibição
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  let description = `Tipo de Serviço: ${serviceType}`
  if (notes) {
    description += `\n\nObservações: ${notes}`
  }
  if (nextServiceDate) {
    description += `\n\nPróximo Serviço: ${formatDate(new Date(nextServiceDate))}`
  }
  
  return {
    summary: `Atendimento Micena — ${clientName}`,
    description,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'America/Sao_Paulo'
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Sao_Paulo'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup', minutes: 60 }       // 1 hora antes
      ]
    }
  }
}

// Função para criar evento no calendário via API
export async function createCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEvent,
  calendarId: string = 'primary'
): Promise<string> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    )
    
    if (!response.ok) {
      throw new Error(`Erro ao criar evento: ${response.status}`)
    }
    
    const data = await response.json()
    return data.id || ''
  } catch (error) {
    console.error('Erro ao criar evento no calendário:', error)
    throw error
  }
}

// Função para atualizar evento no calendário via API
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: GoogleCalendarEvent,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    )
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar evento: ${response.status}`)
    }
  } catch (error) {
    console.error('Erro ao atualizar evento no calendário:', error)
    throw error
  }
}

// Função para deletar evento do calendário via API
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Erro ao deletar evento: ${response.status}`)
    }
  } catch (error) {
    console.error('Erro ao deletar evento do calendário:', error)
    throw error
  }
}
