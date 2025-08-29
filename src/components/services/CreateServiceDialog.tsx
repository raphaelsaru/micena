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
import { ServiceType, ServiceWithClient, Client, PaymentMethod, ServiceItem, ServiceMaterial, categorizeServiceByItems, ServiceCategory } from '@/types/database'
import { CreateServiceData, getAllServiceCategories } from '@/lib/services'
import { getClients } from '@/lib/clients'
import { Search, X } from 'lucide-react'
import { ServiceItemsManagerWithCatalog } from './ServiceItemsManagerWithCatalog'
import { ServiceMaterialsManagerWithCatalog } from './ServiceMaterialsManagerWithCatalog'
import { ServiceTotals } from './ServiceTotals'
import { CustomCategoriesManager } from './CustomCategoriesManager'
import { formatDateForDatabase, normalizeText } from '@/lib/utils'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { Settings } from 'lucide-react'

const createServiceSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  service_date: z.string().min(1, 'Data do serviço é obrigatória'),
  notes: z.string(),
  next_service_date: z.string().optional().or(z.literal('')),
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
  const [monthsToAdd, setMonthsToAdd] = useState<number | undefined>(undefined)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(undefined)
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  
  // Hook do Google Calendar
  const { isAuthenticated, needsReconnect, createServiceEventAndSave } = useGoogleCalendar()

  // Carregar categorias de serviços
  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  // Detectar categoria automaticamente quando os itens mudarem
  useEffect(() => {
    console.log('useEffect executado - serviceItems:', serviceItems.length, 'categories:', categories.length)
    
    // Só detectar automaticamente se não houver uma categoria já selecionada
    if (selectedCategory) {
      console.log('Categoria já selecionada, não detectando automaticamente:', selectedCategory)
      return
    }
    
    if (serviceItems.length > 0 && categories.length > 0) {
      const detectedCategoryName = categorizeServiceByItems(serviceItems)
      console.log('Nome da categoria detectada automaticamente:', detectedCategoryName, 'para itens:', serviceItems)
      
      // Encontrar o ID da categoria baseado no nome
      const detectedCategory = categories.find(cat => cat.name === detectedCategoryName)
      if (detectedCategory) {
        console.log('ID da categoria encontrada:', detectedCategory.id)
        setSelectedCategory(detectedCategory.id)
        setSelectedCategoryName(detectedCategory.name) // Armazenar o nome também
      } else {
        console.log('Categoria não encontrada no banco:', detectedCategoryName)
        setSelectedCategory(undefined)
      }
    }
  }, [serviceItems, categories, selectedCategory])

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



  // Removido: cálculo automático da data do próximo serviço
  // Agora o usuário deve clicar no botão "Calcular" se quiser preencher automaticamente

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
      reset()
      setSearchTerm('')
      setShowClientList(false)
      setServiceItems([])
      setServiceMaterials([])
      setMonthsToAdd(undefined)
      setSelectedCategory(undefined)
      setShowCategoriesManager(false)
    }
  }, [open, reset])

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

  // Filtrar clientes baseado no termo de busca (ignorando acentos)
  const filteredClients = clients.filter(client => {
    if (!searchTerm.trim()) return true
    
    const normalizedTerm = normalizeText(searchTerm)
    return (
      normalizeText(client.full_name).includes(normalizedTerm) ||
      (client.document && normalizeText(client.document).includes(normalizedTerm)) ||
      (client.phone && normalizeText(client.phone).includes(normalizedTerm))
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
      
      // Detectar categoria automaticamente se não foi selecionada manualmente
      let serviceType: ServiceType | undefined = undefined
      
      if (selectedCategory && selectedCategory !== 'auto') {
        // Se foi selecionada manualmente, buscar o nome da categoria pelo ID
        const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory)
        if (selectedCategoryObj) {
          // Usar o nome exato da categoria sem normalização
          serviceType = selectedCategoryObj.name as ServiceType
          console.log('Usando categoria selecionada manualmente:', selectedCategoryObj.name)
        }
      } else if (serviceItems.length > 0) {
        // Se não foi selecionada manualmente, usar a categoria detectada automaticamente
        serviceType = categorizeServiceByItems(serviceItems)
        console.log('Usando categoria detectada automaticamente:', serviceType)
      } else {
        console.log('Nenhuma categoria detectada, usando OUTRO')
      }
      
      console.log('Categoria final que será salva:', serviceType)
      
      // Limpar campos vazios e formatar datas corretamente
      const cleanData: CreateServiceData = {
        client_id: data.client_id,
        service_date: formatDateForDatabase(data.service_date),
        service_type: serviceType, // Incluir a categoria detectada/selecionada
        notes: data.notes.trim() === '' ? undefined : data.notes,
        next_service_date: data.next_service_date && data.next_service_date.trim() !== '' ? formatDateForDatabase(data.next_service_date) : undefined,
        payment_method: data.payment_method && data.payment_method.trim() !== '' ? data.payment_method as PaymentMethod : undefined,
        payment_details: data.payment_details?.trim() === '' ? undefined : data.payment_details,
        service_items: serviceItems,
        service_materials: serviceMaterials,
      }
      
      // Criar o serviço
      const createdService = await onServiceCreated(cleanData)
      
      // Sincronizar com Google Calendar se estiver conectado, não precisar reconectar e tiver data do próximo serviço
      if (isAuthenticated && !needsReconnect && data.next_service_date && data.next_service_date.trim() !== '' && createdService.clients?.full_name) {
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
      setSelectedCategory(undefined) // Resetar categoria selecionada
      onOpenChange(false)
    } catch (error) {
      // Capturar e exibir erros específicos
      console.error('Erro detalhado ao criar serviço:', error)
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
    reset()
    setSearchTerm('')
    setShowClientList(false)
    setServiceItems([])
    setServiceMaterials([])
    onOpenChange(false)
  }

  return (
    <>
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
                    value={monthsToAdd || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || undefined
                      setMonthsToAdd(value)
                      // Não preencher automaticamente - deixar o usuário decidir se quer usar
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">meses</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (getValues('service_date')) {
                        const nextDate = calculateNextServiceDate(getValues('service_date'), monthsToAdd || 1)
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

      {/* Gerenciador de Categorias */}
      <CustomCategoriesManager
        open={showCategoriesManager}
        onOpenChange={setShowCategoriesManager}
        onCategoryChange={loadCategories}
      />
    </>
  )
}
