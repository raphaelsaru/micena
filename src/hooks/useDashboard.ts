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
import { withAuthRetry } from '@/lib/with-auth-retry'
import { useAuth } from '@/contexts/AuthContext'

export function useDashboard() {
  const { user, loading: authLoading } = useAuth()
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
        withAuthRetry(() => getDashboardKPIs()),
        withAuthRetry(() => getReceitaMensal()),
        withAuthRetry(() => getDistribuicaoServicos()),
        withAuthRetry(() => getNovosClientesMes()),
        withAuthRetry(() => getProximosServicos())
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
    // Espera o AuthContext terminar de sincronizar o cookie de sessão antes
    // de disparar as Server Actions, senão elas veem "Não autenticado".
    if (authLoading) return
    if (!user) {
      setIsLoading(false)
      return
    }
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id])

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
