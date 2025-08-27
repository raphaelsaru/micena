'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, updateClient, deleteClient, getClientsPaginated, searchClients, getMensalistasPaginated, searchMensalistas, getTotalMensalistas } from '@/lib/clients'
import { Client } from '@/types/database'
import { toast } from 'sonner'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showOnlyMensalistas, setShowOnlyMensalistas] = useState(false)
  const [totalMensalistas, setTotalMensalistas] = useState(0)
  const PAGE_SIZE = 15

  // Função para buscar clientes do servidor com paginação
  const fetchClients = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (page === 0) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)
      
      let data: Client[]
      if (showOnlyMensalistas) {
        data = await getMensalistasPaginated(page, PAGE_SIZE)
      } else {
        data = await getClientsPaginated(page, PAGE_SIZE)
      }
      
      if (append) {
        // Evita duplicatas ao adicionar novos clientes
        setClients(prev => {
          const existingIds = new Set(prev.map(client => client.id))
          const newClients = data.filter(client => !existingIds.has(client.id))
          return [...prev, ...newClients]
        })
      } else {
        setClients(data)
      }
      
      // Verifica se ainda há mais dados para carregar
      setHasMore(data.length === PAGE_SIZE)
      setCurrentPage(page)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes'
      setError(errorMessage)
      toast.error('Erro ao carregar clientes')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [showOnlyMensalistas])

  // Função para buscar clientes por query
  const searchClientsByQuery = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchQuery('')
      setIsSearching(false)
      // Retorna para a paginação normal
      await fetchClients(0, false)
      return
    }

    try {
      setIsSearching(true)
      setIsLoading(true)
      setError(null)
      
      let data: Client[]
      if (showOnlyMensalistas) {
        data = await searchMensalistas(query)
      } else {
        data = await searchClients(query)
      }
      
      // Remove duplicatas antes de definir os clientes
      const uniqueClients = data.filter((client, index, self) => 
        index === self.findIndex(c => c.id === client.id)
      )
      
      setClients(uniqueClients)
      setSearchQuery(query)
      setHasMore(false) // Não há mais dados para carregar em busca
      setCurrentPage(0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar clientes'
      setError(errorMessage)
      toast.error('Erro ao buscar clientes')
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }, [fetchClients, showOnlyMensalistas])

  // Função para alternar entre mostrar todos os clientes ou apenas mensalistas
  const toggleMensalistasFilter = useCallback(async () => {
    // Limpa o estado atual antes de alternar
    setClients([])
    setCurrentPage(0)
    setHasMore(true)
    setSearchQuery('')
    setIsSearching(false)
    
    // Alterna o filtro
    setShowOnlyMensalistas(prev => !prev)
    
    // Recarrega os clientes com o novo filtro
    setTimeout(async () => {
      try {
        let data: Client[]
        if (!showOnlyMensalistas) {
          // Se estava mostrando todos, agora mostra mensalistas
          data = await getMensalistasPaginated(0, PAGE_SIZE)
          // Atualiza o total de mensalistas
          const total = await getTotalMensalistas()
          setTotalMensalistas(total)
        } else {
          // Se estava mostrando mensalistas, agora mostra todos
          data = await getClientsPaginated(0, PAGE_SIZE)
        }
        
        // Remove duplicatas antes de definir os clientes
        const uniqueClients = data.filter((client, index, self) => 
          index === self.findIndex(c => c.id === client.id)
        )
        
        setClients(uniqueClients)
        setHasMore(uniqueClients.length === PAGE_SIZE)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao alternar filtro'
        setError(errorMessage)
        toast.error('Erro ao alternar filtro')
      }
    }, 0)
  }, [showOnlyMensalistas, PAGE_SIZE])

  // Função para atualizar o total de mensalistas
  const updateTotalMensalistas = useCallback(async () => {
    try {
      const total = await getTotalMensalistas()
      setTotalMensalistas(total)
    } catch (err) {
      console.error('Erro ao atualizar total de mensalistas:', err)
    }
  }, [])

  // Função para carregar mais clientes (apenas quando não há busca ativa)
  const loadMoreClients = useCallback(async () => {
    if (isLoadingMore || !hasMore || searchQuery || isSearching) return
    
    const nextPage = currentPage + 1
    await fetchClients(nextPage, true)
  }, [currentPage, hasMore, isLoadingMore, fetchClients, searchQuery, isSearching])

  // Função para recarregar clientes (reset da paginação)
  const refreshClients = useCallback(async () => {
    setCurrentPage(0)
    setHasMore(true)
    setSearchQuery('')
    setIsSearching(false)
    await fetchClients(0, false)
  }, [fetchClients])

  // Função para limpar busca e voltar à paginação normal
  const clearSearch = useCallback(async () => {
    setSearchQuery('')
    setIsSearching(false)
    setHasMore(true)
    setCurrentPage(0)
    await fetchClients(0, false)
  }, [fetchClients])

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newClient = await createClient(clientData)
      
      // Atualização otimista: adiciona o novo cliente no início
      setClients(prev => [newClient, ...prev])
      
      // Se o novo cliente é um mensalista, atualiza o total
      if (newClient.is_recurring) {
        setTotalMensalistas(prev => prev + 1)
      }
      
      toast.success('Cliente criado com sucesso!')
      
      return newClient
    } catch (err) {
      toast.error('Erro ao criar cliente')
      // Em caso de erro, recarrega a lista para sincronizar
      refreshClients()
      throw err
    }
  }, [refreshClients])

  const editClient = useCallback(async (id: string, clientData: Partial<Client>) => {
    // Salva o estado atual para rollback em caso de erro
    const originalClients = clients
    const originalTotalMensalistas = totalMensalistas
    
    try {
      // Atualização otimista: atualiza imediatamente na interface
      setClients(prev => prev.map(client => 
        client.id === id ? { ...client, ...clientData } : client
      ))
      
      const updatedClient = await updateClient(id, clientData)
      
      // Atualiza com os dados reais do servidor
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ))
      
      // Atualiza o total de mensalistas se o status de mensalista mudou
      const originalClient = clients.find(c => c.id === id)
      if (originalClient && originalClient.is_recurring !== updatedClient.is_recurring) {
        if (updatedClient.is_recurring) {
          setTotalMensalistas(prev => prev + 1)
        } else {
          setTotalMensalistas(prev => Math.max(0, prev - 1))
        }
      }
      
      toast.success('Cliente atualizado com sucesso!')
      
      return updatedClient
    } catch (err) {
      // Rollback: volta ao estado anterior
      setClients(originalClients)
      setTotalMensalistas(originalTotalMensalistas)
      toast.error('Erro ao atualizar cliente')
      throw err
    }
  }, [clients, totalMensalistas])

  const removeClient = useCallback(async (id: string) => {
    // Salva o cliente que será removido para rollback
    const clientToRemove = clients.find(c => c.id === id)
    const originalTotalMensalistas = totalMensalistas
    
    try {
      // Remoção otimista: remove imediatamente da interface
      setClients(prev => prev.filter(client => client.id !== id))
      
      // Se o cliente removido era um mensalista, atualiza o total
      if (clientToRemove?.is_recurring) {
        setTotalMensalistas(prev => Math.max(0, prev - 1))
      }
      
      await deleteClient(id)
      toast.success('Cliente removido com sucesso!')
    } catch (err) {
      // Rollback: restaura o cliente removido
      if (clientToRemove) {
        setClients(prev => [...prev, clientToRemove].sort((a, b) => a.full_name.localeCompare(b.full_name)))
      }
      setTotalMensalistas(originalTotalMensalistas)
      toast.error('Erro ao remover cliente')
      throw err
    }
  }, [clients, totalMensalistas])

  // Carrega os clientes na inicialização
  useEffect(() => {
    fetchClients(0, false)
    // Carrega o total de mensalistas na inicialização
    updateTotalMensalistas()
  }, [fetchClients, updateTotalMensalistas])

  return {
    clients,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    searchQuery,
    isSearching,
    showOnlyMensalistas,
    totalMensalistas,
    toggleMensalistasFilter,
    addClient,
    editClient,
    removeClient,
    loadMoreClients,
    refreshClients,
    searchClientsByQuery,
    clearSearch
  }
}

