'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/formatters'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  X, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Client, Payment, PaymentStatus } from '@/types/database'
import { displayDate, normalizeText } from '@/lib/utils'
import { 
  ExtendedPaymentStatus, 
  isMonthActive,
  getActiveMonthsCount, 
  getExpectedValue, 
  getExpectedValueUntilMonth,
  getExpectedValueForCurrentMonth,
  getReceivedValueForCurrentMonth
} from '@/lib/mensalistas-utils'
import { supabase } from '@/lib/supabase'
import { useMensalistasNotifications } from '@/contexts/MensalistasNotificationsContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface MensalistaWithPayments extends Client {
  payments: Payment[]
}

interface MensalistasSummary {
  totalMensalistas: number
  totalPrevisto: number
  totalRecebido: number
  percentualAdimplencia: number
  clientesEmAberto: string[]
  clientesAtrasados: string[]
  previstoMesAtual: number
  recebidoMesAtual: number
}

type FilterType = 'all' | 'em_aberto' | 'atrasados' | 'both'

const MONTHS = [
  { number: 1, name: 'Jan', short: 'Jan' },
  { number: 2, name: 'Fev', short: 'Fev' },
  { number: 3, name: 'Mar', short: 'Mar' },
  { number: 4, name: 'Abr', short: 'Abr' },
  { number: 5, name: 'Mai', short: 'Mai' },
  { number: 6, name: 'Jun', short: 'Jun' },
  { number: 7, name: 'Jul', short: 'Jul' },
  { number: 8, name: 'Ago', short: 'Ago' },
  { number: 9, name: 'Set', short: 'Set' },
  { number: 10, name: 'Out', short: 'Out' },
  { number: 11, name: 'Nov', short: 'Nov' },
  { number: 12, name: 'Dez', short: 'Dez' }
]

const CURRENT_YEAR = new Date().getFullYear()

export default function MensalistasPage() {
  const [mensalistas, setMensalistas] = useState<MensalistaWithPayments[]>([])
  const [summary, setSummary] = useState<MensalistasSummary>({
    totalMensalistas: 0,
    totalPrevisto: 0,
    totalRecebido: 0,
    percentualAdimplencia: 0,
    clientesEmAberto: [],
    clientesAtrasados: [],
    previstoMesAtual: 0,
    recebidoMesAtual: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingPayments, setUpdatingPayments] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<FilterType>('all')
  
  // Usar o contexto de notificações para sincronização
  const { refreshNotifications } = useMensalistasNotifications()

  useEffect(() => {
    loadMensalistas()
  }, [])

  useEffect(() => {
    const calculateSummary = () => {
      const currentMonth = new Date().getMonth() + 1 // Janeiro = 1, Dezembro = 12
      const totalMensalistas = mensalistas.length
      
      // Calcular total previsto: soma de todos os clientes × 12 meses (para o card)
      let totalPrevistoAno = 0
      
      // Calcular total previsto e recebido até o mês atual (para adimplência)
      let totalPrevistoAtual = 0
      let totalRecebido = 0
      
      mensalistas.forEach(client => {
        // Para o card "Previsto até Dez" - calcular apenas os meses após o início da mensalidade
        totalPrevistoAno += getExpectedValue(client, CURRENT_YEAR)
        
        // Para adimplência - calcular apenas até o mês atual e após o início da mensalidade
        totalPrevistoAtual += getExpectedValueUntilMonth(client, CURRENT_YEAR, currentMonth)
        
        // Calcular valor recebido até o mês atual
        for (let month = 1; month <= currentMonth; month++) {
          // Verificar se este mês está ativo para o cliente
          if (!isMonthActive(client, CURRENT_YEAR, month)) {
            continue
          }
          
          // Verificar se este mês foi pago
          const payment = client.payments.find(p => p.month === month)
          if (payment && payment.status === 'PAGO') {
            // Usar o valor do pagamento ou o valor padrão do cliente
            totalRecebido += payment.amount || (client.monthly_fee || 0)
          }
        }
      })
      
      const percentualAdimplencia = totalPrevistoAtual > 0 ? (totalRecebido / totalPrevistoAtual) * 100 : 0
      
      // Clientes em aberto: não pagaram o mês atual (após o início da mensalidade)
      const clientesEmAberto = mensalistas
        .filter(client => {
          // Verificar se o mês atual está ativo para o cliente
          if (!isMonthActive(client, CURRENT_YEAR, currentMonth)) {
            return false
          }
          
          const currentMonthPayment = client.payments.find(p => p.month === currentMonth)
          return !currentMonthPayment || currentMonthPayment.status === 'EM_ABERTO'
        })
        .map(client => client.full_name)

      // Clientes atrasados: não pagaram meses anteriores ao atual (após o início da mensalidade)
      const clientesAtrasados = mensalistas
        .filter(client => {
          const previousMonths = Array.from({ length: currentMonth - 1 }, (_, i) => i + 1)
          const hasUnpaidPreviousMonths = previousMonths.some(month => {
            // Verificar se este mês está ativo para o cliente
            if (!isMonthActive(client, CURRENT_YEAR, month)) {
              return false
            }
            
            const payment = client.payments.find(p => p.month === month)
            return !payment || payment.status === 'EM_ABERTO'
          })
          return hasUnpaidPreviousMonths
        })
        .map(client => client.full_name)

              // Calcular valores do mês atual
        let previstoMesAtual = 0
        let recebidoMesAtual = 0
        
        mensalistas.forEach(client => {
          previstoMesAtual += getExpectedValueForCurrentMonth(client, CURRENT_YEAR, currentMonth)
          recebidoMesAtual += getReceivedValueForCurrentMonth(client, CURRENT_YEAR, currentMonth)
        })

        setSummary({
          totalMensalistas,
          totalPrevisto: totalPrevistoAno,
          totalRecebido,
          percentualAdimplencia,
          clientesEmAberto,
          clientesAtrasados,
          previstoMesAtual,
          recebidoMesAtual
        })
    }

    calculateSummary()
  }, [mensalistas])

  const loadMensalistas = async () => {
    try {
      setLoading(true)
      
      // Buscar clientes mensalistas
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_recurring', true)
        .order('full_name')

      if (clientsError) throw clientsError

      // Buscar pagamentos para o ano atual
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('year', CURRENT_YEAR)

      if (paymentsError) throw paymentsError

      // Combinar clientes com pagamentos
      const mensalistasWithPayments = clients.map(client => {
        const clientPayments = payments.filter(p => p.client_id === client.id)
        return {
          ...client,
          payments: clientPayments
        }
      })

      setMensalistas(mensalistasWithPayments)
    } catch (error) {
      console.error('Erro ao carregar mensalistas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatus = (client: MensalistaWithPayments, month: number): ExtendedPaymentStatus => {
    // Verificar se este mês está ativo para o cliente
    if (!isMonthActive(client, CURRENT_YEAR, month)) {
      return 'INATIVO'
    }
    
    const payment = client.payments.find(p => p.month === month)
    return payment?.status || 'EM_ABERTO'
  }

  const togglePaymentStatus = async (clientId: string, month: number, currentStatus: ExtendedPaymentStatus) => {
    // Não permitir alterações em meses inativos
    if (currentStatus === 'INATIVO') return
    
    const paymentKey = `${clientId}-${month}`
    
    try {
      const newStatus: PaymentStatus = currentStatus === 'PAGO' ? 'EM_ABERTO' : 'PAGO'
      const client = mensalistas.find(c => c.id === clientId)
      if (!client) return

      // Marcar como atualizando
      setUpdatingPayments(prev => new Set(prev).add(paymentKey))

      // Atualização otimista - atualizar o estado local imediatamente
      setMensalistas(prevMensalistas => 
        prevMensalistas.map(c => {
          if (c.id === clientId) {
            const existingPayment = c.payments.find(p => p.month === month)
            
            if (existingPayment) {
              // Atualizar pagamento existente
              const updatedPayments = c.payments.map(p => 
                p.month === month 
                  ? { ...p, status: newStatus, paid_at: newStatus === 'PAGO' ? new Date().toISOString() : undefined }
                  : p
              )
              return { ...c, payments: updatedPayments }
            } else {
              // Criar novo pagamento
              const newPayment: Payment = {
                id: `temp-${Date.now()}`, // ID temporário
                client_id: clientId,
                year: CURRENT_YEAR,
                month,
                status: newStatus,
                receipt_url: undefined,
                marked_by_receipt: false,
                amount: client.monthly_fee,
                paid_at: newStatus === 'PAGO' ? new Date().toISOString() : undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              return { ...c, payments: [...c.payments, newPayment] }
            }
          }
          return c
        })
      )

      // Atualizar no banco de dados em background
      const payment = client.payments.find(p => p.month === month)
      
      if (payment) {
        // Atualizar pagamento existente
        const { error } = await supabase
          .from('payments')
          .update({ 
            status: newStatus,
            paid_at: newStatus === 'PAGO' ? new Date().toISOString() : null,
            amount: client.monthly_fee
          })
          .eq('id', payment.id)

        if (error) {
          // Em caso de erro, reverter a mudança otimista
          console.error('Erro ao atualizar pagamento:', error)
          setMensalistas(prevMensalistas => 
            prevMensalistas.map(c => {
              if (c.id === clientId) {
                const revertedPayments = c.payments.map(p => 
                  p.month === month 
                    ? { ...p, status: currentStatus, paid_at: currentStatus === 'PAGO' ? new Date().toISOString() : undefined }
                    : p
                )
                return { ...c, payments: revertedPayments }
              }
              return c
            })
          )
          // Aqui você pode adicionar um toast de erro se quiser
          return
        }
      } else {
        // Criar novo pagamento
        const { data: newPaymentData, error } = await supabase
          .from('payments')
          .insert({
            client_id: clientId,
            year: CURRENT_YEAR,
            month,
            status: newStatus,
            amount: client.monthly_fee,
            paid_at: newStatus === 'PAGO' ? new Date().toISOString() : null
          })
          .select()
          .single()

        if (error) {
          // Em caso de erro, reverter a mudança otimista
          console.error('Erro ao criar pagamento:', error)
          setMensalistas(prevMensalistas => 
            prevMensalistas.map(c => {
              if (c.id === clientId) {
                const revertedPayments = c.payments.filter(p => p.month !== month)
                return { ...c, payments: revertedPayments }
              }
              return c
            })
          )
          // Aqui você pode adicionar um toast de erro se quiser
          return
        }

        // Atualizar o ID temporário com o ID real do banco
        setMensalistas(prevMensalistas => 
          prevMensalistas.map(c => {
            if (c.id === clientId) {
              const updatedPayments = c.payments.map(p => 
                p.month === month && p.id.startsWith('temp-')
                  ? { ...p, id: newPaymentData.id }
                  : p
              )
              return { ...c, payments: updatedPayments }
            }
            return c
          })
        )
      }

      // Sincronizar notificações em tempo real
      await refreshNotifications()
      
      // Não é mais necessário recarregar os dados
      // await loadMensalistas()
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error)
      // Em caso de erro geral, reverter todas as mudanças
      await loadMensalistas()
    } finally {
      // Remover do estado de atualização
      setUpdatingPayments(prev => {
        const newSet = new Set(prev)
        newSet.delete(paymentKey)
        return newSet
      })
    }
  }

  // Função para verificar se um cliente está em aberto (mês atual)
  const isClientEmAberto = (client: MensalistaWithPayments): boolean => {
    const currentMonth = new Date().getMonth() + 1
    if (!isMonthActive(client, CURRENT_YEAR, currentMonth)) {
      return false
    }
    
    const currentMonthPayment = client.payments.find(p => p.month === currentMonth)
    return !currentMonthPayment || currentMonthPayment.status === 'EM_ABERTO'
  }

  // Função para verificar se um cliente está atrasado (meses anteriores)
  const isClientAtrasado = (client: MensalistaWithPayments): boolean => {
    const currentMonth = new Date().getMonth() + 1
    const previousMonths = Array.from({ length: currentMonth - 1 }, (_, i) => i + 1)
    
    return previousMonths.some(month => {
      if (!isMonthActive(client, CURRENT_YEAR, month)) {
        return false
      }
      
      const payment = client.payments.find(p => p.month === month)
      return !payment || payment.status === 'EM_ABERTO'
    })
  }

  // Função para filtrar mensalistas baseado no tipo de filtro
  const getFilteredMensalistas = () => {
    let filtered = mensalistas.filter(client =>
      normalizeText(client.full_name).includes(normalizeText(searchTerm))
    )

    switch (filterType) {
      case 'em_aberto':
        filtered = filtered.filter(client => isClientEmAberto(client))
        break
      case 'atrasados':
        filtered = filtered.filter(client => isClientAtrasado(client))
        break
      case 'both':
        filtered = filtered.filter(client => isClientEmAberto(client) || isClientAtrasado(client))
        break
      case 'all':
      default:
        // Não filtrar, mostrar todos
        break
    }

    return filtered
  }

  const filteredMensalistas = getFilteredMensalistas()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando mensalistas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container-mobile mobile-py mobile-space-y">
      {/* Header */}
      <div className="mobile-header">
        <div>
          <h1 className="mobile-header-title">Mensalistas</h1>
          <p className="text-gray-600 mt-2 mobile-text-base">Controle de pagamentos mensais e adimplência</p>
        </div>
      </div>

      {/* Resumo/Relatório */}
      <Card>
        <CardHeader className="mobile-card-header">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="mobile-text-lg">Resumo Geral</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-card-content">
          <div className="mobile-grid-3 lg:grid-cols-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{summary.totalMensalistas}</p>
              <p className="text-sm text-gray-600">Total Mensalistas</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(summary.previstoMesAtual)}
              </p>
              <p className="text-sm text-gray-600">Previsto do Mês Atual</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(summary.recebidoMesAtual)}
              </p>
              <p className="text-sm text-gray-600">Recebido no Mês Atual</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">
                {summary.percentualAdimplencia.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Adimplência</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{summary.clientesEmAberto.length}</p>
              <p className="text-sm text-gray-600">Mês Atual</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{summary.clientesAtrasados.length}</p>
              <p className="text-sm text-gray-600">Atrasados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Mensalistas</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Detalhado</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Busca e Filtros */}
          <div className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar mensalistas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros de Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  Filtrar por Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                    className="text-xs"
                  >
                    Todos ({mensalistas.length})
                  </Button>
                  <Button
                    variant={filterType === 'em_aberto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('em_aberto')}
                    className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Mês Atual ({summary.clientesEmAberto.length})
                  </Button>
                  <Button
                    variant={filterType === 'atrasados' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('atrasados')}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-800 border-red-300"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Atrasados ({summary.clientesAtrasados.length})
                  </Button>
                  <Button
                    variant={filterType === 'both' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('both')}
                    className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Ambos ({summary.clientesEmAberto.length + summary.clientesAtrasados.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Mensalistas */}
          <div className="space-y-4">
            {filteredMensalistas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500">
                    <Filter className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhum mensalista encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros ou a busca</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredMensalistas.map((client) => {
                const isEmAberto = isClientEmAberto(client)
                const isAtrasado = isClientAtrasado(client)
                
                return (
                  <Card key={client.id} className={`
                    ${isEmAberto && isAtrasado ? 'border-orange-300 bg-orange-50/30' : ''}
                    ${isEmAberto && !isAtrasado ? 'border-yellow-300 bg-yellow-50/30' : ''}
                    ${!isEmAberto && isAtrasado ? 'border-red-300 bg-red-50/30' : ''}
                  `}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">{client.full_name}</h3>
                            <Badge variant={client.is_recurring ? "default" : "secondary"}>
                              Mensalista
                            </Badge>
                            <span className="text-lg font-semibold text-green-600">
                              {formatCurrency(client.monthly_fee || 0)}
                            </span>
                            {client.subscription_start_date && (
                              <Badge variant="outline" className="text-blue-700 border-blue-300">
                                Início: {displayDate(client.subscription_start_date)}
                              </Badge>
                            )}
                            {/* Badges de status */}
                            {isEmAberto && (
                              <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Mês Atual
                              </Badge>
                            )}
                            {isAtrasado && (
                              <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                                <Clock className="h-3 w-3 mr-1" />
                                Atrasado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span>Status dos pagamentos {CURRENT_YEAR}:</span>
                          <span className="font-medium">
                            {(() => {
                              const totalMonths = getActiveMonthsCount(client, CURRENT_YEAR)
                              const paidMonths = client.payments.filter(p => 
                                p.status === 'PAGO' && isMonthActive(client, CURRENT_YEAR, p.month)
                              ).length
                              
                              return `${paidMonths}/${totalMonths} meses`
                            })()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-2">
                          {MONTHS.map((month) => {
                            const status = getPaymentStatus(client, month.number)
                            const isPaid = status === 'PAGO'
                            const isInactive = status === 'INATIVO'
                            const isUpdating = updatingPayments.has(`${client.id}-${month.number}`)
                            
                            return (
                              <div key={month.number} className="text-center">
                                <div className="mobile-text-sm text-gray-500 mb-1">{month.short}</div>
                                <div className="flex items-center justify-center">
                                  {isInactive ? (
                                    <div className="w-4 h-4 bg-gray-300 rounded border-2 border-gray-400 cursor-not-allowed" title="Mês anterior ao início da mensalidade">
                                      <span className="sr-only">Inativo</span>
                                    </div>
                                  ) : (
                                    <Checkbox
                                      checked={isPaid}
                                      onCheckedChange={() => togglePaymentStatus(client.id, month.number, status as PaymentStatus)}
                                      disabled={isUpdating}
                                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-5 w-5"
                                    />
                                  )}
                                  {isUpdating && (
                                    <span className="ml-1 mobile-text-sm text-blue-600">...</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          {/* Resumo Detalhado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Mês Atual em Aberto
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.clientesEmAberto.length > 0 ? (
                  <div className="space-y-2">
                    {summary.clientesEmAberto.map((nome, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-800">{nome}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-green-600">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Todos pagaram o mês atual!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Clientes Atrasados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.clientesAtrasados.length > 0 ? (
                  <div className="space-y-2">
                    {summary.clientesAtrasados.map((nome, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-red-800">{nome}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-green-600">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Nenhum cliente atrasado!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cards de Valores Totais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <DollarSign className="h-5 w-5" />
                  Previsto até Dezembro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(summary.totalPrevisto)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Valor total previsto para o ano</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <DollarSign className="h-5 w-5" />
                  Total Recebido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(summary.totalRecebido)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Valor total recebido até o momento</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Resumo de Adimplência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                {summary.percentualAdimplencia >= 90 ? (
                  <div className="text-green-600">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-2xl font-bold">Excelente Gestão!</p>
                    <p className="text-lg">Adimplência de {summary.percentualAdimplencia.toFixed(1)}%</p>
                  </div>
                ) : summary.percentualAdimplencia >= 70 ? (
                  <div className="text-orange-600">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-2xl font-bold">Boa Gestão</p>
                    <p className="text-lg">Adimplência de {summary.percentualAdimplencia.toFixed(1)}%</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-2xl font-bold">Atenção Necessária</p>
                    <p className="text-lg">Adimplência de {summary.percentualAdimplencia.toFixed(1)}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
              </Tabs>
      </div>
    </ProtectedRoute>
  )
}
