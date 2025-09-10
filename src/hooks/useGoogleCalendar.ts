import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary')
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(0)
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Query para status da conexão
  const statusQuery = useQuery({
    queryKey: ['google_calendar_status'],
    queryFn: async () => {
      const response = await fetch('/api/google/status')
      if (!response.ok) throw new Error('Erro ao verificar status')
      const data = await response.json()
      return data.data as GoogleCalendarStatus
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })

  // Query para calendários
  const calendarsQuery = useQuery({
    queryKey: ['google_calendars'],
    queryFn: async () => {
      const response = await fetch('/api/google/calendars')
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.needsReconnect) {
          throw new Error('NEEDS_RECONNECT')
        }
        throw new Error(errorData.error || 'Erro ao carregar calendários')
      }
      const data = await response.json()
      return data.data as GoogleCalendar[]
    },
    enabled: statusQuery.data?.connected === true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })

  // Mutation para criar evento de serviço
  const createServiceEventMutation = useMutation({
    mutationFn: async ({
      clientName,
      serviceType,
      serviceDate,
      notes,
      nextServiceDate,
    }: {
      clientName: string
      serviceType: string
      serviceDate: string
      notes?: string
      nextServiceDate?: string
    }) => {
      const response = await fetch('/api/google/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          serviceType,
          serviceDate,
          notes,
          nextServiceDate,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar evento')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidar cache de calendários para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ['google_calendars'] })
    },
  })

  // Mutation para criar evento e salvar no banco
  const createServiceEventAndSaveMutation = useMutation({
    mutationFn: async ({
      serviceId,
      clientName,
      serviceType,
      serviceDate,
      notes,
      nextServiceDate,
    }: {
      serviceId: string
      clientName: string
      serviceType: string
      serviceDate: string
      notes?: string
      nextServiceDate?: string
    }) => {
      const response = await fetch('/api/google/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          serviceType,
          serviceDate,
          notes,
          nextServiceDate,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar evento')
      }
      
      const { eventId } = await response.json()
      
      // Salvar o google_event_id no banco de dados
      const saveResponse = await fetch(`/api/services/${serviceId}/google-event`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_event_id: eventId }),
      })
      
      if (!saveResponse.ok) {
        // Se falhar ao salvar no banco, deletar o evento do Google Calendar
        try {
          await fetch(`/api/google/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (deleteError) {
          console.error('Erro ao deletar evento do Google Calendar:', deleteError)
        }
        
        const errorData = await saveResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(`Falha ao sincronizar: ${errorData.error || 'Erro no servidor'}`)
      }
      
      return { eventId }
    },
    onSuccess: () => {
      // Invalidar cache de serviços e calendários
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['google_calendars'] })
    },
  })

  // Mutation para atualizar evento
  const updateServiceEventMutation = useMutation({
    mutationFn: async ({
      eventId,
      clientName,
      serviceType,
      serviceDate,
      notes,
      nextServiceDate,
    }: {
      eventId: string
      clientName: string
      serviceType: string
      serviceDate: string
      notes?: string
      nextServiceDate?: string
    }) => {
      const response = await fetch(`/api/google/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          serviceType,
          serviceDate,
          notes,
          nextServiceDate,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar evento')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google_calendars'] })
    },
  })

  // Mutation para deletar evento
  const deleteServiceEventMutation = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const response = await fetch(`/api/google/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar evento')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google_calendars'] })
    },
  })

  // Função para verificar status da conexão com cache
  const checkConnectionStatus = useCallback(async (force = false) => {
    const now = Date.now()
    const CACHE_DURATION = 30000 // 30 segundos
    
    // Se não for forçado e já verificamos recentemente, usar cache
    if (!force && now - lastStatusCheck < CACHE_DURATION && isInitialized) {
      return status.connected
    }

    try {
      console.log('🔍 Verificando status da conexão Google Calendar...')
      const response = await fetch('/api/google/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.data)
        setLastStatusCheck(now)
        console.log('✅ Status verificado:', data.data.connected ? 'Conectado' : 'Desconectado')
        return data.data.connected
      }
      return false
    } catch (error) {
      console.error('❌ Erro ao verificar status da conexão:', error)
      return false
    }
  }, [lastStatusCheck, isInitialized, status.connected])

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
        setSelectedCalendarId('primary')
        
        // Limpar localStorage apenas do calendário selecionado
        localStorage.removeItem('selected_calendar_id')
        
        // Invalidar queries para limpar cache
        queryClient.invalidateQueries({ queryKey: ['google_calendar_status'] })
        queryClient.invalidateQueries({ queryKey: ['google_calendars'] })
        
        console.log('✅ Google Calendar desconectado')
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error)
    }
  }, [queryClient])

  // Função para identificar agenda "Micena"
  const identifyMicenaCalendar = useCallback(async () => {
    try {
      console.log('🔍 Identificando agenda "Micena"...')
      const response = await fetch('/api/google/identify-micena-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Agenda "Micena" identificada:', data.calendarName)
        return data.calendarId
      } else {
        const errorData = await response.json()
        console.warn('⚠️ Não foi possível identificar agenda "Micena":', errorData.message)
        return null
      }
    } catch (error) {
      console.error('❌ Erro ao identificar agenda "Micena":', error)
      return null
    }
  }, [])


  // Verificar sucesso de autenticação na URL
  useEffect(() => {
    const googleAuth = searchParams.get('google_auth')

    if (googleAuth === 'success') {
      console.log('✅ Autenticação Google bem-sucedida, verificando status...')
      
      // Limpar URL
      const url = new URL(window.location.href)
      url.searchParams.delete('google_auth')
      window.history.replaceState({}, '', url.toString())
      
      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['google_calendar_status'] })
      queryClient.invalidateQueries({ queryKey: ['google_calendars'] })
    }
  }, [searchParams, queryClient])

  // Inicialização única ao carregar o componente
  useEffect(() => {
    if (isInitialized) return

    const initializeGoogleCalendar = async () => {
      console.log('🚀 Inicializando Google Calendar...')
      
      // Carregar calendário selecionado salvo
      const savedCalendarId = localStorage.getItem('selected_calendar_id')
      if (savedCalendarId) {
        setSelectedCalendarId(savedCalendarId)
      }
      
      setIsInitialized(true)
      console.log('✅ Google Calendar inicializado')
    }

    initializeGoogleCalendar()
  }, [isInitialized])



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

  // Sincronizar status do query com estado local
  useEffect(() => {
    if (statusQuery.data) {
      setStatus(statusQuery.data)
    }
  }, [statusQuery.data])

  return {
    // Status da conexão
    isAuthenticated: statusQuery.data?.connected || false,
    isLoading: statusQuery.isLoading || calendarsQuery.isLoading || !isInitialized,
    needsReconnect: statusQuery.data?.needsReconnect || false,
    
    // Dados dos calendários
    calendars: calendarsQuery.data || [],
    selectedCalendarId,
    isInitialized,
    
    // Funções de autenticação
    startAuth,
    disconnect,
    refreshStatus: () => {
      queryClient.invalidateQueries({ queryKey: ['google_calendar_status'] })
      queryClient.invalidateQueries({ queryKey: ['google_calendars'] })
    },
    
    // Funções de calendário
    loadCalendars: (force = false) => {
      if (force) {
        queryClient.invalidateQueries({ queryKey: ['google_calendars'] })
      }
    },
    selectCalendar,
    identifyMicenaCalendar,
    
    // Mutations para eventos
    createServiceEvent: createServiceEventMutation.mutateAsync,
    createServiceEventAndSave: createServiceEventAndSaveMutation.mutateAsync,
    updateServiceEvent: updateServiceEventMutation.mutateAsync,
    updateServiceEventAndSave: updateServiceEventMutation.mutateAsync,
    deleteServiceEvent: deleteServiceEventMutation.mutateAsync,
    
    // Estados das mutations
    isCreatingEvent: createServiceEventMutation.isPending,
    isUpdatingEvent: updateServiceEventMutation.isPending,
    isDeletingEvent: deleteServiceEventMutation.isPending,
    
    // Funções auxiliares (mantidas para compatibilidade)
    verifyEventExists,
    updateServiceEventIdLocally,
    cleanupDuplicateEvents
  }
}
