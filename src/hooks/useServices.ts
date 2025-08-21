'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Service, ServiceType, ServiceWithClient, ServiceItem, ServiceMaterial } from '@/types/database'
import { 
  getServicesPaginated, 
  getServicesByClient,
  createService, 
  updateService, 
  deleteService,
  searchServices,
  updateServiceItems,
  updateServiceMaterials,
  CreateServiceData,
  UpdateServiceData
} from '@/lib/services'

export function useServices() {
  const [services, setServices] = useState<ServiceWithClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const PAGE_SIZE = 15

  // Carregar serviços com paginação
  const loadServices = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (page === 0) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)
      
      const data = await getServicesPaginated(page, PAGE_SIZE)
      
      if (append) {
        setServices(prev => [...prev, ...data])
      } else {
        setServices(data)
      }
      
      // Verifica se ainda há mais dados para carregar
      setHasMore(data.length === PAGE_SIZE)
      setCurrentPage(page)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error('Erro ao carregar serviços')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // Função para carregar mais serviços
  const loadMoreServices = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    
    const nextPage = currentPage + 1
    await loadServices(nextPage, true)
  }, [currentPage, hasMore, isLoadingMore, loadServices])

  // Função para recarregar serviços (reset da paginação)
  const refreshServices = useCallback(async () => {
    setCurrentPage(0)
    setHasMore(true)
    await loadServices(0, false)
  }, [loadServices])

  // Carregar serviços na inicialização
  useEffect(() => {
    loadServices(0, false)
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

  // Editar serviço completo (incluindo itens e materiais)
  const editServiceComplete = useCallback(async (id: string, serviceData: UpdateServiceData, items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[], materials: Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]) => {
    try {
      // Primeiro atualizar o serviço principal
      const updatedService = await updateService(id, serviceData)
      
      // Depois atualizar itens e materiais
      if (items.length > 0 || materials.length > 0) {
        // Atualizar itens se existirem
        if (items.length > 0) {
          await updateServiceItems(id, items)
        }
        
        // Atualizar materiais se existirem
        if (materials.length > 0) {
          await updateServiceMaterials(id, materials)
        }
        
        // Recarregar a lista completa para garantir sincronização
        await refreshServices()
      } else {
        // Atualização otimista apenas para o serviço principal
        setServices(prev => 
          prev.map(service => 
            service.id === id ? updatedService : service
          )
        )
      }
      
      toast.success('Serviço atualizado com sucesso!')
      return updatedService
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar serviço'
      toast.error(errorMessage)
      throw err
    }
  }, [refreshServices])

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
      setHasMore(false) // Reset da paginação ao buscar
      setCurrentPage(0)
      
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
    isLoadingMore,
    error,
    hasMore,
    loadServices,
    loadMoreServices,
    addService,
    editService,
    editServiceComplete,
    removeService,
    searchServices: searchServicesList,
    refreshServices,
  }
}

// Hook específico para serviços de um cliente
export function useClientServices(clientId: string) {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadClientServices = useCallback(async () => {
    if (!clientId) return
    
    try {
      setIsLoading(true)
      const data = await getServicesByClient(clientId)
      setServices(data)
    } catch {
      // Erro já tratado no hook principal
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
    loadClientServices,
  }
}
