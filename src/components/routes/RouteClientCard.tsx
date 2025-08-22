import { RouteAssignment } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Trash2, ChevronUp, ChevronDown, KeyRound } from 'lucide-react'
import { formatRouteNumber } from '@/lib/utils'
import { MaterialSymbolsVacuum, FluentEmojiHighContrastSponge } from '@/components/ui/icons'

interface RouteClientCardProps {
  assignment: RouteAssignment
  onRemove: () => void
  onMove: (clientId: string, direction: 'up' | 'down') => Promise<void>
  isFirst: boolean
  isLast: boolean
  currentSortOrder: 'asc' | 'desc'
}

export function RouteClientCard({
  assignment,
  onRemove,
  onMove,
  isFirst,
  isLast,
  currentSortOrder
}: RouteClientCardProps) {
  const handleMoveUp = () => {
    if (!isFirst) {
      onMove(assignment.client_id, 'up')
    }
  }

  const handleMoveDown = () => {
    if (!isLast) {
      onMove(assignment.client_id, 'down')
    }
  }

  return (
    <div className="group bg-white border rounded-lg p-3 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Posição do cliente */}
          <div className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
            {formatRouteNumber(assignment.order_index)}
          </div>
          
          {/* Nome do cliente */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 truncate">
              {assignment.full_name || 'Cliente não encontrado'}
              {assignment.neighborhood && (
                <span className="text-gray-500 font-normal"> - {assignment.neighborhood}</span>
              )}
            </span>
            
            {/* Ícones de serviço */}
            <div className="flex items-center space-x-1">
              {assignment.has_key && (
                <KeyRound className="w-4 h-4 text-yellow-600" />
              )}
              {assignment.service_type && (
                <div className="flex items-center space-x-1">
                  {assignment.service_type === 'ASPIRAR' ? (
                    <MaterialSymbolsVacuum className="w-4 h-4 text-blue-600" />
                  ) : (
                    <FluentEmojiHighContrastSponge className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-xs font-medium text-gray-600">
                    {assignment.service_type === 'ASPIRAR' ? 'A' : 'E'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controles de movimento e remoção */}
        <div className="flex items-center space-x-2">
          {/* Setas para mover */}
          <div className="flex flex-col space-y-1">
            <Button
              onClick={handleMoveUp}
              disabled={isFirst}
              variant="ghost"
              size="sm"
              className={`p-1 h-6 w-6 ${
                isFirst 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
              title={`Mover para ${currentSortOrder === 'asc' ? 'cima' : 'baixo'} (visual)`}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleMoveDown}
              disabled={isLast}
              variant="ghost"
              size="sm"
              className={`p-1 h-6 w-6 ${
                isLast 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
              title={`Mover para ${currentSortOrder === 'asc' ? 'baixo' : 'cima'} (visual)`}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Botão de remover */}
          <Button
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
