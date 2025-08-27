'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Client, Service, Payment, PaymentStatus, PaymentMethod } from '@/types/database'

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

  // Buscar resumo financeiro
  const fetchSummary = async () => {
    try {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()

      // Receita do mês atual (pagos)
      const { data: monthlyPayments, error: monthlyError } = await supabase
        .from('payments')
        .select('amount')
        .eq('year', currentYear)
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
        .gte('service_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('service_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)

      if (osMonthlyError) throw osMonthlyError

      const osMonthlyRevenue = osMonthlyServices?.reduce((sum, service) => 
        sum + (service.total_amount || 0), 0) || 0

      setSummary({
        monthlyRevenue,
        pendingRevenue,
        activeSubscribers,
        totalRevenue: monthlyRevenue + pendingRevenue + osRevenue,
        osRevenue,
        mensalistasRevenue: monthlyRevenue + pendingRevenue,
        osMonthlyRevenue
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar resumo financeiro')
    }
  }

  // Buscar dados dos mensalistas
  const fetchMensalistas = async () => {
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_recurring', true)
        .order('full_name')

      if (clientsError) throw clientsError

      const mensalistasData: MensalistaData[] = []

      for (const client of clients) {
        // Buscar último pagamento
        const { data: lastPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(1)

        // Determinar status baseado no último pagamento
        let status: PaymentStatus = 'EM_ABERTO'
        if (lastPayment && lastPayment.length > 0) {
          const payment = lastPayment[0]
          const paymentDate = new Date(payment.paid_at || payment.created_at)
          const currentDate = new Date()
          const monthsDiff = (currentDate.getFullYear() - paymentDate.getFullYear()) * 12 + 
                           (currentDate.getMonth() - paymentDate.getMonth())
          
          // Se o último pagamento foi há mais de 1 mês, está em aberto
          status = monthsDiff <= 1 ? 'PAGO' : 'EM_ABERTO'
        }

        mensalistasData.push({
          client,
          monthlyFee: client.monthly_fee || 0,
          status,
          lastPayment: lastPayment?.[0]
        })
      }

      setMensalistas(mensalistasData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar mensalistas')
    }
  }

  // Buscar pagamentos de serviços
  const fetchServicePayments = async () => {
    try {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          clients:client_id(full_name)
        `)
        .not('total_amount', 'is', null)
        .order('service_date', { ascending: false })

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
  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Executar em sequência para garantir que os cálculos sejam feitos na ordem correta
      await fetchSummary() // Primeiro busca e calcula o resumo (incluindo OS)
      await fetchMensalistas() // Depois busca mensalistas
      await fetchServicePayments() // Por último busca detalhes dos serviços
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
        .order('service_date', { ascending: false })

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

  useEffect(() => {
    fetchAllData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    summary,
    mensalistas,
    servicePayments,
    loading,
    error,
    fetchAllData,
    filterMensalistasByStatus,
    fetchDataByPeriod
  }
}
