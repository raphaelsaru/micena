import { supabase } from '@/lib/supabase'
import { ServiceType } from '@/types/database'
import { formatDate } from '@/lib/formatters'
import { getBrasiliaDate, getBrasiliaDateString } from '@/lib/utils'

export interface DashboardKPIs {
  totalClientesAtivos: number
  totalMensalistas: number
  totalAvulsos: number
  servicosAgendadosHoje: number
  pagamentosPendentesMes: {
    quantidade: number
    valorTotal: number
  }
  receitaRecebidaMes: number
}

export interface ReceitaMensal {
  mes: string
  valor: number
  valorOS: number
  valorMensalistas: number
}

export interface DistribuicaoServicos {
  tipo: ServiceType
  quantidade: number
  percentual: number
}

export interface NovosClientesMes {
  mes: string
  quantidade: number
}

export interface ProximoServico {
  id: string
  cliente: string
  tipoServico: string
  data: string
  dataFormatada: string
}

// Buscar KPIs do dashboard
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const brasiliaDate = getBrasiliaDate()
  const currentMonth = brasiliaDate.getMonth() + 1
  const currentYear = brasiliaDate.getFullYear()
  const today = getBrasiliaDateString()

  try {
    // Executar todas as queries em paralelo para melhor performance
    const [
      clientsResult,
      servicosHojeResult,
      pagamentosResult
    ] = await Promise.all([
      // 1. Buscar contagem de clientes em uma única query
      supabase
        .from('clients')
        .select('is_recurring')
        .in('is_recurring', [true, false]),

      // 2. Serviços agendados para hoje
      supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('next_service_date', today)
        .not('next_service_date', 'is', null),

      // 3. Pagamentos do mês atual (pendentes e pagos) em uma query
      supabase
        .from('payments')
        .select('amount, status')
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .in('status', ['EM_ABERTO', 'PAGO'])
    ])

    // Processar resultados
    if (clientsResult.error) throw clientsResult.error
    if (servicosHojeResult.error) throw servicosHojeResult.error
    if (pagamentosResult.error) throw pagamentosResult.error

    // Calcular totais de clientes
    const clients = clientsResult.data || []
    const totalMensalistas = clients.filter(c => c.is_recurring).length
    const totalAvulsos = clients.filter(c => !c.is_recurring).length
    const totalClientesAtivos = totalMensalistas + totalAvulsos

    // Serviços agendados hoje
    const servicosAgendadosHoje = servicosHojeResult.count || 0

    // Processar pagamentos do mês
    const payments = pagamentosResult.data || []
    const pagamentosPendentes = payments.filter(p => p.status === 'EM_ABERTO')
    const pagamentosPagos = payments.filter(p => p.status === 'PAGO')

    const pagamentosPendentesMes = {
      quantidade: pagamentosPendentes.length,
      valorTotal: pagamentosPendentes.reduce((sum, p) => sum + (p.amount || 0), 0)
    }

    const receitaRecebidaMes = pagamentosPagos.reduce((sum, p) => sum + (p.amount || 0), 0)

    return {
      totalClientesAtivos,
      totalMensalistas,
      totalAvulsos,
      servicosAgendadosHoje,
      pagamentosPendentesMes,
      receitaRecebidaMes
    }
  } catch (error) {
    console.error('Erro ao buscar KPIs do dashboard:', error)
    throw error
  }
}

// Buscar receita mensal dos últimos 6 meses
export async function getReceitaMensal(): Promise<ReceitaMensal[]> {
  try {
    // Buscar os últimos 6 meses com dados usando uma query mais eficiente
    const brasiliaDate = getBrasiliaDate()
    const currentYear = brasiliaDate.getFullYear()
    const currentMonth = brasiliaDate.getMonth() + 1

    // Gerar array dos últimos 6 meses
    const mesesArray: { year: number, month: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1)
      mesesArray.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1
      })
    }

    // Buscar todos os dados necessários em paralelo
    const [paymentsResult, servicesResult] = await Promise.all([
      // Buscar todos os pagamentos dos últimos 6 meses
      supabase
        .from('payments')
        .select('year, month, amount')
        .eq('status', 'PAGO')
        .or(mesesArray.map(({ year, month }) => `and(year.eq.${year},month.eq.${month})`).join(',')),

      // Buscar todos os serviços dos últimos 6 meses
      supabase
        .from('services')
        .select('service_date, total_amount')
        .gte('service_date', new Date(mesesArray[0].year, mesesArray[0].month - 1, 1).toISOString().split('T')[0])
        .not('total_amount', 'is', null)
        .gt('total_amount', 0)
    ])

    if (paymentsResult.error) throw paymentsResult.error
    if (servicesResult.error) throw servicesResult.error

    const payments = paymentsResult.data || []
    const services = servicesResult.data || []

    // Processar dados de forma eficiente
    const receitaMensal: ReceitaMensal[] = mesesArray.map(({ year, month }) => {
      const date = new Date(year, month - 1, 1)
      const nextMonth = new Date(year, month, 1)

      // Calcular receita de mensalistas para este mês
      const valorMensalistas = payments
        .filter(p => p.year === year && p.month === month)
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      // Calcular receita de OS para este mês
      const valorOS = services
        .filter(s => {
          const serviceDate = new Date(s.service_date)
          return serviceDate >= date && serviceDate < nextMonth
        })
        .reduce((sum, s) => sum + (s.total_amount || 0), 0)

      const mesNome = date.toLocaleDateString('pt-BR', { month: 'short' })

      return {
        mes: mesNome,
        valor: valorMensalistas + valorOS,
        valorOS,
        valorMensalistas
      }
    })

    return receitaMensal
  } catch (error) {
    console.error('Erro ao buscar receita mensal:', error)
    throw error
  }
}

// Buscar distribuição de serviços dos últimos 30 dias
export async function getDistribuicaoServicos(): Promise<DistribuicaoServicos[]> {
  try {
    const brasiliaDate = getBrasiliaDate()
    const thirtyDaysAgo = new Date(brasiliaDate)
    thirtyDaysAgo.setDate(brasiliaDate.getDate() - 30)

    const { data: servicos, error } = await supabase
      .from('services')
      .select('service_type')
      .gte('service_date', thirtyDaysAgo.toISOString().split('T')[0])
      .not('service_type', 'is', null)

    if (error) throw error

    const contagem: Record<ServiceType, number> = {
      AREIA: 0,
      EQUIPAMENTO: 0,
      CAPA: 0,
      OUTRO: 0
    }

    servicos?.forEach(servico => {
      if (servico.service_type) {
        contagem[servico.service_type as ServiceType]++
      }
    })

    const total = Object.values(contagem).reduce((sum, count) => sum + count, 0)

    return Object.entries(contagem).map(([tipo, quantidade]) => ({
      tipo: tipo as ServiceType,
      quantidade,
      percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0
    }))
  } catch (error) {
    console.error('Erro ao buscar distribuição de serviços:', error)
    throw error
  }
}

// Buscar novos clientes por mês dos últimos 6 meses
export async function getNovosClientesMes(): Promise<NovosClientesMes[]> {
  const brasiliaDate = getBrasiliaDate()
  const novosClientesMes: NovosClientesMes[] = []

  try {
    for (let i = 5; i >= 0; i--) {
      const date = new Date(brasiliaDate.getFullYear(), brasiliaDate.getMonth() - i, 1)
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      
      const { data: clientes, error } = await supabase
        .from('clients')
        .select('id')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextMonth.toISOString())

      if (error) throw error

      const quantidade = clientes?.length || 0
      const mesNome = date.toLocaleDateString('pt-BR', { month: 'short' })

      novosClientesMes.push({
        mes: mesNome,
        quantidade
      })
    }

    return novosClientesMes
  } catch (error) {
    console.error('Erro ao buscar novos clientes por mês:', error)
    throw error
  }
}

// Buscar próximos serviços (7 dias)
export async function getProximosServicos(): Promise<ProximoServico[]> {
  try {
    const brasiliaDate = getBrasiliaDate()
    const sevenDaysFromNow = new Date(brasiliaDate)
    sevenDaysFromNow.setDate(brasiliaDate.getDate() + 7)

    const { data: servicos, error } = await supabase
      .from('services')
      .select(`
        id,
        next_service_date,
        service_type,
        clients (
          full_name
        )
      `)
      .gte('next_service_date', getBrasiliaDateString())
      .lte('next_service_date', sevenDaysFromNow.toISOString().split('T')[0])
      .not('next_service_date', 'is', null)
      .order('next_service_date', { ascending: true })

    if (error) throw error

    return servicos?.map(servico => ({
      id: servico.id,
      cliente: (servico.clients as any)?.full_name || 'Cliente não encontrado',
      tipoServico: servico.service_type || 'Não especificado',
      data: servico.next_service_date,
      dataFormatada: formatDate(servico.next_service_date)
    })) || []
  } catch (error) {
    console.error('Erro ao buscar próximos serviços:', error)
    throw error
  }
}
