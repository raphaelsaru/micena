import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  createServiceEvent as createServiceEventUtil,
  listUserCalendars,
  checkEventExists,
  GoogleCalendar
} from '@/lib/google-calendar'

interface GoogleCalendarTokens {
  accessToken: string
  refreshToken?: string
}

export function useGoogleCalendar() {
  const [tokens, setTokens] = useState<GoogleCalendarTokens | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary')
  const searchParams = useSearchParams()

  // Verificar tokens na URL ao carregar
  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const authSuccess = searchParams.get('auth_success')

    if (authSuccess === 'true' && accessToken) {
      const newTokens: GoogleCalendarTokens = { accessToken }
      if (refreshToken) {
        newTokens.refreshToken = refreshToken
      }
      
      setTokens(newTokens)
      setIsAuthenticated(true)
      
      // Salvar tokens no localStorage
      localStorage.setItem('google_calendar_tokens', JSON.stringify(newTokens))
      
      // Limpar URL
      const url = new URL(window.location.href)
      url.searchParams.delete('access_token')
      url.searchParams.delete('refresh_token')
      url.searchParams.delete('auth_success')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Verificar tokens salvos no localStorage
  useEffect(() => {
    const savedTokens = localStorage.getItem('google_calendar_tokens')
    if (savedTokens) {
      try {
        const parsedTokens = JSON.parse(savedTokens) as GoogleCalendarTokens
        setTokens(parsedTokens)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Erro ao parsear tokens salvos:', error)
        localStorage.removeItem('google_calendar_tokens')
      }
    }

    // Carregar calendário selecionado salvo
    const savedCalendarId = localStorage.getItem('selected_calendar_id')
    if (savedCalendarId) {
      setSelectedCalendarId(savedCalendarId)
    }
  }, [])

  // Carregar agendas quando autenticado
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken) {
      loadCalendars()
    }
  }, [isAuthenticated, tokens?.accessToken])

  // Função para iniciar autenticação
  const startAuth = useCallback(() => {
    window.location.href = '/api/auth/google/login'
  }, [])

  // Função para desconectar
  const disconnect = useCallback(() => {
    setTokens(null)
    setIsAuthenticated(false)
    setCalendars([])
    setSelectedCalendarId('primary')
    localStorage.removeItem('google_calendar_tokens')
    localStorage.removeItem('selected_calendar_id')
  }, [])

  // Função para carregar agendas
  const loadCalendars = useCallback(async () => {
    if (!tokens?.accessToken) return

    setIsLoading(true)
    try {
      const userCalendars = await listUserCalendars(tokens.accessToken)
      setCalendars(userCalendars)
      
      // Se não há calendário selecionado, usar o principal
      if (selectedCalendarId === 'primary' && userCalendars.length > 0) {
        const primaryCalendar = userCalendars.find(cal => cal.primary)
        if (primaryCalendar) {
          setSelectedCalendarId(primaryCalendar.id)
          localStorage.setItem('selected_calendar_id', primaryCalendar.id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar agendas:', error)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, selectedCalendarId])

  // Função para selecionar calendário
  const selectCalendar = useCallback((calendarId: string) => {
    setSelectedCalendarId(calendarId)
    localStorage.setItem('selected_calendar_id', calendarId)
  }, [])

  // Função para criar evento de serviço
  const createServiceEvent = useCallback(async (
    clientName: string,
    serviceType: string,
    serviceDate: string,
    notes?: string,
    nextServiceDate?: string
  ): Promise<string> => {
    if (!tokens?.accessToken) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const event = createServiceEventUtil(clientName, serviceType, serviceDate, notes, nextServiceDate)
      const eventId = await createCalendarEvent(tokens.accessToken, event, selectedCalendarId)
      return eventId
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, selectedCalendarId])

  // Função para criar evento de serviço e salvar no banco
  const createServiceEventAndSave = useCallback(async (
    serviceId: string,
    clientName: string,
    serviceType: string,
    serviceDate: string,
    notes?: string,
    nextServiceDate?: string
  ): Promise<string> => {
    if (!tokens?.accessToken) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const event = createServiceEventUtil(clientName, serviceType, serviceDate, notes, nextServiceDate)
      const eventId = await createCalendarEvent(tokens.accessToken, event, selectedCalendarId)
      
      // Salvar o google_event_id no banco de dados
      await fetch(`/api/services/${serviceId}/google-event`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ google_event_id: eventId }),
      })
      
      return eventId
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, selectedCalendarId])

  // Função para atualizar evento de serviço
  const updateServiceEvent = useCallback(async (
    eventId: string,
    clientName: string,
    serviceType: string,
    serviceDate: string,
    notes?: string,
    nextServiceDate?: string
  ): Promise<void> => {
    if (!tokens?.accessToken) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const event = createServiceEventUtil(clientName, serviceType, serviceDate, notes, nextServiceDate)
      await updateCalendarEvent(tokens.accessToken, eventId, event, selectedCalendarId)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, selectedCalendarId])

  // Função para atualizar evento de serviço e salvar no banco
  const updateServiceEventAndSave = useCallback(async (
    serviceId: string,
    eventId: string,
    clientName: string,
    serviceType: string,
    serviceDate: string,
    notes?: string,
    nextServiceDate?: string
  ): Promise<void> => {
    if (!tokens?.accessToken) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const event = createServiceEventUtil(clientName, serviceType, serviceDate, notes, nextServiceDate)
      await updateCalendarEvent(tokens.accessToken, eventId, event, selectedCalendarId)
      
      // Atualizar o google_event_id no banco de dados (caso tenha mudado)
      await fetch(`/api/services/${serviceId}/google-event`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ google_event_id: eventId }),
      })
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, selectedCalendarId])

  // Função para deletar evento de serviço
  const deleteServiceEvent = useCallback(async (eventId: string): Promise<void> => {
    if (!tokens?.accessToken) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      await deleteCalendarEvent(tokens.accessToken, eventId, selectedCalendarId)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, selectedCalendarId])

  // Função para verificar se um evento ainda existe
  const verifyEventExists = useCallback(async (eventId: string): Promise<boolean> => {
    if (!tokens?.accessToken) {
      return false
    }

    try {
      return await checkEventExists(tokens.accessToken, eventId, selectedCalendarId)
    } catch (error) {
      console.error('Erro ao verificar evento:', error)
      return false
    }
  }, [tokens?.accessToken, selectedCalendarId])

  return {
    tokens,
    isAuthenticated,
    isLoading,
    calendars,
    selectedCalendarId,
    startAuth,
    disconnect,
    loadCalendars,
    selectCalendar,
    createServiceEvent,
    createServiceEventAndSave,
    updateServiceEvent,
    updateServiceEventAndSave,
    deleteServiceEvent,
    verifyEventExists
  }
}
