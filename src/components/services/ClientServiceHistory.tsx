'use client'

import { FileText, Settings, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useClientServices } from '@/hooks/useServices'
import { ServiceType } from '@/types/database'
import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { getAllServiceCategories } from '@/lib/services'

interface ClientServiceHistoryProps {
  clientId: string
  clientName: string
  onAddService?: () => void
}

// Função para obter o nome da categoria
const getCategoryName = (serviceType: ServiceType): string => {
  // Para categorias antigas, retornar nomes em português
  if (serviceType === 'AREIA') return 'Troca de Areia'
  if (serviceType === 'EQUIPAMENTO') return 'Equipamento'
  if (serviceType === 'CAPA') return 'Capa da Piscina'
  if (serviceType === 'OUTRO') return 'Outro'
  
  // Para categorias padrão, retornar nomes em português
  if (serviceType === 'LIMPEZA_PROFUNDA') return 'Limpeza Profunda'
  if (serviceType === 'TRATAMENTO_QUIMICO') return 'Tratamento Químico'
  if (serviceType === 'REPARO_ESTRUTURAL') return 'Reparo Estrutural'
  if (serviceType === 'INSTALACAO') return 'Instalação'
  if (serviceType === 'INSPECAO_TECNICA') return 'Inspeção Técnica'
  if (serviceType === 'MANUTENCAO_PREVENTIVA') return 'Manutenção Preventiva'
  if (serviceType === 'DECORACAO') return 'Decoração'
  if (serviceType === 'SAZONAL') return 'Sazonal'
  
  // Para outras categorias (incluindo personalizadas), retornar o próprio valor
  return serviceType
}

// Função para obter a cor da categoria
const getCategoryColor = (serviceType: ServiceType): string => {
  // Para categorias antigas, retornar cores específicas
  if (serviceType === 'AREIA') return 'bg-yellow-100 text-yellow-800'
  if (serviceType === 'EQUIPAMENTO') return 'bg-blue-100 text-blue-800'
  if (serviceType === 'CAPA') return 'bg-green-100 text-green-800'
  if (serviceType === 'OUTRO') return 'bg-gray-100 text-gray-800'
  
  // Para categorias padrão, retornar cores específicas
  if (serviceType === 'LIMPEZA_PROFUNDA') return 'bg-cyan-100 text-cyan-800'
  if (serviceType === 'TRATAMENTO_QUIMICO') return 'bg-purple-100 text-purple-800'
  if (serviceType === 'REPARO_ESTRUTURAL') return 'bg-orange-100 text-orange-800'
  if (serviceType === 'INSTALACAO') return 'bg-pink-100 text-pink-800'
  if (serviceType === 'INSPECAO_TECNICA') return 'bg-red-100 text-red-800'
  if (serviceType === 'MANUTENCAO_PREVENTIVA') return 'bg-blue-100 text-blue-800'
  if (serviceType === 'DECORACAO') return 'bg-rose-100 text-rose-800'
  if (serviceType === 'SAZONAL') return 'bg-lime-100 text-lime-800'
  
  // Para outras categorias (incluindo personalizadas), retornar cor padrão
  return 'bg-gray-100 text-gray-800'
}

export function ClientServiceHistory({ clientId, clientName, onAddService }: ClientServiceHistoryProps) {
  const { services, isLoading } = useClientServices(clientId)
  const router = useRouter()
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string }>>([])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getAllServiceCategories()
        setCategories(data as Array<{ id: string; name: string; color: string }>)
      } catch (error) {
        console.error('Erro ao carregar categorias (cores dinâmicas):', error)
      }
    }
    loadCategories()
  }, [])

  const getCategoryHexColorByName = (name?: string): string | undefined => {
    if (!name) return undefined
    const cat = categories.find(c => c.name === name)
    return cat?.color
  }

  const getReadableTextColor = (hex?: string): string => {
    if (!hex) return '#111827'
    const cleaned = hex.replace('#', '')
    if (cleaned.length !== 6) return '#111827'
    const r = parseInt(cleaned.substring(0, 2), 16)
    const g = parseInt(cleaned.substring(2, 4), 16)
    const b = parseInt(cleaned.substring(4, 6), 16)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    return luminance > 0.6 ? '#111827' : '#FFFFFF'
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
                    {(() => {
                      const dynamicColor = getCategoryHexColorByName(service.service_type)
                      const style = dynamicColor
                        ? { backgroundColor: dynamicColor, color: getReadableTextColor(dynamicColor) }
                        : undefined
                      const className = dynamicColor
                        ? ''
                        : getCategoryColor(service.service_type || 'OUTRO')
                      return (
                        <Badge className={className} style={style}>
                          {getCategoryName(service.service_type || 'OUTRO')}
                        </Badge>
                      )
                    })()}
                    {!service.service_type && (
                      <span className="ml-1 text-xs">(auto)</span>
                    )}
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
