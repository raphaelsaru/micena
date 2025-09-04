'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash2, KeyRound, Edit } from 'lucide-react'
import { RouteAssignment } from '@/types/database'
import { RemoveClientConfirmationDialog } from './RemoveClientConfirmationDialog'
import { MobileClientCard } from './MobileClientCard'
import { formatRouteNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { MaterialSymbolsVacuum, FluentEmojiHighContrastSponge } from '@/components/ui/icons'

interface SortableClientCardProps {
  assignment: RouteAssignment
  onRemove: () => void
  onEdit: () => void
  currentSortOrder: 'asc' | 'desc'
}

interface DraggableRouteListProps {
  assignments: RouteAssignment[]
  onRemoveClient: (clientId: string) => Promise<void>
  onEditClient: (clientId: string) => void
  onReorderClients: (newOrder: RouteAssignment[]) => void
  currentSortOrder: 'asc' | 'desc'
  isSelectionMode?: boolean
  onToggleClientSelection?: (clientId: string) => void
  isClientSelected?: (clientId: string) => boolean
}

function SortableClientCard({ assignment, onRemove, onEdit, currentSortOrder }: SortableClientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: assignment.client_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  }

  // Calcular posição visual baseada na ordenação atual
  const visualPosition = useMemo(() => {
    return currentSortOrder === 'asc' ? assignment.order_index : assignment.order_index
  }, [assignment.order_index, currentSortOrder])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white border rounded-lg p-3 shadow-sm draggable-client-card cursor-grab active:cursor-grabbing ${
        isDragging ? 'dragging' : ''
      }`}
      {...attributes}
      {...listeners}
      title="Arrastar para reordenar"
    >
      <div className="flex items-center justify-between w-full min-w-0">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Ícone de grip (apenas visual) - TAMANHO FIXO */}
          <div className="text-gray-400 flex-shrink-0 w-5 h-5 flex items-center justify-center">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Posição do cliente - escondida durante o drag - TAMANHO FIXO */}
          {!isDragging && (
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full w-8 h-6 text-center flex-shrink-0 flex items-center justify-center">
              {formatRouteNumber(visualPosition)}
            </div>
          )}
          
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

        {/* Botão de editar */}
        <Button
          onClick={(e) => {
            e.stopPropagation() // Prevenir que o drag seja ativado
            onEdit()
          }}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-8 w-8"
          title="Editar configurações de serviço"
        >
          <Edit className="w-4 h-4" />
        </Button>

        {/* Botão de remover */}
        <Button
          onClick={(e) => {
            e.stopPropagation() // Prevenir que o drag seja ativado
            onRemove()
          }}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function DraggableRouteList({
  assignments,
  onRemoveClient,
  onEditClient,
  onReorderClients,
  currentSortOrder,
  isSelectionMode = false,
  onToggleClientSelection,
  isClientSelected
}: DraggableRouteListProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [localAssignments, setLocalAssignments] = useState<RouteAssignment[]>(assignments)
  const [clientToRemove, setClientToRemove] = useState<RouteAssignment | null>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)

  // Atualizar assignments locais quando props mudarem
  useMemo(() => {
    setLocalAssignments(assignments)
  }, [assignments])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduzir a distância mínima para ativação
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      setLocalAssignments((items) => {
        const oldIndex = items.findIndex((item) => item.client_id === active.id)
        const newIndex = items.findIndex((item) => item.client_id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    // Verificar se realmente houve movimento
    const oldIndex = localAssignments.findIndex(item => item.client_id === active.id)
    const newIndex = localAssignments.findIndex(item => item.client_id === over.id)

    console.log('📊 Índices encontrados:', { oldIndex, newIndex })

    // IMPORTANTE: Permitir movimento mesmo se for o mesmo item, desde que a posição mude
    if (oldIndex !== -1 && newIndex !== -1) {
      // Se os índices são diferentes, há movimento válido
      if (oldIndex !== newIndex) {
        console.log('✅ Movimento válido detectado! (índices diferentes)')
        
        const newOrder = arrayMove(localAssignments, oldIndex, newIndex)
        
        console.log('🔄 Nova ordem criada:', newOrder.map(a => ({ id: a.client_id, name: a.full_name })))
        
        // Recalcular order_index baseado na nova posição visual
        // Importante: manter a ordem visual atual (crescente/decrescente)
        const updatedOrder = newOrder.map((item, index) => {
          // Se a ordem é decrescente, inverter a numeração
          const visualIndex = currentSortOrder === 'desc' ? newOrder.length - index : index + 1
          return {
            ...item,
            order_index: visualIndex
          }
        })
        
        console.log('📋 Ordem atualizada com order_index:', updatedOrder.map(a => ({ id: a.client_id, name: a.full_name, pos: a.order_index })))
        
        setLocalAssignments(updatedOrder)
        
        // Notificar componente pai sobre a reordenação
        // O componente pai é responsável por recalcular as posições globais
        // Importante: sempre notificar, mesmo se a ordem parecer igual
        console.log('📞 Chamando onReorderClients...')
        onReorderClients(updatedOrder)
        console.log('✅ onReorderClients chamado com sucesso!')
      } else {
        // Mesmo índice, mas vamos verificar se a posição visual mudou
        const activeItem = localAssignments[oldIndex]
        console.log(`🔍 Mesmo índice (${oldIndex}), mas vamos verificar se há mudança visual`)
        console.log(`   Item: ${activeItem.full_name}, order_index atual: ${activeItem.order_index}`)
        
        // Forçar uma reordenação para garantir que as posições sejam recalculadas
        console.log('🔄 Forçando reordenação para recalcular posições...')
        
        const newOrder = [...localAssignments] // Cópia da lista atual
        const updatedOrder = newOrder.map((item, index) => {
          // Se a ordem é decrescente, inverter a numeração
          const visualIndex = currentSortOrder === 'desc' ? newOrder.length - index : index + 1
          return {
            ...item,
            order_index: visualIndex
          }
        })
        
        console.log('📋 Ordem atualizada com order_index:', updatedOrder.map(a => ({ id: a.client_id, name: a.full_name, pos: a.order_index })))
        
        setLocalAssignments(updatedOrder)
        
        // Notificar componente pai sobre a reordenação
        console.log('📞 Chamando onReorderClients...')
        onReorderClients(updatedOrder)
        console.log('✅ onReorderClients chamado com sucesso!')
      }
    } else {
      console.log('❌ Índices inválidos encontrados')
    }
    
    setActiveId(null)
  }

  const handleRemoveClient = (assignment: RouteAssignment) => {
    setClientToRemove(assignment)
    setRemoveDialogOpen(true)
  }

  const handleConfirmRemove = async () => {
    if (!clientToRemove) return
    
    try {
      await onRemoveClient(clientToRemove.client_id)
    } catch (err) {
      console.error('Erro ao remover cliente:', err)
      toast.error('Erro ao remover cliente da rota')
    }
  }

  // Encontrar o assignment ativo para o overlay
  const activeAssignment = activeId 
    ? localAssignments.find(item => item.client_id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localAssignments.map(item => item.client_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {localAssignments.map((assignment) => {
            // Em mobile e modo seleção, usar MobileClientCard
            if (isSelectionMode) {
              return (
                <MobileClientCard
                  key={assignment.client_id}
                  assignment={assignment}
                  isSelected={isClientSelected?.(assignment.client_id) || false}
                  onSelectionChange={onToggleClientSelection || (() => {})}
                  onEdit={() => onEditClient(assignment.client_id)}
                  onRemove={() => handleRemoveClient(assignment)}
                  currentSortOrder={currentSortOrder}
                  isSelectionMode={isSelectionMode}
                />
              )
            }
            
            // Em desktop ou modo normal, usar SortableClientCard
            return (
              <SortableClientCard
                key={assignment.client_id}
                assignment={assignment}
                onRemove={() => handleRemoveClient(assignment)}
                onEdit={() => onEditClient(assignment.client_id)}
                currentSortOrder={currentSortOrder}
              />
            )
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeAssignment ? (
          <div className="bg-white border rounded-lg p-3 shadow-lg opacity-90 draggable-client-card">
            <div className="flex items-center space-x-3">
                          <div className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
              {formatRouteNumber(activeAssignment.order_index)}
            </div>
              <span className="font-semibold text-gray-900">
                {activeAssignment.full_name}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <RemoveClientConfirmationDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        clientToRemove={clientToRemove}
        onConfirmRemove={handleConfirmRemove}
      />
    </DndContext>
  )
}
