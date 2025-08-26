'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, AlertTriangle, TrendingUp } from 'lucide-react'
import { DashboardKPIs } from '@/lib/dashboard'

interface KPICardsProps {
  kpis: DashboardKPIs
}

export function KPICards({ kpis }: KPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const kpiData = [
    {
      title: 'Total de Clientes Ativos',
      value: kpis.totalClientesAtivos,
      subtitle: `${kpis.totalMensalistas} mensalistas • ${kpis.totalAvulsos} avulsos`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Serviços Agendados para Hoje',
      value: kpis.servicosAgendadosHoje,
      subtitle: 'Agendamentos do dia',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pagamentos Pendentes',
      value: kpis.pagamentosPendentesMes.quantidade,
      subtitle: formatCurrency(kpis.pagamentosPendentesMes.valorTotal),
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Receita Recebida no Mês',
      value: formatCurrency(kpis.receitaRecebidaMes),
      subtitle: 'Total de pagamentos PAGO',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiData.map((kpi, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {kpi.value}
            </div>
            <p className="text-xs text-gray-500">
              {kpi.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
