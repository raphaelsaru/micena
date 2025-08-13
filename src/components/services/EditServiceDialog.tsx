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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ServiceType, ServiceWithClient, Client } from '@/types/database'
import { UpdateServiceData } from '@/lib/services'
import { getClients } from '@/lib/clients'

const editServiceSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  service_date: z.string().min(1, 'Data do serviço é obrigatória'),
  service_type: z.enum(['AREIA', 'EQUIPAMENTO', 'CAPA', 'OUTRO']).refine(() => true, {
    message: 'Tipo de serviço é obrigatório'
  }),
  equipment_details: z.string(),
  notes: z.string(),
  next_service_date: z.string(),
  work_order_number: z.string(),
})

type EditServiceFormData = z.infer<typeof editServiceSchema>

interface EditServiceDialogProps {
  service: ServiceWithClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onServiceUpdated: (id: string, serviceData: UpdateServiceData) => Promise<ServiceWithClient>
}

const SERVICE_TYPE_OPTIONS = [
  { value: 'AREIA' as ServiceType, label: 'Troca de Areia' },
  { value: 'EQUIPAMENTO' as ServiceType, label: 'Equipamento' },
  { value: 'CAPA' as ServiceType, label: 'Capa da Piscina' },
  { value: 'OUTRO' as ServiceType, label: 'Outro' },
]

export function EditServiceDialog({ service, open, onOpenChange, onServiceUpdated }: EditServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isValid, isSubmitted },
  } = useForm<EditServiceFormData>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      client_id: '',
      service_date: '',
      service_type: 'AREIA',
      equipment_details: '',
      notes: '',
      next_service_date: '',
      work_order_number: '',
    },
  })

  // Resetar formulário quando o serviço mudar
  useEffect(() => {
    if (service) {
      reset({
        client_id: service.client_id || '',
        service_date: service.service_date || '',
        service_type: service.service_type || 'AREIA',
        equipment_details: service.equipment_details || '',
        notes: service.notes || '',
        next_service_date: service.next_service_date || '',
        work_order_number: service.work_order_number || '',
      })
    } else {
      // Reset para valores padrão quando não há serviço
      reset({
        client_id: '',
        service_date: '',
        service_type: 'AREIA',
        equipment_details: '',
        notes: '',
        next_service_date: '',
        work_order_number: '',
      })
    }
  }, [service, reset])

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
    }
  }, [open])

  const onSubmit = async (data: EditServiceFormData) => {
    if (!service) return
    
    try {
      setIsSubmitting(true)
      
      // Limpar campos vazios
      const cleanData: UpdateServiceData = {
        client_id: data.client_id,
        service_date: data.service_date,
        service_type: data.service_type,
        equipment_details: data.equipment_details.trim() === '' ? undefined : data.equipment_details,
        notes: data.notes.trim() === '' ? undefined : data.notes,
        next_service_date: data.next_service_date.trim() === '' ? undefined : data.next_service_date,
        work_order_number: data.work_order_number.trim() === '' ? undefined : data.work_order_number,
      }
      
      await onServiceUpdated(service.id, cleanData)
      
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="work_order_number">Número da OS</Label>
            <Input
              id="work_order_number"
              {...register('work_order_number')}
              placeholder="Ex: OS-2025-001"
            />
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
