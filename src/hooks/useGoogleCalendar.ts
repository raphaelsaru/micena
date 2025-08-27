import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  createServiceEvent as createServiceEventUtil,
  listUserCalendars,
  checkEventExists,
  findEventsByTitleAndDate,
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
  const [needsReconnect, setNeedsReconnect] = useState(false)
  const searchParams = useSearchParams()

  // ID fixo para usuário principal (mesmo usado no servidor)
  const userId = '00000000-0000-0000-0000-000000000001'

  // Verificar status da conexão via API
  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/google/status?userId=${userId}`)
      if (response.ok) {
        const status = await response.json()
        setIsAuthenticated(status.connected)
        setNeedsReconnect(status.needsReconnect)
        
        // Se precisa reconectar, limpar tokens locais
        if (status.needsReconnect) {
          setTokens(null)
          setCalendars([])
          localStorage.removeItem('google_calendar_tokens')
          localStorage.removeItem('selected_calendar_id')
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status da conexão:', error)
    }
  }, [])

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
      setNeedsReconnect(false)
      
      // Salvar tokens no localStorage (fallback)
      localStorage.setItem('google_calendar_tokens', JSON.stringify(newTokens))
      
      // Limpar URL
      const url = new URL(window.location.href)
      url.searchParams.delete('access_token')
      url.searchParams.delete('refresh_token')
      url.searchParams.delete('auth_success')
      window.history.replaceState({}, '', url.toString())
      
      // Verificar status da conexão
      checkConnectionStatus()
    }
  }, [searchParams, checkConnectionStatus])

  // Verificar tokens salvos no localStorage e status da conexão
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

    // Verificar status da conexão
    checkConnectionStatus()
  }, [checkConnectionStatus])

  // Função para carregar agendas
  const loadCalendars = useCallback(async () => {
    if (!isAuthenticated || needsReconnect) return

    setIsLoading(true)
    try {
      const userCalendars = await listUserCalendars(tokens?.accessToken || '')
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
      // Se der erro de autenticação, verificar status
      if (error instanceof Error && error.message.includes('401')) {
        checkConnectionStatus()
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, needsReconnect, tokens?.accessToken, selectedCalendarId, checkConnectionStatus])

  // Carregar agendas quando autenticado
  useEffect(() => {
    if (isAuthenticated && !needsReconnect) {
      loadCalendars()
    }
  }, [isAuthenticated, needsReconnect, loadCalendars])

  // Função para iniciar autenticação
  const startAuth = useCallback(() => {
    window.location.href = '/api/auth/google/login'
  }, [])

  // Função para desconectar
  const disconnect = useCallback(async () => {
    try {
      // Chamar API para desconectar
      await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
    } catch (error) {
      console.error('Erro ao desconectar via API:', error)
    }
    
    // Limpar estado local
    setTokens(null)
    setIsAuthenticated(false)
    setNeedsReconnect(false)
    setCalendars([])
    setSelectedCalendarId('primary')
    localStorage.removeItem('google_calendar_tokens')
    localStorage.removeItem('selected_calendar_id')
  }, [])

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
    if (!isAuthenticated || needsReconnect) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const event = createServiceEventUtil(clientName, serviceType, serviceDate, notes, nextServiceDate)
      const eventId = await createCalendarEvent(tokens?.accessToken || '', event, selectedCalendarId)
      return eventId
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, needsReconnect, tokens?.accessToken, selectedCalendarId])

  // Função para criar evento de serviço e salvar no banco
  const createServiceEventAndSave = useCallback(async (
    serviceId: string,
    clientName: string,
    serviceType: string,
    serviceDate: string,
    notes?: string,
    nextServiceDate?: string
  ): Promise<string> => {
    if (!isAuthenticated || needsReconnect) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const event = createServiceEventUtil(clientName, serviceType, serviceDate, notes, nextServiceDate)
      const eventId = await createCalendarEvent(tokens?.accessToken || '', event, selectedCalendarId)
      
      // Salvar o google_event_id no banco de dados
      const response = await fetch(`/api/services/${serviceId}/google-event`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ google_event_id: eventId }),
      })
      
      if (!response.ok) {
        // Se falhar ao salvar no banco, deletar o evento do Google Calendar para evitar duplicação
        try {
          await deleteCalendarEvent(tokens?.accessToken || '', eventId, selectedCalendarId)
        } catch (deleteError) {
          console.error('Erro ao deletar evento do Google Calendar após falha no banco:', deleteError)
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(`Falha ao sincronizar: ${errorData.error || 'Erro no servidor'}`)
      }
      
      return eventId
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, needsReconnect, tokens?.accessToken, selectedCalendarId])

  // Função para atualizar evento de serviço
  const updateServiceEvent = useCallback(async (
    eventId: string,
    clientName: string,
    serviceType: string,
    serviceDate: string,
    notes?: string,
    nextServiceDate?: string
  ): Promise<void> => {
    if (!isAuthenticated || needsReconnect) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const event = createServiceEventUtil(clientName, serviceType, serviceDate, notes, nextServiceDate)
      await updateCalendarEvent(tokens?.accessToken || '', eventId, event, selectedCalendarId)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, needsReconnect, tokens?.accessToken, selectedCalendarId])

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
    if (!isAuthenticated || needsReconnect) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const event = createServiceEventUtil(clientName, serviceType, serviceDate, notes, nextServiceDate)
      await updateCalendarEvent(tokens?.accessToken || '', eventId, event, selectedCalendarId)
      
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
  }, [isAuthenticated, needsReconnect, tokens?.accessToken, selectedCalendarId])

  // Função para deletar evento de serviço
  const deleteServiceEvent = useCallback(async (eventId: string): Promise<void> => {
    if (!isAuthenticated || needsReconnect) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      await deleteCalendarEvent(tokens?.accessToken || '', eventId, selectedCalendarId)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, needsReconnect, tokens?.accessToken, selectedCalendarId])

  // Função para verificar se um evento ainda existe
  const verifyEventExists = useCallback(async (eventId: string): Promise<boolean> => {
    if (!isAuthenticated || needsReconnect) {
      return false
    }

    try {
      return await checkEventExists(tokens?.accessToken || '', eventId, selectedCalendarId)
    } catch (error) {
      console.error('Erro ao verificar evento:', error)
      return false
    }
  }, [isAuthenticated, needsReconnect, tokens?.accessToken, selectedCalendarId])

  // Função para atualizar o google_event_id de um serviço localmente
  const updateServiceEventIdLocally = useCallback(async (serviceId: string, eventId: string | null) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/google-event`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ google_event_id: eventId }),
      })
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar google_event_id no banco')
      }
      
      return true
    } catch (error) {
      console.error('Erro ao atualizar google_event_id localmente:', error)
      return false
    }
  }, [])

  // Função para limpar eventos duplicados (se necessário)
  const cleanupDuplicateEvents = useCallback(async (clientName: string, serviceDate: string) => {
    if (!isAuthenticated || needsReconnect) {
      return []
    }

    try {
      const events = await findEventsByTitleAndDate(
        tokens?.accessToken || '', 
        `Atendimento Micena — ${clientName}`, 
        serviceDate, 
        selectedCalendarId
      )
      
      // Se há mais de um evento, deletar os extras (manter apenas o primeiro)
      if (events.length > 1) {
        const eventsToDelete = events.slice(1) // Pegar todos exceto o primeiro
        
        for (const event of eventsToDelete) {
          try {
            await deleteCalendarEvent(tokens?.accessToken || '', event.id, selectedCalendarId)
          } catch (error) {
            console.error('Erro ao deletar evento duplicado:', error)
          }
        }
        
        return eventsToDelete.map(e => e.id)
      }
      
      return []
    } catch (error) {
      console.error('Erro ao limpar eventos duplicados:', error)
      return []
    }
  }, [isAuthenticated, needsReconnect, tokens?.accessToken, selectedCalendarId])

  return {
    tokens,
    isAuthenticated,
    isLoading,
    needsReconnect,
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
    verifyEventExists,
    updateServiceEventIdLocally,
    cleanupDuplicateEvents,
    checkConnectionStatus
  }
}
