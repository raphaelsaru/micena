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
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function FinanceiroPage() {
  const { 
    summary, 
    mensalistas, 
    servicePayments, 
    loading, 
    error,
    filterMensalistasByStatus
  } = useFinancial()

  const [mensalistasFilter, setMensalistasFilter] = useState<PaymentStatus | 'TODOS'>('TODOS')
  const [revenueFilter, setRevenueFilter] = useState<'TODOS' | 'OS' | 'MENSALISTAS'>('TODOS')

  const filteredMensalistas = filterMensalistasByStatus(mensalistasFilter)

  // Função para calcular receita baseada no filtro
  const getFilteredRevenue = () => {
    switch (revenueFilter) {
      case 'OS':
        return summary.osRevenue
      case 'MENSALISTAS':
        return summary.mensalistasRevenue
      default:
        return summary.totalRevenue
    }
  }

  // Função para calcular receita pendente baseada no filtro
  const getFilteredPendingRevenue = () => {
    switch (revenueFilter) {
      case 'OS':
        return 0 // OS não têm receita pendente, são pagas à vista
      case 'MENSALISTAS':
        return summary.pendingRevenue
      default:
        return summary.pendingRevenue
    }
  }

  // Função para calcular receita mensal baseada no filtro
  const getFilteredMonthlyRevenue = () => {
    switch (revenueFilter) {
      case 'OS':
        return summary.osMonthlyRevenue // Receita das OS do mês atual
      case 'MENSALISTAS':
        return summary.monthlyRevenue
      default:
        return summary.monthlyRevenue + summary.osMonthlyRevenue // Total mensal (mensalidades + OS)
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financeiro</h1>
        <p className="text-gray-600">Gestão financeira e relatórios do sistema</p>
      </div>

      {/* Filtro de Receita */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por tipo de receita:</label>
          <Select value={revenueFilter} onValueChange={(value: 'TODOS' | 'OS' | 'MENSALISTAS') => setRevenueFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas as Receitas</SelectItem>
              <SelectItem value="OS">Apenas OS</SelectItem>
              <SelectItem value="MENSALISTAS">Apenas Mensalistas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Debug: Mostrar valores calculados */}
        <div className="mt-2 text-xs text-gray-500">
          <span className="mr-4">OS Total: {formatCurrency(summary.osRevenue)}</span>
          <span className="mr-4">OS Mês: {formatCurrency(summary.osMonthlyRevenue)}</span>
          <span className="mr-4">Mensalistas: {formatCurrency(summary.mensalistasRevenue)}</span>
          <span>Total: {formatCurrency(summary.totalRevenue)}</span>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
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
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
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
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Pendente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(getFilteredPendingRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueFilter === 'OS' ? 'OS são pagas à vista' : 
               revenueFilter === 'MENSALISTAS' ? 'Mensalidades em aberto' : 
               'Pagamentos em aberto'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensalistas Ativos</CardTitle>
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
          <TabsTrigger value="mensalistas">Mensalistas</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos Avulsos</TabsTrigger>
        </TabsList>

        {/* Tab Mensalistas */}
        <TabsContent value="mensalistas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mensalistas</h2>
            <Select value={mensalistasFilter} onValueChange={(value: PaymentStatus | 'TODOS') => setMensalistasFilter(value)}>
              <SelectTrigger className="w-48">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor da Mensalidade</TableHead>
                    <TableHead>Status Geral</TableHead>
                    <TableHead>Último Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMensalistas.map((mensalista) => (
                    <TableRow key={mensalista.client.id}>
                      <TableCell className="font-medium">
                        {mensalista.client.full_name}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(mensalista.monthlyFee)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(mensalista.status)}
                      </TableCell>
                      <TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pagamentos Avulsos */}
        <TabsContent value="pagamentos" className="space-y-4">
          <h2 className="text-xl font-semibold">Pagamentos Avulsos (OS)</h2>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº OS</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método de Pagamento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicePayments.map((payment) => (
                    <TableRow key={payment.service.id}>
                      <TableCell className="font-medium">
                        {payment.service.work_order_number || 'N/A'}
                      </TableCell>
                      <TableCell>{payment.clientName}</TableCell>
                      <TableCell>
                        {payment.service.service_type || 'Serviço Geral'}
                      </TableCell>
                      <TableCell>
                        {formatDate(payment.service.service_date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/services/${payment.service.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver OS
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  )
}
