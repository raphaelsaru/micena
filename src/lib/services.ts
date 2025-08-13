'use client'

import { supabase } from './supabase-client'
import { Service, ServiceType, ServiceWithClient } from '@/types/database'

export interface CreateServiceData {
  client_id: string
  service_date: string
  service_type: ServiceType
  equipment_details?: string
  notes?: string
  next_service_date?: string
  work_order_number?: string
}

export interface UpdateServiceData {
  client_id?: string
  service_date?: string
  service_type?: ServiceType
  equipment_details?: string
  notes?: string
  next_service_date?: string
  work_order_number?: string
}

// Buscar todos os serviços com informações do cliente
export async function getServices(): Promise<ServiceWithClient[]> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      client:clients(
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
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData])
    .select(`
      *,
      client:clients(
        full_name,
        document
      )
    `)
    .single()

  if (error) {
    console.error('Erro ao criar serviço:', error)
    throw new Error('Erro ao criar serviço')
  }

  return data
}

// Atualizar serviço existente
export async function updateService(id: string, serviceData: UpdateServiceData): Promise<ServiceWithClient> {
  const { data, error } = await supabase
    .from('services')
    .update(serviceData)
    .eq('id', id)
    .select(`
      *,
      client:clients(
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
      client:clients(
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

  // Filtro por nome do cliente no frontend
  if (filters.clientName) {
    const searchTerm = filters.clientName.toLowerCase()
    results = results.filter((service: any) => 
      service.client?.full_name?.toLowerCase().includes(searchTerm)
    )
  }

  return results
}
