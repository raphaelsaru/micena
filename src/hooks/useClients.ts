'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, updateClient, deleteClient, getClients } from '@/lib/clients'
import { Client } from '@/types/database'
import { toast } from 'sonner'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar clientes do servidor
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await getClients()
      setClients(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes'
      setError(errorMessage)
      toast.error('Erro ao carregar clientes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newClient = await createClient(clientData)
      
      // Atualização otimista: adiciona o novo cliente imediatamente
      setClients(prev => [newClient, ...prev])
      toast.success('Cliente criado com sucesso!')
      
      return newClient
    } catch (err) {
      toast.error('Erro ao criar cliente')
      // Em caso de erro, recarrega a lista para sincronizar
      fetchClients()
      throw err
    }
  }, [fetchClients])

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
    fetchClients()
  }, [fetchClients])

  return {
    clients,
    isLoading,
    error,
    addClient,
    editClient,
    removeClient,
    refreshClients: fetchClients
  }
}