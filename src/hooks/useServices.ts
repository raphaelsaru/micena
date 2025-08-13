'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Service, ServiceType, ServiceWithClient } from '@/types/database'
import { 
  getServices, 
  getServicesByClient,
  createService, 
  updateService, 
  deleteService,
  searchServices,
  CreateServiceData,
  UpdateServiceData
} from '@/lib/services'

export function useServices() {
  const [services, setServices] = useState<ServiceWithClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar serviços
  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getServices()
      setServices(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error('Erro ao carregar serviços')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar serviços na inicialização
  useEffect(() => {
    loadServices()
  }, [loadServices])

  // Adicionar novo serviço
  const addService = useCallback(async (serviceData: CreateServiceData) => {
    try {
      const newService = await createService(serviceData)
      
      // Atualização otimista
      setServices(prev => [newService, ...prev])
      
      toast.success('Serviço criado com sucesso!')
      return newService
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar serviço'
      toast.error(errorMessage)
      throw err
    }
  }, [])

  // Editar serviço existente
  const editService = useCallback(async (id: string, serviceData: UpdateServiceData) => {
    try {
      const updatedService = await updateService(id, serviceData)
      
      // Atualização otimista
      setServices(prev => 
        prev.map(service => 
          service.id === id ? updatedService : service
        )
      )
      
      toast.success('Serviço atualizado com sucesso!')
      return updatedService
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar serviço'
      toast.error(errorMessage)
      throw err
    }
  }, [])

  // Remover serviço
  const removeService = useCallback(async (id: string) => {
    try {
      await deleteService(id)
      
      // Atualização otimista
      setServices(prev => prev.filter(service => service.id !== id))
      
      toast.success('Serviço removido com sucesso!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover serviço'
      toast.error(errorMessage)
      throw err
    }
  }, [])

  // Buscar serviços com filtros
  const searchServicesList = useCallback(async (filters: {
    clientName?: string
    serviceType?: ServiceType
    dateFrom?: string
    dateTo?: string
  }) => {
    try {
      setIsLoading(true)
      const data = await searchServices(filters)
      setServices(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar serviços'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    services,
    isLoading,
    error,
    loadServices,
    addService,
    editService,
    removeService,
    searchServices: searchServicesList,
  }
}

// Hook específico para serviços de um cliente
export function useClientServices(clientId: string) {
  const [services, setServices] = useState<ServiceWithClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClientServices = useCallback(async () => {
    if (!clientId) return
    
    try {
      setIsLoading(true)
      setError(null)
      const data = await getServicesByClient(clientId)
      setServices(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    loadClientServices()
  }, [loadClientServices])

  return {
    services,
    isLoading,
    error,
    loadClientServices,
  }
}
