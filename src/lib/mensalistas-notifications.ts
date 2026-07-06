'use server'

import { query, queryOne } from '@/lib/db'
import { requireUser } from '@/lib/auth-server'
import { Client, Payment } from '@/types/database'

export async function getMensalistasWithPayments(year: number): Promise<(Client & { payments: Payment[] })[]> {
  await requireUser()
  const clients = await query<Client>(
    'SELECT * FROM clients WHERE is_recurring = true ORDER BY full_name'
  )
  const clientIds = clients.map((c) => c.id)

  const payments = clientIds.length
    ? await query<Payment>(
        'SELECT * FROM payments WHERE client_id = ANY($1) AND year = $2',
        [clientIds, year]
      )
    : []

  return clients.map((client) => ({
    ...client,
    payments: payments.filter((p) => p.client_id === client.id),
  }))
}

export async function upsertMensalistaPayment(
  clientId: string,
  year: number,
  month: number,
  status: 'PAGO' | 'EM_ABERTO',
  amount: number
): Promise<string> {
  await requireUser()
  const paidAt = status === 'PAGO' ? new Date().toISOString() : null

  const result = await queryOne<Payment>(
    `INSERT INTO payments (client_id, year, month, status, amount, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (client_id, year, month) DO UPDATE SET
       status = EXCLUDED.status, amount = EXCLUDED.amount, paid_at = EXCLUDED.paid_at, updated_at = NOW()
     RETURNING id`,
    [clientId, year, month, status, amount, paidAt]
  )
  if (!result) {
    throw new Error('Erro ao salvar pagamento')
  }
  return result.id
}

export async function markPaymentAsUnpaid(clientId: string, year: number, month: number): Promise<void> {
  await requireUser()
  await query(
    `INSERT INTO payments (client_id, year, month, status) VALUES ($1, $2, $3, 'EM_ABERTO')
     ON CONFLICT (client_id, year, month) DO UPDATE SET
       status = 'EM_ABERTO', paid_at = NULL, updated_at = NOW()`,
    [clientId, year, month]
  )
}
