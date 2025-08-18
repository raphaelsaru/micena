'use client'

import { supabase } from './supabase-client'
import { Service, ServiceType, ServiceWithClient } from '@/types/database'
import { normalizeText } from './utils'

export interface CreateServiceData {
  client_id: string
  service_date: string
  service_type: ServiceType
  equipment_details?: string
  notes?: string
  next_service_date?: string
}

export interface UpdateServiceData {
  client_id?: string
  service_date?: string
  service_type?: ServiceType
  equipment_details?: string
  notes?: string
  next_service_date?: string
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

// Buscar um serviço por ID (com dados do cliente)
export async function getServiceById(id: string): Promise<ServiceWithClient | null> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      clients(
        full_name,
        document,
        phone
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar serviço por ID:', error)
    return null
  }

  return data
}

// Buscar todos os serviços com informações do cliente
export async function getServices(): Promise<ServiceWithClient[]> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      clients(
        full_name,
        document
      )
    `)
    .order('service_date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar serviços:', error)
    throw new Error('Erro ao carregar serviços')
  }

  return data || []
}

// Buscar serviços de um cliente específico
export async function getServicesByClient(clientId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('client_id', clientId)
    .order('service_date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar serviços do cliente:', error)
    throw new Error('Erro ao carregar histórico de serviços')
  }

  return data || []
}

// Criar novo serviço
export async function createService(serviceData: CreateServiceData): Promise<ServiceWithClient> {
  try {
    // Gerar automaticamente o número da OS
    const workOrderNumber = await generateWorkOrderNumber()
    console.log('Número da OS gerado:', workOrderNumber)
    
    const { data, error } = await supabase
      .from('services')
      .insert([{ ...serviceData, work_order_number: workOrderNumber }])
      .select(`
        *,
        clients(
          full_name,
          document
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao criar serviço:', error)
      throw new Error(`Erro ao criar serviço: ${error.message}`)
    }

    return data
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
      )
    `)
    .single()

  if (error) {
    console.error('Erro ao atualizar serviço:', error)
    throw new Error('Erro ao atualizar serviço')
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
      )
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
  
  const { data, error } = await query.order('service_date', { ascending: false })

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
