'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Client, Service, Payment, PaymentStatus, PaymentMethod, Expense } from '@/types/database'
import { getBrasiliaDate } from '@/lib/utils'

export interface FinancialSummary {
  monthlyRevenue: number
  pendingRevenue: number
  activeSubscribers: number
  totalRevenue: number
  osRevenue: number
  mensalistasRevenue: number
  osMonthlyRevenue: number
  totalExpenses: number
  monthlyExpenses: number
  netProfit: number
  monthlyNetProfit: number
}

export interface MensalistaData {
  client: Client
  monthlyFee: number
  status: PaymentStatus
  lastPayment?: Payment
}

export interface ServicePaymentData {
  service: Service
  clientName: string
  totalAmount: number
  paymentMethod?: PaymentMethod
}

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
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null) // null = todos os meses

  // Buscar anos disponíveis com registros
  const fetchAvailableYears = async () => {
    try {
      // Buscar anos dos pagamentos
      const { data: paymentYears, error: paymentError } = await supabase
        .from('payments')
        .select('year')
        .not('year', 'is', null)

      if (paymentError) throw paymentError

      // Buscar anos dos serviços
      const { data: serviceYears, error: serviceError } = await supabase
        .from('services')
        .select('service_date')
        .not('service_date', 'is', null)

      if (serviceError) throw serviceError

      // Extrair anos únicos
      const years = new Set<number>()
      
      // Adicionar anos dos pagamentos
      paymentYears?.forEach(payment => {
        if (payment.year) years.add(payment.year)
      })

      // Adicionar anos dos serviços
      serviceYears?.forEach(service => {
        if (service.service_date) {
          const year = new Date(service.service_date).getFullYear()
          years.add(year)
        }
      })

      // Converter para array e ordenar
      const sortedYears = Array.from(years).sort((a, b) => b - a)
      setAvailableYears(sortedYears)
    } catch (err) {
      console.error('Erro ao buscar anos disponíveis:', err)
    }
  }

  // Buscar resumo financeiro com queries paralelas
  const fetchSummary = async (year?: number, month?: number | null) => {
    try {
      const currentDate = getBrasiliaDate()
      const currentMonth = currentDate.getMonth() + 1
      const targetYear = year || selectedYear
      const targetMonth = month !== undefined ? month : selectedMonth

      // Executar todas as queries em paralelo
      const [
        monthlyPaymentsResult,
        pendingPaymentsResult,
        activeClientsResult,
        osServicesResult,
        osMonthlyServicesResult,
        allMensalistasPaymentsResult,
        allExpensesResult,
        monthlyExpensesResult
      ] = await Promise.all([
        // Receita do mês (pagos) - usar mês selecionado ou todos os meses do ano
        targetMonth ? 
          supabase
            .from('payments')
            .select('amount')
            .eq('year', targetYear)
            .eq('month', targetMonth)
            .eq('status', 'PAGO') :
          supabase
            .from('payments')
            .select('amount')
            .eq('year', targetYear)
            .eq('status', 'PAGO'),

        // Receita pendente (em aberto)
        supabase
          .from('payments')
          .select('amount')
          .eq('status', 'EM_ABERTO'),

        // Total de mensalistas ativos
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('is_recurring', true),

        // Receita total das OS
        supabase
          .from('services')
          .select('total_amount')
          .not('total_amount', 'is', null),

        // Receita mensal das OS - usar mês selecionado ou todos os meses do ano
        targetMonth ? 
          supabase
            .from('services')
            .select('total_amount')
            .not('total_amount', 'is', null)
            .gte('service_date', `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`)
            .lt('service_date', `${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')}-01`) :
          supabase
            .from('services')
            .select('total_amount')
            .not('total_amount', 'is', null)
            .gte('service_date', `${targetYear}-01-01`)
            .lt('service_date', `${targetYear + 1}-01-01`),

        // Receita total de mensalistas
        supabase
          .from('payments')
          .select('amount')
          .eq('status', 'PAGO'),

        // Despesas totais
        supabase
          .from('expenses')
          .select('amount'),

        // Despesas do mês - usar mês selecionado ou todos os meses do ano
        targetMonth ? 
          supabase
            .from('expenses')
            .select('amount')
            .gte('expense_date', `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`)
            .lt('expense_date', `${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')}-01`) :
          supabase
            .from('expenses')
            .select('amount')
            .gte('expense_date', `${targetYear}-01-01`)
            .lt('expense_date', `${targetYear + 1}-01-01`)
      ])

      // Verificar erros
      if (monthlyPaymentsResult.error) throw monthlyPaymentsResult.error
      if (pendingPaymentsResult.error) throw pendingPaymentsResult.error
      if (activeClientsResult.error) throw activeClientsResult.error
      if (osServicesResult.error) throw osServicesResult.error
      if (osMonthlyServicesResult.error) throw osMonthlyServicesResult.error
      if (allMensalistasPaymentsResult.error) throw allMensalistasPaymentsResult.error
      if (allExpensesResult.error) throw allExpensesResult.error
      if (monthlyExpensesResult.error) throw monthlyExpensesResult.error

      // Processar resultados
      const monthlyRevenue = monthlyPaymentsResult.data?.reduce((sum, payment) =>
        sum + (payment.amount || 0), 0) || 0

      const pendingRevenue = pendingPaymentsResult.data?.reduce((sum, payment) =>
        sum + (payment.amount || 0), 0) || 0

      const activeSubscribers = activeClientsResult.count || 0

      const osRevenue = osServicesResult.data?.reduce((sum, service) =>
        sum + (service.total_amount || 0), 0) || 0

      const osMonthlyRevenue = osMonthlyServicesResult.data?.reduce((sum, service) =>
        sum + (service.total_amount || 0), 0) || 0

      const mensalistasRevenue = allMensalistasPaymentsResult.data?.reduce((sum, payment) =>
        sum + (payment.amount || 0), 0) || 0

      const totalExpenses = allExpensesResult.data?.reduce((sum, expense) =>
        sum + (expense.amount || 0), 0) || 0

      const monthlyExpenses = monthlyExpensesResult.data?.reduce((sum, expense) =>
        sum + (expense.amount || 0), 0) || 0

      const totalRevenue = mensalistasRevenue + osRevenue
      const netProfit = totalRevenue - totalExpenses
      const monthlyNetProfit = (monthlyRevenue + osMonthlyRevenue) - monthlyExpenses

      const finalSummary = {
        monthlyRevenue,
        pendingRevenue,
        activeSubscribers,
        totalRevenue,
        osRevenue,
        mensalistasRevenue,
        osMonthlyRevenue,
        totalExpenses,
        monthlyExpenses,
        netProfit,
        monthlyNetProfit
      }

      setSummary(finalSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar resumo financeiro')
    }
  }

  // Buscar dados dos mensalistas
  const fetchMensalistas = async (year?: number, month?: number | null) => {
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_recurring', true)
        .order('full_name')

      if (clientsError) throw clientsError
      
      // Buscar todos os pagamentos de uma vez para otimizar
      const clientIds = clients?.map(c => c.id) || []
      const { data: allPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

      // Agrupar pagamentos por cliente
      const paymentsByClient = new Map<string, any[]>()
      allPayments?.forEach(payment => {
        if (!paymentsByClient.has(payment.client_id)) {
          paymentsByClient.set(payment.client_id, [])
        }
        paymentsByClient.get(payment.client_id)?.push(payment)
      })

      const mensalistasData: MensalistaData[] = []

      for (const client of clients) {
        const clientPayments = paymentsByClient.get(client.id) || []
        const lastPayment = clientPayments[0] // Já ordenado por created_at desc

        // Determinar status baseado no último pagamento do mês atual
        let status: PaymentStatus = 'EM_ABERTO'
        const currentDate = getBrasiliaDate()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()
        
        // Buscar pagamento do mês atual
        const currentMonthPayment = clientPayments.find(payment => 
          payment.year === currentYear && 
          payment.month === currentMonth
        )
        
        if (currentMonthPayment) {
          // Se existe pagamento para o mês atual, usar o status do pagamento
          status = currentMonthPayment.status
        } else if (lastPayment) {
          // Se não há pagamento para o mês atual, verificar se o último pagamento foi recente
          const paymentDate = new Date(lastPayment.paid_at || lastPayment.created_at)
          const monthsDiff = (currentDate.getFullYear() - paymentDate.getFullYear()) * 12 + 
                           (currentDate.getMonth() - paymentDate.getMonth())
          
          // Se o último pagamento foi há mais de 1 mês, está em aberto
          status = monthsDiff <= 1 ? 'PAGO' : 'EM_ABERTO'
        }

        mensalistasData.push({
          client,
          monthlyFee: client.monthly_fee || 0,
          status,
          lastPayment
        })
      }

      setMensalistas(mensalistasData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar mensalistas')
    }
  }

  // Buscar pagamentos de serviços
  const fetchServicePayments = async (year?: number, month?: number | null) => {
    try {
      const targetYear = year || selectedYear
      const targetMonth = month !== undefined ? month : selectedMonth
      
      let startDate: string
      let endDate: string
      
      if (targetMonth) {
        // Filtrar por mês específico
        startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
        const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1
        const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear
        endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`
      } else {
        // Filtrar por ano inteiro
        startDate = `${targetYear}-01-01`
        endDate = `${targetYear}-12-31`
      }
      
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          clients:client_id(full_name)
        `)
        .not('total_amount', 'is', null)
        .gte('service_date', startDate)
        .lt('service_date', endDate)
        .order('created_at', { ascending: false })

      if (servicesError) throw servicesError

      const servicePaymentsData: ServicePaymentData[] = services?.map(service => ({
        service,
        clientName: service.clients?.full_name || 'Cliente não encontrado',
        totalAmount: service.total_amount || 0,
        paymentMethod: service.payment_method
      })) || []

      setServicePayments(servicePaymentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar pagamentos de serviços')
    }
  }

  // Buscar todos os dados em paralelo para melhor performance
  const fetchAllData = async (year?: number, month?: number | null) => {
    setLoading(true)
    setError(null)

    try {
      // Buscar anos disponíveis primeiro
      await fetchAvailableYears()

      // Executar todas as operações em paralelo
      await Promise.all([
        fetchSummary(year, month),
        fetchMensalistas(year, month),
        fetchServicePayments(year, month)
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar mensalistas por status
  const filterMensalistasByStatus = (status: PaymentStatus | 'TODOS') => {
    if (status === 'TODOS') return mensalistas
    return mensalistas.filter(mensalista => mensalista.status === status)
  }

  // Buscar dados por período para relatórios
  const fetchDataByPeriod = async (startDate: Date, endDate: Date) => {
    try {
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Buscar serviços no período
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          clients:client_id(full_name),
          service_items(*),
          service_materials(*)
        `)
        .gte('service_date', startDateStr)
        .lte('service_date', endDateStr)
        .order('created_at', { ascending: false })

      if (servicesError) throw servicesError

      // Buscar pagamentos no período (apenas pagos)
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          clients:client_id(full_name)
        `)
        .eq('status', 'PAGO')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

      return {
        services: services || [],
        payments: payments || []
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados do período')
      return { services: [], payments: [] }
    }
  }

  // Função para alterar o ano selecionado
  const changeYear = async (year: number) => {
    setSelectedYear(year)
    await fetchAllData(year, selectedMonth)
  }

  // Função para alterar o mês selecionado
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
