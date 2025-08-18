'use client'

import { useState } from 'react'
import { Search, Filter, Edit2, Trash2, Calendar, User, Settings, FileText, FileText as FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ServiceWithClient, ServiceType } from '@/types/database'
import { useRouter } from 'next/navigation'
import { normalizeText } from '@/lib/utils'

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
    const serviceType = SERVICE_TYPE_LABELS[service.service_type] || ''
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Busca instantânea</label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por cliente, tipo ou observações..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="pl-10"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Serviço</label>
              <Select value={serviceTypeFilter} onValueChange={(value: ServiceType | 'ALL') => setServiceTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os tipos</SelectItem>
                  <SelectItem value="AREIA">Troca de Areia</SelectItem>
                  <SelectItem value="EQUIPAMENTO">Equipamento</SelectItem>
                  <SelectItem value="CAPA">Capa da Piscina</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Limpar Filtros
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
                      <Badge className={SERVICE_TYPE_COLORS[service.service_type]}>
                        {SERVICE_TYPE_LABELS[service.service_type]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-4 h-4" />
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

                    {service.equipment_details && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Equipamentos: </span>
                        <span className="text-sm text-gray-600">{service.equipment_details}</span>
                      </div>
                    )}

                    {service.notes && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Observações: </span>
                        <span className="text-sm text-gray-600">{service.notes}</span>
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
                      <Edit2 className="w-4 h-4" />
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
                  <strong>Tipo:</strong> {SERVICE_TYPE_LABELS[serviceToDelete.service_type]}
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
