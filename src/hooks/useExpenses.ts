'use client'

import { useState, useEffect, useCallback } from 'react'
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

export function useExpenses(selectedYear?: number, selectedMonth?: number | null) {
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

  // Calcular resumo das despesas
  const calculateSummary = useCallback((expensesData: ExpenseWithMaterial[]) => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const summaryData = expensesData.reduce((acc, expense) => {
      const expenseDate = new Date(expense.expense_date)
      
      // Se há filtro de mês específico, usar esse mês para monthlyExpenses
      // Caso contrário, usar o mês atual
      let targetMonth = currentMonth
      let targetYear = currentYear
      
      if (selectedMonth && selectedYear) {
        targetMonth = selectedMonth
        targetYear = selectedYear
      }
      
      const isTargetMonth = expenseDate.getMonth() + 1 === targetMonth && 
                           expenseDate.getFullYear() === targetYear

      acc.totalExpenses += expense.amount

      if (isTargetMonth) {
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
  }, [selectedYear, selectedMonth])

  // Buscar todas as despesas
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Parâmetros recebidos:', { selectedYear, selectedMonth })

      // Query básica primeiro
      let query = supabase
        .from('expenses')
        .select(`
          *,
          materials(*)
        `)

      // Aplicar filtros de data se fornecidos
      if (selectedYear && selectedYear > 0) {
        if (selectedMonth && selectedMonth > 0) {
          // Filtro por mês específico
          const monthStr = selectedMonth.toString().padStart(2, '0')
          const startDate = `${selectedYear}-${monthStr}-01`
          
          // Calcular o último dia do mês corretamente
          const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
          const endDate = `${selectedYear}-${monthStr}-${lastDay.toString().padStart(2, '0')}`
          
          console.log('Aplicando filtro mensal:', { startDate, endDate, lastDay })
          query = query.gte('expense_date', startDate).lte('expense_date', endDate)
        } else {
          // Filtro por ano completo
          const startDate = `${selectedYear}-01-01`
          const endDate = `${selectedYear}-12-31`
          console.log('Aplicando filtro anual:', { startDate, endDate })
          query = query.gte('expense_date', startDate).lte('expense_date', endDate)
        }
      } else {
        console.log('Sem filtro de data - buscando todas as despesas')
      }

      const { data, error: fetchError } = await query.order('expense_date', { ascending: false })

      if (fetchError) {
        console.error('Erro detalhado na query:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        })
        throw new Error(`Erro na query: ${fetchError.message || 'Erro desconhecido'}`)
      }

      console.log('Despesas carregadas com sucesso:', data?.length || 0)
      setExpenses(data || [])
      calculateSummary(data || [])
    } catch (err) {
      console.error('Erro ao buscar despesas:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar despesas'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth, calculateSummary])

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
          materials(*)
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
          materials(*)
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
          materials(*)
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
  }, [selectedYear, selectedMonth, fetchExpenses])

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
