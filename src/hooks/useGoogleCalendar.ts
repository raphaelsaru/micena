import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  createServiceEvent as createServiceEventUtil,
  checkEventExists,
  findEventsByTitleAndDate,
  GoogleCalendar
} from '@/lib/google-calendar'

interface GoogleCalendarStatus {
  connected: boolean
  expiresAt?: string
  needsReconnect: boolean
}

export function useGoogleCalendar() {
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false, needsReconnect: false })
  const [isLoading, setIsLoading] = useState(false)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Função para verificar status da conexão
  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/google/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.data)
        return data.data.connected
      }
      return false
    } catch (error) {
      console.error('❌ Erro ao verificar status da conexão:', error)
      return false
    }
  }, [])

  // Função para obter access token
  const getAccessToken = useCallback(async () => {
    try {
      const response = await fetch('/api/google/status')
      if (response.ok) {
        const data = await response.json()
        if (data.data.connected && !data.data.needsReconnect) {
          // Se conectado, buscar calendários para obter o token
          const calendarsResponse = await fetch('/api/google/calendars')
          if (calendarsResponse.ok) {
            // O token é usado internamente na API, não precisamos retorná-lo
            return true
          }
        }
      }
      return false
    } catch (error) {
      console.error('❌ Erro ao obter access token:', error)
      return false
    }
  }, [])

  // Função para desconectar
  const disconnect = useCallback(async () => {
    console.log('🚪 Desconectando Google Calendar...')
    
    try {
      const response = await fetch('/api/google/disconnect', { method: 'POST' })
      if (response.ok) {
        // Limpar estado
        setStatus({ connected: false, needsReconnect: false })
        setCalendars([])
        setSelectedCalendarId('primary')
        setAccessToken(null)
        
        // Limpar localStorage apenas do calendário selecionado
        localStorage.removeItem('selected_calendar_id')
        
        console.log('✅ Google Calendar desconectado')
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error)
    }
  }, [])

  // Função para carregar agendas
  const loadCalendars = useCallback(async () => {
    if (!status.connected) {
      console.log('❌ Google Calendar não conectado')
      return
    }

    setIsLoading(true)
    try {
      console.log('📡 Carregando agendas do Google Calendar...')
      const response = await fetch('/api/google/calendars')
      
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.needsReconnect) {
          setStatus(prev => ({ ...prev, needsReconnect: true, connected: false }))
        }
        throw new Error(errorData.error || 'Erro ao carregar calendários')
      }
      
      const data = await response.json()
      const userCalendars = data.data
      console.log('✅ Agendas carregadas:', userCalendars.length)
      setCalendars(userCalendars)
      
      // Definir calendário principal se necessário
      if (selectedCalendarId === 'primary' && userCalendars.length > 0) {
        const primaryCalendar = userCalendars.find((cal: GoogleCalendar) => cal.primary)
        if (primaryCalendar) {
          setSelectedCalendarId(primaryCalendar.id)
          localStorage.setItem('selected_calendar_id', primaryCalendar.id)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar agendas:', error)
    } finally {
      setIsLoading(false)
    }
  }, [status.connected, selectedCalendarId])

  // Verificar sucesso de autenticação na URL
  useEffect(() => {
    const googleAuth = searchParams.get('google_auth')

    if (googleAuth === 'success') {
      console.log('✅ Autenticação Google bem-sucedida, verificando status...')
      
      // Limpar URL
      const url = new URL(window.location.href)
      url.searchParams.delete('google_auth')
      window.history.replaceState({}, '', url.toString())
      
      // Verificar status e carregar calendários
      checkConnectionStatus().then(connected => {
        if (connected) {
          loadCalendars()
        }
      })
    }
  }, [searchParams, checkConnectionStatus, loadCalendars])

  // Verificar status da conexão ao carregar
  useEffect(() => {
    // Carregar calendário selecionado salvo
    const savedCalendarId = localStorage.getItem('selected_calendar_id')
    if (savedCalendarId) {
      setSelectedCalendarId(savedCalendarId)
    }
    
    // Verificar status da conexão
    checkConnectionStatus().then(connected => {
      if (connected) {
        loadCalendars()
      }
    })
  }, [checkConnectionStatus, loadCalendars])



  // Função para iniciar autenticação
  const startAuth = useCallback(() => {
    console.log('🚀 Iniciando autenticação Google Calendar...')
    window.location.href = '/api/auth/google/login'
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
    if (!status.connected) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      // Usar a API para criar o evento
      const response = await fetch('/api/google/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          serviceType,
          serviceDate,
          notes,
          nextServiceDate,
          calendarId: selectedCalendarId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar evento')
      }

      const data = await response.json()
      return data.eventId
    } finally {
      setIsLoading(false)
    }
  }, [status.connected, selectedCalendarId])

  // Função para deletar evento de serviço
  const deleteServiceEvent = useCallback(async (eventId: string): Promise<void> => {
    if (!status.connected) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/google/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calendarId: selectedCalendarId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar evento')
      }
    } finally {
      setIsLoading(false)
    }
  }, [status.connected, selectedCalendarId])

  // Função para criar evento de serviço e salvar no banco
  const createServiceEventAndSave = useCallback(async (
    serviceId: string,
    clientName: string,
    serviceType: string,
    serviceDate: string,
    notes?: string,
    nextServiceDate?: string
  ): Promise<string> => {
    if (!status.connected) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const eventId = await createServiceEvent(clientName, serviceType, serviceDate, notes, nextServiceDate)
      
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
          await deleteServiceEvent(eventId)
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
  }, [status.connected, createServiceEvent, deleteServiceEvent])

  // Função para atualizar evento de serviço
  const updateServiceEvent = useCallback(async (
    eventId: string,
    clientName: string,
    serviceType: string,
    serviceDate: string,
    notes?: string,
    nextServiceDate?: string
  ): Promise<void> => {
    if (!status.connected) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/google/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          serviceType,
          serviceDate,
          notes,
          nextServiceDate,
          calendarId: selectedCalendarId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar evento')
      }
    } finally {
      setIsLoading(false)
    }
  }, [status.connected, selectedCalendarId])

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
    if (!status.connected) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      await updateServiceEvent(eventId, clientName, serviceType, serviceDate, notes, nextServiceDate)
      
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
  }, [status.connected, updateServiceEvent])

  // Função para verificar se um evento ainda existe
  const verifyEventExists = useCallback(async (eventId: string): Promise<boolean> => {
    if (!status.connected) {
      return false
    }

    try {
      const response = await fetch(`/api/google/events/${eventId}/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.exists
      }
      return false
    } catch (error) {
      console.error('Erro ao verificar evento:', error)
      return false
    }
  }, [status.connected])

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
    if (!status.connected) {
      return []
    }

    try {
      const response = await fetch('/api/google/events/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          serviceDate,
          calendarId: selectedCalendarId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.deletedEventIds || []
      }
      
      return []
    } catch (error) {
      console.error('Erro ao limpar eventos duplicados:', error)
      return []
    }
  }, [status.connected, selectedCalendarId])

  return {
    isAuthenticated: status.connected,
    isLoading,
    needsReconnect: status.needsReconnect,
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
