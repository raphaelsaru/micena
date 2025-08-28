'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboard } from '@/hooks/useDashboard'
import { KPICards } from './KPICards'
import { ReceitaMensalChart } from './ReceitaMensalChart'
import { NovosClientesChart } from './NovosClientesChart'
import { ProximosServicosList } from './ProximosServicosList'
import { DashboardLoading } from './DashboardLoading'

export function Dashboard() {
  const {
    kpis,
    receitaMensal,
    novosClientesMes,
    proximosServicos,
    isLoading,
    error,
    refreshDashboard
  } = useDashboard()

  if (isLoading) {
    return <DashboardLoading />
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erro ao carregar dashboard
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={refreshDashboard} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">
            Nenhum dado disponível
          </h1>
          <p className="text-gray-500 mb-6">
            Não foi possível carregar os dados do dashboard
          </p>
          <Button onClick={refreshDashboard} variant="outline">
            Recarregar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-mobile mobile-py">
      {/* Header */}
      <div className="mobile-header mb-6 sm:mb-8">
        <div>
          <h1 className="mobile-header-title mb-2">
            Visão Geral das Operações
          </h1>
          <p className="text-gray-600 mobile-text-base">
            Dashboard com métricas e insights das operações da Micena Piscinas
          </p>
        </div>
        <Button 
          onClick={refreshDashboard} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 mobile-button-sm"
        >
          <RefreshCw className="h-5 w-5" />
          <span className="mobile-hidden">Atualizar</span>
        </Button>
      </div>

      {/* KPIs */}
      <KPICards kpis={kpis} />

      {/* Gráficos */}
      <div className="mobile-grid-3 mb-6 sm:mb-8">
        <ReceitaMensalChart data={receitaMensal} />
        <ProximosServicosList servicos={proximosServicos} />
        <NovosClientesChart data={novosClientesMes} />
      </div>
    </div>
  )
}
