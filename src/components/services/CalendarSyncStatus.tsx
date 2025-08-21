'use client'

import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ServiceWithClient } from '@/types/database'

interface CalendarSyncStatusProps {
  service: ServiceWithClient
}

export function CalendarSyncStatus({ service }: CalendarSyncStatusProps) {
  if (!service.next_service_date) {
    return null
  }

  const hasGoogleEvent = !!service.google_event_id
  const nextServiceDate = new Date(service.next_service_date)
  const today = new Date()
  const isPast = nextServiceDate < today

  if (isPast) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>Data passada</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {hasGoogleEvent ? (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span>Sincronizado</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-orange-600">
          <XCircle className="w-3 h-3" />
          <span>Não sincronizado</span>
        </div>
      )}
      
      <Badge 
        variant="outline" 
        className="text-xs px-2 py-1 h-5"
      >
        <Calendar className="w-3 h-3 mr-1" />
        {nextServiceDate.toLocaleDateString('pt-BR')}
      </Badge>
    </div>
  )
}


