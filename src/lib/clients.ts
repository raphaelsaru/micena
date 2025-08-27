import { supabase } from '@/lib/supabase-client'
import { Client } from '@/types/database'

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  return data || []
}

export async function getClientsPaginated(page: number, pageSize: number): Promise<Client[]> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('full_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  return data || []
}

export async function getClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Cliente não encontrado
    }
    throw new Error(`Erro ao buscar cliente: ${error.message}`)
  }

  return data
}

export async function createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
  // Validar documento único apenas se houver documento
  if (clientData.document && clientData.document.trim() !== '') {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('document', clientData.document)
      .single()

    if (existingClient) {
      throw new Error('Já existe um cliente com este documento')
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar cliente: ${error.message}`)
  }

  return data
}

export async function updateClient(id: string, clientData: Partial<Client>): Promise<Client> {
  // Se estiver atualizando o documento, verificar se já existe outro cliente com o mesmo documento
  if (clientData.document && clientData.document.trim() !== '') {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('document', clientData.document)
      .neq('id', id)
      .single()

    if (existingClient) {
      throw new Error('Já existe outro cliente com este documento')
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar cliente: ${error.message}`)
  }

  return data
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao remover cliente: ${error.message}`)
  }
}

export async function searchClients(query: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`full_name.ilike.%${query}%,document.ilike.%${query}%,email.ilike.%${query}%`)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  return data || []
}

export async function getMensalistasPaginated(page: number, pageSize: number): Promise<Client[]> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_recurring', true)
    .order('full_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw new Error(`Erro ao buscar mensalistas: ${error.message}`)
  }

  return data || []
}

export async function searchMensalistas(query: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_recurring', true)
    .or(`full_name.ilike.%${query}%,document.ilike.%${query}%,email.ilike.%${query}%`)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar mensalistas: ${error.message}`)
  }

  return data || []
}

export async function getTotalMensalistas(): Promise<number> {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('is_recurring', true)

  if (error) {
    throw new Error(`Erro ao contar mensalistas: ${error.message}`)
  }

  return count || 0
}
