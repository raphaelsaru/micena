'use client'

import { supabase } from './supabase-client'
import { Service, ServiceType, ServiceWithClient, ServiceWithDetails, ServiceItem, ServiceMaterial, PaymentMethod, categorizeServiceByItems, ServiceCatalogItem, MaterialCatalogItem, LastPriceResult, ServiceCategory, CustomServiceCategory } from '@/types/database'
import { normalizeText } from './utils'

export interface CreateServiceData {
  client_id: string
  service_date: string
  service_type?: ServiceType // Agora opcional
  notes?: string
  next_service_date?: string
  payment_method?: PaymentMethod
  payment_details?: string
  service_items?: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]
  service_materials?: Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]
}

export interface UpdateServiceData {
  client_id?: string
  service_date?: string
  service_type?: ServiceType
  notes?: string
  next_service_date?: string
  payment_method?: PaymentMethod
  payment_details?: string
}

// Função auxiliar para padStart (compatibilidade com navegadores antigos)
function padStart(str: string, targetLength: number, padString: string): string {
  if (str.length >= targetLength) {
    return str
  }
  const pad = padString.repeat(Math.ceil((targetLength - str.length) / padString.length))
  return pad.slice(0, targetLength - str.length) + str
}

// Função para gerar automaticamente o número da OS
export async function generateWorkOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  
  try {
    console.log('Gerando número da OS para o ano:', currentYear)
    
    // Buscar o último número de OS do ano atual
    const { data, error } = await supabase
      .from('services')
      .select('work_order_number')
      .not('work_order_number', 'is', null)
      .ilike('work_order_number', `OS-${currentYear}-%`)
      .order('work_order_number', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Erro ao buscar último número de OS:', error)
      // Fallback: retorna o primeiro número do ano
      return `OS-${currentYear}-0001`
    }

    console.log('Dados encontrados:', data)

    if (!data || data.length === 0) {
      // Primeira OS do ano
      console.log('Primeira OS do ano, retornando:', `OS-${currentYear}-0001`)
      return `OS-${currentYear}-0001`
    }

    // Extrair o número da última OS
    const lastNumber = data[0].work_order_number
    if (!lastNumber) {
      console.log('Último número é null, retornando:', `OS-${currentYear}-0001`)
      return `OS-${currentYear}-0001`
    }

    console.log('Último número encontrado:', lastNumber)

    const match = lastNumber.match(/OS-\d{4}-(\d{4})/)
    
    if (match) {
      const lastSequence = parseInt(match[1])
      const nextSequence = lastSequence + 1
      const result = `OS-${currentYear}-${padStart(nextSequence.toString(), 4, '0')}`
      console.log('Próximo número calculado:', result)
      return result
    }

    // Fallback: retorna o próximo número sequencial
    console.log('Fallback, retornando:', `OS-${currentYear}-0001`)
    return `OS-${currentYear}-0001`
  } catch (error) {
    console.error('Erro inesperado ao gerar número da OS:', error)
    // Fallback: retorna o primeiro número do ano
    return `OS-${currentYear}-0001`
  }
}

// Buscar um serviço por ID (com dados do cliente, itens e materiais)
export async function getServiceById(id: string): Promise<ServiceWithClient | null> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      clients(
        full_name,
        document,
        phone
      ),
      service_items(*),
      service_materials(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar serviço por ID:', error)
    return null
  }

  return data
}

// Buscar todos os serviços com informações do cliente, itens e materiais
export async function getServices(): Promise<ServiceWithClient[]> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      clients(
        full_name,
        document
      ),
      service_items(*),
      service_materials(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar serviços:', error)
    throw new Error('Erro ao carregar serviços')
  }

  return data || []
}

// Buscar serviços com paginação
export async function getServicesPaginated(page: number, pageSize: number): Promise<ServiceWithClient[]> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      clients(
        full_name,
        document
      ),
      service_items(*),
      service_materials(*)
    `)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Erro ao buscar serviços com paginação:', error)
    throw new Error('Erro ao carregar serviços')
  }

  return data || []
}

// Buscar serviços de um cliente específico
export async function getServicesByClient(clientId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      service_items(*),
      service_materials(*)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar serviços do cliente:', error)
    throw new Error('Erro ao carregar histórico de serviços')
  }

  return data || []
}

// Criar novo serviço com itens e materiais
export async function createService(serviceData: CreateServiceData): Promise<ServiceWithClient> {
  try {
    // Gerar automaticamente o número da OS
    const workOrderNumber = await generateWorkOrderNumber()
    console.log('Número da OS gerado:', workOrderNumber)
    
    // Extrair itens e materiais do serviceData
    const { service_items, service_materials, ...serviceInfo } = serviceData
    
    // Categorizar automaticamente o serviço baseado nos itens se não foi especificado
    let finalServiceType = serviceInfo.service_type
    if (!finalServiceType && service_items && service_items.length > 0) {
      finalServiceType = categorizeServiceByItems(service_items)
    }
    
    // Criar o serviço principal com tipo categorizado automaticamente
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .insert([{ 
        ...serviceInfo, 
        service_type: finalServiceType || 'OUTRO',
        work_order_number: workOrderNumber 
      }])
      .select('*')
      .single()

    if (serviceError) {
      console.error('Erro ao criar serviço:', serviceError)
      throw new Error(`Erro ao criar serviço: ${serviceError.message || 'Erro desconhecido'}`)
    }

    // Inserir itens de serviço se existirem
    if (service_items && service_items.length > 0) {
      const itemsToInsert = service_items.map(item => ({
        ...item,
        service_id: service.id
      }))
      
      const { error: itemsError } = await supabase
        .from('service_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Erro ao inserir itens de serviço:', itemsError)
        // Continuar mesmo com erro nos itens
      }

      // Salvar preços no histórico para todos os itens
      for (const item of service_items) {
        if (item.value > 0) {
          try {
            if (item.catalog_item_id) {
              // Se tem catalog_item_id, usar a função normal
              await insertPriceHistory('service', item.catalog_item_id, item.value)
            } else {
              // Se não tem catalog_item_id, usar a função para itens customizados
              await insertCustomPriceHistory('service', item.description, item.value)
            }
          } catch (error) {
            console.error('Erro ao salvar preço no histórico:', error)
            // Continuar mesmo com erro no histórico
          }
        }
      }
    }

    // Inserir materiais se existirem
    if (service_materials && service_materials.length > 0) {
      const materialsToInsert = service_materials.map(material => ({
        ...material,
        service_id: service.id,
        total_price: material.quantity * material.unit_price
      }))
      
      const { error: materialsError } = await supabase
        .from('service_materials')
        .insert(materialsToInsert)

      if (materialsError) {
        console.error('Erro ao inserir materiais:', materialsError)
        // Continuar mesmo com erro nos materiais
      }

      // Salvar preços no histórico para todos os materiais
      for (const material of service_materials) {
        if (material.unit_price > 0) {
          try {
            if (material.catalog_item_id) {
              // Se tem catalog_item_id, usar a função normal
              await insertPriceHistory('material', material.catalog_item_id, material.unit_price)
            } else {
              // Se não tem catalog_item_id, usar a função para materiais customizados
              await insertCustomPriceHistory('material', material.description, material.unit_price)
            }
          } catch (error) {
            console.error('Erro ao salvar preço no histórico:', error)
            // Continuar mesmo com erro no histórico
          }
        }
      }
    }

    // Buscar o serviço completo com dados do cliente, itens e materiais
    const { data: completeService, error: fetchError } = await supabase
      .from('services')
      .select(`
        *,
        clients(
          full_name,
          document
        ),
        service_items(*),
        service_materials(*)
      `)
      .eq('id', service.id)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar serviço criado:', fetchError)
      throw new Error('Erro ao buscar serviço criado')
    }

    return completeService
  } catch (error) {
    console.error('Erro inesperado ao criar serviço:', error)
    if (error instanceof Error) {
      throw new Error(`Erro ao criar serviço: ${error.message}`)
    }
    throw new Error('Erro inesperado ao criar serviço')
  }
}

// Atualizar serviço existente
export async function updateService(id: string, serviceData: UpdateServiceData): Promise<ServiceWithClient> {
  const { data, error } = await supabase
    .from('services')
    .update(serviceData)
    .eq('id', id)
    .select(`
      *,
      clients(
        full_name,
        document
      ),
      service_items(*),
      service_materials(*)
    `)
    .single()

  if (error) {
    console.error('Erro ao atualizar serviço:', error)
    console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
    throw new Error(`Erro ao atualizar serviço: ${error.message || JSON.stringify(error, null, 2)}`)
  }

  return data
}

// Deletar serviço
export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar serviço:', error)
    throw new Error('Erro ao deletar serviço')
  }
}

// Buscar serviços por filtros
export async function searchServices(filters: {
  clientName?: string
  serviceType?: ServiceType
  dateFrom?: string
  dateTo?: string
}): Promise<ServiceWithClient[]> {
  let query = supabase
    .from('services')
    .select(`
      *,
      clients(
        full_name,
        document
      ),
      service_items(*),
      service_materials(*)
    `)

  // Filtro por tipo de serviço
  if (filters.serviceType) {
    query = query.eq('service_type', filters.serviceType)
  }

  // Filtro por período
  if (filters.dateFrom) {
    query = query.gte('service_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('service_date', filters.dateTo)
  }

  // Filtro por nome do cliente (mais complexo, será feito no frontend)
  
  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar serviços:', error)
    throw new Error('Erro ao filtrar serviços')
  }

  let results = data || []

  // Filtro por nome do cliente no frontend (ignorando acentos)
  if (filters.clientName) {
    const normalizedSearchTerm = normalizeText(filters.clientName)
    results = results.filter((service: ServiceWithClient) => 
      service.clients?.full_name && 
      normalizeText(service.clients.full_name).includes(normalizedSearchTerm)
    )
  }

  return results
}

// Buscar serviço com todos os detalhes (itens e materiais)
export async function getServiceWithDetails(id: string): Promise<ServiceWithDetails | null> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      clients(
        full_name,
        document,
        phone
      ),
      service_items(*),
      service_materials(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar serviço com detalhes:', error)
    return null
  }

  return data
}

// Atualizar itens de serviço
export async function updateServiceItems(serviceId: string, items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  // Deletar itens existentes
  const { error: deleteError } = await supabase
    .from('service_items')
    .delete()
    .eq('service_id', serviceId)

  if (deleteError) {
    console.error('Erro ao deletar itens existentes:', deleteError)
    throw new Error('Erro ao atualizar itens de serviço')
  }

  // Inserir novos itens
  if (items.length > 0) {
    const itemsToInsert = items.map(item => ({
      ...item,
      service_id: serviceId
    }))
    
    const { error: insertError } = await supabase
      .from('service_items')
      .insert(itemsToInsert)

    if (insertError) {
      console.error('Erro ao inserir novos itens:', insertError)
      throw new Error('Erro ao atualizar itens de serviço')
    }
  }
}

// Atualizar materiais de serviço
export async function updateServiceMaterials(serviceId: string, materials: Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  // Deletar materiais existentes
  const { error: deleteError } = await supabase
    .from('service_materials')
    .delete()
    .eq('service_id', serviceId)

  if (deleteError) {
    console.error('Erro ao deletar materiais existentes:', deleteError)
    throw new Error('Erro ao atualizar materiais de serviço')
  }

  // Inserir novos materiais
  if (materials.length > 0) {
    const materialsToInsert = materials.map(material => ({
      ...material,
      service_id: serviceId,
      total_price: material.quantity * material.unit_price
    }))
    
    const { error: insertError } = await supabase
      .from('service_materials')
      .insert(materialsToInsert)

    if (insertError) {
      console.error('Erro ao inserir novos materiais:', insertError)
      throw new Error('Erro ao atualizar materiais de serviço')
    }
  }
}

// Funções para catálogos e histórico de preços
export async function getServiceCatalog(): Promise<ServiceCatalogItem[]> {
  const { data, error } = await supabase
    .from('service_catalog')
    .select('*')
    .order('name')

  if (error) {
    console.error('Erro ao buscar catálogo de serviços:', error)
    throw new Error(`Erro ao buscar catálogo de serviços: ${error.message}`)
  }

  return data || []
}

export async function searchServiceCatalog(query: string): Promise<ServiceCatalogItem[]> {
  if (!query.trim()) {
    return getServiceCatalog()
  }

  const { data, error } = await supabase
    .rpc('search_service_catalog_accent_insensitive', { 
      search_query: query 
    })

  if (error) {
    console.error('Erro ao buscar catálogo de serviços:', error)
    throw new Error(`Erro ao buscar catálogo de serviços: ${error.message}`)
  }

  return data || []
}

export async function getMaterialCatalog(): Promise<MaterialCatalogItem[]> {
  const { data, error } = await supabase
    .from('material_catalog')
    .select('*')
    .order('name')

  if (error) {
    console.error('Erro ao buscar catálogo de materiais:', error)
    throw new Error(`Erro ao buscar catálogo de materiais: ${error.message}`)
  }

  return data || []
}

export async function searchMaterialCatalog(query: string): Promise<MaterialCatalogItem[]> {
  if (!query.trim()) {
    return getMaterialCatalog()
  }

  const { data, error } = await supabase
    .rpc('search_material_catalog_accent_insensitive', { 
      search_query: query 
    })

  if (error) {
    console.error('Erro ao buscar catálogo de materiais:', error)
    throw new Error(`Erro ao buscar catálogo de materiais: ${error.message}`)
  }

  return data || []
}

export async function getLastPrice(
  itemType: 'service' | 'material',
  itemId: string,
  orgId?: string
): Promise<LastPriceResult | null> {
  const { data, error } = await supabase
    .rpc('get_last_price', {
      p_item_type: itemType,
      p_item_id: itemId,
      p_org_id: orgId
    })

  if (error) {
    console.error('Erro ao buscar último preço:', error)
    return null
  }

  return data && data.length > 0 ? data[0] : null
}

export async function insertPriceHistory(
  itemType: 'service' | 'material',
  itemId: string,
  price: number,
  orgId?: string
): Promise<string | null> {
  const { data, error } = await supabase
    .rpc('insert_price_history', {
      p_item_type: itemType,
      p_item_id: itemId,
      p_price_numeric: price,
      p_org_id: orgId
    })

  if (error) {
    console.error('Erro ao inserir histórico de preço:', error)
    return null
  }

  return data
}

// Função para inserir preço no histórico para itens customizados
export async function insertCustomPriceHistory(
  itemType: 'service' | 'material',
  description: string,
  price: number,
  orgId?: string
): Promise<string | null> {
  const { data, error } = await supabase
    .rpc('insert_custom_price_history', {
      p_description: description,
      p_item_type: itemType,
      p_price_numeric: price,
      p_org_id: orgId
    })

  if (error) {
    console.error('Erro ao inserir histórico de preço customizado:', error)
    return null
  }

  return data
}

// Funções para adicionar novos itens aos catálogos
export async function insertServiceCatalogItem(name: string, unitType?: string): Promise<ServiceCatalogItem | null> {
  const { data, error } = await supabase
    .from('service_catalog')
    .insert([{ 
      name: name.trim(), 
      unit_type: unitType 
    }])
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao inserir serviço no catálogo:', error)
    return null
  }

  return data
}

export async function insertMaterialCatalogItem(name: string, unitType: string): Promise<MaterialCatalogItem | null> {
  const { data, error } = await supabase
    .from('material_catalog')
    .insert([{ 
      name: name.trim(), 
      unit_type: unitType 
    }])
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao inserir material no catálogo:', error)
    return null
  }

  return data
}

// Funções para editar itens dos catálogos
export async function updateServiceCatalogItem(id: string, name: string, unitType?: string): Promise<ServiceCatalogItem | null> {
  const { data, error } = await supabase
    .from('service_catalog')
    .update({ 
      name: name.trim(), 
      unit_type: unitType,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao atualizar serviço no catálogo:', error)
    return null
  }

  return data
}

export async function updateMaterialCatalogItem(id: string, name: string, unitType: string): Promise<MaterialCatalogItem | null> {
  const { data, error } = await supabase
    .from('material_catalog')
    .update({ 
      name: name.trim(), 
      unit_type: unitType,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao atualizar material no catálogo:', error)
    return null
  }

  return data
}

// Funções para excluir itens dos catálogos
export async function deleteServiceCatalogItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('service_catalog')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir serviço do catálogo:', error)
    return false
  }

  return true
}

export async function deleteMaterialCatalogItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('material_catalog')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao excluir material do catálogo:', error)
    return false
  }

  return true
}

// Funções para gerenciar categorias de serviços
export async function getAllServiceCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .rpc('get_all_service_categories')

  if (error) {
    console.error('Erro ao buscar categorias de serviço:', error)
    throw new Error(`Erro ao buscar categorias de serviço: ${error.message}`)
  }

  return data || []
}

export async function addCustomServiceCategory(
  name: string, 
  description?: string, 
  color: string = '#6B7280'
): Promise<CustomServiceCategory | null> {
  const { data, error } = await supabase
    .rpc('add_custom_service_category', {
      category_name: name,
      category_description: description,
      category_color: color
    })

  if (error) {
    console.error('Erro ao adicionar categoria personalizada:', error)
    // Extrair mensagem do erro PostgreSQL se disponível
    let errorMessage = 'Erro ao adicionar categoria'
    
    if (error.message) {
      // Se a mensagem contém informações sobre duplicata, personalizar
      if (error.message.includes('duplicate key value')) {
        errorMessage = 'Já existe uma categoria com este nome'
      } else if (error.message.includes('Já existe uma categoria')) {
        // Capturar mensagem personalizada da função RPC
        const match = error.message.match(/Já existe uma categoria com o nome "([^"]+)"/);
        if (match) {
          errorMessage = `Já existe uma categoria com o nome "${match[1]}"`;
        } else {
          errorMessage = 'Já existe uma categoria com este nome';
        }
      } else {
        errorMessage = error.message
      }
    }
    
    throw new Error(errorMessage)
  }

  // Buscar a categoria criada para retornar os dados completos
  const { data: category, error: fetchError } = await supabase
    .from('custom_service_categories')
    .select('*')
    .eq('id', data)
    .single()

  if (fetchError) {
    console.error('Erro ao buscar categoria criada:', fetchError)
    return null
  }

  return category
}

export async function updateCustomServiceCategory(
  id: string,
  updates: {
    name?: string
    description?: string
    color?: string
    is_active?: boolean
  }
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('update_custom_service_category', {
      category_id: id,
      category_name: updates.name,
      category_description: updates.description,
      category_color: updates.color,
      category_active: updates.is_active
    })

  if (error) {
    console.error('Erro ao atualizar categoria personalizada:', error)
    // Extrair mensagem do erro PostgreSQL se disponível
    let errorMessage = 'Erro ao atualizar categoria'
    
    if (error.message) {
      // Se a mensagem contém informações sobre duplicata, personalizar
      if (error.message.includes('duplicate key value')) {
        errorMessage = 'Já existe uma categoria com este nome'
      } else if (error.message.includes('Já existe uma categoria')) {
        // Capturar mensagem personalizada da função RPC
        const match = error.message.match(/Já existe uma categoria com o nome "([^"]+)"/);
        if (match) {
          errorMessage = `Já existe uma categoria com o nome "${match[1]}"`;
        } else {
          errorMessage = 'Já existe uma categoria com este nome';
        }
      } else if (error.message.includes('Categoria não encontrada')) {
        errorMessage = 'Categoria não encontrada'
      } else {
        errorMessage = error.message
      }
    }
    
    throw new Error(errorMessage)
  }

  return data
}

export async function removeCustomServiceCategory(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('remove_custom_service_category', {
      category_id: id
    })

  if (error) {
    console.error('Erro ao remover categoria personalizada:', error)
    // Extrair mensagem do erro PostgreSQL se disponível
    const errorMessage = error.message || error.details || 'Erro desconhecido'
    throw new Error(errorMessage)
  }

  return data
}

// Nova função para deletar permanentemente uma categoria (hard delete)
export async function deleteCustomServiceCategory(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('delete_custom_service_category', {
      category_id: id
    })

  if (error) {
    console.error('Erro ao deletar categoria personalizada:', error)
    // Extrair mensagem do erro PostgreSQL se disponível
    let errorMessage = 'Erro ao deletar categoria'
    
    if (error.message) {
      if (error.message.includes('há') && error.message.includes('serviço(s) usando ela')) {
        errorMessage = 'Não é possível deletar esta categoria pois há serviços usando ela. Use remoção temporária em vez disso.'
      } else if (error.message.includes('Categoria não encontrada')) {
        errorMessage = 'Categoria não encontrada'
      } else {
        errorMessage = error.message
      }
    }
    
    throw new Error(errorMessage)
  }

  return data
}

// Nova função para listar categorias com informações de uso
export async function getCustomServiceCategoriesWithUsage(): Promise<Array<{
  id: string
  name: string
  description: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
  services_count: number
}>> {
  const { data, error } = await supabase
    .rpc('get_custom_service_categories_with_usage')

  if (error) {
    console.error('Erro ao buscar categorias com uso:', error)
    throw new Error('Erro ao buscar categorias')
  }

  return data || []
}
