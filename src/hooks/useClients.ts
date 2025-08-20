'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, updateClient, deleteClient, getClientsPaginated } from '@/lib/clients'
import { Client } from '@/types/database'
import { toast } from 'sonner'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
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

  // Função para carregar mais clientes
  const loadMoreClients = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    
    const nextPage = currentPage + 1
    await fetchClients(nextPage, true)
  }, [currentPage, hasMore, isLoadingMore, fetchClients])

  // Função para recarregar clientes (reset da paginação)
  const refreshClients = useCallback(async () => {
    setCurrentPage(0)
    setHasMore(true)
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
    addClient,
    editClient,
    removeClient,
    loadMoreClients,
    refreshClients
  }
}

