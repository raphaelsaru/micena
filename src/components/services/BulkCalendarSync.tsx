'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { ServiceWithClient } from '@/types/database'
import { useToast } from '@/components/ui/toast'

interface BulkCalendarSyncProps {
  services: ServiceWithClient[]
  onServiceUpdated: (serviceId: string, googleEventId: string | null) => Promise<boolean>
}

export function BulkCalendarSync({ services, onServiceUpdated }: BulkCalendarSyncProps) {
  const { isAuthenticated, needsReconnect, createServiceEventAndSave } = useGoogleCalendar()
  const { showSuccess, showError, showInfo } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState({
    success: 0,
    failed: 0,
    skipped: 0
  })

  // Filtrar serviços que precisam de sincronização
  const servicesToSync = services.filter(service => 
    service.next_service_date && 
    !service.google_event_id && // Não tem evento no Google Calendar
    new Date(service.next_service_date) >= new Date() // Data não passou
  )

  const handleBulkSync = async () => {
    if (!isAuthenticated || needsReconnect || servicesToSync.length === 0) return

    setIsSyncing(true)
    setSyncResults({ success: 0, failed: 0, skipped: 0 })
    showInfo('Iniciando sincronização...', `Sincronizando ${servicesToSync.length} serviços`)

    let success = 0
    let failed = 0
    let skipped = 0

    for (const service of servicesToSync) {
      try {
        if (service.next_service_date && service.clients?.full_name) {
          try {
            const eventId = await createServiceEventAndSave(
              service.id,
              service.clients.full_name,
              service.service_type || 'OUTRO',
              service.next_service_date, // Esta data já vem do banco no formato correto
              service.notes
            )
            
            // Atualizar o estado local para mostrar como sincronizado
            await onServiceUpdated(service.id, eventId)
            success++
          } catch (error) {
            console.error('Erro ao sincronizar serviço:', error)
            failed++
          }
        } else {
          skipped++
        }
      } catch (error) {
        failed++
        console.error('Erro ao sincronizar serviço:', error)
      }
    }

    setSyncResults({ success, failed, skipped })
    setIsSyncing(false)

    // Mostrar resultado final
    if (success > 0 && failed === 0) {
      showSuccess('Sincronização concluída!', `${success} serviços sincronizados com sucesso`)
    } else if (success > 0 && failed > 0) {
      showError('Sincronização parcial', `${success} sincronizados, ${failed} falharam`)
    } else if (failed > 0) {
      showError('Falha na sincronização', `${failed} serviços falharam`)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sincronização em Lote
          </CardTitle>
          <CardDescription>
            Conecte-se ao Google Calendar para sincronizar serviços em lote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Você precisa estar conectado ao Google Calendar para usar esta funcionalidade
          </div>
        </CardContent>
      </Card>
    )
  }

  if (servicesToSync.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sincronização em Lote
          </CardTitle>
          <CardDescription>
            Todos os serviços já estão sincronizados com Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-green-600">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <span>Nenhum serviço precisa de sincronização</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Sincronização em Lote
        </CardTitle>
        <CardDescription>
          Sincronize {servicesToSync.length} serviços com Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded text-center">
            <div className="font-medium text-blue-800">{servicesToSync.length}</div>
            <div className="text-blue-600">Para sincronizar</div>
          </div>
          <div className="bg-green-50 p-3 rounded text-center">
            <div className="font-medium text-green-800">{syncResults.success}</div>
            <div className="text-green-600">Sincronizados</div>
          </div>
          <div className="bg-red-50 p-3 rounded text-center">
            <div className="font-medium text-red-800">{syncResults.failed}</div>
            <div className="text-red-600">Falharam</div>
          </div>
        </div>

        <Button 
          onClick={handleBulkSync} 
          disabled={isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Sincronizar {servicesToSync.length} Serviços
            </>
          )}
        </Button>

        {(syncResults.success > 0 || syncResults.failed > 0) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {syncResults.success > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{syncResults.success} sincronizados com sucesso</span>
                </div>
              )}
              {syncResults.failed > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>{syncResults.failed} falharam</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
