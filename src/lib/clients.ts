'use server'

import { query, queryOne, insertRow, updateRow } from '@/lib/db'
import { requireUser } from '@/lib/auth-server'
import { Client } from '@/types/database'

export async function getClients(): Promise<Client[]> {
  await requireUser()
  return query<Client>('SELECT * FROM clients ORDER BY full_name ASC')
}

export async function getClientsPaginated(page: number, pageSize: number): Promise<Client[]> {
  await requireUser()
  const offset = page * pageSize
  return query<Client>(
    'SELECT * FROM clients ORDER BY full_name ASC LIMIT $1 OFFSET $2',
    [pageSize, offset]
  )
}

export async function getClientById(id: string): Promise<Client | null> {
  await requireUser()
  return queryOne<Client>('SELECT * FROM clients WHERE id = $1', [id])
}

export async function createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
  await requireUser()
  if (clientData.document && clientData.document.trim() !== '') {
    const existing = await queryOne('SELECT id FROM clients WHERE document = $1', [clientData.document])
    if (existing) {
      throw new Error('Já existe um cliente com este documento')
    }
  }

  const created = await insertRow<Client>('clients', clientData)
  if (!created) {
    throw new Error('Erro ao criar cliente')
  }
  return created
}

export async function updateClient(id: string, clientData: Partial<Client>): Promise<Client> {
  await requireUser()
  if (clientData.document && clientData.document.trim() !== '') {
    const existing = await queryOne(
      'SELECT id FROM clients WHERE document = $1 AND id != $2',
      [clientData.document, id]
    )
    if (existing) {
      throw new Error('Já existe outro cliente com este documento')
    }
  }

  const updated = await updateRow<Client>('clients', id, clientData)
  if (!updated) {
    throw new Error('Erro ao atualizar cliente')
  }
  return updated
}

export async function deleteClient(id: string): Promise<void> {
  await requireUser()
  await query('DELETE FROM clients WHERE id = $1', [id])
}

export async function searchClients(query_: string): Promise<Client[]> {
  await requireUser()
  return query<Client>('SELECT * FROM search_clients_accent_insensitive($1)', [query_])
}

export async function getMensalistasPaginated(page: number, pageSize: number): Promise<Client[]> {
  await requireUser()
  const offset = page * pageSize
  return query<Client>(
    'SELECT * FROM clients WHERE is_recurring = true ORDER BY full_name ASC LIMIT $1 OFFSET $2',
    [pageSize, offset]
  )
}

export async function searchMensalistas(query_: string): Promise<Client[]> {
  await requireUser()
  return query<Client>('SELECT * FROM search_mensalistas_accent_insensitive($1)', [query_])
}

export async function getMensalistasBySubscriptionMonth(year: number, month: number): Promise<Client[]> {
  await requireUser()
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const from = `${year}-${month.toString().padStart(2, '0')}-01`
  const to = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`

  return query<Client>(
    `SELECT * FROM clients
     WHERE is_recurring = true
       AND subscription_start_date IS NOT NULL
       AND subscription_start_date >= $1
       AND subscription_start_date < $2
     ORDER BY full_name ASC`,
    [from, to]
  )
}

export async function getTotalMensalistas(): Promise<number> {
  await requireUser()
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM clients WHERE is_recurring = true'
  )
  return result?.count ?? 0
}
