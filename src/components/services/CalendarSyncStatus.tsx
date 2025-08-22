'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ServiceWithClient } from '@/types/database'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { formatDate } from '@/lib/formatters'

interface CalendarSyncStatusProps {
  service: ServiceWithClient
}

export function CalendarSyncStatus({ service }: CalendarSyncStatusProps) {
  const { isAuthenticated, verifyEventExists } = useGoogleCalendar()
  const [eventExists, setEventExists] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const hasGoogleEventId = !!service.google_event_id
  const nextServiceDate = service.next_service_date ? new Date(service.next_service_date) : null
  const today = new Date()
  const isPast = nextServiceDate ? nextServiceDate < today : false

  // Verificar se o evento ainda existe no Google Calendar
  useEffect(() => {
    const checkEvent = async () => {
      if (!isAuthenticated || !hasGoogleEventId || !service.google_event_id) {
        setEventExists(null)
        return
      }

      setIsChecking(true)
      try {
        const exists = await verifyEventExists(service.google_event_id)
        setEventExists(exists)
      } catch (error) {
        console.error('Erro ao verificar evento:', error)
        setEventExists(null)
      } finally {
        setIsChecking(false)
      }
    }

    if (hasGoogleEventId && !isPast) {
      checkEvent()
    }
  }, [isAuthenticated, hasGoogleEventId, service.google_event_id, verifyEventExists, isPast])

  if (!nextServiceDate) {
    return null
  }

  if (isPast) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>Data passada</span>
      </div>
    )
  }

  const getSyncStatus = () => {
    if (!hasGoogleEventId) {
      return {
        icon: XCircle,
        text: 'Não sincronizado',
        color: 'text-orange-600'
      }
    }

    if (isChecking) {
      return {
        icon: Clock,
        text: 'Verificando...',
        color: 'text-gray-500'
      }
    }

    if (eventExists === false) {
      return {
        icon: AlertTriangle,
        text: 'Evento não encontrado',
        color: 'text-red-600'
      }
    }

    if (eventExists === true || eventExists === null) {
      // Se eventExists é null, assumimos que está sincronizado (falha na verificação)
      return {
        icon: CheckCircle,
        text: 'Sincronizado',
        color: 'text-green-600'
      }
    }

    return {
      icon: XCircle,
      text: 'Não sincronizado',
      color: 'text-orange-600'
    }
  }

  const status = getSyncStatus()
  const StatusIcon = status.icon

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1 text-xs ${status.color}`}>
        <StatusIcon className="w-3 h-3" />
        <span>{status.text}</span>
      </div>
      
      <Badge 
        variant="outline" 
        className="text-xs px-2 py-1 h-5"
      >
        <Calendar className="w-3 h-3 mr-1" />
        {formatDate(service.next_service_date)}
      </Badge>
    </div>
  )
}


