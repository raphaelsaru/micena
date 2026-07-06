'use server'

import { query, queryOne } from '@/lib/db'
import { requireUser } from '@/lib/auth-server'
import { Client, Service, Payment, PaymentStatus, PaymentMethod } from '@/types/database'

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

function sumAmount(rows: { amount: number | string | null }[]): number {
  return rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
}

export async function getAvailableYears(): Promise<number[]> {
  await requireUser()
  const [paymentYears, serviceDates] = await Promise.all([
    query<{ year: number }>('SELECT DISTINCT year FROM payments WHERE year IS NOT NULL'),
    query<{ service_date: string }>('SELECT service_date FROM services WHERE service_date IS NOT NULL'),
  ])

  const years = new Set<number>()
  paymentYears.forEach((p) => years.add(p.year))
  serviceDates.forEach((s) => years.add(new Date(s.service_date).getFullYear()))

  return Array.from(years).sort((a, b) => b - a)
}

export async function getFinancialSummary(targetYear: number, targetMonth: number | null): Promise<FinancialSummary> {
  await requireUser()
  const monthRange = (year: number, month: number) => {
    const from = `${year}-${month.toString().padStart(2, '0')}-01`
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const to = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`
    return { from, to }
  }

  const [
    monthlyPayments,
    pendingPayments,
    activeClients,
    osServices,
    osMonthlyServices,
    allMensalistasPayments,
    allExpenses,
    monthlyExpenses,
  ] = await Promise.all([
    targetMonth
      ? query<{ amount: number | null }>(
          `SELECT amount FROM payments WHERE year = $1 AND month = $2 AND status = 'PAGO'`,
          [targetYear, targetMonth]
        )
      : query<{ amount: number | null }>(
          `SELECT amount FROM payments WHERE year = $1 AND status = 'PAGO'`,
          [targetYear]
        ),
    query<{ amount: number | null }>(`SELECT amount FROM payments WHERE status = 'EM_ABERTO'`),
    queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM clients WHERE is_recurring = true`),
    query<{ total_amount: number | null }>(`SELECT total_amount FROM services WHERE total_amount IS NOT NULL`),
    (() => {
      const { from, to } = targetMonth
        ? monthRange(targetYear, targetMonth)
        : { from: `${targetYear}-01-01`, to: `${targetYear + 1}-01-01` }
      return query<{ total_amount: number | null }>(
        `SELECT total_amount FROM services WHERE total_amount IS NOT NULL AND service_date >= $1 AND service_date < $2`,
        [from, to]
      )
    })(),
    query<{ amount: number | null }>(`SELECT amount FROM payments WHERE status = 'PAGO'`),
    query<{ amount: number | null }>(`SELECT amount FROM expenses`),
    (() => {
      const { from, to } = targetMonth
        ? monthRange(targetYear, targetMonth)
        : { from: `${targetYear}-01-01`, to: `${targetYear + 1}-01-01` }
      return query<{ amount: number | null }>(
        `SELECT amount FROM expenses WHERE expense_date >= $1 AND expense_date < $2`,
        [from, to]
      )
    })(),
  ])

  const monthlyRevenue = sumAmount(monthlyPayments)
  const pendingRevenue = sumAmount(pendingPayments)
  const activeSubscribers = activeClients ? parseInt(activeClients.count, 10) : 0
  const osRevenue = sumAmount(osServices.map((s) => ({ amount: s.total_amount })))
  const osMonthlyRevenue = sumAmount(osMonthlyServices.map((s) => ({ amount: s.total_amount })))
  const mensalistasRevenue = sumAmount(allMensalistasPayments)
  const totalExpensesSum = sumAmount(allExpenses)
  const monthlyExpensesSum = sumAmount(monthlyExpenses)

  const totalRevenue = mensalistasRevenue + osRevenue
  const netProfit = totalRevenue - totalExpensesSum
  const monthlyNetProfit = monthlyRevenue + osMonthlyRevenue - monthlyExpensesSum

  return {
    monthlyRevenue,
    pendingRevenue,
    activeSubscribers,
    totalRevenue,
    osRevenue,
    mensalistasRevenue,
    osMonthlyRevenue,
    totalExpenses: totalExpensesSum,
    monthlyExpenses: monthlyExpensesSum,
    netProfit,
    monthlyNetProfit,
  }
}

export async function getMensalistasFinancial(): Promise<MensalistaData[]> {
  await requireUser()
  const clients = await query<Client>(`SELECT * FROM clients WHERE is_recurring = true ORDER BY full_name`)
  const clientIds = clients.map((c) => c.id)

  const allPayments = clientIds.length
    ? await query<Payment>(
        `SELECT * FROM payments WHERE client_id = ANY($1) ORDER BY created_at DESC`,
        [clientIds]
      )
    : []

  const paymentsByClient = new Map<string, Payment[]>()
  allPayments.forEach((payment) => {
    if (!paymentsByClient.has(payment.client_id)) {
      paymentsByClient.set(payment.client_id, [])
    }
    paymentsByClient.get(payment.client_id)?.push(payment)
  })

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  return clients.map((client) => {
    const clientPayments = paymentsByClient.get(client.id) || []
    const lastPayment = clientPayments[0]

    let status: PaymentStatus = 'EM_ABERTO'
    const currentMonthPayment = clientPayments.find(
      (payment) => payment.year === currentYear && payment.month === currentMonth
    )

    if (currentMonthPayment) {
      status = currentMonthPayment.status
    } else if (lastPayment) {
      const paymentDate = new Date(lastPayment.paid_at || lastPayment.created_at)
      const monthsDiff =
        (now.getFullYear() - paymentDate.getFullYear()) * 12 + (now.getMonth() - paymentDate.getMonth())
      status = monthsDiff <= 1 ? 'PAGO' : 'EM_ABERTO'
    }

    return {
      client,
      monthlyFee: client.monthly_fee || 0,
      status,
      lastPayment,
    }
  })
}

export async function getServicePaymentsInRange(targetYear: number, targetMonth: number | null): Promise<ServicePaymentData[]> {
  await requireUser()
  let startDate: string
  let endDate: string

  if (targetMonth) {
    startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
    const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1
    const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear
    endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`
  } else {
    startDate = `${targetYear}-01-01`
    endDate = `${targetYear + 1}-01-01`
  }

  const services = await query<Service & { full_name: string | null }>(
    `SELECT s.*, c.full_name
     FROM services s
     LEFT JOIN clients c ON c.id = s.client_id
     WHERE s.total_amount IS NOT NULL AND s.service_date >= $1 AND s.service_date < $2
     ORDER BY s.created_at DESC`,
    [startDate, endDate]
  )

  return services.map(({ full_name, ...service }) => ({
    service: service as Service,
    clientName: full_name || 'Cliente não encontrado',
    totalAmount: service.total_amount || 0,
    paymentMethod: service.payment_method,
  }))
}

export async function getFinancialDataByPeriod(startDate: Date, endDate: Date) {
  await requireUser()
  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  const services = await query<Service & { full_name: string | null }>(
    `SELECT s.*, c.full_name
     FROM services s
     LEFT JOIN clients c ON c.id = s.client_id
     WHERE s.service_date >= $1 AND s.service_date <= $2
     ORDER BY s.created_at DESC`,
    [startDateStr, endDateStr]
  )

  const serviceIds = services.map((s) => s.id)
  const [items, materials] = await Promise.all([
    serviceIds.length ? query('SELECT * FROM service_items WHERE service_id = ANY($1)', [serviceIds]) : Promise.resolve([]),
    serviceIds.length ? query('SELECT * FROM service_materials WHERE service_id = ANY($1)', [serviceIds]) : Promise.resolve([]),
  ])

  const servicesWithDetails = services.map((service) => ({
    ...service,
    clients: { full_name: service.full_name },
    service_items: (items as { service_id: string }[]).filter((i) => i.service_id === service.id),
    service_materials: (materials as { service_id: string }[]).filter((m) => m.service_id === service.id),
  }))

  const payments = await query<Payment & { full_name: string | null }>(
    `SELECT p.*, c.full_name
     FROM payments p
     LEFT JOIN clients c ON c.id = p.client_id
     WHERE p.status = 'PAGO' AND p.created_at >= $1 AND p.created_at <= $2
     ORDER BY p.created_at DESC`,
    [startDateStr, endDateStr]
  )

  const paymentsWithClient = payments.map((payment) => ({
    ...payment,
    clients: { full_name: payment.full_name },
  }))

  return { services: servicesWithDetails, payments: paymentsWithClient }
}
