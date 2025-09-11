'use client'

import { RouteAssignment } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Eye, KeyRound } from 'lucide-react'
import { MaterialSymbolsVacuum, FluentEmojiHighContrastSponge } from '@/components/ui/icons'
import { formatRouteNumber } from '@/lib/utils'

interface RouteClientCardColaboradorProps {
  assignment: RouteAssignment
  onView: () => void
  currentSortOrder: 'asc' | 'desc'
}

export function RouteClientCardColaborador({
  assignment,
  onView,
  currentSortOrder
}: RouteClientCardColaboradorProps) {
  // Calcular posição visual baseada na ordenação atual
  const visualPosition = currentSortOrder === 'asc' ? assignment.order_index : assignment.order_index
  return (
    <div className="group bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between w-full min-w-0">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Posição do cliente - TAMANHO FIXO */}
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full w-8 h-6 text-center flex-shrink-0 flex items-center justify-center">
            {formatRouteNumber(visualPosition)}
          </div>
          
          {/* Nome do cliente com bairro e ícones na mesma linha */}
          <div className="flex items-center space-x-2 flex-1 min-w-0 overflow-hidden">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {assignment.full_name || 'Cliente não encontrado'}
            </span>
            
            {/* Bairro */}
            {assignment.neighborhood && (
              <span className="text-gray-500 text-sm">
                - {assignment.neighborhood}
              </span>
            )}
            
            {/* Ícones de serviço - TAMANHOS FIXOS */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {assignment.has_key && (
                <KeyRound className="w-3 h-3 text-yellow-600 flex-shrink-0" />
              )}
              {assignment.service_type && (
                <div className="flex items-center space-x-0.5 flex-shrink-0">
                  {assignment.service_type === 'ASPIRAR' ? (
                    <MaterialSymbolsVacuum className="w-3 h-3 text-blue-600 flex-shrink-0" />
                  ) : (
                    <FluentEmojiHighContrastSponge className="w-3 h-3 text-green-600 flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium text-gray-600 flex-shrink-0 w-3 h-3 flex items-center justify-center">
                    {assignment.service_type === 'ASPIRAR' ? 'A' : 'E'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botão de visualizar */}
        <Button
          onClick={onView}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-8 w-8"
          title="Ver detalhes do cliente"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
