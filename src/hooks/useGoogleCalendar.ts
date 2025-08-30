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

  // Função para verificar se há tokens válidos no localStorage
  const checkLocalTokens = useCallback(() => {
    try {
      const savedTokens = localStorage.getItem('google_calendar_tokens')
      if (savedTokens) {
        const parsedTokens = JSON.parse(savedTokens) as GoogleCalendarTokens
        if (parsedTokens.accessToken && parsedTokens.accessToken.length > 0) {
          console.log('✅ Tokens válidos encontrados no localStorage')
          setTokens(parsedTokens)
          setIsAuthenticated(true)
          setNeedsReconnect(false)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('❌ Erro ao verificar tokens locais:', error)
      return false
    }
  }, [])





  // Função para carregar agendas
  const loadCalendars = useCallback(async () => {
    if (!tokens?.accessToken) {
      console.log('❌ Sem token para carregar agendas')
      return
    }

    setIsLoading(true)
    try {
      console.log('📡 Carregando agendas do Google Calendar...')
      const userCalendars = await listUserCalendars(tokens.accessToken)
      console.log('✅ Agendas carregadas:', userCalendars.length)
      setCalendars(userCalendars)
      
      // Definir calendário principal se necessário
      if (selectedCalendarId === 'primary' && userCalendars.length > 0) {
        const primaryCalendar = userCalendars.find(cal => cal.primary)
        if (primaryCalendar) {
          setSelectedCalendarId(primaryCalendar.id)
          localStorage.setItem('selected_calendar_id', primaryCalendar.id)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar agendas:', error)
      // Se der erro 401, limpar tokens
      if (error instanceof Error && error.message.includes('401')) {
        console.log('🔍 Token expirado, limpando...')
        disconnect()
      }
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, selectedCalendarId])

  // Verificar tokens na URL ao carregar
  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const authSuccess = searchParams.get('auth_success')
    const googleAuth = searchParams.get('google_auth')

    if ((authSuccess === 'true' || googleAuth === 'success') && accessToken) {
      console.log('✅ Tokens recebidos da URL, salvando...')
      
      const newTokens: GoogleCalendarTokens = { accessToken }
      if (refreshToken) {
        newTokens.refreshToken = refreshToken
      }
      
      // Salvar tokens
      setTokens(newTokens)
      setIsAuthenticated(true)
      setNeedsReconnect(false)
      localStorage.setItem('google_calendar_tokens', JSON.stringify(newTokens))
      
      // Limpar URL
      const url = new URL(window.location.href)
      url.searchParams.delete('access_token')
      url.searchParams.delete('refresh_token')
      url.searchParams.delete('auth_success')
      url.searchParams.delete('google_auth')
      window.history.replaceState({}, '', url.toString())
      
      // Carregar agendas diretamente
      loadCalendars()
    }
  }, [searchParams, loadCalendars])



  // Verificar tokens salvos no localStorage ao carregar
  useEffect(() => {
    const hasValidTokens = checkLocalTokens()
    
    // Carregar calendário selecionado salvo
    const savedCalendarId = localStorage.getItem('selected_calendar_id')
    if (savedCalendarId) {
      setSelectedCalendarId(savedCalendarId)
    }
    
    // Se há tokens válidos, carregar agendas
    if (hasValidTokens) {
      loadCalendars()
    }
  }, [checkLocalTokens, loadCalendars])



  // Função para iniciar autenticação
  const startAuth = useCallback(() => {
    console.log('🚀 Iniciando autenticação Google Calendar...')
    window.location.href = '/api/auth/google/login'
  }, [])

  // Função para desconectar
  const disconnect = useCallback(() => {
    console.log('🚪 Desconectando Google Calendar...')
    
    // Limpar estado
    setTokens(null)
    setIsAuthenticated(false)
    setNeedsReconnect(false)
    setCalendars([])
    setSelectedCalendarId('primary')
    
    // Limpar localStorage
    localStorage.removeItem('google_calendar_tokens')
    localStorage.removeItem('selected_calendar_id')
    
    console.log('✅ Google Calendar desconectado')
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
          await deleteCalendarEvent(tokens.accessToken, eventId, selectedCalendarId)
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
      
      // Atualizar o google_event_id no banco de dados
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
    if (!tokens?.accessToken) {
      return []
    }

    try {
      const events = await findEventsByTitleAndDate(
        tokens.accessToken, 
        `Atendimento Micena — ${clientName}`, 
        serviceDate, 
        selectedCalendarId
      )
      
      // Se há mais de um evento, deletar os extras (manter apenas o primeiro)
      if (events.length > 1) {
        const eventsToDelete = events.slice(1) // Pegar todos exceto o primeiro
        
        for (const event of eventsToDelete) {
          try {
            await deleteCalendarEvent(tokens.accessToken, event.id, selectedCalendarId)
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
  }, [tokens?.accessToken, selectedCalendarId])

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
    cleanupDuplicateEvents
  }
}
