'use server'

import { query, insertRow, updateRow } from '@/lib/db'
import { requireUser } from '@/lib/auth-server'
import { Expense, ExpenseWithMaterial, ExpenseType, Material } from '@/types/database'

async function attachMaterial(expenses: Expense[]): Promise<ExpenseWithMaterial[]> {
  const materialIds = [...new Set(expenses.map((e) => e.material_id).filter(Boolean))] as string[]
  const materials = materialIds.length
    ? await query<Material>('SELECT * FROM materials WHERE id = ANY($1)', [materialIds])
    : []
  const byId = new Map(materials.map((m) => [m.id, m]))

  return expenses.map((expense) => ({
    ...expense,
    material: expense.material_id ? byId.get(expense.material_id) : undefined,
  }))
}

export async function getExpenses(year?: number, month?: number | null): Promise<ExpenseWithMaterial[]> {
  await requireUser()
  const conditions: string[] = []
  const params: unknown[] = []

  if (year && year > 0) {
    if (month && month > 0) {
      const monthStr = month.toString().padStart(2, '0')
      const lastDay = new Date(year, month, 0).getDate()
      params.push(`${year}-${monthStr}-01`, `${year}-${monthStr}-${lastDay.toString().padStart(2, '0')}`)
      conditions.push(`expense_date >= $${params.length - 1} AND expense_date <= $${params.length}`)
    } else {
      params.push(`${year}-01-01`, `${year}-12-31`)
      conditions.push(`expense_date >= $${params.length - 1} AND expense_date <= $${params.length}`)
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const expenses = await query<Expense>(
    `SELECT * FROM expenses ${where} ORDER BY expense_date DESC`,
    params
  )
  return attachMaterial(expenses)
}

export interface ExpenseInput {
  description?: string
  expense_type: ExpenseType
  amount: number
  expense_date: string
  material_id?: string
  quantity?: number
  unit_price?: number
  supplier?: string
  notes?: string
}

export async function createExpense(expenseData: ExpenseInput): Promise<ExpenseWithMaterial> {
  await requireUser()
  const created = await insertRow<Expense>('expenses', expenseData)
  if (!created) throw new Error('Erro ao criar despesa')
  const [withMaterial] = await attachMaterial([created])
  return withMaterial
}

export async function updateExpense(id: string, expenseData: Partial<ExpenseInput>): Promise<ExpenseWithMaterial> {
  await requireUser()
  const updated = await updateRow<Expense>('expenses', id, expenseData)
  if (!updated) throw new Error('Erro ao atualizar despesa')
  const [withMaterial] = await attachMaterial([updated])
  return withMaterial
}

export async function deleteExpense(id: string): Promise<void> {
  await requireUser()
  await query('DELETE FROM expenses WHERE id = $1', [id])
}

export async function getExpensesByPeriod(startDate: Date, endDate: Date): Promise<ExpenseWithMaterial[]> {
  await requireUser()
  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  const expenses = await query<Expense>(
    'SELECT * FROM expenses WHERE expense_date >= $1 AND expense_date <= $2 ORDER BY expense_date DESC',
    [startDateStr, endDateStr]
  )
  return attachMaterial(expenses)
}
