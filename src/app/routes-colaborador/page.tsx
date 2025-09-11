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
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const {
    assignments,
    isLoading,
    loadDayState,
    currentTeam,
    changeTeam,
  } = useRoutes()

  // Carregar estado quando o dia selecionado ou equipe mudar
  useEffect(() => {
    console.log('🔄 RoutesColaboradorPage useEffect executado:', { selectedDay, currentTeam, isInitialLoad })
    loadDayState(selectedDay, currentTeam)
    
    // Marcar que o carregamento inicial foi feito
    if (isInitialLoad) {
      setIsInitialLoad(false)
    }
  }, [selectedDay, currentTeam, loadDayState, isInitialLoad])

  // Carregamento inicial forçado quando o componente monta
  useEffect(() => {
    console.log('🚀 RoutesColaboradorPage - Carregamento inicial forçado')
    const initialLoad = async () => {
      try {
        await loadDayState(selectedDay, currentTeam)
      } catch (error) {
        console.error('Erro no carregamento inicial:', error)
      }
    }
    
    initialLoad()
  }, [loadDayState, selectedDay, currentTeam]) // Incluir dependências necessárias

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
