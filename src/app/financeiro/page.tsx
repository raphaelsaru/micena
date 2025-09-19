'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFinancial } from '@/hooks/useFinancial'
import { PaymentMethod } from '@/types/database'
import { MaterialsManagement } from '@/components/financial/MaterialsManagement'
import { ExpenseForm } from '@/components/financial/ExpenseForm'
import { ExpensesList } from '@/components/financial/ExpensesList'
import { ExpensesSummary } from '@/components/financial/ExpensesSummary'
import { Datepicker } from '@/components/ui/datepicker'
import { 
  Eye, 
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute'

export default function FinanceiroPage() {
  const { 
    summary, 
    mensalistas, 
    servicePayments, 
    loading, 
    error,
    availableYears,
    selectedYear,
    selectedMonth,
    changeYear,
    changeMonth,
    filterMensalistasByStatus,
    fetchDataByPeriod,
    refetchSummary
  } = useFinancial()

  // Estado para trigger de atualização em tempo real
  const [expenseRefreshTrigger, setExpenseRefreshTrigger] = useState(0)

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
      totalExpenses: number
      monthlyExpenses: number
      netProfit: number
      monthlyNetProfit: number
    }
    mensalistas: any[]
    servicePayments: any[]
  } | null>(null)
  const [isApplyingFilter, setIsApplyingFilter] = useState(false)


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
      const osRevenue = periodData.services.reduce((sum: any, s: any) => sum + (s.total_amount || 0), 0)
      const mensalistasRevenue = periodData.payments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0)
      
      const totalRevenue = osRevenue + mensalistasRevenue
      const periodSummary = {
        monthlyRevenue: periodData.payments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0),
        pendingRevenue: 0, // Não aplicável para período específico
        activeSubscribers: summary.activeSubscribers, // Manter total
        totalRevenue,
        osRevenue,
        mensalistasRevenue,
        osMonthlyRevenue: osRevenue,
        totalExpenses: summary.totalExpenses, // Usar valores totais já que não temos despesas por período aqui
        monthlyExpenses: summary.monthlyExpenses,
        netProfit: totalRevenue - summary.totalExpenses,
        monthlyNetProfit: (periodData.payments.reduce((sum: any, p: any) => sum + (p.amount || 0), 0) + osRevenue) - summary.monthlyExpenses
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

  // Função para atualizar resumos quando uma despesa é criada
  const handleExpenseCreated = async () => {
    // Atualizar resumo financeiro
    await refetchSummary()
    
    // Trigger para atualizar resumo de despesas
    setExpenseRefreshTrigger(prev => prev + 1)
  }

  // Usar dados filtrados ou originais
  const currentSummary = filteredData?.summary || summary
  const currentServicePayments = filteredData?.servicePayments || servicePayments

  // Função para calcular receita baseada no filtro
  const getFilteredRevenue = () => {
    // Se um mês específico está selecionado, usar valores mensais
    if (selectedMonth) {
      switch (revenueFilter) {
        case 'OS':
          return currentSummary.osMonthlyRevenue
        case 'MENSALISTAS':
          return currentSummary.monthlyRevenue
        default:
          return currentSummary.monthlyRevenue + currentSummary.osMonthlyRevenue
      }
    }
    
    // Se "Todos os meses" está selecionado, usar valores totais
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
        <div className="mb-2">
          <h1 className="mobile-header-title">Financeiro</h1>
        </div>
        <p className="text-gray-600 mobile-text-base">Gestão financeira e relatórios do sistema</p>
      </div>

      {/* Filtros alinhados à direita */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 mb-6">
        <div className="flex items-center gap-2">
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
          <Datepicker
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={changeYear}
            onMonthChange={changeMonth}
            availableYears={availableYears}
          />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Receita Total */}
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Receita Total</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(getFilteredRevenue())}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {selectedMonth ? 
                  `${revenueFilter === 'OS' ? 'Receita de OS' : 
                    revenueFilter === 'MENSALISTAS' ? 'Receita de Mensalistas' : 
                    'Receita total'} - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` :
                  `${revenueFilter === 'OS' ? 'Receita de OS' : 
                    revenueFilter === 'MENSALISTAS' ? 'Receita de Mensalistas' : 
                    'Receita total'} - ${selectedYear}`
                }
              </p>
            </CardContent>
          </Card>

          {/* Despesas Total */}
          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Despesas Total</CardTitle>
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {formatCurrency(selectedMonth ? currentSummary.monthlyExpenses : currentSummary.totalExpenses)}
              </div>
              <p className="text-xs text-red-600 mt-1">
                {selectedMonth ? 
                  `Despesas - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` :
                  `Total de despesas - ${selectedYear}`
                }
              </p>
            </CardContent>
          </Card>

          {/* Lucro Líquido */}
          <Card className={`border-l-4 ${(selectedMonth ? currentSummary.monthlyNetProfit : currentSummary.netProfit) >= 0 ? 
            'border-l-blue-500 bg-gradient-to-br from-blue-50 to-white' : 
            'border-l-orange-500 bg-gradient-to-br from-orange-50 to-white'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${(selectedMonth ? currentSummary.monthlyNetProfit : currentSummary.netProfit) >= 0 ? 
                'text-blue-800' : 'text-orange-800'}`}>
                Lucro Líquido
              </CardTitle>
              <div className={`p-2 rounded-full ${(selectedMonth ? currentSummary.monthlyNetProfit : currentSummary.netProfit) >= 0 ? 
                'bg-blue-100' : 'bg-orange-100'}`}>
                <DollarSign className={`h-4 w-4 ${(selectedMonth ? currentSummary.monthlyNetProfit : currentSummary.netProfit) >= 0 ? 
                  'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(selectedMonth ? currentSummary.monthlyNetProfit : currentSummary.netProfit) >= 0 ? 
                'text-blue-700' : 'text-orange-700'}`}>
                {formatCurrency(selectedMonth ? currentSummary.monthlyNetProfit : currentSummary.netProfit)}
              </div>
              <p className={`text-xs mt-1 ${(selectedMonth ? currentSummary.monthlyNetProfit : currentSummary.netProfit) >= 0 ? 
                'text-blue-600' : 'text-orange-600'}`}>
                {selectedMonth ? 
                  `Lucro mensal - ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` :
                  `Lucro total - ${selectedYear}`
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="pagamentos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pagamentos">Pagamentos Avulsos</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
        </TabsList>


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

        {/* Tab Despesas */}
        <TabsContent value="despesas" className="mobile-space-y">
          <div className="space-y-6">
            {/* Header com botão de ação principal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="mobile-text-xl font-semibold">Gestão de Despesas</h2>
                <p className="text-gray-600 mobile-text-sm">Controle e acompanhe todas as despesas da empresa</p>
              </div>
              <ExpenseForm onExpenseCreated={handleExpenseCreated} variant="button" />
            </div>

            {/* Lista de despesas */}
            <ExpensesList key={expenseRefreshTrigger} selectedYear={selectedYear} selectedMonth={selectedMonth} />
            
            {/* Resumo de despesas */}
            <ExpensesSummary refreshTrigger={expenseRefreshTrigger} selectedYear={selectedYear} selectedMonth={selectedMonth} />
          </div>
        </TabsContent>

        {/* Tab Materiais */}
        <TabsContent value="materiais" className="mobile-space-y">
          <MaterialsManagement />
        </TabsContent>

      </Tabs>
    </div>
  </ProtectedRoute>
  )
}
