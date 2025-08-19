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
import { ServiceType, ServiceWithClient, Client, PaymentMethod, ServiceItem, ServiceMaterial } from '@/types/database'
import { CreateServiceData } from '@/lib/services'
import { getClients } from '@/lib/clients'
import { Search, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ServiceItemsManager } from './ServiceItemsManager'
import { ServiceMaterialsManager } from './ServiceMaterialsManager'
import { ServiceTotals } from './ServiceTotals'

const createServiceSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  service_date: z.string().min(1, 'Data do serviço é obrigatória'),
  service_type: z.enum(['AREIA', 'EQUIPAMENTO', 'CAPA', 'OUTRO']).refine(() => true, {
    message: 'Tipo de serviço é obrigatório'
  }),
  equipment_details: z.string(),
  notes: z.string(),
  next_service_date: z.string(),
  payment_method: z.enum(['PIX', 'TRANSFERENCIA', 'DINHEIRO', 'CARTAO', 'BOLETO']).optional(),
  payment_details: z.string().optional(),
})

type CreateServiceFormData = z.infer<typeof createServiceSchema>

interface CreateServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onServiceCreated: (serviceData: CreateServiceData) => Promise<ServiceWithClient>
}

const SERVICE_TYPE_OPTIONS = [
  { value: 'AREIA' as ServiceType, label: 'Troca de Areia' },
  { value: 'EQUIPAMENTO' as ServiceType, label: 'Equipamento' },
  { value: 'CAPA' as ServiceType, label: 'Capa da Piscina' },
  { value: 'OUTRO' as ServiceType, label: 'Outro' },
]

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
  const [loadingClients, setLoadingClients] = useState(true)
  const [showClientList, setShowClientList] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [serviceItems, setServiceItems] = useState<Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]>([])
  const [serviceMaterials, setServiceMaterials] = useState<(Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> & { total_price?: number })[]>([])
  
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
      service_type: 'AREIA',
      equipment_details: '',
      notes: '',
      next_service_date: '',
      payment_method: undefined,
      payment_details: '',
    },
  })

  // Observar valores dos campos obrigatórios
  const watchedValues = watch(['client_id', 'service_date', 'service_type'])
  const hasRequiredFields = watchedValues[0] && watchedValues[1] && watchedValues[2]
  const canSubmit = hasRequiredFields && (isValid || !isSubmitted)

  // Carregar clientes
  useEffect(() => {
    async function loadClients() {
      try {
        setLoadingClients(true)
        const clientsData = await getClients()
        setClients(clientsData)
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      } finally {
        setLoadingClients(false)
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
      
      // Limpar campos vazios
      const cleanData: CreateServiceData = {
        client_id: data.client_id,
        service_date: data.service_date,
        service_type: data.service_type,
        equipment_details: data.equipment_details.trim() === '' ? undefined : data.equipment_details,
        notes: data.notes.trim() === '' ? undefined : data.notes,
        next_service_date: data.next_service_date.trim() === '' ? undefined : data.next_service_date,
        payment_method: data.payment_method,
        payment_details: data.payment_details?.trim() === '' ? undefined : data.payment_details,
        service_items: serviceItems,
        service_materials: serviceMaterials,
      }
      
      await onServiceCreated(cleanData)
      
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" style={{ zIndex: 50 }}>
        <DialogHeader>
          <DialogTitle>Novo Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo serviço. Os campos marcados com * são obrigatórios.
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
                <Label htmlFor="service_type">
                  Tipo de Serviço <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="service_type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errors.service_type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.service_type && (
                  <p className="text-sm text-red-600">{errors.service_type.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="next_service_date">Próximo Serviço</Label>
                <Input
                  id="next_service_date"
                  type="date"
                  {...register('next_service_date')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment_details">Detalhes dos Equipamentos</Label>
              <Textarea
                id="equipment_details"
                {...register('equipment_details')}
                placeholder="Descreva equipamentos trocados, reparados, etc..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Informações adicionais sobre o serviço..."
                rows={3}
              />
            </div>
          </div>

          {/* Itens de Serviço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Itens de Serviço</h3>
            <ServiceItemsManager
              items={serviceItems}
              onChange={setServiceItems}
            />
          </div>

          {/* Materiais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Materiais</h3>
            <ServiceMaterialsManager
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
                    <Select value={field.value} onValueChange={field.onChange}>
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

          {!hasRequiredFields && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-red-500">*</span>
              <span>Campos obrigatórios: Cliente, Tipo de Serviço e Data devem ser preenchidos</span>
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
              title={!hasRequiredFields ? 'Preencha os campos obrigatórios para habilitar' : ''}
            >
              {isSubmitting ? 'Criando...' : 'Criar Serviço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
