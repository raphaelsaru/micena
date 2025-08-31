'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFinancial } from '@/hooks/useFinancial'
import { PaymentStatus, PaymentMethod } from '@/types/database'
import { 
  Users, 
  Clock, 
  Eye, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function FinanceiroPage() {
  const { 
    summary, 
    mensalistas, 
    servicePayments, 
    loading, 
    error,
    filterMensalistasByStatus,
    fetchDataByPeriod
  } = useFinancial()

  const [mensalistasFilter, setMensalistasFilter] = useState<PaymentStatus | 'TODOS'>('TODOS')
  const [revenueFilter, setRevenueFilter] = useState<'TODOS' | 'OS' | 'MENSALISTAS'>('TODOS')
  
  // Estados para filtro de data
  const [dateFilter, setDateFilter] = useState<'HOJE' | 'MES_ATUAL' | 'PERIODO_PERSONALIZADO' | 'TODOS'>('TODOS')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [filteredData, setFilteredData] = useState<{
    summary: {
      monthlyRevenue: number
      pendingRevenue: number
      activeSubscribers: number
      totalRevenue: number
      osRevenue: number
      mensalistasRevenue: number
      osMonthlyRevenue: number
    }
    mensalistas: any[]
    servicePayments: any[]
  } | null>(null)
  const [isApplyingFilter, setIsApplyingFilter] = useState(false)

  const filteredMensalistas = filterMensalistasByStatus(mensalistasFilter)

  // Função para aplicar filtro de data
  const applyDateFilter = async () => {
    if (dateFilter === 'PERIODO_PERSONALIZADO' && (!startDate || !endDate)) {
      return
    }

    setIsApplyingFilter(true)
    try {
      let start: Date, end: Date

      switch (dateFilter) {
        case 'HOJE':
          const today = new Date()
          start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          break
        case 'MES_ATUAL':
          const now = new Date()
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          break
        case 'PERIODO_PERSONALIZADO':
          start = new Date(startDate)
          end = new Date(endDate)
          end.setDate(end.getDate() + 1) // Incluir o dia final
          break
        case 'TODOS':
          // Para "Todo o Período", não aplicar filtro de data
          setFilteredData(null)
          setIsApplyingFilter(false)
          return
      }

      const periodData = await fetchDataByPeriod(start, end)
      
      // DEBUG: Log dos dados buscados
      console.log('🔍 DEBUG - Dados do período:', {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        servicesCount: periodData.services.length,
        paymentsCount: periodData.payments.length,
        servicesTotal: periodData.services.reduce((sum: any, s: any) => sum + (s.total_amount || 0), 0),
        paymentsTotal: periodData.payments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0),
        payments: periodData.payments.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          client_id: p.client_id,
          year: p.year,
          month: p.month,
          status: p.status
        }))
      })
      
      // Calcular resumo do período
      const periodSummary = {
        monthlyRevenue: periodData.payments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0),
        pendingRevenue: 0, // Não aplicável para período específico
        activeSubscribers: summary.activeSubscribers, // Manter total
        totalRevenue: periodData.services.reduce((sum: any, s: any) => sum + (s.total_amount || 0), 0) + 
                     periodData.payments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0),
        osRevenue: periodData.services.reduce((sum: any, s: any) => sum + (s.total_amount || 0), 0),
        mensalistasRevenue: periodData.payments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0),
        osMonthlyRevenue: periodData.services.reduce((sum: any, s: any) => sum + (s.total_amount || 0), 0)
      }

      // DEBUG: Log do resumo calculado
      console.log('📊 DEBUG - Resumo calculado:', periodSummary)

      setFilteredData({
        summary: periodSummary,
        mensalistas: mensalistas.filter(m => {
          // Filtrar mensalistas que tiveram pagamentos no período
          return periodData.payments.some((p: any) => p.client_id === m.client.id)
        }),
        servicePayments: periodData.services.map((s: any) => ({
          service: s,
          clientName: s.clients?.full_name || 'Cliente não encontrado',
          totalAmount: s.total_amount || 0,
          paymentMethod: s.payment_method
        }))
      })
    } catch (err) {
      console.error('Erro ao aplicar filtro de data:', err)
    } finally {
      setIsApplyingFilter(false)
    }
  }

  // Função para limpar filtro de data
  const clearDateFilter = () => {
    setDateFilter('TODOS')
    setStartDate('')
    setEndDate('')
    setFilteredData(null)
  }

  // Usar dados filtrados ou originais
  const currentSummary = filteredData?.summary || summary
  const currentMensalistas = filteredData?.mensalistas || mensalistas
  const currentServicePayments = filteredData?.servicePayments || servicePayments

  // Função para calcular receita baseada no filtro
  const getFilteredRevenue = () => {
    switch (revenueFilter) {
      case 'OS':
        return currentSummary.osRevenue
      case 'MENSALISTAS':
        return currentSummary.mensalistasRevenue
      default:
        return currentSummary.totalRevenue
    }
  }

  // Função para calcular receita pendente baseada no filtro
  const getFilteredPendingRevenue = () => {
    switch (revenueFilter) {
      case 'OS':
        return 0 // OS não têm receita pendente, são pagas à vista
      case 'MENSALISTAS':
        return currentSummary.pendingRevenue
      default:
        return currentSummary.pendingRevenue
      }
  }

  // Função para calcular receita mensal baseada no filtro
  const getFilteredMonthlyRevenue = () => {
    switch (revenueFilter) {
      case 'OS':
        return currentSummary.osMonthlyRevenue
      case 'MENSALISTAS':
        return currentSummary.monthlyRevenue
      default:
        return currentSummary.monthlyRevenue + currentSummary.osMonthlyRevenue
    }
  }



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: PaymentStatus) => {
    return status === 'PAGO' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Pago
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertCircle className="w-3 h-3 mr-1" />
        Em Aberto
      </Badge>
    )
  }

  const getPaymentMethodLabel = (method?: PaymentMethod) => {
    if (!method) return 'Não informado'
    
    const labels: Record<PaymentMethod, string> = {
      PIX: 'PIX',
      TRANSFERENCIA: 'Transferência',
      DINHEIRO: 'Dinheiro',
      CARTAO: 'Cartão',
      BOLETO: 'Boleto'
    }
    
    return labels[method]
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar dados</h2>
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="container-mobile mobile-py">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="mobile-header-title">Financeiro</h1>
          {filteredData && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              <Filter className="w-3 h-3 mr-1" />
              Filtro Ativo
            </Badge>
          )}
        </div>
        <p className="text-gray-600 mobile-text-base">Gestão financeira e relatórios do sistema</p>
      </div>

      {/* Filtro de Data - NOVO */}
      <div className="mb-6">
        <div className="mobile-header">
          <h3 className="mobile-text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtro de Período
          </h3>
          <div className="mobile-header-actions">
            <Select value={dateFilter} onValueChange={(value: 'HOJE' | 'MES_ATUAL' | 'PERIODO_PERSONALIZADO' | 'TODOS') => setDateFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todo o Período</SelectItem>
                <SelectItem value="HOJE">Hoje</SelectItem>
                <SelectItem value="MES_ATUAL">Mês Atual</SelectItem>
                <SelectItem value="PERIODO_PERSONALIZADO">Período Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === 'PERIODO_PERSONALIZADO' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40"
                  placeholder="Data inicial"
                />
                <span className="text-gray-500 text-sm">até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40"
                  placeholder="Data final"
                />
              </div>
            )}

            <Button 
              onClick={applyDateFilter} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isApplyingFilter || (dateFilter === 'PERIODO_PERSONALIZADO' && (!startDate || !endDate))}
            >
              <Filter className="w-4 h-4 mr-2" />
              {isApplyingFilter ? 'Aplicando...' : 'Aplicar Filtro'}
            </Button>
            
            {filteredData && (
              <Button variant="outline" onClick={clearDateFilter}>
                Limpar Filtro
              </Button>
            )}
          </div>
        </div>

        {/* Indicador de filtro ativo */}
        {filteredData && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <strong>Filtro ativo:</strong> 
              {dateFilter === 'TODOS' && ' Dados de todo o período'}
              {dateFilter === 'HOJE' && ' Dados de hoje'}
              {dateFilter === 'MES_ATUAL' && ' Dados do mês atual'}
              {dateFilter === 'PERIODO_PERSONALIZADO' && ` Dados de ${startDate} até ${endDate}`}
            </p>
          </div>
        )}
      </div>

      {/* Filtro de Receita */}
      <div className="mb-6">
        <div className="mobile-header-actions">
          <label className="mobile-text-sm font-medium text-gray-700">Filtrar por tipo de receita:</label>
          <Select value={revenueFilter} onValueChange={(value: 'TODOS' | 'OS' | 'MENSALISTAS') => setRevenueFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas as Receitas</SelectItem>
              <SelectItem value="OS">Apenas OS</SelectItem>
              <SelectItem value="MENSALISTAS">Apenas Mensalistas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Debug: Mostrar valores calculados - RESPETANDO FILTRO DE DATA */}
        <div className="mt-2 mobile-text-sm text-gray-500 flex flex-wrap gap-2">
          <span>OS Total: {formatCurrency(filteredData ? currentSummary.osRevenue : summary.osRevenue)}</span>
          <span>OS Mês: {formatCurrency(filteredData ? currentSummary.osMonthlyRevenue : summary.osMonthlyRevenue)}</span>
          <span>Mensalistas: {formatCurrency(filteredData ? currentSummary.mensalistasRevenue : summary.mensalistasRevenue)}</span>
          <span>Total: {formatCurrency(filteredData ? currentSummary.totalRevenue : summary.totalRevenue)}</span>
          {filteredData && (
            <span className="text-blue-600 font-medium">
              📅 Filtro de data ativo
            </span>
          )}
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="mobile-grid-4 mb-6 sm:mb-8">
        <Card className={filteredData ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Receita Total
              {filteredData && <Filter className="w-3 h-3 text-blue-600" />}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(getFilteredRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueFilter === 'OS' ? 'Receita de OS' : 
               revenueFilter === 'MENSALISTAS' ? 'Receita de Mensalistas' : 
               'Receita total (OS + Mensalistas)'}
              {filteredData && ' - Período filtrado'}
            </p>
          </CardContent>
        </Card>

        <Card className={filteredData ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Receita do Mês
              {filteredData && <Filter className="w-3 h-3 text-blue-600" />}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(getFilteredMonthlyRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueFilter === 'OS' ? 'OS realizadas este mês' : 
               revenueFilter === 'MENSALISTAS' ? 'Mensalidades recebidas este mês' : 
               'Receita total do mês (mensalidades + OS)'}
              {filteredData && ' - Período filtrado'}
            </p>
          </CardContent>
        </Card>

        <Card className={filteredData ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Receita Pendente
              {filteredData && <Filter className="w-3 h-3 text-blue-600" />}
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(getFilteredPendingRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueFilter === 'MENSALISTAS' ? 'Mensalidades em aberto' : 
               'Pagamentos em aberto'}
              {filteredData && ' - Período filtrado'}
            </p>
          </CardContent>
        </Card>

        <Card className={filteredData ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Mensalistas Ativos
              {filteredData && <Filter className="w-3 h-3 text-blue-600" />}
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.activeSubscribers}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes com mensalidade ativa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="mensalistas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mensalistas" className="flex items-center gap-2">
            Mensalistas
            {filteredData && <Filter className="w-3 h-3 text-blue-600" />}
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="flex items-center gap-2">
            Pagamentos Avulsos
            {filteredData && <Filter className="w-3 h-3 text-blue-600" />}
          </TabsTrigger>
        </TabsList>

        {/* Tab Mensalistas */}
        <TabsContent value="mensalistas" className="mobile-space-y">
          <div className="mobile-header">
            <h2 className="mobile-text-xl font-semibold">Mensalistas</h2>
            <Select value={mensalistasFilter} onValueChange={(value: PaymentStatus | 'TODOS') => setMensalistasFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PAGO">Pagos</SelectItem>
                <SelectItem value="EM_ABERTO">Em Aberto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="mobile-table-container">
                <Table className="mobile-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="mobile-text-sm">Cliente</TableHead>
                      <TableHead className="mobile-text-sm">Valor da Mensalidade</TableHead>
                      <TableHead className="mobile-text-sm">Status Geral</TableHead>
                      <TableHead className="mobile-text-sm">Último Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredData ? currentMensalistas : filteredMensalistas).map((mensalista) => (
                      <TableRow key={mensalista.client.id}>
                        <TableCell className="font-medium mobile-text-sm">
                          {mensalista.client.full_name}
                        </TableCell>
                        <TableCell className="mobile-text-sm">
                          {formatCurrency(mensalista.monthlyFee)}
                        </TableCell>
                        <TableCell className="mobile-text-sm">
                          {getStatusBadge(mensalista.status)}
                        </TableCell>
                        <TableCell className="mobile-text-sm">
                          {mensalista.lastPayment ? (
                            formatDate(mensalista.lastPayment.paid_at || mensalista.lastPayment.created_at)
                          ) : (
                            <span className="text-gray-400">Nunca</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pagamentos Avulsos */}
        <TabsContent value="pagamentos" className="mobile-space-y">
          <h2 className="mobile-text-xl font-semibold">Pagamentos Avulsos (OS)</h2>
          
          <Card>
            <CardContent className="p-0">
              <div className="mobile-table-container">
                <Table className="mobile-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="mobile-text-sm">Nº OS</TableHead>
                      <TableHead className="mobile-text-sm">Cliente</TableHead>
                      <TableHead className="mobile-text-sm">Serviço</TableHead>
                      <TableHead className="mobile-text-sm">Data</TableHead>
                      <TableHead className="mobile-text-sm">Valor</TableHead>
                      <TableHead className="mobile-text-sm">Método de Pagamento</TableHead>
                      <TableHead className="mobile-text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentServicePayments.map((payment) => (
                      <TableRow key={payment.service.id}>
                        <TableCell className="font-medium mobile-text-sm">
                          {payment.service.work_order_number || 'N/A'}
                        </TableCell>
                        <TableCell className="mobile-text-sm">{payment.clientName}</TableCell>
                        <TableCell className="mobile-text-sm">
                          {payment.service.service_type || 'Serviço Geral'}
                        </TableCell>
                        <TableCell className="mobile-text-sm">
                          {formatDate(payment.service.service_date)}
                        </TableCell>
                        <TableCell className="font-medium mobile-text-sm">
                          {formatCurrency(payment.totalAmount)}
                        </TableCell>
                        <TableCell className="mobile-text-sm">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/services/${payment.service.id}`}>
                            <Button variant="outline" size="sm" className="min-h-[40px]">
                              <Eye className="w-4 h-4 mr-1" />
                              <span className="mobile-text-sm">Ver OS</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  </ProtectedRoute>
  )
}
