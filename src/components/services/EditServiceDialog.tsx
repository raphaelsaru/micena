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
import { UpdateServiceData } from '@/lib/services'
import { getClients } from '@/lib/clients'
import { ServiceItemsManagerWithCatalog } from './ServiceItemsManagerWithCatalog'
import { ServiceMaterialsManagerWithCatalog } from './ServiceMaterialsManagerWithCatalog'
import { ServiceTotals } from './ServiceTotals'
import { formatDateForDatabase, formatDateForInput } from '@/lib/utils'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'

const editServiceSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  service_date: z.string().min(1, 'Data do serviço é obrigatória'),
  service_type: z.enum(['AREIA', 'EQUIPAMENTO', 'CAPA', 'OUTRO']).optional(),
  notes: z.string(),
  next_service_date: z.string(),
  payment_method: z.enum(['PIX', 'TRANSFERENCIA', 'DINHEIRO', 'CARTAO', 'BOLETO']).optional().or(z.literal('')),
  payment_details: z.string().optional(),
})

type EditServiceFormData = z.infer<typeof editServiceSchema>

interface EditServiceDialogProps {
  service: ServiceWithClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onServiceUpdated: (id: string, serviceData: UpdateServiceData, items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[], materials: Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]) => Promise<ServiceWithClient>
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'PIX' as PaymentMethod, label: 'PIX' },
  { value: 'TRANSFERENCIA' as PaymentMethod, label: 'Transferência' },
  { value: 'DINHEIRO' as PaymentMethod, label: 'Dinheiro' },
  { value: 'CARTAO' as PaymentMethod, label: 'Cartão' },
  { value: 'BOLETO' as PaymentMethod, label: 'Boleto' },
]

export function EditServiceDialog({ service, open, onOpenChange, onServiceUpdated }: EditServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [serviceItems, setServiceItems] = useState<Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]>([])
  const [serviceMaterials, setServiceMaterials] = useState<(Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> & { total_price?: number })[]>([])
  const [monthsToAdd, setMonthsToAdd] = useState<number>(1)
  
  // Hook do Google Calendar
  const { isAuthenticated, createServiceEventAndSave, updateServiceEventAndSave, deleteServiceEvent } = useGoogleCalendar()
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isValid, isSubmitted },
    setValue,
    getValues,
  } = useForm<EditServiceFormData>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      client_id: '',
      service_date: '',
      notes: '',
      next_service_date: '',
      payment_method: undefined,
      payment_details: '',
    },
  })

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

  // Calcular meses entre a data do serviço e a data do próximo serviço
  const calculateMonthsBetween = (serviceDate: string, nextServiceDate: string) => {
    if (!serviceDate || !nextServiceDate) return 1
    
    const startDate = new Date(serviceDate)
    const endDate = new Date(nextServiceDate)
    
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth())
    
    return Math.max(1, months)
  }

  // Resetar formulário quando o serviço mudar
  useEffect(() => {
    if (service) {
      reset({
        client_id: service.client_id || '',
        service_date: formatDateForInput(service.service_date || ''),
        notes: service.notes || '',
        next_service_date: formatDateForInput(service.next_service_date || ''),
        payment_method: service.payment_method || undefined,
        payment_details: service.payment_details || '',
      })
      
      // Calcular meses entre a data do serviço e a data do próximo serviço
      if (service.service_date && service.next_service_date) {
        const months = calculateMonthsBetween(service.service_date, service.next_service_date)
        setMonthsToAdd(months)
      } else {
        setMonthsToAdd(1)
      }
      
      // Carregar itens e materiais existentes
      if (service.service_items) {
        setServiceItems(service.service_items.map(item => ({
          description: item.description,
          value: item.value
        })))
      } else {
        setServiceItems([])
      }
      
      if (service.service_materials) {
        setServiceMaterials(service.service_materials.map(material => ({
          description: material.description,
          unit: material.unit,
          quantity: material.quantity,
          unit_price: material.unit_price,
          total_price: material.total_price
        })))
      } else {
        setServiceMaterials([])
      }
    } else {
      // Reset para valores padrão quando não há serviço
      reset({
        client_id: '',
        service_date: '',
        notes: '',
        next_service_date: '',
        payment_method: undefined,
        payment_details: '',
      })
      setServiceItems([])
      setServiceMaterials([])
    }
  }, [service, reset])

  // Observar mudanças na data do serviço e atualizar automaticamente
  const watchedServiceDate = watch('service_date')
  useEffect(() => {
    if (watchedServiceDate && monthsToAdd > 0) {
      const nextDate = calculateNextServiceDate(watchedServiceDate, monthsToAdd)
      setValue('next_service_date', nextDate)
    }
  }, [watchedServiceDate, monthsToAdd, setValue])

  // Observar valores dos campos obrigatórios
  const watchedValues = watch(['client_id', 'service_date'])
  const hasRequiredFields = watchedValues[0] && watchedValues[1]
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
    }
  }, [open])

  const onSubmit = async (data: EditServiceFormData) => {
    if (!service) return
    
    try {
      setIsSubmitting(true)
      
      // Limpar campos vazios e formatar datas corretamente
      const cleanData: UpdateServiceData = {
        client_id: data.client_id,
        service_date: formatDateForDatabase(data.service_date),
        notes: data.notes.trim() === '' ? undefined : data.notes,
        next_service_date: data.next_service_date.trim() === '' ? undefined : formatDateForDatabase(data.next_service_date),
        payment_method: data.payment_method && data.payment_method.trim() !== '' ? data.payment_method as PaymentMethod : undefined,
        payment_details: data.payment_details?.trim() === '' ? undefined : data.payment_details,
      }
      
      // Atualizar o serviço principal
      const updatedService = await onServiceUpdated(service.id, cleanData, serviceItems, serviceMaterials)
      
      // Sincronizar com Google Calendar se estiver conectado
      if (isAuthenticated && updatedService.clients?.full_name) {
        try {
          const hasNextServiceDate = data.next_service_date && data.next_service_date.trim() !== ''
          
          if (hasNextServiceDate) {
            // Se tem data do próximo serviço, criar ou atualizar evento
            if (service.google_event_id) {
              // Atualizar evento existente
              await updateServiceEventAndSave(
                service.id,
                service.google_event_id,
                updatedService.clients.full_name,
                updatedService.service_type || 'OUTRO',
                formatDateForDatabase(data.next_service_date), // Usar data formatada
                data.notes
              )
            } else {
              // Criar novo evento apenas se não existir
              const eventId = await createServiceEventAndSave(
                service.id,
                updatedService.clients.full_name,
                updatedService.service_type || 'OUTRO',
                formatDateForDatabase(data.next_service_date), // Usar data formatada
                data.notes
              )
              
              // Atualizar o serviço localmente para mostrar como sincronizado
              console.log('Serviço sincronizado com Google Calendar:', eventId)
            }
          } else if (service.google_event_id) {
            // Se não tem data do próximo serviço mas tinha evento, deletar
            await deleteServiceEvent(service.google_event_id)
            
            // Limpar google_event_id no banco
            const response = await fetch(`/api/services/${service.id}/google-event`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ google_event_id: null }),
            })
            
            if (!response.ok) {
              console.error('Erro ao limpar google_event_id no banco')
            }
          }
        } catch (error) {
          console.error('Erro ao sincronizar com Google Calendar:', error)
          // Não falhar o serviço se a sincronização falhar
        }
      }
      
      // Fechar diálogo
      onOpenChange(false)
    } catch {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" style={{ zIndex: 9998 }}>
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
          <DialogDescription>
            Edite os dados do serviço. A categoria será detectada automaticamente baseada nos itens de serviço. Os campos marcados com * são obrigatórios.
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
                <Controller
                  name="client_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errors.client_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione um cliente"} />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
