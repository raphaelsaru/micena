'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, updateClient, deleteClient, getClients } from '@/lib/clients'
import { Client } from '@/types/database'
import { toast } from 'sonner'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getClients()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
      toast.error('Erro ao carregar clientes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newClient = await createClient(clientData)
      setClients(prev => [newClient, ...prev])
      toast.success('Cliente criado com sucesso!')
      return newClient
    } catch (err) {
      toast.error('Erro ao criar cliente')
      throw err
    }
  }, [])

  const editClient = useCallback(async (id: string, clientData: Partial<Client>) => {
    try {
      const updatedClient = await updateClient(id, clientData)
      setClients(prev => prev.map(client => 
        client.id === id ? updatedClient : client
      ))
      toast.success('Cliente atualizado com sucesso!')
      return updatedClient
    } catch (err) {
      toast.error('Erro ao atualizar cliente')
      throw err
    }
  }, [])

  const removeClient = useCallback(async (id: string) => {
    try {
      await deleteClient(id)
      setClients(prev => prev.filter(client => client.id !== id))
      toast.success('Cliente removido com sucesso!')
    } catch (err) {
      toast.error('Erro ao remover cliente')
      throw err
    }
  }, [])

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
