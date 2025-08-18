'use client'

import { FileText, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useClientServices } from '@/hooks/useServices'
import { ServiceType } from '@/types/database'
import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'

interface ClientServiceHistoryProps {
  clientId: string
  clientName: string
  onAddService?: () => void
}

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  AREIA: 'Troca de Areia',
  EQUIPAMENTO: 'Equipamento',
  CAPA: 'Capa da Piscina',
  OUTRO: 'Outro'
}

const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  AREIA: 'bg-yellow-100 text-yellow-800',
  EQUIPAMENTO: 'bg-blue-100 text-blue-800',
  CAPA: 'bg-green-100 text-green-800',
  OUTRO: 'bg-gray-100 text-gray-800'
}

export function ClientServiceHistory({ clientId, clientName, onAddService }: ClientServiceHistoryProps) {
  const { services, isLoading } = useClientServices(clientId)
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Histórico de Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Histórico de Serviços
          </CardTitle>
          {onAddService && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddService}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {clientName} • {services.length} serviço{services.length !== 1 ? 's' : ''} realizado{services.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum serviço registrado
            </h3>
            <p className="text-gray-600 mb-4">
              Este cliente ainda não possui histórico de serviços.
            </p>
            {onAddService && (
              <Button onClick={onAddService} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Primeiro Serviço
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="border-l-4 border-blue-200 pl-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge className={SERVICE_TYPE_COLORS[service.service_type]}>
                      {SERVICE_TYPE_LABELS[service.service_type]}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(service.service_date)}</span>
                    </div>
                  </div>
                  {service.work_order_number && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-gray-500 hover:text-blue-600 hover:bg-transparent cursor-pointer underline"
                        onClick={() => router.push(`/services/${service.id}`)}
                        title="Gerar Ordem de Serviço"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-gray-500 hover:text-blue-600 hover:bg-transparent font-normal cursor-pointer underline"
                        onClick={() => router.push(`/services/${service.id}`)}
                        title="Gerar Ordem de Serviço"
                      >
                        {service.work_order_number}
                      </Button>
                    </div>
                  )}
                </div>
                
                {service.equipment_details && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Equipamentos: </span>
                    <span className="text-sm text-gray-600">{service.equipment_details}</span>
                  </div>
                )}
                
                {service.notes && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Observações: </span>
                    <span className="text-sm text-gray-600">{service.notes}</span>
                  </div>
                )}
                
                {service.next_service_date && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <Calendar className="w-4 h-4" />
                    <span>Próximo serviço: {formatDate(service.next_service_date)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
