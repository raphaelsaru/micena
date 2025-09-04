'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { RouteAssignment } from '@/types/database'
import { formatRouteNumber } from '@/lib/utils'
import { KeyRound, Edit, Trash2, GripVertical } from 'lucide-react'
import { MaterialSymbolsVacuum, FluentEmojiHighContrastSponge } from '@/components/ui/icons'

interface MobileClientCardProps {
  assignment: RouteAssignment
  isSelected: boolean
  onSelectionChange: (clientId: string) => void
  onEdit: () => void
  onRemove: () => void
  currentSortOrder: 'asc' | 'desc'
  isSelectionMode: boolean
}

export function MobileClientCard({
  assignment,
  isSelected,
  onSelectionChange,
  onEdit,
  onRemove,
  currentSortOrder,
  isSelectionMode
}: MobileClientCardProps) {
  // Calcular posição visual baseada na ordenação atual
  const visualPosition = currentSortOrder === 'asc' ? assignment.order_index : assignment.order_index

  const handleCheckboxChange = (checked: boolean) => {
    onSelectionChange(assignment.client_id)
  }

  return (
    <div className="group bg-white border rounded-lg p-3 shadow-sm w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Checkbox para seleção (apenas em modo seleção) */}
          {isSelectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 checkbox-mobile flex-shrink-0 w-4 h-4"
            />
          )}

          {/* Ícone de grip (apenas visual) - TAMANHO FIXO */}
          <div className="text-gray-400 flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Posição do cliente - TAMANHO FIXO */}
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full w-8 h-6 text-center flex-shrink-0 flex items-center justify-center">
            {formatRouteNumber(visualPosition)}
          </div>
          
          {/* Nome do cliente */}
          <div className="flex flex-col space-y-1 flex-1 min-w-0 overflow-hidden">
            {/* Nome do cliente com truncate adequado */}
            <div className="min-w-0">
              <span className="font-semibold text-gray-900 text-sm block truncate">
                {assignment.full_name || 'Cliente não encontrado'}
              </span>
            </div>
            
            {/* Bairro e ícones de serviço - OCULTOS NA VERSÃO MOBILE */}
            <div className="hidden md:flex items-center justify-between min-w-0">
              {assignment.neighborhood && (
                <span className="text-xs text-gray-500 truncate flex-1 min-w-0 mr-2">
                  {assignment.neighborhood}
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
        </div>

        {/* Botões de ação (apenas quando não em modo seleção) - TAMANHOS FIXOS */}
        {!isSelectionMode && (
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Botão de editar */}
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-8 w-8 flex-shrink-0 flex items-center justify-center"
              title="Editar configurações de serviço"
            >
              <Edit className="w-4 h-4" />
            </Button>

            {/* Botão de remover */}
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8 flex-shrink-0 flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
