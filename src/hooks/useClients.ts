'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, updateClient, deleteClient, getClientsPaginated, searchClients } from '@/lib/clients'
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
      
      const data = await getClientsPaginated(page, PAGE_SIZE)
      
      if (append) {
        setClients(prev => [...prev, ...data])
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
  }, [])

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
      
      const data = await searchClients(query)
      setClients(data)
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
  }, [fetchClients])

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
      
      toast.success('Cliente atualizado com sucesso!')
      
      return updatedClient
    } catch (err) {
      // Rollback: volta ao estado anterior
      setClients(originalClients)
      toast.error('Erro ao atualizar cliente')
      throw err
    }
  }, [clients])

  const removeClient = useCallback(async (id: string) => {
    // Salva o cliente que será removido para rollback
    const clientToRemove = clients.find(c => c.id === id)
    
    try {
      // Remoção otimista: remove imediatamente da interface
      setClients(prev => prev.filter(client => client.id !== id))
      
      await deleteClient(id)
      toast.success('Cliente removido com sucesso!')
    } catch (err) {
      // Rollback: restaura o cliente removido
      if (clientToRemove) {
        setClients(prev => [...prev, clientToRemove].sort((a, b) => a.full_name.localeCompare(b.full_name)))
      }
      toast.error('Erro ao remover cliente')
      throw err
    }
  }, [clients])

  // Carrega os clientes na inicialização
  useEffect(() => {
    fetchClients(0, false)
  }, [fetchClients])

  return {
    clients,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    searchQuery,
    isSearching,
    addClient,
    editClient,
    removeClient,
    loadMoreClients,
    refreshClients,
    searchClientsByQuery,
    clearSearch
  }
}

