import { Client } from '@/types/database'

export type ExtendedPaymentStatus = 'PAGO' | 'EM_ABERTO' | 'INATIVO'

/**
 * Verifica se um mês específico está ativo para um cliente mensalista
 * baseado na data de início da mensalidade
 */
export function isMonthActive(client: Client, year: number, month: number): boolean {
  if (!client.subscription_start_date) {
    // Cliente sem data de início, considerar todos os meses como ativos
    return true
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  // Se o ano de início é posterior ao ano atual, mês não está ativo
  if (startYear > year) {
    return false
  }

  // Se o ano de início é anterior ao ano atual, mês está ativo
  if (startYear < year) {
    return true
  }

  // Mesmo ano: verificar se o mês está após o início
  return month >= startMonth
}

/**
 * Calcula o número total de meses ativos para um cliente em um ano específico
 */
export function getActiveMonthsCount(client: Client, year: number): number {
  if (!client.subscription_start_date) {
    return 12 // Todos os meses se não há data de início
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  if (startYear > year) {
    return 0 // Nenhum mês ativo
  }

  if (startYear < year) {
    return 12 // Todos os meses ativos
  }

  // Mesmo ano: calcular meses restantes
  return 12 - startMonth + 1
}

/**
 * Calcula o valor previsto para um cliente em um ano específico
 */
export function getExpectedValue(client: Client, year: number): number {
  const monthlyFee = client.monthly_fee || 0
  const activeMonths = getActiveMonthsCount(client, year)
  return monthlyFee * activeMonths
}

/**
 * Calcula o valor previsto para um cliente até um mês específico
 */
export function getExpectedValueUntilMonth(client: Client, year: number, month: number): number {
  if (!client.subscription_start_date) {
    // Cliente sem data de início, calcular todos os meses até o mês especificado
    return (client.monthly_fee || 0) * month
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  if (startYear > year) {
    return 0 // Nenhum mês ativo
  }

  if (startYear < year) {
    // Cliente começou em ano anterior, calcular todos os meses até o mês especificado
    return (client.monthly_fee || 0) * month
  }

  // Mesmo ano: calcular apenas meses após o início
  if (month < startMonth) {
    return 0
  }

  const activeMonths = month - startMonth + 1
  return (client.monthly_fee || 0) * activeMonths
}

/**
 * Calcula o valor previsto para um cliente no mês atual
 */
export function getExpectedValueForCurrentMonth(client: Client, year: number, month: number): number {
  if (!isMonthActive(client, year, month)) {
    return 0 // Mês não está ativo para este cliente
  }
  return client.monthly_fee || 0
}

/**
 * Calcula o valor recebido para um cliente no mês atual
 */
export function getReceivedValueForCurrentMonth(client: Client & { payments?: { month: number; status: string; amount?: number }[] }, year: number, month: number): number {
  if (!isMonthActive(client, year, month)) {
    return 0 // Mês não está ativo para este cliente
  }
  
  const payment = client.payments?.find(p => p.month === month && p.status === 'PAGO')
  return payment ? (payment.amount || client.monthly_fee || 0) : 0
}
