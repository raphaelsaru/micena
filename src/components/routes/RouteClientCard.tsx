import { RouteAssignment, DayOfWeek } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'

interface RouteClientCardProps {
  assignment: RouteAssignment
  dayOfWeek: DayOfWeek
  onRemove: () => void
  onMove: (clientId: string, dayOfWeek: DayOfWeek, newPosition: number) => Promise<void>
  isFirst: boolean
  isLast: boolean
}

export function RouteClientCard({
  assignment,
  dayOfWeek,
  onRemove,
  onMove,
  isFirst,
  isLast
}: RouteClientCardProps) {
  const handleMoveUp = () => {
    if (!isFirst) {
      onMove(assignment.client_id, dayOfWeek, assignment.order_index - 1)
    }
  }

  const handleMoveDown = () => {
    if (!isLast) {
      onMove(assignment.client_id, dayOfWeek, assignment.order_index + 1)
    }
  }

  return (
    <div className="group bg-white border rounded-lg p-3 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Posição do cliente */}
          <div className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
            {assignment.order_index}
          </div>
          
          {/* Nome do cliente */}
          <span className="font-semibold text-gray-900 truncate">
            {assignment.full_name || 'Cliente não encontrado'}
          </span>
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
