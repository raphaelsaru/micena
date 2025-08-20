'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RouteTab } from './RouteTab'
import { AddClientToRouteWithPositionDialog } from './AddClientToRouteWithPositionDialog'
import { TeamSelector } from './TeamSelector'
import { useRoutes } from '@/hooks/useRoutes'
import { DayOfWeek, DAY_LABELS, DAY_SHORT_LABELS } from '@/types/database'
import { Plus } from 'lucide-react'

export default function RoutesPage() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(1)
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false)

  const {
    assignments,
    availableClients,
    isLoading,
    loadDayState,
    addClientToRoute,
    removeClientFromRoute,
    reorderClients,
    savePendingChanges,
    currentSortOrder,
    changeSortOrder,
    currentTeam,
    changeTeam
  } = useRoutes()

  // Carregar estado quando o dia selecionado ou equipe mudar
  useEffect(() => {
    loadDayState(selectedDay, currentTeam)
  }, [selectedDay, currentTeam, loadDayState])

  const handleAddClient = async (
    clientIds: string[], 
    position: 'start' | 'end' | 'between' = 'end',
    betweenClientId?: string
  ) => {
    try {
      addClientToRoute(clientIds, position, betweenClientId)
      setAddClientDialogOpen(false)
    } catch (err) {
      console.error('Erro ao adicionar cliente:', err)
    }
  }

  const handleRemoveClient = async (clientId: string) => {
    try {
      removeClientFromRoute(clientId)
    } catch (err) {
      console.error('Erro ao remover cliente:', err)
    }
  }

  const handleSavePositions = async () => {
    try {
      await savePendingChanges()
    } catch (err) {
      console.error('Erro ao salvar posições:', err)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 print:hidden">Sistema de Rotas</h1>
        <p className="text-gray-600 print:hidden">
          Gerencie as rotas de clientes para cada dia da semana e equipe
        </p>
      </div>

      {/* Seletor de Equipes */}
      <div className="mb-6 print:hidden">
        <TeamSelector 
          currentTeam={currentTeam} 
          onTeamChange={changeTeam} 
        />
      </div>

      {/* Tabs dos dias da semana */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg print:hidden">
        {Object.entries(DAY_LABELS).map(([day, label]) => (
          <button
            key={day}
            onClick={() => setSelectedDay(Number(day) as DayOfWeek)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedDay === Number(day)
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="hidden sm:block">{label}</div>
            <div className="sm:hidden">{DAY_SHORT_LABELS[Number(day) as DayOfWeek]}</div>
          </button>
        ))}
      </div>

      {/* Botão para adicionar cliente */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 print:hidden">
            {DAY_LABELS[selectedDay]} - Equipe {currentTeam}
          </h2>
          <p className="text-sm text-gray-600 print:hidden">
            {assignments.length} cliente(s) na rota.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => setAddClientDialogOpen(true)}
            className="flex items-center space-x-2 print:hidden"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Cliente</span>
          </Button>
        </div>
      </div>

      {/* Tab da rota do dia selecionado */}
      <RouteTab
        dayOfWeek={selectedDay}
        currentTeam={currentTeam}
        assignments={assignments}
        isLoading={isLoading}
        onRemoveClient={handleRemoveClient}
        onReorderClients={reorderClients}
        onSavePositions={handleSavePositions}
        currentSortOrder={currentSortOrder}
        onSortOrderChange={changeSortOrder}
      />

      {/* Dialog para adicionar cliente */}
      <AddClientToRouteWithPositionDialog
        open={addClientDialogOpen}
        onOpenChange={setAddClientDialogOpen}
        selectedDay={selectedDay}
        currentTeam={currentTeam}
        onAddClient={handleAddClient}
        availableClients={availableClients}
        currentAssignments={assignments}
        isLoading={isLoading}
      />
    </div>
  )
}
