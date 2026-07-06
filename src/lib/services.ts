'use server'

import { query, queryOne, insertRow, insertRows, updateRow, withTransaction } from '@/lib/db'
import { requireUser } from '@/lib/auth-server'
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

// Anexa clients/service_items/service_materials a uma lista de serviços (equivalente aos joins do Supabase)
async function attachDetails(services: Service[], includeClientFields: (keyof NonNullable<ServiceWithClient['clients']>)[] = ['full_name', 'document', 'phone']): Promise<ServiceWithClient[]> {
  if (services.length === 0) return []

  const ids = services.map((s) => s.id)
  const clientIds = [...new Set(services.map((s) => s.client_id))]

  const [items, materials, clients] = await Promise.all([
    query<ServiceItem>('SELECT * FROM service_items WHERE service_id = ANY($1)', [ids]),
    query<ServiceMaterial>('SELECT * FROM service_materials WHERE service_id = ANY($1)', [ids]),
    query<{ id: string; full_name: string; document: string | null; phone: string | null }>(
      'SELECT id, full_name, document, phone FROM clients WHERE id = ANY($1)',
      [clientIds]
    ),
  ])

  const clientsById = new Map(clients.map((c) => [c.id, c]))

  return services.map((service) => {
    const client = clientsById.get(service.client_id)
    const clientData = client
      ? Object.fromEntries(includeClientFields.map((f) => [f, client[f as keyof typeof client]]))
      : undefined
    return {
      ...service,
      clients: clientData as ServiceWithClient['clients'],
      service_items: items.filter((i) => i.service_id === service.id),
      service_materials: materials.filter((m) => m.service_id === service.id),
    }
  })
}

function padStart(str: string, targetLength: number, padString: string): string {
  if (str.length >= targetLength) {
    return str
  }
  const pad = padString.repeat(Math.ceil((targetLength - str.length) / padString.length))
  return pad.slice(0, targetLength - str.length) + str
}

// Função para gerar automaticamente o número da OS
export async function generateWorkOrderNumber(): Promise<string> {
  await requireUser()
  const currentYear = new Date().getFullYear()

  const last = await queryOne<{ work_order_number: string }>(
    `SELECT work_order_number FROM services
     WHERE work_order_number IS NOT NULL AND work_order_number ILIKE $1
     ORDER BY work_order_number DESC LIMIT 1`,
    [`OS-${currentYear}-%`]
  )

  if (!last || !last.work_order_number) {
    return `OS-${currentYear}-0001`
  }

  const match = last.work_order_number.match(/OS-\d{4}-(\d{4})/)
  if (match) {
    const nextSequence = parseInt(match[1], 10) + 1
    return `OS-${currentYear}-${padStart(nextSequence.toString(), 4, '0')}`
  }

  return `OS-${currentYear}-0001`
}

// Buscar um serviço por ID (com dados do cliente, itens e materiais)
export async function getServiceById(id: string): Promise<ServiceWithClient | null> {
  await requireUser()
  const service = await queryOne<Service>('SELECT * FROM services WHERE id = $1', [id])
  if (!service) return null
  const [withDetails] = await attachDetails([service])
  return withDetails
}

// Buscar todos os serviços com informações do cliente, itens e materiais
export async function getServices(): Promise<ServiceWithClient[]> {
  await requireUser()
  const services = await query<Service>('SELECT * FROM services ORDER BY created_at DESC')
  return attachDetails(services, ['full_name', 'document'])
}

// Buscar serviços com paginação
export async function getServicesPaginated(page: number, pageSize: number): Promise<ServiceWithClient[]> {
  await requireUser()
  const offset = page * pageSize
  const services = await query<Service>(
    'SELECT * FROM services ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [pageSize, offset]
  )
  return attachDetails(services, ['full_name', 'document'])
}

// Buscar serviços de um cliente específico
export async function getServicesByClient(clientId: string): Promise<Service[]> {
  await requireUser()
  const services = await query<Service>(
    'SELECT * FROM services WHERE client_id = $1 ORDER BY created_at DESC',
    [clientId]
  )
  const ids = services.map((s) => s.id)
  const [items, materials] = await Promise.all([
    query<ServiceItem>('SELECT * FROM service_items WHERE service_id = ANY($1)', [ids]),
    query<ServiceMaterial>('SELECT * FROM service_materials WHERE service_id = ANY($1)', [ids]),
  ])
  return services.map((service) => ({
    ...service,
    service_items: items.filter((i) => i.service_id === service.id),
    service_materials: materials.filter((m) => m.service_id === service.id),
  })) as Service[]
}

// Criar novo serviço com itens e materiais
export async function createService(serviceData: CreateServiceData): Promise<ServiceWithClient> {
  await requireUser()
  const workOrderNumber = await generateWorkOrderNumber()
  const { service_items, service_materials, ...serviceInfo } = serviceData

  let finalServiceType = serviceInfo.service_type
  if (!finalServiceType && service_items && service_items.length > 0) {
    finalServiceType = categorizeServiceByItems(service_items)
  }

  const insertData = {
    ...serviceInfo,
    service_type: finalServiceType || 'OUTRO',
    work_order_number: workOrderNumber,
  }

  // Serviço + itens + materiais são criados numa única transação: se um
  // INSERT no meio do lote falhar (ex. catalog_item_id inválido), tudo é
  // desfeito em vez de deixar o serviço com uma lista parcial.
  const service = await withTransaction(async (tx) => {
    const created = await insertRow<Service>('services', insertData, tx)
    if (!created) {
      throw new Error('Erro ao criar serviço')
    }

    if (service_items && service_items.length > 0) {
      await insertRows(
        'service_items',
        service_items.map((item) => ({
          service_id: created.id,
          description: item.description,
          value: item.value,
          catalog_item_id: item.catalog_item_id ?? null,
        })),
        tx
      )
    }

    if (service_materials && service_materials.length > 0) {
      await insertRows(
        'service_materials',
        service_materials.map((material) => ({
          service_id: created.id,
          description: material.description,
          unit: material.unit,
          quantity: material.quantity,
          unit_price: material.unit_price,
          total_price: material.quantity * material.unit_price,
          catalog_item_id: material.catalog_item_id ?? null,
        })),
        tx
      )
    }

    return created
  })

  // Histórico de preços é um efeito colateral melhor-esforço (não deve
  // desfazer a criação do serviço se falhar), então roda fora da transação.
  for (const item of service_items ?? []) {
    if (item.value > 0) {
      try {
        if (item.catalog_item_id) {
          await insertPriceHistory('service', item.catalog_item_id, item.value)
        } else {
          await insertCustomPriceHistory('service', item.description, item.value)
        }
      } catch {
        // Continuar mesmo com erro no histórico
      }
    }
  }

  for (const material of service_materials ?? []) {
    if (material.unit_price > 0) {
      try {
        if (material.catalog_item_id) {
          await insertPriceHistory('material', material.catalog_item_id, material.unit_price)
        } else {
          await insertCustomPriceHistory('material', material.description, material.unit_price)
        }
      } catch {
        // Continuar mesmo com erro no histórico
      }
    }
  }

  const completeService = await getServiceById(service.id)
  if (!completeService) {
    throw new Error('Erro ao buscar serviço criado')
  }
  return completeService
}

// Atualizar serviço existente
export async function updateService(id: string, serviceData: UpdateServiceData): Promise<ServiceWithClient> {
  await requireUser()
  if (Object.keys(serviceData).length > 0) {
    await updateRow('services', id, serviceData)
  }

  const updated = await getServiceById(id)
  if (!updated) {
    throw new Error('Erro ao atualizar serviço')
  }
  return updated
}

// Deletar serviço
export async function deleteService(id: string): Promise<void> {
  await requireUser()
  await query('DELETE FROM services WHERE id = $1', [id])
}

// Buscar serviços por filtros
export async function searchServices(filters: {
  clientName?: string
  serviceType?: ServiceType
  dateFrom?: string
  dateTo?: string
}): Promise<ServiceWithClient[]> {
  await requireUser()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.serviceType) {
    params.push(filters.serviceType)
    conditions.push(`service_type = $${params.length}`)
  }
  if (filters.dateFrom) {
    params.push(filters.dateFrom)
    conditions.push(`service_date >= $${params.length}`)
  }
  if (filters.dateTo) {
    params.push(filters.dateTo)
    conditions.push(`service_date <= $${params.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const services = await query<Service>(
    `SELECT * FROM services ${where} ORDER BY created_at DESC`,
    params
  )

  let results = await attachDetails(services, ['full_name', 'document'])

  if (filters.clientName) {
    const normalizedSearchTerm = normalizeText(filters.clientName)
    results = results.filter(
      (service) =>
        service.clients?.full_name && normalizeText(service.clients.full_name).includes(normalizedSearchTerm)
    )
  }

  return results
}

// Buscar serviço com todos os detalhes (itens e materiais)
export async function getServiceWithDetails(id: string): Promise<ServiceWithDetails | null> {
  await requireUser()
  const result = await getServiceById(id)
  return result as ServiceWithDetails | null
}

// Atualizar itens de serviço
export async function updateServiceItems(serviceId: string, items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  await requireUser()
  await withTransaction(async (tx) => {
    await tx.query('DELETE FROM service_items WHERE service_id = $1', [serviceId])
    if (items.length > 0) {
      await insertRows(
        'service_items',
        items.map((item) => ({
          service_id: serviceId,
          description: item.description,
          value: item.value,
          catalog_item_id: item.catalog_item_id ?? null,
        })),
        tx
      )
    }
  })
}

// Atualizar materiais de serviço
export async function updateServiceMaterials(serviceId: string, materials: Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  await requireUser()
  await withTransaction(async (tx) => {
    await tx.query('DELETE FROM service_materials WHERE service_id = $1', [serviceId])
    if (materials.length > 0) {
      await insertRows(
        'service_materials',
        materials.map((material) => ({
          service_id: serviceId,
          description: material.description,
          unit: material.unit,
          quantity: material.quantity,
          unit_price: material.unit_price,
          total_price: material.quantity * material.unit_price,
          catalog_item_id: material.catalog_item_id ?? null,
        })),
        tx
      )
    }
  })
}

// Funções para catálogos e histórico de preços
export async function getServiceCatalog(): Promise<ServiceCatalogItem[]> {
  await requireUser()
  return query<ServiceCatalogItem>('SELECT * FROM service_catalog ORDER BY name')
}

export async function searchServiceCatalog(searchQuery: string): Promise<ServiceCatalogItem[]> {
  await requireUser()
  if (!searchQuery.trim()) {
    return getServiceCatalog()
  }
  return query<ServiceCatalogItem>('SELECT * FROM search_service_catalog_accent_insensitive($1)', [searchQuery])
}

export async function getMaterialCatalog(): Promise<MaterialCatalogItem[]> {
  await requireUser()
  return query<MaterialCatalogItem>('SELECT * FROM material_catalog ORDER BY name')
}

export async function searchMaterialCatalog(searchQuery: string): Promise<MaterialCatalogItem[]> {
  await requireUser()
  if (!searchQuery.trim()) {
    return getMaterialCatalog()
  }
  return query<MaterialCatalogItem>('SELECT * FROM search_material_catalog_accent_insensitive($1)', [searchQuery])
}

export async function getLastPrice(
  itemType: 'service' | 'material',
  itemId: string,
  orgId?: string
): Promise<LastPriceResult | null> {
  await requireUser()
  return queryOne<LastPriceResult>('SELECT * FROM get_last_price($1, $2, $3)', [itemType, itemId, orgId ?? null])
}

export async function insertPriceHistory(
  itemType: 'service' | 'material',
  itemId: string,
  price: number,
  orgId?: string
): Promise<string | null> {
  await requireUser()
  const result = await queryOne<{ insert_price_history: string }>(
    'SELECT insert_price_history($1, $2, $3, $4)',
    [itemType, itemId, price, orgId ?? null]
  )
  return result?.insert_price_history ?? null
}

// Função para inserir preço no histórico para itens customizados
export async function insertCustomPriceHistory(
  itemType: 'service' | 'material',
  description: string,
  price: number,
  orgId?: string
): Promise<string | null> {
  await requireUser()
  const result = await queryOne<{ insert_custom_price_history: string }>(
    'SELECT insert_custom_price_history($1, $2, $3, $4)',
    [description, itemType, price, orgId ?? null]
  )
  return result?.insert_custom_price_history ?? null
}

// Funções para adicionar novos itens aos catálogos
export async function insertServiceCatalogItem(name: string, unitType?: string): Promise<ServiceCatalogItem | null> {
  await requireUser()
  return queryOne<ServiceCatalogItem>(
    'INSERT INTO service_catalog (name, unit_type) VALUES ($1, $2) RETURNING *',
    [name.trim(), unitType ?? null]
  )
}

export async function insertMaterialCatalogItem(name: string, unitType: string): Promise<MaterialCatalogItem | null> {
  await requireUser()
  return queryOne<MaterialCatalogItem>(
    'INSERT INTO material_catalog (name, unit_type) VALUES ($1, $2) RETURNING *',
    [name.trim(), unitType]
  )
}

// Funções para editar itens dos catálogos
export async function updateServiceCatalogItem(id: string, name: string, unitType?: string): Promise<ServiceCatalogItem | null> {
  await requireUser()
  return queryOne<ServiceCatalogItem>(
    'UPDATE service_catalog SET name = $1, unit_type = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [name.trim(), unitType ?? null, id]
  )
}

export async function updateMaterialCatalogItem(id: string, name: string, unitType: string): Promise<MaterialCatalogItem | null> {
  await requireUser()
  return queryOne<MaterialCatalogItem>(
    'UPDATE material_catalog SET name = $1, unit_type = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [name.trim(), unitType, id]
  )
}

function extractPgErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message) || fallback
  }
  return fallback
}

// Funções para excluir itens dos catálogos
export async function deleteServiceCatalogItem(id: string): Promise<boolean> {
  await requireUser()
  const result = await queryOne<{ safe_delete_service_catalog_item: { success: boolean; message: string } }>(
    'SELECT safe_delete_service_catalog_item($1)',
    [id]
  )
  const data = result?.safe_delete_service_catalog_item
  if (!data?.success) {
    throw new Error(data?.message || 'Erro ao excluir serviço do catálogo')
  }
  return true
}

export async function deleteMaterialCatalogItem(id: string): Promise<boolean> {
  await requireUser()
  const result = await queryOne<{ safe_delete_material_catalog_item: { success: boolean; message: string } }>(
    'SELECT safe_delete_material_catalog_item($1)',
    [id]
  )
  const data = result?.safe_delete_material_catalog_item
  if (!data?.success) {
    throw new Error(data?.message || 'Erro ao excluir material do catálogo')
  }
  return true
}

// Funções para gerenciar categorias de serviços
export async function getAllServiceCategories(): Promise<ServiceCategory[]> {
  await requireUser()
  return query<ServiceCategory>('SELECT * FROM get_all_service_categories()')
}

function translateCategoryError(message: string, fallback: string): string {
  if (message.includes('duplicate key value') || message.includes('Já existe uma categoria')) {
    const match = message.match(/Já existe uma categoria com o nome "([^"]+)"/)
    return match ? `Já existe uma categoria com o nome "${match[1]}"` : 'Já existe uma categoria com este nome'
  }
  if (message.includes('Categoria não encontrada')) {
    return 'Categoria não encontrada'
  }
  return message || fallback
}

export async function addCustomServiceCategory(
  name: string,
  description?: string,
  color: string = '#6B7280'
): Promise<CustomServiceCategory | null> {
  await requireUser()
  try {
    const result = await queryOne<{ add_custom_service_category: string }>(
      'SELECT add_custom_service_category($1, $2, $3)',
      [name, description ?? null, color]
    )
    const newId = result?.add_custom_service_category
    if (!newId) return null

    return queryOne<CustomServiceCategory>('SELECT * FROM custom_service_categories WHERE id = $1', [newId])
  } catch (error) {
    throw new Error(translateCategoryError(extractPgErrorMessage(error, 'Erro ao adicionar categoria'), 'Erro ao adicionar categoria'))
  }
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
  await requireUser()
  try {
    const result = await queryOne<{ update_custom_service_category: boolean }>(
      'SELECT update_custom_service_category($1, $2, $3, $4, $5)',
      [id, updates.name ?? null, updates.description ?? null, updates.color ?? null, updates.is_active ?? null]
    )
    return result?.update_custom_service_category ?? false
  } catch (error) {
    throw new Error(translateCategoryError(extractPgErrorMessage(error, 'Erro ao atualizar categoria'), 'Erro ao atualizar categoria'))
  }
}

export async function removeCustomServiceCategory(id: string): Promise<boolean> {
  await requireUser()
  const result = await queryOne<{ remove_custom_service_category: boolean }>(
    'SELECT remove_custom_service_category($1)',
    [id]
  )
  return result?.remove_custom_service_category ?? false
}

// Nova função para deletar permanentemente uma categoria (hard delete)
export async function deleteCustomServiceCategory(id: string): Promise<boolean> {
  await requireUser()
  try {
    const result = await queryOne<{ delete_custom_service_category: boolean }>(
      'SELECT delete_custom_service_category($1)',
      [id]
    )
    return result?.delete_custom_service_category ?? false
  } catch (error) {
    const message = extractPgErrorMessage(error, 'Erro ao deletar categoria')
    if (message.includes('há') && message.includes('serviço(s) usando ela')) {
      throw new Error('Não é possível deletar esta categoria pois há serviços usando ela. Use remoção temporária em vez disso.')
    }
    throw new Error(translateCategoryError(message, 'Erro ao deletar categoria'))
  }
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
  await requireUser()
  return query('SELECT * FROM get_custom_service_categories_with_usage()')
}

// Função para obter informações sobre itens que podem ser excluídos
export async function getDeletableCatalogItems(): Promise<{
  services: Array<{
    id: string
    name: string
    unit_type: string | null
    can_delete: boolean
    reference_count: number
  }>
  materials: Array<{
    id: string
    name: string
    unit_type: string | null
    can_delete: boolean
    reference_count: number
  }>
}> {
  await requireUser()
  const data = await query<{
    item_type: 'service' | 'material'
    id: string
    name: string
    unit_type: string | null
    can_delete: boolean
    reference_count: number
  }>('SELECT * FROM get_deletable_catalog_items()')

  const services = data.filter((item) => item.item_type === 'service')
  const materials = data.filter((item) => item.item_type === 'material')

  return { services, materials }
}
