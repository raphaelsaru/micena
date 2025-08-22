// Configurações do Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''

// URI de redirecionamento baseada no ambiente
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.GOOGLE_REDIRECT_URI_PRODUCTION || 'https://micena.vercel.app/api/auth/google/callback'
  }
  return process.env.GOOGLE_REDIRECT_URI_DEVELOPMENT || 'http://localhost:3000/api/auth/google/callback'
}

const GOOGLE_REDIRECT_URI = getRedirectUri()

// Escopos necessários para Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
]

// Interface para agenda do Google Calendar
export interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
  accessRole: string
  backgroundColor?: string
  foregroundColor?: string
}

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

// Função para gerar URL de autorização
export function generateAuthUrl(): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID não configurado')
  }

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
  
  // Garantir que a data esteja no formato YYYY-MM-DD para eventos de dia inteiro
  let formattedDate = serviceDate
  if (serviceDate.includes('T')) {
    // Se a data tem informações de hora, extrair apenas a data
    formattedDate = serviceDate.split('T')[0]
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
    // Se não está no formato correto, tentar converter
    try {
      const date = new Date(serviceDate)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      formattedDate = `${year}-${month}-${day}`
    } catch {
      // Se falhar, usar a data original
      formattedDate = serviceDate
    }
  }
  
  // Criar evento de dia inteiro (sem horário específico)
  return {
    summary: `Atendimento Micena — ${clientName}`,
    description,
    start: {
      date: formattedDate // Formato YYYY-MM-DD para eventos de dia inteiro
    },
    end: {
      date: formattedDate // Mesmo dia para eventos de dia inteiro
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

// Função para listar agendas do usuário
export async function listUserCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Erro ao listar agendas: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Filtrar apenas agendas onde o usuário pode criar eventos
    return (data.items || []).filter((calendar: any) => 
      calendar.accessRole === 'owner' || calendar.accessRole === 'writer'
    ).map((calendar: any) => ({
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

// Função para verificar se um evento ainda existe no calendário
export async function checkEventExists(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    return response.ok
  } catch (error) {
    console.error('Erro ao verificar se evento existe:', error)
    return false
  }
}

// Função para buscar eventos por título e data (para detectar duplicados)
export async function findEventsByTitleAndDate(
  accessToken: string,
  title: string,
  date: string,
  calendarId: string = 'primary'
): Promise<Array<{ id: string, summary: string, start: { date?: string } }>> {
  try {
    // Buscar eventos na data específica
    const timeMin = new Date(date + 'T00:00:00Z').toISOString()
    const timeMax = new Date(date + 'T23:59:59Z').toISOString()
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
      `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar eventos: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Filtrar eventos com título similar
    return (data.items || []).filter((event: any) => 
      event.summary && event.summary.includes(title.split('—')[1]?.trim() || '')
    ).map((event: any) => ({
      id: event.id,
      summary: event.summary,
      start: event.start
    }))
  } catch (error) {
    console.error('Erro ao buscar eventos por título e data:', error)
    return []
  }
}
