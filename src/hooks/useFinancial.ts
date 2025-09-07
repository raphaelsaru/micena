'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Client, Service, Payment, PaymentStatus, PaymentMethod } from '@/types/database'
import { getBrasiliaDate } from '@/lib/utils'

export interface FinancialSummary {
  monthlyRevenue: number
  pendingRevenue: number
  activeSubscribers: number
  totalRevenue: number
  osRevenue: number
  mensalistasRevenue: number
  osMonthlyRevenue: number
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
    osMonthlyRevenue: 0
  })
  const [mensalistas, setMensalistas] = useState<MensalistaData[]>([])
  const [servicePayments, setServicePayments] = useState<ServicePaymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

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

  // Buscar resumo financeiro
  const fetchSummary = async (year?: number) => {
    try {
      const currentDate = getBrasiliaDate()
      const currentMonth = currentDate.getMonth() + 1
      const targetYear = year || selectedYear

      // Receita do mês atual (pagos) - buscar por data de criação também
      const startOfMonth = new Date(targetYear, currentMonth - 1, 1)
      const endOfMonth = new Date(targetYear, currentMonth, 0, 23, 59, 59)
      
      const { data: monthlyPayments, error: monthlyError } = await supabase
        .from('payments')
        .select('*')
        .eq('year', targetYear)
        .eq('month', currentMonth)
        .eq('status', 'PAGO')

      if (monthlyError) throw monthlyError

      const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => 
        sum + (payment.amount || 0), 0) || 0




      // Receita pendente (em aberto)
      const { data: pendingPayments, error: pendingError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'EM_ABERTO')

      if (pendingError) throw pendingError

      const pendingRevenue = pendingPayments?.reduce((sum, payment) => 
        sum + (payment.amount || 0), 0) || 0

      // Total de mensalistas ativos
      const { data: activeClients, error: activeError } = await supabase
        .from('clients')
        .select('id')
        .eq('is_recurring', true)

      if (activeError) throw activeError

      const activeSubscribers = activeClients?.length || 0

      // Buscar receita total das OS para calcular o total geral
      const { data: osServices, error: osError } = await supabase
        .from('services')
        .select('total_amount')
        .not('total_amount', 'is', null)

      if (osError) throw osError

      const osRevenue = osServices?.reduce((sum, service) => 
        sum + (service.total_amount || 0), 0) || 0

      // Buscar receita mensal das OS (serviços realizados no mês atual)
      const { data: osMonthlyServices, error: osMonthlyError } = await supabase
        .from('services')
        .select('total_amount')
        .not('total_amount', 'is', null)
        .gte('service_date', `${targetYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('service_date', `${targetYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)

      if (osMonthlyError) throw osMonthlyError

      const osMonthlyRevenue = osMonthlyServices?.reduce((sum, service) => 
        sum + (service.total_amount || 0), 0) || 0

      // Calcular receita total de mensalistas (todos os pagamentos históricos)
      const { data: allMensalistasPayments, error: allMensalistasError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'PAGO')

      if (allMensalistasError) throw allMensalistasError

      const mensalistasRevenue = allMensalistasPayments?.reduce((sum, payment) => 
        sum + (payment.amount || 0), 0) || 0

      const finalSummary = {
        monthlyRevenue, // Apenas pagamentos de mensalistas do mês atual
        pendingRevenue,
        activeSubscribers,
        totalRevenue: mensalistasRevenue + osRevenue,
        osRevenue,
        mensalistasRevenue,
        osMonthlyRevenue
      }



      setSummary(finalSummary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar resumo financeiro')
    }
  }

  // Buscar dados dos mensalistas
  const fetchMensalistas = async (year?: number) => {
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

        // Determinar status baseado no último pagamento
        let status: PaymentStatus = 'EM_ABERTO'
        if (lastPayment) {
          const paymentDate = new Date(lastPayment.paid_at || lastPayment.created_at)
          const currentDate = getBrasiliaDate()
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
  const fetchServicePayments = async (year?: number) => {
    try {
      const targetYear = year || selectedYear
      const startOfYear = `${targetYear}-01-01`
      const endOfYear = `${targetYear}-12-31`
      
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          clients:client_id(full_name)
        `)
        .not('total_amount', 'is', null)
        .gte('service_date', startOfYear)
        .lte('service_date', endOfYear)
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

  // Buscar todos os dados
  const fetchAllData = async (year?: number) => {
    setLoading(true)
    setError(null)
    
    try {
      // Buscar anos disponíveis primeiro
      await fetchAvailableYears()
      
      // Executar em sequência para garantir que os cálculos sejam feitos na ordem correta
      await fetchSummary(year) // Primeiro busca e calcula o resumo (incluindo OS)
      await fetchMensalistas(year) // Depois busca mensalistas
      await fetchServicePayments(year) // Por último busca detalhes dos serviços
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

      // Buscar pagamentos no período
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          clients:client_id(full_name)
        `)
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
    await fetchAllData(year)
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
    changeYear,
    fetchAllData,
    filterMensalistasByStatus,
    fetchDataByPeriod
  }
}
