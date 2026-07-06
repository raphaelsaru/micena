'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrimmedInput, TrimmedTextarea } from '@/components/ui/trimmed-input'
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
import { ServiceType, ServiceWithClient, Client, PaymentMethod, ServiceItem, ServiceMaterial, categorizeServiceByItems, ServiceCategory } from '@/types/database'
import { UpdateServiceData, getAllServiceCategories } from '@/lib/services'
import { getClients } from '@/lib/clients'
import { ServiceItemsManagerWithCatalog } from './ServiceItemsManagerWithCatalog'
import { ServiceMaterialsManagerWithCatalog } from './ServiceMaterialsManagerWithCatalog'
import { ServiceTotals } from './ServiceTotals'
import { formatDateForDatabase, formatDateForInput } from '@/lib/utils'
import { CustomCategoriesManager } from './CustomCategoriesManager'
import { Settings } from 'lucide-react'

const editServiceSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  service_date: z.string().min(1, 'Data do serviço é obrigatória'),
  notes: z.string(),
  next_service_date: z.string().optional().or(z.literal('')),
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
  const [monthsToAdd, setMonthsToAdd] = useState<number | undefined>(undefined)
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(undefined)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  
  // Hook do Google Calendar
  
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
    
    // Criar data no fuso horário local para evitar problemas de UTC
    const [year, month, day] = serviceDate.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const originalDay = date.getDate()
    
    // Calcular o mês de destino
    let targetMonth = month + months
    let targetYear = year
    
    // Ajustar ano se necessário
    while (targetMonth > 12) {
      targetMonth -= 12
      targetYear++
    }
    
    // Criar a data de destino no mês correto
    const targetDate = new Date(targetYear, targetMonth - 1, 1)
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth, 0).getDate()
    
    // Usar o menor valor entre o dia original e o último dia do mês de destino
    const finalDay = Math.min(originalDay, lastDayOfTargetMonth)
    
    // Formatar para YYYY-MM-DD
    const resultYear = targetYear
    const resultMonth = String(targetMonth).padStart(2, '0')
    const resultDay = String(finalDay).padStart(2, '0')
    
    return `${resultYear}-${resultMonth}-${resultDay}`
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
        setMonthsToAdd(undefined) // Resetar para undefined se não houver data
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
      setMonthsToAdd(undefined) // Resetar meses para undefined
    }
  }, [service, reset])

  // Removido: cálculo automático da data do próximo serviço
  // Agora o usuário deve clicar no botão "Calcular" se quiser preencher automaticamente

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

  // Carregar categorias de serviços
  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  // Definir categoria selecionada após as categorias serem carregadas
  useEffect(() => {
    if (categories.length > 0 && service?.service_type) {
      // Encontrar a categoria correspondente ao service_type salvo
      const normalizedServiceType = service.service_type
      const category = categories.find(cat => {
        const normalizedCatName = cat.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/\s+/g, '_') // Substitui espaços por underscores
          .toUpperCase()
        return normalizedCatName === normalizedServiceType
      })
      
      if (category) {
        setSelectedCategory(category.id)
        setSelectedCategoryName(category.name)
        console.log('Categoria do serviço existente definida após carregar categorias:', category.name)
      } else {
        console.log('Categoria não encontrada para service_type:', service.service_type)
        setSelectedCategory(undefined)
        setSelectedCategoryName(undefined)
      }
    }
  }, [categories, service?.service_type])



  const loadCategories = async () => {
    try {
      const data = await getAllServiceCategories()
      setCategories(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  // Função para obter o nome da categoria
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : categoryId
  }



  // Função para obter a cor da categoria
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.color : '#6B7280'
  }





  const onSubmit = async (data: EditServiceFormData) => {
    if (!service) return
    
    try {
      setIsSubmitting(true)
      
      // Detectar categoria automaticamente se não foi selecionada manualmente
      let serviceType: ServiceType | undefined = undefined
      
      if (selectedCategory && selectedCategory !== 'auto') {
        // Se foi selecionada manualmente, buscar o nome da categoria pelo ID
        const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory)
        if (selectedCategoryObj) {
          // Usar o nome exato da categoria sem normalização
          serviceType = selectedCategoryObj.name as ServiceType
          console.log('Usando categoria selecionada manualmente (editar):', selectedCategoryObj.name)
        }
      } else if (serviceItems.length > 0) {
        // Se não foi selecionada manualmente, usar a categoria detectada automaticamente
        serviceType = categorizeServiceByItems(serviceItems)
        console.log('Usando categoria detectada automaticamente (editar):', serviceType)
      } else {
        console.log('Nenhuma categoria detectada (editar), usando OUTRO')
      }
      
      console.log('Categoria final que será salva (editar):', serviceType)
      
      // Limpar campos vazios e formatar datas corretamente
      const cleanData: UpdateServiceData = {
        client_id: data.client_id,
        service_date: formatDateForDatabase(data.service_date),
        service_type: serviceType, // Incluir a categoria detectada/selecionada
        notes: data.notes.trim() === '' ? undefined : data.notes,
        next_service_date: data.next_service_date && data.next_service_date.trim() !== '' ? formatDateForDatabase(data.next_service_date) : undefined,
        payment_method: data.payment_method && data.payment_method.trim() !== '' ? data.payment_method as PaymentMethod : undefined,
        payment_details: data.payment_details?.trim() === '' ? undefined : data.payment_details,
      }
      
      // Atualizar o serviço principal
      await onServiceUpdated(service.id, cleanData, serviceItems, serviceMaterials)

      // Fechar diálogo
      onOpenChange(false)
    } catch (error) {
      // Capturar e exibir erros específicos
      console.error('Erro detalhado ao atualizar serviço:', error)
      if (error instanceof Error) {
        console.error('Mensagem do erro:', error.message)
        console.error('Stack do erro:', error.stack)
      }
      // Re-throw para que o hook possa capturar e exibir o toast
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedCategory(undefined) // Resetar categoria selecionada
    onOpenChange(false)
  }

  return (
    <>
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
                    value={monthsToAdd || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || undefined
                      setMonthsToAdd(value)
                      // Não preencher automaticamente - deixar o usuário decidir se quer usar
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-nowrap">meses</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (getValues('service_date')) {
                        const nextDate = calculateNextServiceDate(getValues('service_date'), monthsToAdd || 1) // Usar 1 se monthsToAdd for undefined
                        setValue('next_service_date', nextDate)
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Calcular
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Clique em &quot;Calcular&quot; para preencher automaticamente a data do próximo serviço
                </p>
              </div>
            </div>

            {/* Seleção de Categoria */}
            <div className="space-y-2">
              <Label>Categoria do Serviço</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedCategory || 'auto'}
                  onValueChange={(value) => setSelectedCategory(value === 'auto' ? undefined : value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma categoria ou mantenha a sugestão automática">
                      {selectedCategory ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(selectedCategory) }}
                          />
                          <span>{getCategoryName(selectedCategory)}</span>
                        </div>
                      ) : (
                        "Manter sugestão automática"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Manter sugestão automática</span>
                      </div>
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategoriesManager(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar
                </Button>
              </div>
              
              {/* Categoria detectada automaticamente */}
              {selectedCategory && selectedCategory !== 'auto' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>🎯 Categoria Sugerida Automaticamente:</strong> {getCategoryName(selectedCategory)}
                    <br />
                    <span className="text-xs text-blue-600">
                      {categories.find(cat => cat.id === selectedCategory)?.description || 'Sem descrição disponível'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Instrução para o usuário */}
              {!selectedCategory && serviceItems.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="text-sm text-yellow-800">
                    <strong>💡 Dica:</strong> Adicione mais itens de serviço para que a categoria seja detectada automaticamente, ou selecione uma categoria manualmente.
                  </div>
                </div>
              )}
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
                <Controller
                  name="payment_details"
                  control={control}
                  render={({ field }) => (
                    <TrimmedInput
                      id="payment_details"
                      value={field.value || ''}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Chave PIX, dados bancários, etc..."
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Observações - Agora é o último campo */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TrimmedTextarea
                  id="notes"
                  value={field.value || ''}
                  onChange={(value) => field.onChange(value)}
                  placeholder="Informações adicionais sobre o serviço..."
                  rows={3}
                />
              )}
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

      {/* Gerenciador de Categorias */}
      <CustomCategoriesManager
        open={showCategoriesManager}
        onOpenChange={setShowCategoriesManager}
        onCategoryChange={loadCategories}
      />
    </>
  )
}
