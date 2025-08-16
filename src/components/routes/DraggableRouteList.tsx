'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
  UniqueIdentifier
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RouteAssignment } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical } from 'lucide-react'

interface DraggableRouteListProps {
  assignments: RouteAssignment[]
  onRemoveClient: (clientId: string) => Promise<void>
  onReorderClients: (newOrder: RouteAssignment[]) => void
  currentSortOrder: 'asc' | 'desc'
}

interface SortableClientCardProps {
  assignment: RouteAssignment
  onRemove: () => void
  currentSortOrder: 'asc' | 'desc'
}

function SortableClientCard({ assignment, onRemove, currentSortOrder }: SortableClientCardProps) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Ícone de grip (apenas visual) */}
          <div className="text-gray-400">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Posição do cliente */}
          <div className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
            {visualPosition}
          </div>
          
          {/* Nome do cliente */}
          <span className="font-semibold text-gray-900 truncate">
            {assignment.full_name || 'Cliente não encontrado'}
          </span>
        </div>

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
  onReorderClients,
  currentSortOrder
}: DraggableRouteListProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [localAssignments, setLocalAssignments] = useState<RouteAssignment[]>(assignments)

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
    
    if (!over || active.id === over.id) return

    const oldIndex = localAssignments.findIndex(item => item.client_id === active.id)
    const newIndex = localAssignments.findIndex(item => item.client_id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(localAssignments, oldIndex, newIndex)
      
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
      
      setLocalAssignments(updatedOrder)
      
      // NÃO notificar o componente pai durante o drag over para evitar loops infinitos
      // A notificação será feita apenas no handleDragEnd
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    console.log('🎯 handleDragEnd chamado!', { active: active.id, over: over?.id })
    
    if (!over) {
      console.log('❌ Drag cancelado - sem over')
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

  const handleRemoveClient = async (clientId: string) => {
    try {
      await onRemoveClient(clientId)
    } catch (err) {
      console.error('Erro ao remover cliente:', err)
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
          {localAssignments.map((assignment) => (
            <SortableClientCard
              key={assignment.client_id}
              assignment={assignment}
              onRemove={() => handleRemoveClient(assignment.client_id)}
              currentSortOrder={currentSortOrder}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeAssignment ? (
          <div className="bg-white border rounded-lg p-3 shadow-lg opacity-90 draggable-client-card">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                {activeAssignment.order_index}
              </div>
              <span className="font-semibold text-gray-900">
                {activeAssignment.full_name}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
