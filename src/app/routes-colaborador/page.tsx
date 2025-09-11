'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RouteTabColaborador } from '@/components/routes/RouteTabColaborador'
import { TeamSelector } from '@/components/routes/TeamSelector'
import { useRoutes } from '@/hooks/useRoutes'
import { DayOfWeek, DAY_LABELS } from '@/types/database'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Plus } from 'lucide-react'

function RoutesColaboradorContent() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(1)
  const [hasLoaded, setHasLoaded] = useState(false)

  const {
    assignments,
    isLoading,
    loadDayState,
    currentTeam,
    changeTeam,
  } = useRoutes()

  // Carregamento inicial quando o componente monta
  useEffect(() => {
    console.log('🚀 RoutesColaboradorPage - Carregamento inicial')
    const initialLoad = async () => {
      try {
        console.log('📊 Carregando dados para:', { selectedDay, currentTeam })
        await loadDayState(selectedDay, currentTeam)
        setHasLoaded(true)
        console.log('✅ Dados carregados com sucesso')
      } catch (error) {
        console.error('❌ Erro no carregamento inicial:', error)
        setHasLoaded(true) // Marcar como carregado mesmo com erro para não ficar em loop
      }
    }
    
    if (!hasLoaded) {
      initialLoad()
    }
  }, [hasLoaded, selectedDay, currentTeam, loadDayState]) // Incluir dependências necessárias

  // Carregar estado quando o dia selecionado ou equipe mudar (após carregamento inicial)
  useEffect(() => {
    if (hasLoaded) {
      console.log('🔄 RoutesColaboradorPage - Mudança de dia/equipe:', { selectedDay, currentTeam })
      loadDayState(selectedDay, currentTeam)
    }
  }, [selectedDay, currentTeam, loadDayState, hasLoaded])

  // Mostrar loading inicial se ainda não carregou
  if (!hasLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Carregando suas rotas...</h3>
          <p className="text-sm text-gray-600">Preparando a visualização das rotas do dia</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Seletores de dia e equipe */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(DAY_LABELS).map(([day, label]) => (
            <Button
              key={day}
              variant={selectedDay === Number(day) ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDay(Number(day) as DayOfWeek)}
              className="mobile-button-sm"
            >
              {label}
            </Button>
          ))}
        </div>
        
        <TeamSelector
          currentTeam={currentTeam}
          onTeamChange={changeTeam}
        />
      </div>

      {/* Botão para adicionar cliente - oculto para colaboradores */}
      <div className="mobile-header mb-6">
        <div>
          <h2 className="mobile-text-xl font-semibold text-gray-900 print:hidden">
            {DAY_LABELS[selectedDay]} - Equipe {currentTeam}
          </h2>
          <p className="mobile-text-sm text-gray-600 print:hidden">
            {assignments.length} cliente(s) na rota.
          </p>
        </div>
        
        {/* Botão de adicionar cliente removido para colaboradores */}
      </div>

      {/* Tab da rota do dia selecionado */}
      <RouteTabColaborador
        dayOfWeek={selectedDay}
        currentTeam={currentTeam}
        assignments={assignments}
        isLoading={isLoading}
      />
    </div>
  )
}

export default function RoutesColaboradorPage() {
  return (
    <ProtectedRoute>
      <RoutesColaboradorContent />
    </ProtectedRoute>
  )
}
