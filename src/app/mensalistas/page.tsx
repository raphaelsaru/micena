'use client'

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
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
  isAfterDay26,
  getActiveMonthsCount,
  getExpectedValue,
  getExpectedValueUntilMonth,
  getExpectedValueForCurrentMonth,
  getReceivedValueForCurrentMonth
} from '@/lib/mensalistas-utils'
import { supabase } from '@/lib/supabase'
import { useMensalistasNotifications } from '@/contexts/MensalistasNotificationsContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute'

// Lazy load componentes pesados
const MensalistasTable = lazy(() => import('@/components/mensalistas/MensalistasTable').then(module => ({ default: module.MensalistasTable })))
const MensalistaDetailsModal = lazy(() => import('@/components/mensalistas/MensalistaDetailsModal').then(module => ({ default: module.MensalistaDetailsModal })))
const AdvancedFilters = lazy(() => import('@/components/mensalistas/AdvancedFilters').then(module => ({ default: module.AdvancedFilters })))
const BulkPaymentActions = lazy(() => import('@/components/mensalistas/BulkPaymentActions').then(module => ({ default: module.BulkPaymentActions })))

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
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    neighborhoods: [],
    minValue: null,
    maxValue: null,
    searchTerm: ''
  })
  
  // Usar o contexto de notificações para sincronização
  const { refreshNotifications } = useMensalistasNotifications()

  useEffect(() => {
    loadMensalistas()
  }, [])

  // Memoizar o cálculo do summary para melhor performance
  const calculatedSummary = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1
    const totalMensalistas = mensalistas.length

    // Usar reduce para melhor performance em vez de forEach com variáveis externas
    const calculations = mensalistas.reduce((acc, client) => {
      // Calcular valores para este cliente
      const previstoAno = getExpectedValue(client, CURRENT_YEAR)
      const previstoAtual = getExpectedValueUntilMonth(client, CURRENT_YEAR, currentMonth)
      const previstoMesAtual = getExpectedValueForCurrentMonth(client, CURRENT_YEAR, currentMonth)
      const recebidoMesAtual = getReceivedValueForCurrentMonth(client, CURRENT_YEAR, currentMonth)

      // Calcular valor recebido até o mês atual de forma mais eficiente
      const recebidoTotal = client.payments
        .filter(p => p.month <= currentMonth && p.status === 'PAGO' && isMonthActive(client, CURRENT_YEAR, p.month))
        .reduce((sum, payment) => sum + (payment.amount || (client.monthly_fee || 0)), 0)

      // Verificar status do cliente
      const isEmAberto = isMonthActive(client, CURRENT_YEAR, currentMonth) &&
        (!client.payments.find(p => p.month === currentMonth) ||
         client.payments.find(p => p.month === currentMonth)?.status === 'EM_ABERTO')

      const isAtrasado = Array.from({ length: currentMonth - 1 }, (_, i) => i + 1)
        .some(month => {
          if (!isMonthActive(client, CURRENT_YEAR, month)) return false
          const payment = client.payments.find(p => p.month === month)
          return !payment || payment.status === 'EM_ABERTO'
        })

      return {
        totalPrevistoAno: acc.totalPrevistoAno + previstoAno,
        totalPrevistoAtual: acc.totalPrevistoAtual + previstoAtual,
        totalRecebido: acc.totalRecebido + recebidoTotal,
        previstoMesAtual: acc.previstoMesAtual + previstoMesAtual,
        recebidoMesAtual: acc.recebidoMesAtual + recebidoMesAtual,
        clientesEmAberto: isEmAberto ? [...acc.clientesEmAberto, client.full_name] : acc.clientesEmAberto,
        clientesAtrasados: isAtrasado ? [...acc.clientesAtrasados, client.full_name] : acc.clientesAtrasados
      }
    }, {
      totalPrevistoAno: 0,
      totalPrevistoAtual: 0,
      totalRecebido: 0,
      previstoMesAtual: 0,
      recebidoMesAtual: 0,
      clientesEmAberto: [] as string[],
      clientesAtrasados: [] as string[]
    })

    const percentualAdimplencia = calculations.totalPrevistoAtual > 0
      ? (calculations.totalRecebido / calculations.totalPrevistoAtual) * 100
      : 0

    return {
      totalMensalistas,
      totalPrevisto: calculations.totalPrevistoAno,
      totalRecebido: calculations.totalRecebido,
      percentualAdimplencia,
      clientesEmAberto: calculations.clientesEmAberto,
      clientesAtrasados: calculations.clientesAtrasados,
      previstoMesAtual: calculations.previstoMesAtual,
      recebidoMesAtual: calculations.recebidoMesAtual
    }
  }, [mensalistas])

  // Atualizar o summary quando o cálculo memoizado mudar
  useEffect(() => {
    setSummary(calculatedSummary)
  }, [calculatedSummary])

  const loadMensalistas = async () => {
    try {
      setLoading(true)
      
      // Buscar clientes mensalistas com pagamentos aninhados em uma única consulta
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          payments(*)
        `)
        .eq('is_recurring', true)
        .order('full_name')

      if (clientsError) throw clientsError

      // Filtrar pagamentos do ano atual em JavaScript para garantir precisão
      const mensalistasWithPayments = clients.map(client => {
        const clientPayments = client.payments.filter((p: any) => p.year === CURRENT_YEAR)
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

      console.log(`🔄 Toggle payment: ${clientId}-${month} from ${currentStatus} to ${newStatus}`)

      // Marcar como atualizando
      setUpdatingPayments(prev => new Set(prev).add(paymentKey))

      // Primeiro, atualizar no banco de dados
      const { data: existingPayment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .eq('year', CURRENT_YEAR)
        .eq('month', month)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Erro diferente de "não encontrado"
        console.error('Erro ao buscar pagamento existente:', fetchError)
        return
      }

      let paymentId: string

      if (existingPayment) {
        // Atualizar pagamento existente
        console.log(`📝 Updating existing payment ${existingPayment.id} to ${newStatus}`)
        const { data: updatedPayment, error } = await supabase
          .from('payments')
          .update({ 
            status: newStatus,
            paid_at: newStatus === 'PAGO' ? new Date().toISOString() : null,
            amount: client.monthly_fee,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id)
          .select()
          .single()

        if (error) {
          console.error('❌ Erro ao atualizar pagamento:', error)
          return
        }
        
        paymentId = updatedPayment.id
        console.log(`✅ Payment updated successfully`)
      } else {
        // Criar novo pagamento
        console.log(`➕ Creating new payment for ${clientId}-${month} with status ${newStatus}`)
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
          console.error('❌ Erro ao criar pagamento:', error)
          return
        }

        paymentId = newPaymentData.id
        console.log(`✅ New payment created with ID: ${paymentId}`)
      }

      // Após sucesso no banco, atualizar o estado local
      setMensalistas(prevMensalistas => 
        prevMensalistas.map(c => {
          if (c.id === clientId) {
            const existingPayment = c.payments.find(p => p.month === month)
            
            if (existingPayment) {
              // Atualizar pagamento existente
              const updatedPayments = c.payments.map(p => 
                p.month === month 
                  ? { 
                      ...p, 
                      id: paymentId,
                      status: newStatus, 
                      paid_at: newStatus === 'PAGO' ? new Date().toISOString() : undefined,
                      amount: client.monthly_fee,
                      updated_at: new Date().toISOString()
                    }
                  : p
              )
              return { ...c, payments: updatedPayments }
            } else {
              // Criar novo pagamento
              const newPayment: Payment = {
                id: paymentId,
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

      // Sincronizar notificações em tempo real
      await refreshNotifications()
      
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error)
      // Em caso de erro geral, recarregar os dados
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

  // Função para verificar se um cliente está atrasado no mês atual (apenas a partir do dia 26)
  const isClientAtrasadoCurrentMonth = (client: MensalistaWithPayments): boolean => {
    const currentMonth = new Date().getMonth() + 1
    
    // Só considerar atrasado no mês atual se for dia 26 ou posterior
    if (!isAfterDay26()) {
      return false
    }
    
    if (!isMonthActive(client, CURRENT_YEAR, currentMonth)) {
      return false
    }
    
    const currentMonthPayment = client.payments.find(p => p.month === currentMonth)
    return !currentMonthPayment || currentMonthPayment.status === 'EM_ABERTO'
  }

  // Função combinada para verificar se um cliente está atrasado (meses anteriores + mês atual se for dia 26+)
  const isClientAtrasadoCompleto = (client: MensalistaWithPayments): boolean => {
    return isClientAtrasado(client) || isClientAtrasadoCurrentMonth(client)
  }

  // Memoizar a filtragem para melhor performance
  const filteredMensalistas = useMemo(() => {
    return mensalistas.filter(client => {
      // Filtro por termo de busca
      const matchesSearch = normalizeText(client.full_name).includes(normalizeText(filters.searchTerm))

      // Filtro por status
      let matchesStatus = true
      switch (filters.status) {
        case 'em_aberto':
          matchesStatus = isClientEmAberto(client)
          break
        case 'atrasados':
          matchesStatus = isClientAtrasadoCompleto(client)
          break
        case 'both':
          matchesStatus = isClientEmAberto(client) || isClientAtrasadoCompleto(client)
          break
        case 'adimplente':
          matchesStatus = !isClientEmAberto(client) && !isClientAtrasadoCompleto(client)
          break
        case 'all':
        default:
          matchesStatus = true
          break
      }

      // Filtro por bairro
      const matchesNeighborhood = filters.neighborhoods.length === 0 ||
        (client.neighborhood && filters.neighborhoods.includes(client.neighborhood))

      // Filtro por faixa de valor
      const monthlyFee = client.monthly_fee || 0
      const matchesMinValue = filters.minValue === null || monthlyFee >= filters.minValue
      const matchesMaxValue = filters.maxValue === null || monthlyFee <= filters.maxValue

      return matchesSearch && matchesStatus && matchesNeighborhood && matchesMinValue && matchesMaxValue
    })
  }, [mensalistas, filters])

  // Funções para o modal e ações
  const handleViewDetails = (client: MensalistaWithPayments) => {
    setSelectedClientId(client.id)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClientId(null)
  }

  // Obter cliente atualizado para o modal
  const selectedClient = selectedClientId ? mensalistas.find(c => c.id === selectedClientId) || null : null

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const handleBulkPayment = async (clientIds: string[], month: number) => {
    try {
      // Processar cada cliente individualmente
      for (const clientId of clientIds) {
        const client = mensalistas.find(c => c.id === clientId)
        if (!client) continue

        const currentStatus = getPaymentStatus(client, month)
        
        // Só processar se não estiver inativo e não estiver já pago
        if (currentStatus !== 'INATIVO' && currentStatus !== 'PAGO') {
          await togglePaymentStatus(clientId, month, currentStatus)
        }
      }

      // Limpar seleção após sucesso
      setSelectedClients(new Set())
      
      // Sincronizar notificações
      await refreshNotifications()
    } catch (error) {
      console.error('Erro ao processar pagamentos em massa:', error)
      throw error
    }
  }

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
  }

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
      <RoleProtectedRoute allowedRoles={['admin']}>
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
          {/* Filtros Avançados */}
          <Suspense fallback={
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          }>
            <AdvancedFilters
              mensalistas={mensalistas}
              onFiltersChange={handleFiltersChange}
              isClientEmAberto={isClientEmAberto}
              isClientAtrasado={isClientAtrasadoCompleto}
            />
          </Suspense>

          {/* Ações em Massa */}
          <Suspense fallback={
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          }>
            <BulkPaymentActions
              mensalistas={filteredMensalistas}
              onBulkPayment={handleBulkPayment}
              isClientEmAberto={isClientEmAberto}
              isClientAtrasado={isClientAtrasadoCompleto}
              getPaymentStatus={getPaymentStatus}
              currentYear={CURRENT_YEAR}
              loading={loading}
            />
          </Suspense>

          {/* Tabela de Mensalistas */}
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
              <Suspense fallback={
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }>
                <MensalistasTable
                  mensalistas={filteredMensalistas}
                  onViewDetails={handleViewDetails}
                  isClientEmAberto={isClientEmAberto}
                  isClientAtrasado={isClientAtrasadoCompleto}
                  getPaymentStatus={getPaymentStatus}
                  currentYear={CURRENT_YEAR}
                  selectedClients={selectedClients}
                  onSelectClient={handleSelectClient}
                  showSelection={true}
                />
              </Suspense>
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

      {/* Modal de Detalhes */}
      <Suspense fallback={null}>
        <MensalistaDetailsModal
          client={selectedClient}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onTogglePayment={togglePaymentStatus}
          updatingPayments={updatingPayments}
          currentYear={CURRENT_YEAR}
          isClientEmAberto={isClientEmAberto}
          isClientAtrasado={isClientAtrasado}
        />
      </Suspense>
        </div>
      </RoleProtectedRoute>
    </ProtectedRoute>
  )
}
