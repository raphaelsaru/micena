'use client'

import { useState, useEffect, useCallback } from 'react'
import { getExpenses, createExpense as createExpenseAction, updateExpense as updateExpenseAction, deleteExpense as deleteExpenseAction, getExpensesByPeriod, ExpenseInput } from '@/lib/expenses'
import { ExpenseWithMaterial, ExpenseType } from '@/types/database'
import { withAuthRetry } from '@/lib/with-auth-retry'

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

  const calculateSummary = useCallback((expensesData: ExpenseWithMaterial[]) => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const summaryData = expensesData.reduce((acc, expense) => {
      const expenseDate = new Date(expense.expense_date)

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

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await withAuthRetry(() => getExpenses(selectedYear, selectedMonth))

      setExpenses(data)
      calculateSummary(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar despesas'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth, calculateSummary])

  const createExpense = async (expenseData: ExpenseInput) => {
    try {
      const data = await createExpenseAction(expenseData)

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

  const updateExpense = async (id: string, expenseData: Partial<ExpenseInput>) => {
    try {
      const data = await updateExpenseAction(id, expenseData)

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

  const deleteExpense = async (id: string) => {
    try {
      await deleteExpenseAction(id)

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

  const fetchExpensesByPeriod = async (startDate: Date, endDate: Date) => {
    try {
      return await getExpensesByPeriod(startDate, endDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar despesas do período')
      return []
    }
  }

  const filterExpensesByType = (type: ExpenseType | 'TODOS') => {
    if (type === 'TODOS') return expenses
    return expenses.filter(expense => expense.expense_type === type)
  }

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
