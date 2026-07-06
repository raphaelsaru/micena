'use server'

import { query, queryOne } from '@/lib/db'
import { requireUser } from '@/lib/auth-server'
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
  await requireUser()
  const brasiliaDate = getBrasiliaDate()
  const currentMonth = brasiliaDate.getMonth() + 1
  const currentYear = brasiliaDate.getFullYear()
  const today = getBrasiliaDateString()

  const [clients, servicosHojeResult, payments] = await Promise.all([
    query<{ is_recurring: boolean }>('SELECT is_recurring FROM clients'),
    queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM services WHERE next_service_date = $1',
      [today]
    ),
    query<{ amount: number | null; status: string }>(
      `SELECT amount, status FROM payments WHERE year = $1 AND month = $2 AND status IN ('EM_ABERTO', 'PAGO')`,
      [currentYear, currentMonth]
    ),
  ])

  const totalMensalistas = clients.filter((c) => c.is_recurring).length
  const totalAvulsos = clients.filter((c) => !c.is_recurring).length
  const totalClientesAtivos = totalMensalistas + totalAvulsos

  const servicosAgendadosHoje = servicosHojeResult ? parseInt(servicosHojeResult.count, 10) : 0

  const pagamentosPendentes = payments.filter((p) => p.status === 'EM_ABERTO')
  const pagamentosPagos = payments.filter((p) => p.status === 'PAGO')

  const pagamentosPendentesMes = {
    quantidade: pagamentosPendentes.length,
    valorTotal: pagamentosPendentes.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
  }

  const receitaRecebidaMes = pagamentosPagos.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return {
    totalClientesAtivos,
    totalMensalistas,
    totalAvulsos,
    servicosAgendadosHoje,
    pagamentosPendentesMes,
    receitaRecebidaMes,
  }
}

// Buscar receita mensal dos últimos 6 meses
export async function getReceitaMensal(): Promise<ReceitaMensal[]> {
  await requireUser()
  const brasiliaDate = getBrasiliaDate()
  const currentYear = brasiliaDate.getFullYear()
  const currentMonth = brasiliaDate.getMonth() + 1

  const mesesArray: { year: number; month: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1)
    mesesArray.push({ year: date.getFullYear(), month: date.getMonth() + 1 })
  }

  const firstMonthDate = new Date(mesesArray[0].year, mesesArray[0].month - 1, 1)
    .toISOString()
    .split('T')[0]

  const monthConditions = mesesArray
    .map((_, i) => `(year = $${i * 2 + 1} AND month = $${i * 2 + 2})`)
    .join(' OR ')
  const monthParams = mesesArray.flatMap(({ year, month }) => [year, month])

  const [payments, services] = await Promise.all([
    query<{ year: number; month: number; amount: number | null }>(
      `SELECT year, month, amount FROM payments WHERE status = 'PAGO' AND (${monthConditions})`,
      monthParams
    ),
    query<{ service_date: string; total_amount: number | null }>(
      `SELECT service_date, total_amount FROM services
       WHERE service_date >= $1 AND total_amount IS NOT NULL AND total_amount > 0`,
      [firstMonthDate]
    ),
  ])

  return mesesArray.map(({ year, month }) => {
    const date = new Date(year, month - 1, 1)
    const nextMonth = new Date(year, month, 1)

    const valorMensalistas = payments
      .filter((p) => p.year === year && p.month === month)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const valorOS = services
      .filter((s) => {
        const serviceDate = new Date(s.service_date)
        return serviceDate >= date && serviceDate < nextMonth
      })
      .reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)

    const mesNome = date.toLocaleDateString('pt-BR', { month: 'short' })

    return { mes: mesNome, valor: valorMensalistas + valorOS, valorOS, valorMensalistas }
  })
}

// Buscar distribuição de serviços dos últimos 30 dias
export async function getDistribuicaoServicos(): Promise<DistribuicaoServicos[]> {
  await requireUser()
  const brasiliaDate = getBrasiliaDate()
  const thirtyDaysAgo = new Date(brasiliaDate)
  thirtyDaysAgo.setDate(brasiliaDate.getDate() - 30)

  const servicos = await query<{ service_type: string | null }>(
    `SELECT service_type FROM services WHERE service_date >= $1 AND service_type IS NOT NULL`,
    [thirtyDaysAgo.toISOString().split('T')[0]]
  )

  const contagem: Record<ServiceType, number> = {
    AREIA: 0,
    EQUIPAMENTO: 0,
    CAPA: 0,
    OUTRO: 0,
  }

  servicos.forEach((servico) => {
    if (servico.service_type && servico.service_type in contagem) {
      contagem[servico.service_type as ServiceType]++
    }
  })

  const total = Object.values(contagem).reduce((sum, count) => sum + count, 0)

  return Object.entries(contagem).map(([tipo, quantidade]) => ({
    tipo: tipo as ServiceType,
    quantidade,
    percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0,
  }))
}

// Buscar novos clientes por mês dos últimos 6 meses
export async function getNovosClientesMes(): Promise<NovosClientesMes[]> {
  await requireUser()
  const brasiliaDate = getBrasiliaDate()
  const novosClientesMes: NovosClientesMes[] = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date(brasiliaDate.getFullYear(), brasiliaDate.getMonth() - i, 1)
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)

    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM clients WHERE created_at >= $1 AND created_at < $2',
      [date.toISOString(), nextMonth.toISOString()]
    )

    const quantidade = result ? parseInt(result.count, 10) : 0
    const mesNome = date.toLocaleDateString('pt-BR', { month: 'short' })

    novosClientesMes.push({ mes: mesNome, quantidade })
  }

  return novosClientesMes
}

// Buscar próximos serviços (7 dias)
export async function getProximosServicos(): Promise<ProximoServico[]> {
  await requireUser()
  const brasiliaDate = getBrasiliaDate()
  const sevenDaysFromNow = new Date(brasiliaDate)
  sevenDaysFromNow.setDate(brasiliaDate.getDate() + 7)

  const servicos = await query<{
    id: string
    next_service_date: string
    service_type: string | null
    full_name: string | null
  }>(
    `SELECT s.id, s.next_service_date, s.service_type, c.full_name
     FROM services s
     LEFT JOIN clients c ON c.id = s.client_id
     WHERE s.next_service_date >= $1 AND s.next_service_date <= $2
     ORDER BY s.next_service_date ASC`,
    [getBrasiliaDateString(), sevenDaysFromNow.toISOString().split('T')[0]]
  )

  return servicos.map((servico) => ({
    id: servico.id,
    cliente: servico.full_name || 'Cliente não encontrado',
    tipoServico: servico.service_type || 'Não especificado',
    data: servico.next_service_date,
    dataFormatada: formatDate(servico.next_service_date),
  }))
}
