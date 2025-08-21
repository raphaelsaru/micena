import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  createServiceEvent as createServiceEventUtil
} from '@/lib/google-calendar'

interface GoogleCalendarTokens {
  accessToken: string
  refreshToken?: string
}

export function useGoogleCalendar() {
  const [tokens, setTokens] = useState<GoogleCalendarTokens | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
  }, [])

  // Função para iniciar autenticação
  const startAuth = useCallback(() => {
    window.location.href = '/api/auth/google/login'
  }, [])

  // Função para desconectar
  const disconnect = useCallback(() => {
    setTokens(null)
    setIsAuthenticated(false)
    localStorage.removeItem('google_calendar_tokens')
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
      const eventId = await createCalendarEvent(tokens.accessToken, event)
      return eventId
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

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
      const eventId = await createCalendarEvent(tokens.accessToken, event)
      
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
  }, [tokens?.accessToken])

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
      await updateCalendarEvent(tokens.accessToken, eventId, event)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

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
      await updateCalendarEvent(tokens.accessToken, eventId, event)
      
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
  }, [tokens?.accessToken])

  // Função para deletar evento de serviço
  const deleteServiceEvent = useCallback(async (eventId: string): Promise<void> => {
    if (!tokens?.accessToken) {
      throw new Error('Não autenticado com Google Calendar')
    }

    setIsLoading(true)
    try {
      await deleteCalendarEvent(tokens.accessToken, eventId)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  return {
    tokens,
    isAuthenticated,
    isLoading,
    startAuth,
    disconnect,
    createServiceEvent,
    createServiceEventAndSave,
    updateServiceEvent,
    updateServiceEventAndSave,
    deleteServiceEvent
  }
}
