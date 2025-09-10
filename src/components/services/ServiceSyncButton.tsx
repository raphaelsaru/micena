'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { ServiceWithClient } from '@/types/database'
import { useToast } from '@/components/ui/toast'

interface ServiceSyncButtonProps {
  service: ServiceWithClient
  onSyncSuccess: (serviceId: string, googleEventId: string) => void
  onSyncError: (serviceId: string, error: string) => void
}

export function ServiceSyncButton({ service, onSyncSuccess, onSyncError }: ServiceSyncButtonProps) {
  const { isAuthenticated, needsReconnect, createServiceEventAndSave, isLoading } = useGoogleCalendar()
  const [isSyncing, setIsSyncing] = useState(false)
  const { showSuccess, showError, showWarning } = useToast()

  const hasGoogleEventId = !!service.google_event_id
  const nextServiceDate = service.next_service_date ? new Date(service.next_service_date) : null
  const today = new Date()
  const isPast = nextServiceDate ? nextServiceDate < today : false

  const handleSync = async () => {
    if (!isAuthenticated || needsReconnect || !service.next_service_date || !service.clients?.full_name) {
      return
    }

    setIsSyncing(true)
    try {
      const eventId = await createServiceEventAndSave(
        service.id,
        service.clients.full_name,
        service.service_type || 'OUTRO',
        service.next_service_date,
        service.notes
      )

      onSyncSuccess(service.id, eventId)
      showSuccess(
        'Serviço sincronizado!',
        `Evento criado no Google Calendar para ${service.clients.full_name}`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      onSyncError(service.id, errorMessage)
      showError(
        'Falha na sincronização',
        `Não foi possível sincronizar o serviço: ${errorMessage}`
      )
    } finally {
      setIsSyncing(false)
    }
  }

  if (!isAuthenticated || needsReconnect) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="text-xs"
      >
        <XCircle className="w-3 h-3 mr-1" />
        Não conectado
      </Button>
    )
  }

  if (!service.next_service_date) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="text-xs"
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Sem data
      </Button>
    )
  }

  if (isPast) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="text-xs"
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Data passada
      </Button>
    )
  }

  if (hasGoogleEventId) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="text-xs text-green-600 border-green-200"
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        Sincronizado
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSync}
      disabled={isSyncing || isLoading}
      className="text-xs hover:bg-blue-50 hover:border-blue-200"
    >
      {isSyncing ? (
        <>
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <Calendar className="w-3 h-3 mr-1" />
          Sincronizar
        </>
      )}
    </Button>
  )
}
