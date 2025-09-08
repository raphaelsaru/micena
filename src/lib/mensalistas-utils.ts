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

/**
 * Calcula o número total de meses ativos desde o início da mensalidade até o mês atual
 * Considera apenas os meses que já passaram (não inclui meses futuros)
 */
export function getTotalActiveMonthsSinceStart(client: Client, currentYear: number, currentMonth: number): number {
  if (!client.subscription_start_date) {
    // Cliente sem data de início, calcular todos os meses até o mês atual
    return currentMonth
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  if (startYear > currentYear) {
    return 0 // Nenhum mês ativo ainda
  }

  if (startYear < currentYear) {
    // Cliente começou em ano anterior, calcular todos os meses até o mês atual
    const monthsInPreviousYears = (currentYear - startYear) * 12
    const monthsFromStartToEndOfPreviousYear = monthsInPreviousYears - startMonth + 1
    return monthsFromStartToEndOfPreviousYear + currentMonth
  }

  // Mesmo ano: calcular apenas meses após o início até o mês atual
  if (currentMonth < startMonth) {
    return 0
  }

  return currentMonth - startMonth + 1
}

/**
 * Calcula o valor total recebido desde o início da mensalidade
 * Considera que todos os pagamentos de anos anteriores foram pagos
 * E apenas os meses que já passaram no ano atual
 */
export function getTotalReceivedSinceStart(
  client: Client & { payments?: { month: number; status: string; amount?: number; year: number }[] }, 
  currentYear: number, 
  currentMonth: number
): number {
  if (!client.subscription_start_date) {
    // Cliente sem data de início, calcular apenas pagamentos do ano atual até o mês atual
    const currentYearPayments = client.payments?.filter(p => 
      p.year === currentYear && 
      p.status === 'PAGO' && 
      p.month <= currentMonth
    ) || []
    return currentYearPayments.reduce((total, payment) => total + (payment.amount || client.monthly_fee || 0), 0)
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  if (startYear > currentYear) {
    return 0 // Nenhum mês ativo ainda
  }

  let totalReceived = 0

  // Calcular pagamentos de anos anteriores (assumir que foram todos pagos)
  if (startYear < currentYear) {
    const yearsBeforeCurrent = currentYear - startYear
    const monthsInPreviousYears = yearsBeforeCurrent * 12
    const monthsFromStartToEndOfPreviousYear = monthsInPreviousYears - startMonth + 1
    totalReceived += monthsFromStartToEndOfPreviousYear * (client.monthly_fee || 0)
  }

  // Calcular pagamentos do ano atual apenas até o mês atual
  const currentYearPayments = client.payments?.filter(p => 
    p.year === currentYear && 
    p.status === 'PAGO' && 
    p.month <= currentMonth
  ) || []
  const currentYearReceived = currentYearPayments.reduce((total, payment) => total + (payment.amount || client.monthly_fee || 0), 0)
  totalReceived += currentYearReceived

  return totalReceived
}

/**
 * Calcula o valor total previsto desde o início da mensalidade
 * Considera apenas os meses que já passaram (não inclui meses futuros)
 */
export function getTotalExpectedSinceStart(client: Client, currentYear: number, currentMonth: number): number {
  const totalActiveMonths = getTotalActiveMonthsSinceStart(client, currentYear, currentMonth)
  return totalActiveMonths * (client.monthly_fee || 0)
}

/**
 * Calcula o valor previsto apenas para o ano atual (até dezembro)
 */
export function getExpectedValueForCurrentYear(client: Client, currentYear: number): number {
  if (!client.subscription_start_date) {
    return (client.monthly_fee || 0) * 12
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  if (startYear > currentYear) {
    return 0 // Nenhum mês ativo ainda
  }

  if (startYear < currentYear) {
    // Cliente começou em ano anterior, todos os 12 meses do ano atual são ativos
    return (client.monthly_fee || 0) * 12
  }

  // Mesmo ano: calcular apenas meses após o início até dezembro
  const monthsFromStartToDecember = 12 - startMonth + 1
  return (client.monthly_fee || 0) * monthsFromStartToDecember
}

/**
 * Calcula o número de meses pagos no ano atual
 */
export function getPaidMonthsInCurrentYear(
  client: Client & { payments?: { month: number; status: string; amount?: number; year: number }[] }, 
  currentYear: number
): number {
  const currentYearPayments = client.payments?.filter(p => p.year === currentYear && p.status === 'PAGO') || []
  return currentYearPayments.length
}

/**
 * Calcula o valor recebido no ano atual
 */
export function getReceivedValueInCurrentYear(
  client: Client & { payments?: { month: number; status: string; amount?: number; year: number }[] }, 
  currentYear: number
): number {
  const currentYearPayments = client.payments?.filter(p => p.year === currentYear && p.status === 'PAGO') || []
  return currentYearPayments.reduce((total, payment) => total + (payment.amount || client.monthly_fee || 0), 0)
}

/**
 * Calcula o número de meses pagos desde o início da mensalidade
 * Considera que todos os pagamentos de anos anteriores foram pagos
 * E inclui meses futuros se o usuário marcou pagamentos futuros
 */
export function getPaidMonthsSinceStart(
  client: Client & { payments?: { month: number; status: string; amount?: number; year: number }[] }, 
  currentYear: number, 
  currentMonth: number
): number {
  if (!client.subscription_start_date) {
    // Cliente sem data de início, contar todos os pagamentos do ano atual (incluindo futuros)
    const currentYearPayments = client.payments?.filter(p => 
      p.year === currentYear && 
      p.status === 'PAGO'
    ) || []
    return currentYearPayments.length
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  if (startYear > currentYear) {
    return 0 // Nenhum mês ativo ainda
  }

  let totalPaidMonths = 0

  // Calcular meses pagos de anos anteriores (assumir que foram todos pagos)
  if (startYear < currentYear) {
    const yearsBeforeCurrent = currentYear - startYear
    const monthsInPreviousYears = yearsBeforeCurrent * 12
    const monthsFromStartToEndOfPreviousYear = monthsInPreviousYears - startMonth + 1
    totalPaidMonths += monthsFromStartToEndOfPreviousYear
  }

  // Calcular meses pagos do ano atual (incluindo futuros se marcados)
  const currentYearPayments = client.payments?.filter(p => 
    p.year === currentYear && 
    p.status === 'PAGO'
  ) || []
  totalPaidMonths += currentYearPayments.length

  return totalPaidMonths
}

/**
 * Calcula o número de meses ativos desde o início da mensalidade
 * Considera meses futuros se o usuário marcou pagamentos futuros
 */
export function getActiveMonthsSinceStart(
  client: Client & { payments?: { month: number; status: string; amount?: number; year: number }[] }, 
  currentYear: number, 
  currentMonth: number
): number {
  if (!client.subscription_start_date) {
    // Cliente sem data de início, contar todos os meses até o último mês pago
    const currentYearPayments = client.payments?.filter(p => 
      p.year === currentYear && 
      p.status === 'PAGO'
    ) || []
    
    if (currentYearPayments.length === 0) {
      return currentMonth // Se não há pagamentos, contar até o mês atual
    }
    
    // Encontrar o último mês pago
    const lastPaidMonth = Math.max(...currentYearPayments.map(p => p.month))
    return Math.max(lastPaidMonth, currentMonth)
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  if (startYear > currentYear) {
    return 0 // Nenhum mês ativo ainda
  }

  let totalActiveMonths = 0

  // Calcular meses ativos de anos anteriores
  if (startYear < currentYear) {
    const yearsBeforeCurrent = currentYear - startYear
    const monthsInPreviousYears = yearsBeforeCurrent * 12
    const monthsFromStartToEndOfPreviousYear = monthsInPreviousYears - startMonth + 1
    totalActiveMonths += monthsFromStartToEndOfPreviousYear
  }

  // Calcular meses ativos do ano atual
  const currentYearPayments = client.payments?.filter(p => 
    p.year === currentYear && 
    p.status === 'PAGO'
  ) || []
  
  if (currentYearPayments.length === 0) {
    // Se não há pagamentos, contar apenas até o mês atual
    if (startYear === currentYear) {
      totalActiveMonths += Math.max(0, currentMonth - startMonth + 1)
    } else {
      totalActiveMonths += currentMonth
    }
  } else {
    // Se há pagamentos, contar até o último mês pago
    const lastPaidMonth = Math.max(...currentYearPayments.map(p => p.month))
    if (startYear === currentYear) {
      totalActiveMonths += Math.max(0, lastPaidMonth - startMonth + 1)
    } else {
      totalActiveMonths += lastPaidMonth
    }
  }

  return totalActiveMonths
}

/**
 * Calcula o número de meses ativos do ano atual
 * Considera até o último mês pago, mesmo que seja futuro
 */
export function getActiveMonthsInCurrentYear(
  client: Client & { payments?: { month: number; status: string; amount?: number; year: number }[] }, 
  currentYear: number
): number {
  if (!client.subscription_start_date) {
    // Cliente sem data de início, contar até o último mês pago
    const currentYearPayments = client.payments?.filter(p => 
      p.year === currentYear && 
      p.status === 'PAGO'
    ) || []
    
    if (currentYearPayments.length === 0) {
      return 0 // Se não há pagamentos, não há meses ativos
    }
    
    // Encontrar o último mês pago
    return Math.max(...currentYearPayments.map(p => p.month))
  }

  const subscriptionStartDate = new Date(client.subscription_start_date)
  const startMonth = subscriptionStartDate.getMonth() + 1
  const startYear = subscriptionStartDate.getFullYear()

  if (startYear > currentYear) {
    return 0 // Nenhum mês ativo ainda
  }

  if (startYear < currentYear) {
    // Cliente começou em ano anterior, contar até o último mês pago
    const currentYearPayments = client.payments?.filter(p => 
      p.year === currentYear && 
      p.status === 'PAGO'
    ) || []
    
    if (currentYearPayments.length === 0) {
      return 0 // Se não há pagamentos, não há meses ativos
    }
    
    return Math.max(...currentYearPayments.map(p => p.month))
  }

  // Mesmo ano: contar até o último mês pago após o início
  const currentYearPayments = client.payments?.filter(p => 
    p.year === currentYear && 
    p.status === 'PAGO'
  ) || []
  
  if (currentYearPayments.length === 0) {
    return 0 // Se não há pagamentos, não há meses ativos
  }
  
  const lastPaidMonth = Math.max(...currentYearPayments.map(p => p.month))
  return Math.max(0, lastPaidMonth - startMonth + 1)
}
