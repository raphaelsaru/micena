'use client'

import { useState } from 'react'
import { Search, Filter, Edit, Trash2, User, Settings, FileText, FileText as FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ServiceWithClient, ServiceType } from '@/types/database'
import { useRouter } from 'next/navigation'
import { normalizeText } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'
import { CalendarSyncStatus } from './CalendarSyncStatus'

interface ServiceListProps {
  services: ServiceWithClient[]
  isLoading: boolean
  onEditService: (service: ServiceWithClient) => void
  onDeleteService: (id: string) => Promise<void>
  onSearchServices: (filters: {
    clientName?: string
    serviceType?: ServiceType
    dateFrom?: string
    dateTo?: string
  }) => void
}

// Função para obter o nome da categoria
const getCategoryName = (serviceType: ServiceType): string => {
  // Mapeamento reverso para categorias normalizadas
  const categoryMap: Record<string, string> = {
    'AREIA': 'AREIA',
    'EQUIPAMENTO': 'EQUIPAMENTO',
    'CAPA': 'CAPA',
    'OUTRO': 'OUTRO',
    'LIMPEZA_PROFUNDA': 'LIMPEZA PROFUNDA',
    'TRATAMENTO_QUIMICO': 'TRATAMENTO QUÍMICO',
    'REPARO_ESTRUTURAL': 'REPARO ESTRUTURAL',
    'INSTALACAO': 'INSTALAÇÃO',
    'INSPECAO_TECNICA': 'INSPEÇÃO TÉCNICA',
    'MANUTENCAO_PREVENTIVA': 'MANUTENÇÃO PREVENTIVA',
    'DECORACAO': 'DECORAÇÃO',
    'SAZONAL': 'SAZONAL'
  }
  
  // Retornar o nome mapeado ou o valor original se não estiver no mapeamento
  return categoryMap[serviceType] || serviceType
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

export function ServiceList({
  services,
  isLoading,
  onEditService,
  onDeleteService,
  onSearchServices
}: ServiceListProps) {
  const router = useRouter()
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | 'ALL'>('ALL')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<ServiceWithClient | null>(null)
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  // const [serviceOrderDialog, setServiceOrderDialog] = useState<ServiceWithClient | null>(null)

  // Busca local instantânea (ignorando acentos)
  const filteredServices = services.filter(service => {
    if (!localSearchTerm.trim()) return true

    const normalizedSearch = normalizeText(localSearchTerm)
    const clientName = service.clients?.full_name || ''
    const serviceType = getCategoryName(service.service_type || 'OUTRO')
    const notes = service.notes || ''

    return (
      normalizeText(clientName).includes(normalizedSearch) ||
      normalizeText(serviceType).includes(normalizedSearch) ||
      normalizeText(notes).includes(normalizedSearch)
    )
  })

  const handleSearch = () => {
    const filters: {
      clientName?: string
      serviceType?: ServiceType
      dateFrom?: string
      dateTo?: string
    } = {}

    // Removido: clientName via campo avançado

    if (serviceTypeFilter !== 'ALL') {
      filters.serviceType = serviceTypeFilter
    }

    if (dateFromFilter) {
      filters.dateFrom = dateFromFilter
    }

    if (dateToFilter) {
      filters.dateTo = dateToFilter
    }

    onSearchServices(filters)
  }

  const handleClearFilters = () => {
    setServiceTypeFilter('ALL')
    setDateFromFilter('')
    setDateToFilter('')
    setLocalSearchTerm('')
    onSearchServices({})
  }

  const handleDeleteClick = (service: ServiceWithClient) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      await onDeleteService(serviceToDelete.id)
      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    }
  }



  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-card-content">
          <div className="mobile-form-grid-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="mobile-text-sm font-medium">Busca instantânea</label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por cliente, tipo ou observações..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="pl-10 mobile-text-sm"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="mobile-text-sm font-medium">Tipo de Serviço</label>
              <Select value={serviceTypeFilter} onValueChange={(value: ServiceType | 'ALL') => setServiceTypeFilter(value)}>
                <SelectTrigger className="mobile-text-sm">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os tipos</SelectItem>
                  <SelectItem value="AREIA">Troca de Areia</SelectItem>
                  <SelectItem value="EQUIPAMENTO">Equipamento</SelectItem>
                  <SelectItem value="CAPA">Capa da Piscina</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                  <SelectItem value="LIMPEZA_PROFUNDA">Limpeza Profunda</SelectItem>
                  <SelectItem value="TRATAMENTO_QUIMICO">Tratamento Químico</SelectItem>
                  <SelectItem value="REPARO_ESTRUTURAL">Reparo Estrutural</SelectItem>
                  <SelectItem value="INSTALACAO">Instalação</SelectItem>
                  <SelectItem value="INSPECAO_TECNICA">Inspeção Técnica</SelectItem>
                  <SelectItem value="MANUTENCAO_PREVENTIVA">Manutenção Preventiva</SelectItem>
                  <SelectItem value="DECORACAO">Decoração</SelectItem>
                  <SelectItem value="SAZONAL">Sazonal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="mobile-form-grid">
                <div>
                  <label className="mobile-text-sm font-medium">Data Inicial</label>
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="mobile-text-sm"
                  />
                </div>

                <div>
                  <label className="mobile-text-sm font-medium">Data Final</label>
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="mobile-text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mobile-button-group mt-4">
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 mobile-button-sm">
              <Search className="w-4 h-4 mr-2" />
              <span className="mobile-text-sm">Buscar</span>
            </Button>
            <Button variant="outline" onClick={handleClearFilters} className="mobile-button-sm">
              <span className="mobile-text-sm">Limpar Filtros</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Serviços */}
      <div className="space-y-4">
        {localSearchTerm && (
          <div className="text-sm text-gray-600">
            Mostrando {filteredServices.length} de {services.length} serviços
            {localSearchTerm && ` para "${localSearchTerm}"`}
          </div>
        )}
        {filteredServices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {localSearchTerm ? `Nenhum serviço encontrado para "${localSearchTerm}"` : 'Nenhum serviço encontrado'}
              </h3>
              <p className="text-gray-600">
                {localSearchTerm || serviceTypeFilter !== 'ALL' || dateFromFilter || dateToFilter
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando o primeiro serviço.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredServices.map((service: ServiceWithClient) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {service.clients?.full_name || 'Cliente não encontrado'}
                      </span>
                      <Badge className={getCategoryColor(service.service_type || 'OUTRO')}>
                        {getCategoryName(service.service_type || 'OUTRO')}
                        {!service.service_type && (
                          <span className="ml-1 text-xs">(auto)</span>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>Realizado em: {formatDate(service.service_date)}</span>
                      {service.next_service_date && (
                        <>
                          <span>•</span>
                          <span>Próximo: {formatDate(service.next_service_date)}</span>
                        </>
                      )}
                    </div>

                    {service.work_order_number && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{service.work_order_number}</span>
                      </div>
                    )}

                    {service.notes && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Observações: </span>
                        <span className="text-sm text-gray-600">{service.notes}</span>
                      </div>
                    )}

                    {/* Status de sincronização com Google Calendar */}
                    <CalendarSyncStatus service={service} />

                    {/* Mostrar itens de serviço se disponíveis */}
                    {service.service_items && service.service_items.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <div className="text-sm font-medium text-gray-700 mb-2">Itens do Serviço:</div>
                        <div className="space-y-1">
                          {service.service_items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.description}</span>
                              <span className="font-medium">{formatCurrency(item.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mostrar materiais se disponíveis */}
                    {service.service_materials && service.service_materials.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <div className="text-sm font-medium text-gray-700 mb-2">Materiais Utilizados:</div>
                        <div className="space-y-1">
                          {service.service_materials.map((material, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {material.description} ({material.quantity} {material.unit})
                              </span>
                              <span className="font-medium">{formatCurrency(material.total_price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/services/${service.id}`)}
                      title="Gerar Ordem de Serviço"
                      className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
                    >
                      <FileTextIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditService(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(service)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
            {serviceToDelete && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="text-sm">
                  <strong>Cliente:</strong> {serviceToDelete.clients?.full_name || 'N/A'}
                </div>
                <div className="text-sm">
                                          <strong>Tipo:</strong> {getCategoryName(serviceToDelete.service_type || 'OUTRO')}
                </div>
                <div className="text-sm">
                  <strong>Data:</strong> {formatDate(serviceToDelete.service_date)}
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog removido: agora OS abre em página própria */}
    </div>
  )
}
