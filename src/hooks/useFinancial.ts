'use client'

import { useState, useEffect } from 'react'
import {
  getAvailableYears,
  getFinancialSummary,
  getMensalistasFinancial,
  getServicePaymentsInRange,
  getFinancialDataByPeriod,
  FinancialSummary,
  MensalistaData,
  ServicePaymentData,
} from '@/lib/financial'
import { PaymentStatus } from '@/types/database'
import { withAuthRetry } from '@/lib/with-auth-retry'

export type { FinancialSummary, MensalistaData, ServicePaymentData }

export function useFinancial() {
  const [summary, setSummary] = useState<FinancialSummary>({
    monthlyRevenue: 0,
    pendingRevenue: 0,
    activeSubscribers: 0,
    totalRevenue: 0,
    osRevenue: 0,
    mensalistasRevenue: 0,
    osMonthlyRevenue: 0,
    totalExpenses: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    monthlyNetProfit: 0
  })
  const [mensalistas, setMensalistas] = useState<MensalistaData[]>([])
  const [servicePayments, setServicePayments] = useState<ServicePaymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1)

  const fetchAvailableYears = async () => {
    try {
      setAvailableYears(await withAuthRetry(() => getAvailableYears()))
    } catch (err) {
      console.error('Erro ao buscar anos disponíveis:', err)
    }
  }

  const fetchSummary = async (year?: number, month?: number | null) => {
    try {
      const targetYear = year || selectedYear
      const targetMonth = month !== undefined ? month : selectedMonth
      setSummary(await withAuthRetry(() => getFinancialSummary(targetYear, targetMonth)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar resumo financeiro')
    }
  }

  const fetchMensalistas = async () => {
    try {
      setMensalistas(await withAuthRetry(() => getMensalistasFinancial()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar mensalistas')
    }
  }

  const fetchServicePayments = async (year?: number, month?: number | null) => {
    try {
      const targetYear = year || selectedYear
      const targetMonth = month !== undefined ? month : selectedMonth
      setServicePayments(await withAuthRetry(() => getServicePaymentsInRange(targetYear, targetMonth)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar pagamentos de serviços')
    }
  }

  const fetchAllData = async (year?: number, month?: number | null) => {
    setLoading(true)
    setError(null)

    try {
      await fetchAvailableYears()
      await Promise.all([
        fetchSummary(year, month),
        fetchMensalistas(),
        fetchServicePayments(year, month)
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const filterMensalistasByStatus = (status: PaymentStatus | 'TODOS') => {
    if (status === 'TODOS') return mensalistas
    return mensalistas.filter(mensalista => mensalista.status === status)
  }

  const fetchDataByPeriod = async (startDate: Date, endDate: Date) => {
    try {
      return await getFinancialDataByPeriod(startDate, endDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados do período')
      return { services: [], payments: [] }
    }
  }

  const changeYear = async (year: number) => {
    setSelectedYear(year)
    await fetchAllData(year, selectedMonth)
  }

  const changeMonth = async (month: number | null) => {
    setSelectedMonth(month)
    await fetchAllData(selectedYear, month)
  }

  useEffect(() => {
    fetchAllData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    summary,
    mensalistas,
    servicePayments,
    loading,
    error,
    availableYears,
    selectedYear,
    selectedMonth,
    changeYear,
    changeMonth,
    fetchAllData,
    filterMensalistasByStatus,
    fetchDataByPeriod,
    refetchSummary: fetchSummary
  }
}
