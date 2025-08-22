'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
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
import { Trash2, GripVertical, KeyRound, Edit } from 'lucide-react'
import { RemoveClientConfirmationDialog } from './RemoveClientConfirmationDialog'
import { formatRouteNumber } from '@/lib/utils'
import { toast } from 'sonner'
import { MaterialSymbolsVacuum, FluentEmojiHighContrastSponge } from '@/components/ui/icons'

interface DraggableTwoColumnLayoutProps {
  leftColumn: RouteAssignment[]
  rightColumn: RouteAssignment[]
  onRemoveClient: (clientId: string) => Promise<void>
  onEditClient: (clientId: string) => void
  onReorderClients: (newOrder: RouteAssignment[]) => void
  currentSortOrder: 'asc' | 'desc'
}

interface SortableClientCardProps {
  assignment: RouteAssignment
  onRemove: () => void
  onEdit: () => void
  currentSortOrder: 'asc' | 'desc'
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Ícone de grip (apenas visual) */}
          <div className="text-gray-400">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Posição do cliente - escondida durante o drag */}
          {!isDragging && (
            <div className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
              {formatRouteNumber(visualPosition)}
            </div>
          )}
          
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

export function DraggableTwoColumnLayout({
  leftColumn,
  rightColumn,
  onRemoveClient,
  onEditClient,
  onReorderClients,
  currentSortOrder
}: DraggableTwoColumnLayoutProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [localLeftColumn, setLocalLeftColumn] = useState<RouteAssignment[]>(leftColumn)
  const [localRightColumn, setLocalRightColumn] = useState<RouteAssignment[]>(rightColumn)
  const [clientToRemove, setClientToRemove] = useState<RouteAssignment | null>(null)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)

  // Atualizar colunas locais quando props mudarem
  useEffect(() => {
    setLocalLeftColumn(leftColumn)
    setLocalRightColumn(rightColumn)
  }, [leftColumn, rightColumn])

  // Função auxiliar para recalcular todas as posições globais
  const recalculateAllPositions = useCallback((
    newLeftColumn: RouteAssignment[], 
    newRightColumn: RouteAssignment[]
  ) => {
    // IMPORTANTE: Tratar como uma única fila contínua
    const totalItems = newLeftColumn.length + newRightColumn.length
    
    const updatedLeftColumn = newLeftColumn.map((item, index) => {
      let orderIndex: number
      
      if (currentSortOrder === 'asc') {
        // Ordem crescente: 1, 2, 3, 4... (primeiros da fila)
        orderIndex = index + 1
      } else {
        // Ordem decrescente: 4, 3, 2, 1... (primeiros da fila)
        orderIndex = totalItems - index
      }
      
      return {
        ...item,
        order_index: orderIndex
      }
    })

    const updatedRightColumn = newRightColumn.map((item, index) => {
      let orderIndex: number
      
      if (currentSortOrder === 'asc') {
        // Ordem crescente: continua da coluna esquerda (últimos da fila)
        orderIndex = newLeftColumn.length + index + 1
      } else {
        // Ordem decrescente: continua da coluna esquerda (últimos da fila)
        // Exemplo: Se temos 4,3 na esquerda e 2,1 na direita
        // Coluna direita deve ter: 2,1 (posições 2 e 1 da fila global)
        // Fórmula: totalItems - (newLeftColumn.length + index + 1) + 1
        orderIndex = totalItems - (newLeftColumn.length + index + 1) + 1
      }
      
      return {
        ...item,
        order_index: orderIndex
      }
    })

    return { updatedLeftColumn, updatedRightColumn }
  }, [currentSortOrder])

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

    // Encontrar em qual coluna está o item ativo
    const activeInLeft = localLeftColumn.findIndex(item => item.client_id === active.id)
    const activeInRight = localRightColumn.findIndex(item => item.client_id === active.id)
    
    // Encontrar em qual coluna está o item de destino
    const overInLeft = localLeftColumn.findIndex(item => item.client_id === over.id)
    const overInRight = localRightColumn.findIndex(item => item.client_id === over.id)

    if (activeInLeft !== -1 && overInLeft !== -1) {
      // Movimento dentro da coluna esquerda
      const newOrder = arrayMove(localLeftColumn, activeInLeft, overInLeft)
      const { updatedLeftColumn, updatedRightColumn } = recalculateAllPositions(newOrder, localRightColumn)
      setLocalLeftColumn(updatedLeftColumn)
      setLocalRightColumn(updatedRightColumn)
    } else if (activeInRight !== -1 && overInRight !== -1) {
      // Movimento dentro da coluna direita
      const newOrder = arrayMove(localRightColumn, activeInRight, overInRight)
      const { updatedLeftColumn, updatedRightColumn } = recalculateAllPositions(localLeftColumn, newOrder)
      setLocalLeftColumn(updatedLeftColumn)
      setLocalRightColumn(updatedRightColumn)
    } else if (activeInLeft !== -1 && overInRight !== -1) {
      // Movimento da coluna esquerda para direita
      const itemToMove = localLeftColumn[activeInLeft]
      const newLeftColumn = localLeftColumn.filter((_, index) => index !== activeInLeft)
      const newRightColumn = [...localRightColumn]
      
      // Inserir na posição correta da coluna direita
      newRightColumn.splice(overInRight, 0, itemToMove)
      
      // Recalcular todas as posições
      const { updatedLeftColumn, updatedRightColumn } = recalculateAllPositions(newLeftColumn, newRightColumn)
      setLocalLeftColumn(updatedLeftColumn)
      setLocalRightColumn(updatedRightColumn)
    } else if (activeInRight !== -1 && overInLeft !== -1) {
      // Movimento da coluna direita para esquerda
      const itemToMove = localRightColumn[activeInRight]
      const newRightColumn = localRightColumn.filter((_, index) => index !== activeInRight)
      const newLeftColumn = [...localLeftColumn]
      
      // Inserir na posição correta da coluna esquerda
      newLeftColumn.splice(overInLeft, 0, itemToMove)
      
      // Recalcular todas as posições
      const { updatedLeftColumn, updatedRightColumn } = recalculateAllPositions(newLeftColumn, newRightColumn)
      setLocalLeftColumn(updatedLeftColumn)
      setLocalRightColumn(updatedRightColumn)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    console.log('🎯 handleDragEnd (2 colunas) chamado!', { active: active.id, over: over?.id })
    
    if (!over) {
      console.log('❌ Drag cancelado - sem over')
      setActiveId(null)
      return
    }

    // Combinar as duas colunas e notificar o componente pai
    const allAssignments = [...localLeftColumn, ...localRightColumn]
    
    console.log('📋 Todas as atribuições:', allAssignments.map(a => ({ id: a.client_id, name: a.full_name, pos: a.order_index })))
    console.log('📞 Chamando onReorderClients...')
    
    onReorderClients(allAssignments)
    
    console.log('✅ onReorderClients chamado com sucesso!')
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
    ? [...localLeftColumn, ...localRightColumn].find(item => item.client_id === activeId)
    : null

  // Criar lista única para o SortableContext
  const allItems = [...localLeftColumn, ...localRightColumn]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={allItems.map(item => item.client_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna esquerda */}
          <div className="space-y-3">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Coluna Esquerda</h3>
              <p className="text-sm text-gray-600">{localLeftColumn.length} cliente(s)</p>
            </div>
            <div className="space-y-3">
              {localLeftColumn.map((assignment) => (
                <SortableClientCard
                  key={assignment.client_id}
                  assignment={assignment}
                  onRemove={() => handleRemoveClient(assignment)}
                  onEdit={() => onEditClient(assignment.client_id)}
                  currentSortOrder={currentSortOrder}
                />
              ))}
            </div>
          </div>

          {/* Coluna direita */}
          <div className="space-y-3">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Coluna Direita</h3>
              <p className="text-sm text-gray-600">{localRightColumn.length} cliente(s)</p>
            </div>
            <div className="space-y-3">
              {localRightColumn.map((assignment) => (
                <SortableClientCard
                  key={assignment.client_id}
                  assignment={assignment}
                  onRemove={() => handleRemoveClient(assignment)}
                  onEdit={() => onEditClient(assignment.client_id)}
                  currentSortOrder={currentSortOrder}
                />
              ))}
            </div>
          </div>
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
