'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RouteTab } from './RouteTab'
import { AddClientToRouteWithPositionDialog } from './AddClientToRouteWithPositionDialog'
import { EditRouteClientDialog } from './EditRouteClientDialog'
import { TeamSelector } from './TeamSelector'
import { useRoutes } from '@/hooks/useRoutes'
import { DayOfWeek, DAY_LABELS, DAY_SHORT_LABELS, RouteAssignment } from '@/types/database'
import { Plus } from 'lucide-react'

export default function RoutesPage() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(1)
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false)
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<RouteAssignment | null>(null)

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
    changeTeam,
    updateClientAttributes
  } = useRoutes()

  // Carregar estado quando o dia selecionado ou equipe mudar
  useEffect(() => {
    console.log('🔄 RoutesPage useEffect executado:', { selectedDay, currentTeam })
    loadDayState(selectedDay, currentTeam)
  }, [selectedDay, currentTeam, loadDayState])

  const handleAddClient = async (
    clientIds: string[], 
    position: 'start' | 'end' | 'between' = 'end',
    betweenClientId?: string,
    hasKey?: boolean,
    serviceType?: 'ASPIRAR' | 'ESFREGAR'
  ) => {
    try {
      addClientToRoute(clientIds, position, betweenClientId, hasKey, serviceType)
      setAddClientDialogOpen(false)
    } catch (err) {
      console.error('Erro ao adicionar cliente:', err)
    }
  }

  const handleRemoveClient = async (clientId: string) => {
    try {
      await removeClientFromRoute(clientId)
    } catch (err) {
      console.error('Erro ao remover cliente:', err)
      // Erro já tratado no hook
    }
  }

  const handleEditClient = (clientId: string) => {
    const assignment = assignments.find(a => a.client_id === clientId)
    if (assignment) {
      setClientToEdit(assignment)
      setEditClientDialogOpen(true)
    }
  }

  const handleSaveEdit = async (clientId: string, hasKey: boolean, serviceType: 'ASPIRAR' | 'ESFREGAR') => {
    try {
      console.log('Salvando alterações:', { clientId, hasKey, serviceType })
      
      // Atualizar no banco e no estado local
      const success = await updateClientAttributes(clientId, hasKey, serviceType)
      
      if (success) {
        // Fechar o diálogo apenas se a operação foi bem-sucedida
        setEditClientDialogOpen(false)
        setClientToEdit(null)
      }
      // Se não foi bem-sucedido, o diálogo permanece aberto e o erro já foi tratado no hook
    } catch (err) {
      console.error('Erro ao salvar edição:', err)
      // Erro já tratado no hook
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
    <div className="container-mobile mobile-py">
      <div className="mobile-header mb-6">
        <div>
          <h1 className="mobile-header-title print:hidden">Sistema de Rotas</h1>
          <p className="text-gray-600 mobile-text-base print:hidden">
            Gerencie as rotas de clientes para cada dia da semana e equipe
          </p>
        </div>
      </div>

      {/* Seletor de Equipes */}
      <div className="mb-6 print:hidden">
        <TeamSelector 
          currentTeam={currentTeam} 
          onTeamChange={changeTeam} 
        />
      </div>

      {/* Tabs dos dias da semana */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 p-1 rounded-lg print:hidden overflow-x-auto">
        {Object.entries(DAY_LABELS).map(([day, label]) => (
          <button
            key={day}
            onClick={() => setSelectedDay(Number(day) as DayOfWeek)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
      <div className="mobile-header mb-6">
        <div>
          <h2 className="mobile-text-xl font-semibold text-gray-900 print:hidden">
            {DAY_LABELS[selectedDay]} - Equipe {currentTeam}
          </h2>
          <p className="mobile-text-sm text-gray-600 print:hidden">
            {assignments.length} cliente(s) na rota.
          </p>
        </div>
        
        <div className="mobile-header-actions">
          <Button
            onClick={() => setAddClientDialogOpen(true)}
            className="mobile-button-sm print:hidden"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="mobile-text-sm">Adicionar Cliente</span>
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
        onEditClient={handleEditClient}
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

      {/* Dialog para editar cliente */}
      <EditRouteClientDialog
        open={editClientDialogOpen}
        onOpenChange={setEditClientDialogOpen}
        assignment={clientToEdit}
        onSave={handleSaveEdit}
        isLoading={isLoading}
      />
    </div>
  )
}
