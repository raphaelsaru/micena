import { supabase } from '@/lib/supabase-client'
import { ServiceType } from '@/types/database'

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
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  try {
    // 1. Total de clientes ativos (criados no último ano)
    const { data: clientesAtivos, error: errorClientes } = await supabase
      .from('clients')
      .select('id, is_recurring')
      .gte('created_at', new Date(currentYear - 1, 0, 1).toISOString())

    if (errorClientes) throw errorClientes

    const totalClientesAtivos = clientesAtivos?.length || 0
    const totalMensalistas = clientesAtivos?.filter(c => c.is_recurring).length || 0
    const totalAvulsos = totalClientesAtivos - totalMensalistas

    // 2. Serviços agendados para hoje
    const today = new Date().toISOString().split('T')[0]
    const { data: servicosHoje, error: errorServicos } = await supabase
      .from('services')
      .select('id')
      .eq('service_date', today)

    if (errorServicos) throw errorServicos

    const servicosAgendadosHoje = servicosHoje?.length || 0

    // 3. Pagamentos pendentes no mês
    const { data: pagamentosPendentes, error: errorPagamentos } = await supabase
      .from('payments')
      .select('amount')
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .eq('status', 'EM_ABERTO')

    if (errorPagamentos) throw errorPagamentos

    const pagamentosPendentesMes = {
      quantidade: pagamentosPendentes?.length || 0,
      valorTotal: pagamentosPendentes?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    }

    // 4. Receita recebida no mês
    const { data: pagamentosPagos, error: errorPagos } = await supabase
      .from('payments')
      .select('amount')
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .eq('status', 'PAGO')

    if (errorPagos) throw errorPagos

    const receitaRecebidaMes = pagamentosPagos?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

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
  const currentDate = new Date()
  const receitaMensal: ReceitaMensal[] = []

  try {
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      const { data: pagamentos, error } = await supabase
        .from('payments')
        .select('amount')
        .eq('year', year)
        .eq('month', month)
        .eq('status', 'PAGO')

      if (error) throw error

      const valor = pagamentos?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const mesNome = date.toLocaleDateString('pt-BR', { month: 'short' })

      receitaMensal.push({
        mes: mesNome,
        valor
      })
    }

    return receitaMensal
  } catch (error) {
    console.error('Erro ao buscar receita mensal:', error)
    throw error
  }
}

// Buscar distribuição de serviços dos últimos 30 dias
export async function getDistribuicaoServicos(): Promise<DistribuicaoServicos[]> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

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
  const currentDate = new Date()
  const novosClientesMes: NovosClientesMes[] = []

  try {
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
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
    const today = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(today.getDate() + 7)

    const { data: servicos, error } = await supabase
      .from('services')
      .select(`
        id,
        service_date,
        service_type,
        clients (
          full_name
        )
      `)
      .gte('service_date', today.toISOString().split('T')[0])
      .lte('service_date', sevenDaysFromNow.toISOString().split('T')[0])
      .order('service_date', { ascending: true })

    if (error) throw error

    return servicos?.map(servico => ({
      id: servico.id,
      cliente: (servico.clients as any)?.full_name || 'Cliente não encontrado',
      tipoServico: servico.service_type || 'Não especificado',
      data: servico.service_date,
      dataFormatada: new Date(servico.service_date).toLocaleDateString('pt-BR')
    })) || []
  } catch (error) {
    console.error('Erro ao buscar próximos serviços:', error)
    throw error
  }
}
