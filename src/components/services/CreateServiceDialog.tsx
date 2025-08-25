'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ServiceType, ServiceWithClient, Client, PaymentMethod, ServiceItem, ServiceMaterial, categorizeServiceByItems } from '@/types/database'
import { CreateServiceData } from '@/lib/services'
import { getClients } from '@/lib/clients'
import { Search, X } from 'lucide-react'
import { ServiceItemsManagerWithCatalog } from './ServiceItemsManagerWithCatalog'
import { ServiceMaterialsManagerWithCatalog } from './ServiceMaterialsManagerWithCatalog'
import { ServiceTotals } from './ServiceTotals'
import { formatDateForDatabase } from '@/lib/utils'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'

const createServiceSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  service_date: z.string().min(1, 'Data do serviço é obrigatória'),
  service_type: z.enum(['AREIA', 'EQUIPAMENTO', 'CAPA', 'OUTRO']).optional(), // Agora opcional
  notes: z.string(),
  next_service_date: z.string(),
  payment_method: z.enum(['PIX', 'TRANSFERENCIA', 'DINHEIRO', 'CARTAO', 'BOLETO']).optional().or(z.literal('')),
  payment_details: z.string().optional(),
})

type CreateServiceFormData = z.infer<typeof createServiceSchema>

interface CreateServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onServiceCreated: (serviceData: CreateServiceData) => Promise<ServiceWithClient>
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'PIX' as PaymentMethod, label: 'PIX' },
  { value: 'TRANSFERENCIA' as PaymentMethod, label: 'Transferência' },
  { value: 'DINHEIRO' as PaymentMethod, label: 'Dinheiro' },
  { value: 'CARTAO' as PaymentMethod, label: 'Cartão' },
  { value: 'BOLETO' as PaymentMethod, label: 'Boleto' },
]

export function CreateServiceDialog({ open, onOpenChange, onServiceCreated }: CreateServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [showClientList, setShowClientList] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [serviceItems, setServiceItems] = useState<Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]>([])
  const [serviceMaterials, setServiceMaterials] = useState<(Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> & { total_price?: number })[]>([])
  const [monthsToAdd, setMonthsToAdd] = useState<number>(1)
  
  // Hook do Google Calendar
  const { isAuthenticated, createServiceEventAndSave } = useGoogleCalendar()
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isValid, isSubmitted },
    getValues,
    setValue,
  } = useForm<CreateServiceFormData>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: {
      client_id: '',
      service_date: '',
      notes: '',
      next_service_date: '',
      payment_method: undefined,
      payment_details: '',
    },
  })

  // Observar valores dos campos obrigatórios
  const watchedValues = watch(['client_id', 'service_date'])
  const hasRequiredFields = watchedValues[0] && watchedValues[1]
  const canSubmit = hasRequiredFields && (isValid || !isSubmitted)

  // Função para calcular a data do próximo serviço
  const calculateNextServiceDate = (serviceDate: string, months: number) => {
    if (!serviceDate) return ''
    
    const date = new Date(serviceDate)
    const originalDay = date.getDate()
    
    // Adicionar meses
    date.setMonth(date.getMonth() + months)
    
    // Verificar se o dia mudou (problema de overflow)
    if (date.getDate() !== originalDay) {
      // Se o dia mudou, significa que houve overflow
      // Voltar para o último dia do mês anterior
      date.setDate(0)
    }
    
    // Formatar para YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }



  // Observar mudanças na data do serviço
  const watchedServiceDate = watch('service_date')
  useEffect(() => {
    if (watchedServiceDate && monthsToAdd > 0) {
      const nextDate = calculateNextServiceDate(watchedServiceDate, monthsToAdd)
      setValue('next_service_date', nextDate)
    }
  }, [watchedServiceDate, monthsToAdd, setValue])

  // Carregar clientes
  useEffect(() => {
    async function loadClients() {
      try {
        const clientsData = await getClients()
        setClients(clientsData)
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      }
    }
    
    if (open) {
      loadClients()
      // Limpar campos quando abrir o modal
      setSearchTerm('')
      setShowClientList(false)
      setServiceItems([])
      setServiceMaterials([])
    }
  }, [open])

  // Mostrar nome do cliente selecionado
  const selectedClient = clients.find(client => client.id === watch('client_id'))

  // Fechar lista quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showClientList) {
        const target = event.target as Element
        if (!target.closest('.client-search-container')) {
          setShowClientList(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showClientList])

  // Sincronizar o campo de busca com o valor selecionado
  useEffect(() => {
    if (selectedClient) {
      setSearchTerm(selectedClient.full_name)
    }
  }, [selectedClient])

  // Filtrar clientes baseado no termo de busca
  const filteredClients = clients.filter(client => {
    if (!searchTerm.trim()) return true
    
    const term = searchTerm.toLowerCase()
    return (
      client.full_name.toLowerCase().includes(term) ||
      (client.document && client.document.toLowerCase().includes(term)) ||
      (client.phone && client.phone.includes(term))
    )
  })

  const handleClientSelect = (clientId: string) => {
    // Atualizar o campo do formulário
    const form = getValues()
    form.client_id = clientId
    setValue('client_id', clientId)
    
    // Limpar busca e fechar lista
    setSearchTerm('')
    setShowClientList(false)
  }

  const clearClientSelection = () => {
    setValue('client_id', '')
    setSearchTerm('')
    setShowClientList(false)
  }

  const onSubmit = async (data: CreateServiceFormData) => {
    try {
      setIsSubmitting(true)
      
      // Limpar campos vazios e formatar datas corretamente
      const cleanData: CreateServiceData = {
        client_id: data.client_id,
        service_date: formatDateForDatabase(data.service_date),
        notes: data.notes.trim() === '' ? undefined : data.notes,
        next_service_date: data.next_service_date.trim() === '' ? undefined : formatDateForDatabase(data.next_service_date),
        payment_method: data.payment_method && data.payment_method.trim() !== '' ? data.payment_method as PaymentMethod : undefined,
        payment_details: data.payment_details?.trim() === '' ? undefined : data.payment_details,
        service_items: serviceItems,
        service_materials: serviceMaterials,
      }
      
      // Criar o serviço
      const createdService = await onServiceCreated(cleanData)
      
      // Sincronizar com Google Calendar se estiver conectado e tiver data do próximo serviço
      if (isAuthenticated && data.next_service_date && createdService.clients?.full_name) {
        try {
          // Verificar se o serviço já tem google_event_id (não deveria ter, mas por segurança)
          if (!createdService.google_event_id) {
            const eventId = await createServiceEventAndSave(
              createdService.id,
              createdService.clients.full_name,
              createdService.service_type || 'OUTRO',
              formatDateForDatabase(data.next_service_date), // Usar data formatada
              data.notes
            )
            
            // Atualizar o serviço localmente para mostrar como sincronizado
            // Nota: O serviço já foi criado, então não precisamos atualizar o estado aqui
            console.log('Serviço sincronizado com Google Calendar:', eventId)
          }
        } catch (error) {
          console.error('Erro ao sincronizar com Google Calendar:', error)
          // Não falhar o serviço se a sincronização falhar
        }
      }
      
      // Resetar formulário e fechar diálogo
      reset()
      setSearchTerm('')
      setShowClientList(false)
      setServiceItems([])
      setServiceMaterials([])
      onOpenChange(false)
    } catch {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setSearchTerm('')
    setShowClientList(false)
    setServiceItems([])
    setServiceMaterials([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" style={{ zIndex: 9998 }}>
        <DialogHeader>
          <DialogTitle>Novo Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo serviço. A categoria será detectada automaticamente baseada nos itens de serviço. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <div className="relative client-search-container">
                  {/* Campo de busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, documento ou telefone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowClientList(true)
                        // Limpar seleção quando digitar
                        if (selectedClient) {
                          setValue('client_id', '')
                        }
                      }}
                      onFocus={() => setShowClientList(true)}
                      className="pl-10 pr-10"
                    />
                    {selectedClient && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearClientSelection}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Lista de clientes filtrados */}
                  {showClientList && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente disponível'}
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleClientSelect(client.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{client.full_name}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {client.document && (
                                  <span>{client.document}</span>
                                )}
                                {client.phone && (
                                  <span>{client.phone}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Cliente selecionado */}
                  {selectedClient && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm font-medium text-blue-900">
                        Cliente selecionado: {selectedClient.full_name}
                      </div>
                    </div>
                  )}
                </div>
                {errors.client_id && (
                  <p className="text-sm text-red-600">{errors.client_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_date">
                  Data do Serviço <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="service_date"
                  type="date"
                  {...register('service_date')}
                  className={errors.service_date ? 'border-red-500' : ''}
                />
                {errors.service_date && (
                  <p className="text-sm text-red-600">{errors.service_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="next_service_date">Próximo Serviço</Label>
                <Input
                  id="next_service_date"
                  type="date"
                  {...register('next_service_date')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="months_to_add">Meses para Próximo Serviço</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="months_to_add"
                    type="number"
                    min="1"
                    max="60"
                    value={monthsToAdd}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      setMonthsToAdd(value)
                      if (getValues('service_date')) {
                        const nextDate = calculateNextServiceDate(getValues('service_date'), value)
                        setValue('next_service_date', nextDate)
                      }
                    }}
                    className="flex-1"
                    placeholder="1"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">meses</span>
                </div>
                <p className="text-xs text-gray-500">
                  Calcula automaticamente a data do próximo serviço
                </p>
              </div>

              {/* Categoria detectada automaticamente */}
              <div className="space-y-2">
                <Label>Categoria Detectada</Label>
                <div className="p-3 bg-gray-50 border rounded-md">
                  {serviceItems.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Categoria:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {(() => {
                          const category = categorizeServiceByItems(serviceItems)
                          const categoryLabels: Record<ServiceType, string> = {
                            'AREIA': 'Troca de Areia',
                            'EQUIPAMENTO': 'Equipamento',
                            'CAPA': 'Capa da Piscina',
                            'OUTRO': 'Outro'
                          }
                          return categoryLabels[category]
                        })()}
                      </span>
                      <span className="text-xs text-gray-500">(detectada automaticamente)</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Adicione itens de serviço para detectar a categoria automaticamente
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Itens de Serviço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Itens de Serviço</h3>
                      <ServiceItemsManagerWithCatalog
            items={serviceItems}
            onChange={setServiceItems}
          />
          </div>

          {/* Materiais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Materiais</h3>
                      <ServiceMaterialsManagerWithCatalog
            materials={serviceMaterials}
            onChange={setServiceMaterials}
          />
          </div>

          {/* Resumo Financeiro */}
          {(serviceItems.length > 0 || serviceMaterials.length > 0) && (
            <ServiceTotals
              serviceItems={serviceItems}
              serviceMaterials={serviceMaterials}
            />
          )}

          {/* Informações de Pagamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Pagamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Meio de Pagamento</Label>
                <Controller
                  name="payment_method"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o meio de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_details">Detalhes do Pagamento</Label>
                <Input
                  id="payment_details"
                  {...register('payment_details')}
                  placeholder="Chave PIX, dados bancários, etc..."
                />
              </div>
            </div>
          </div>

          {/* Observações - Agora é o último campo */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre o serviço..."
              rows={3}
            />
          </div>

          {!hasRequiredFields && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-red-500">*</span>
              <span>Campos obrigatórios: Cliente e Data devem ser preenchidos</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
              title={!hasRequiredFields ? 'Preencha os campos obrigatórios para habilitar' : 'A categoria será detectada automaticamente baseada nos itens de serviço'}
            >
              {isSubmitting ? 'Criando...' : 'Criar Serviço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
