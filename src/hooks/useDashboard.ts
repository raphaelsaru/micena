'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  getDashboardKPIs,
  getReceitaMensal,
  getDistribuicaoServicos,
  getNovosClientesMes,
  getProximosServicos,
  DashboardKPIs,
  ReceitaMensal,
  DistribuicaoServicos,
  NovosClientesMes,
  ProximoServico
} from '@/lib/dashboard'

export function useDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [receitaMensal, setReceitaMensal] = useState<ReceitaMensal[]>([])
  const [distribuicaoServicos, setDistribuicaoServicos] = useState<DistribuicaoServicos[]>([])
  const [novosClientesMes, setNovosClientesMes] = useState<NovosClientesMes[]>([])
  const [proximosServicos, setProximosServicos] = useState<ProximoServico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Carregar todos os dados em paralelo
      const [
        kpisData,
        receitaData,
        distribuicaoData,
        novosClientesData,
        proximosServicosData
      ] = await Promise.all([
        getDashboardKPIs(),
        getReceitaMensal(),
        getDistribuicaoServicos(),
        getNovosClientesMes(),
        getProximosServicos()
      ])

      setKpis(kpisData)
      setReceitaMensal(receitaData)
      setDistribuicaoServicos(distribuicaoData)
      setNovosClientesMes(novosClientesData)
      setProximosServicos(proximosServicosData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshDashboard = () => {
    loadDashboardData()
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return {
    kpis,
    receitaMensal,
    distribuicaoServicos,
    novosClientesMes,
    proximosServicos,
    isLoading,
    error,
    refreshDashboard
  }
}
