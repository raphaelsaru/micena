'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Expense, ExpenseWithMaterial, ExpenseType, Material } from '@/types/database'

export interface ExpenseSummary {
  totalExpenses: number
  materialExpenses: number
  payrollExpenses: number
  taxExpenses: number
  fixedExpenses: number
  otherExpenses: number
  monthlyExpenses: number
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseWithMaterial[]>([])
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    materialExpenses: 0,
    payrollExpenses: 0,
    taxExpenses: 0,
    fixedExpenses: 0,
    otherExpenses: 0,
    monthlyExpenses: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar todas as despesas
  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select(`
          *,
          material:materials(*)
        `)
        .order('expense_date', { ascending: false })

      if (fetchError) throw fetchError

      setExpenses(data || [])
      calculateSummary(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar despesas')
    } finally {
      setLoading(false)
    }
  }

  // Calcular resumo das despesas
  const calculateSummary = (expensesData: ExpenseWithMaterial[]) => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const summaryData = expensesData.reduce((acc, expense) => {
      const expenseDate = new Date(expense.expense_date)
      const isCurrentMonth = expenseDate.getMonth() + 1 === currentMonth && 
                            expenseDate.getFullYear() === currentYear

      acc.totalExpenses += expense.amount

      if (isCurrentMonth) {
        acc.monthlyExpenses += expense.amount
      }

      switch (expense.expense_type) {
        case 'MATERIAL':
          acc.materialExpenses += expense.amount
          break
        case 'FOLHA_PAGAMENTO':
          acc.payrollExpenses += expense.amount
          break
        case 'IMPOSTOS':
          acc.taxExpenses += expense.amount
          break
        case 'CONTAS_FIXAS':
          acc.fixedExpenses += expense.amount
          break
        case 'OUTROS':
          acc.otherExpenses += expense.amount
          break
      }

      return acc
    }, {
      totalExpenses: 0,
      materialExpenses: 0,
      payrollExpenses: 0,
      taxExpenses: 0,
      fixedExpenses: 0,
      otherExpenses: 0,
      monthlyExpenses: 0
    })

    setSummary(summaryData)
  }

  // Criar nova despesa
  const createExpense = async (expenseData: {
    description?: string
    expense_type: ExpenseType
    amount: number
    expense_date: string
    material_id?: string
    quantity?: number
    unit_price?: number
    supplier?: string
    notes?: string
  }) => {
    try {
      const { data, error: createError } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select(`
          *,
          material:materials(*)
        `)
        .single()

      if (createError) throw createError

      // Atualizar lista local imediatamente
      setExpenses(prev => {
        const updatedExpenses = [data, ...prev]
        calculateSummary(updatedExpenses)
        return updatedExpenses
      })
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar despesa')
      throw err
    }
  }

  // Atualizar despesa
  const updateExpense = async (id: string, expenseData: {
    description?: string
    expense_type?: ExpenseType
    amount?: number
    expense_date?: string
    material_id?: string
    quantity?: number
    unit_price?: number
    supplier?: string
    notes?: string
  }) => {
    try {
      const { data, error: updateError } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select(`
          *,
          material:materials(*)
        `)
        .single()

      if (updateError) throw updateError

      // Atualizar lista local imediatamente
      setExpenses(prev => {
        const updatedExpenses = prev.map(expense =>
          expense.id === id ? data : expense
        )
        calculateSummary(updatedExpenses)
        return updatedExpenses
      })
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar despesa')
      throw err
    }
  }

  // Deletar despesa
  const deleteExpense = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Atualizar lista local imediatamente
      setExpenses(prev => {
        const updatedExpenses = prev.filter(expense => expense.id !== id)
        calculateSummary(updatedExpenses)
        return updatedExpenses
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar despesa')
      throw err
    }
  }

  // Buscar despesas por período
  const fetchExpensesByPeriod = async (startDate: Date, endDate: Date) => {
    try {
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const { data, error: fetchError } = await supabase
        .from('expenses')
        .select(`
          *,
          material:materials(*)
        `)
        .gte('expense_date', startDateStr)
        .lte('expense_date', endDateStr)
        .order('expense_date', { ascending: false })

      if (fetchError) throw fetchError

      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar despesas do período')
      return []
    }
  }

  // Filtrar despesas por tipo
  const filterExpensesByType = (type: ExpenseType | 'TODOS') => {
    if (type === 'TODOS') return expenses
    return expenses.filter(expense => expense.expense_type === type)
  }

  // Buscar despesa por ID
  const getExpenseById = (id: string) => {
    return expenses.find(expense => expense.id === id)
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  return {
    expenses,
    summary,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    filterExpensesByType,
    fetchExpensesByPeriod,
    refetch: fetchExpenses
  }
}
