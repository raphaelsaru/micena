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
  
  try {
    // 1. Totais de clientes por tipo (contagem direta, sem restringir por datas)
    const { count: countMensalistas, error: errorMensalistas } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('is_recurring', true)

    if (errorMensalistas) throw errorMensalistas

    const { count: countAvulsos, error: errorAvulsos } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('is_recurring', false)

    if (errorAvulsos) throw errorAvulsos

    const totalMensalistas = countMensalistas || 0
    const totalAvulsos = countAvulsos || 0
    const totalClientesAtivos = totalMensalistas + totalAvulsos

    // 2. Serviços agendados para hoje (baseado em next_service_date)
    // Usar a data de Brasília para comparação
    const today = getBrasiliaDateString()
    const { data: servicosHoje, error: errorServicos } = await supabase
      .from('services')
      .select('id')
      .eq('next_service_date', today)
      .not('next_service_date', 'is', null)

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
  const receitaMensal: ReceitaMensal[] = []

  try {
    // Primeiro, vamos descobrir quais são os últimos 6 meses com dados disponíveis
    const { data: mesesDisponiveis, error: errorMeses } = await supabase
      .from('payments')
      .select('year, month')
      .eq('status', 'PAGO')
      .gt('amount', 0)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (errorMeses) throw errorMeses

    // Se não houver dados de pagamentos, buscar apenas de serviços
    if (!mesesDisponiveis || mesesDisponiveis.length === 0) {
      const { data: mesesServicos, error: errorServicos } = await supabase
        .from('services')
        .select('service_date')
        .gt('total_amount', 0)
        .order('service_date', { ascending: false })

      if (errorServicos) throw errorServicos

      if (mesesServicos && mesesServicos.length > 0) {
        // Agrupar por ano e mês
        const mesesUnicos = new Map<string, { year: number, month: number }>()
        
        mesesServicos.forEach(servico => {
          const date = new Date(servico.service_date)
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const key = `${year}-${month}`
          
          if (!mesesUnicos.has(key)) {
            mesesUnicos.set(key, { year, month })
          }
        })

        // Converter para array e ordenar em ordem crescente (mais antigo para mais recente)
        const mesesArray = Array.from(mesesUnicos.values())
          .sort((a, b) => a.year - b.year || a.month - b.month)
          .slice(-6) // Pegar os últimos 6 meses

        // Processar cada mês
        for (const { year, month } of mesesArray) {
          const date = new Date(year, month - 1, 1)
          const nextMonth = new Date(year, month, 1)

          // Buscar valores de OS (serviços com total_amount) no período
          const { data: servicos, error: errorServicos } = await supabase
            .from('services')
            .select('total_amount')
            .gte('service_date', date.toISOString().split('T')[0])
            .lt('service_date', nextMonth.toISOString().split('T')[0])
            .not('total_amount', 'is', null)
            .gt('total_amount', 0)

          if (errorServicos) throw errorServicos

          const valorOS = servicos?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
          const valorMensalistas = 0 // Não há pagamentos neste período
          const valor = valorOS + valorMensalistas

          const mesNome = date.toLocaleDateString('pt-BR', { month: 'short' })

          receitaMensal.push({
            mes: mesNome,
            valor,
            valorOS,
            valorMensalistas
          })
        }
      }
    } else {
      // Agrupar por ano e mês para evitar duplicatas
      const mesesUnicos = new Map<string, { year: number, month: number }>()
      
      mesesDisponiveis.forEach(item => {
        const key = `${item.year}-${item.month}`
        if (!mesesUnicos.has(key)) {
          mesesUnicos.set(key, { year: item.year, month: item.month })
        }
      })

      // Converter para array e ordenar em ordem crescente (mais antigo para mais recente)
      const mesesArray = Array.from(mesesUnicos.values())
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .slice(-6) // Pegar os últimos 6 meses

      // Processar cada mês
      for (const { year, month } of mesesArray) {
        const date = new Date(year, month - 1, 1)
        const nextMonth = new Date(year, month, 1)

        // Buscar pagamentos de mensalistas (status PAGO)
        const { data: pagamentos, error: errorPagamentos } = await supabase
          .from('payments')
          .select('amount')
          .eq('year', year)
          .eq('month', month)
          .eq('status', 'PAGO')

        if (errorPagamentos) throw errorPagamentos

        const valorMensalistas = pagamentos?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        // Buscar valores de OS (serviços com total_amount) no período
        const { data: servicos, error: errorServicos } = await supabase
          .from('services')
          .select('total_amount')
          .gte('service_date', date.toISOString().split('T')[0])
          .lt('service_date', nextMonth.toISOString().split('T')[0])
          .not('total_amount', 'is', null)
          .gt('total_amount', 0)

        if (errorServicos) throw errorServicos

        const valorOS = servicos?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

        // Calcular valor total
        const valor = valorMensalistas + valorOS

        const mesNome = date.toLocaleDateString('pt-BR', { month: 'short' })

        receitaMensal.push({
          mes: mesNome,
          valor,
          valorOS,
          valorMensalistas
        })
      }
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
