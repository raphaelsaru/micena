import { useState, useMemo } from 'react'
import { RouteAssignment, DayOfWeek, DAY_LABELS } from '@/types/database'
import { RouteClientCard } from './RouteClientCard'
import { Calendar, Users, ArrowUp, ArrowDown, Save } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface RouteTabProps {
  dayOfWeek: DayOfWeek
  assignments: RouteAssignment[]
  isLoading: boolean
  onRemoveClient: (clientId: string) => Promise<void>
  onMoveClient: (clientId: string, dayOfWeek: DayOfWeek, newPosition: number) => Promise<void>
  onSavePositions?: () => Promise<void>
  hasPendingChanges?: boolean
  pendingChangesCount?: number
}

type SortOption = 'position-asc' | 'position-desc'

export function RouteTab({ 
  dayOfWeek, 
  assignments, 
  isLoading, 
  onRemoveClient, 
  onMoveClient,
  onSavePositions,
  hasPendingChanges = false,
  pendingChangesCount = 0
}: RouteTabProps) {
  const [sortOption, setSortOption] = useState<SortOption>('position-asc')
  const [isOperationInProgress, setIsOperationInProgress] = useState(false)

  // Aplicar ordenação
  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
      if (sortOption === 'position-asc') {
        return a.order_index - b.order_index
      } else {
        return b.order_index - a.order_index
      }
    })
  }, [assignments, sortOption])

  const handleRemoveClient = async (clientId: string) => {
    try {
      setIsOperationInProgress(true)
      await onRemoveClient(clientId)
    } catch (err) {
      console.error('Erro ao remover cliente:', err)
    } finally {
      setIsOperationInProgress(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando rotas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com informações e controles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                {DAY_LABELS[dayOfWeek]}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {assignments.length} cliente(s)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Controle de ordenação */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                Ordenar por:
              </Label>
              <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                <SelectTrigger id="sort-select" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="position-asc">
                    <div className="flex items-center space-x-2">
                      <ArrowUp className="w-4 h-4" />
                      <span>Crescente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="position-desc">
                    <div className="flex items-center space-x-2">
                      <ArrowDown className="w-4 h-4" />
                      <span>Decrescente</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão Salvar Posições */}
            {hasPendingChanges && onSavePositions && (
              <Button
                onClick={onSavePositions}
                disabled={isOperationInProgress}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Posições ({pendingChangesCount})
              </Button>
            )}
          </div>
        </div>

        {/* Informação sobre como usar */}
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg inline-block">
          <div className="text-xs text-blue-700">
            <span className="font-medium">💡 Como funciona:</span> 
            Use as setas ↑↓ para mover clientes para cima ou para baixo na fila. 
            As mudanças são apenas visuais até você clicar em &quot;Salvar posições&quot;.
          </div>
        </div>
      </div>

      {/* Lista de clientes ordenada */}
      <div className="space-y-3">
        {sortedAssignments.map((assignment, index) => (
          <RouteClientCard
            key={assignment.client_id}
            assignment={assignment}
            dayOfWeek={dayOfWeek}
            onRemove={() => handleRemoveClient(assignment.client_id)}
            onMove={onMoveClient}
            isFirst={index === 0}
            isLast={index === sortedAssignments.length - 1}
          />
        ))}
      </div>

      {/* Estado vazio */}
      {assignments.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum cliente na rota
          </h3>
          <p className="text-gray-600">
            Adicione clientes para começar a organizar a rota de {DAY_LABELS[dayOfWeek].toLowerCase()}
          </p>
        </div>
      )}
    </div>
  )
}
