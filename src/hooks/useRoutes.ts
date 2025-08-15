import { useState, useCallback, useEffect } from 'react'
import { DayOfWeek, DayState, RouteAssignment, PendingChange } from '@/types/database'
import { getDayState, savePositions } from '@/lib/routes'
import { toast } from 'sonner'

export function useRoutes() {
  const [currentDayState, setCurrentDayState] = useState<DayState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [currentDay, setCurrentDay] = useState<DayOfWeek>(1)
  const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc'>('desc')

  // Carregar estado do dia (1 leitura)
  const loadDayState = useCallback(async (weekday: DayOfWeek) => {
    try {
      setIsLoading(true)
      const dayState = await getDayState(weekday)
      setCurrentDayState(dayState)
      setCurrentDay(weekday)
      // Limpar mudanças pendentes ao trocar de dia
      setPendingChanges([])
    } catch (err) {
      console.error('Erro ao carregar estado do dia:', err)
      toast.error('Erro ao carregar rotas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar estado inicial
  useEffect(() => {
    loadDayState(1)
  }, [loadDayState])

  // Aplicar mudanças pendentes ao estado local (apenas visual)
  const applyPendingChanges = useCallback((assignments: RouteAssignment[]) => {
    if (pendingChanges.length === 0) return assignments

    const updatedAssignments = [...assignments]
    
    // Aplicar mudanças pendentes
    pendingChanges.forEach((change) => {
      if (change.newPosition === -1) {
        // Cliente foi removido, não aplicar mudança
        return
      }
      
      if (change.oldPosition === 0) {
        // Cliente foi adicionado, não aplicar mudança (já está no estado)
        return
      }
      
      const assignmentIndex = updatedAssignments.findIndex(assignment => 
        assignment.client_id === change.clientId
      )
      
      if (assignmentIndex !== -1) {
        updatedAssignments[assignmentIndex] = {
          ...updatedAssignments[assignmentIndex],
          order_index: change.newPosition
        }
      }
    })
    
    // Reordenar por order_index para manter a sequência visual
    return updatedAssignments.sort((a, b) => a.order_index - b.order_index)
  }, [pendingChanges])

  // Obter assignments com mudanças pendentes aplicadas
  const getAssignmentsWithPendingChanges = useCallback(() => {
    if (!currentDayState) return []
    return applyPendingChanges(currentDayState.assignments)
  }, [currentDayState, applyPendingChanges])

  // Adicionar mudança pendente
  const addPendingChange = useCallback((
    clientId: string, 
    oldPosition: number, 
    newPosition: number, 
    dayOfWeek: DayOfWeek
  ) => {
    setPendingChanges(prev => [
      ...prev.filter(change => 
        !(change.clientId === clientId && change.dayOfWeek === dayOfWeek)
      ),
      { clientId, oldPosition, newPosition, dayOfWeek }
    ])
  }, [])

  // Limpar todas as mudanças pendentes
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([])
  }, [])

  // Adicionar cliente à rota (apenas no estado local)
  const addClientToRoute = useCallback((clientId: string) => {
    if (!currentDayState) return

    // Encontrar o cliente na lista de disponíveis
    const clientToAdd = currentDayState.available_clients.find(c => c.id === clientId)
    if (!clientToAdd) {
      toast.error('Cliente não encontrado')
      return
    }

    // Calcular nova posição (última + 1)
    const newPosition = currentDayState.assignments.length + 1

    // Atualizar estado local
    setCurrentDayState(prev => {
      if (!prev) return prev

      return {
        ...prev,
        assignments: [
          ...prev.assignments,
          {
            client_id: clientToAdd.id,
            full_name: clientToAdd.full_name,
            order_index: newPosition
          } as RouteAssignment
        ],
        available_clients: prev.available_clients.filter(c => c.id !== clientId)
      }
    })

    // Adicionar mudança pendente para o novo cliente
    addPendingChange(clientId, 0, newPosition, currentDay)

    toast.success('Cliente adicionado à rota. Clique em "Salvar posições" para confirmar.')
  }, [currentDayState, currentDay, addPendingChange])

  // Remover cliente da rota (apenas no estado local)
  const removeClientFromRoute = useCallback((clientId: string) => {
    if (!currentDayState) return

    // Encontrar o cliente na lista de assignments
    const clientToRemove = currentDayState.assignments.find(a => a.client_id === clientId)
    if (!clientToRemove) {
      toast.error('Cliente não encontrado na rota')
      return
    }

    const removedPosition = clientToRemove.order_index

    // Atualizar estado local
    setCurrentDayState(prev => {
      if (!prev) return prev

      // Remover o cliente da lista de assignments
      const updatedAssignments = prev.assignments.filter(a => a.client_id !== clientId)
      
      // Reordenar automaticamente os clientes que estavam abaixo da posição removida
      const reorderedAssignments = updatedAssignments.map(assignment => {
        if (assignment.order_index > removedPosition) {
          // Cliente estava abaixo da posição removida, sobe uma posição
          return {
            ...assignment,
            order_index: assignment.order_index - 1
          }
        }
        // Cliente estava acima ou na posição removida, mantém posição
        return assignment
      })

      // Adicionar o cliente removido de volta à lista de disponíveis
      const updatedAvailableClients = [
        ...prev.available_clients,
        {
          id: clientToRemove.client_id,
          full_name: clientToRemove.full_name,
          document: '', // Será preenchido quando recarregar
          phone: undefined
        }
      ].sort((a, b) => a.full_name.localeCompare(b.full_name))

      return {
        ...prev,
        assignments: reorderedAssignments,
        available_clients: updatedAvailableClients
      }
    })

    // Remover mudanças pendentes deste cliente
    setPendingChanges(prev => prev.filter(change => change.clientId !== clientId))

    // Adicionar mudanças pendentes para os clientes que subiram de posição
    const clientesQueSubiram = currentDayState.assignments.filter(
      a => a.client_id !== clientId && a.order_index > removedPosition
    )
    
    clientesQueSubiram.forEach(cliente => {
      addPendingChange(cliente.client_id, cliente.order_index, cliente.order_index - 1, currentDay)
    })

    // Adicionar mudança pendente para marcar o cliente como removido
    // Usamos uma posição especial (-1) para indicar remoção
    addPendingChange(clientId, removedPosition, -1, currentDay)

    toast.success('Cliente removido da rota e posições reordenadas automaticamente. Clique em "Salvar posições" para confirmar.')
  }, [currentDayState, currentDay, addPendingChange])

  // Mover cliente para nova posição (apenas visual no frontend)
  const moveClientToPosition = useCallback((
    clientId: string, 
    dayOfWeek: DayOfWeek, 
    newPosition: number
  ) => {
    const currentAssignments = getAssignmentsWithPendingChanges()
    const currentAssignment = currentAssignments.find(a => a.client_id === clientId)
    
    if (!currentAssignment) {
      toast.error('Cliente não encontrado na rota')
      return
    }

    const oldPosition = currentAssignment.order_index
    
    // Se a posição é a mesma, não fazer nada
    if (oldPosition === newPosition) {
      toast.info('Cliente já está nesta posição')
      return
    }

    // Verificar se a nova posição é adjacente (apenas +1 ou -1)
    const positionDiff = Math.abs(newPosition - oldPosition)
    if (positionDiff !== 1) {
      toast.error('Só é possível mover para posições adjacentes')
      return
    }

    // Verificar se a nova posição é válida
    if (newPosition < 1 || newPosition > currentAssignments.length) {
      toast.error('Posição inválida')
      return
    }

    // Encontrar o cliente que está na posição de destino
    const targetAssignment = currentAssignments.find(a => a.order_index === newPosition)
    if (!targetAssignment) {
      toast.error('Posição de destino não encontrada')
      return
    }

    // Adicionar mudanças pendentes para AMBOS os clientes (troca de posições)
    // Cliente atual vai para nova posição
    addPendingChange(clientId, oldPosition, newPosition, dayOfWeek)
    // Cliente de destino vai para posição antiga
    addPendingChange(targetAssignment.client_id, newPosition, oldPosition, dayOfWeek)
    
    toast.success('Posições trocadas. Clique em "Salvar posições" para confirmar.')
  }, [getAssignmentsWithPendingChanges, addPendingChange])

  // Salvar todas as mudanças pendentes no banco (1 persistência)
  const savePendingChanges = useCallback(async () => {
    if (!currentDayState || pendingChanges.length === 0) {
      toast.info('Nenhuma mudança pendente para salvar')
      return
    }

    try {
      setIsLoading(true)
      
      // Obter assignments com mudanças pendentes aplicadas
      const finalAssignments = getAssignmentsWithPendingChanges()
      
      // Filtrar apenas clientes válidos (não removidos)
      const validAssignments = finalAssignments.filter(a => a.order_index > 0)
      
      // Extrair apenas os client_ids na ordem final
      const orderedClientIds = validAssignments.map(a => a.client_id)
      
      // Salvar no banco (1 persistência)
      await savePositions(currentDay, orderedClientIds)
      
      // Recarregar estado do banco para confirmar
      await loadDayState(currentDay)
      
      toast.success(`${pendingChanges.length} mudanças salvas com sucesso!`)
    } catch (err) {
      console.error('Erro ao salvar mudanças pendentes:', err)
      toast.error('Erro ao salvar mudanças. Tente novamente.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [currentDayState, pendingChanges, getAssignmentsWithPendingChanges, currentDay, loadDayState])

  // Aplicar ordenação aos assignments
  const getSortedAssignments = useCallback((assignments: RouteAssignment[]) => {
    if (currentSortOrder === 'asc') {
      return [...assignments].sort((a, b) => a.order_index - b.order_index)
    } else {
      return [...assignments].sort((a, b) => b.order_index - a.order_index)
    }
  }, [currentSortOrder])

  // Calcular posição visual baseada na ordenação atual
  const getVisualPosition = useCallback((clientId: string, assignments: RouteAssignment[]) => {
    const sortedAssignments = getSortedAssignments(assignments)
    return sortedAssignments.findIndex(a => a.client_id === clientId)
  }, [getSortedAssignments])

  // Calcular posição lógica (order_index) baseada na posição visual
  const getLogicalPosition = useCallback((visualPosition: number, assignments: RouteAssignment[]) => {
    const sortedAssignments = getSortedAssignments(assignments)
    if (visualPosition >= 0 && visualPosition < sortedAssignments.length) {
      return sortedAssignments[visualPosition].order_index
    }
    return -1
  }, [getSortedAssignments])

  // Função para mover cliente baseada na posição visual
  const moveClientByVisualPosition = useCallback((
    clientId: string, 
    direction: 'up' | 'down'
  ) => {
    const currentAssignments = getAssignmentsWithPendingChanges()
    const visualPosition = getVisualPosition(clientId, currentAssignments)
    
    if (visualPosition === -1) {
      toast.error('Cliente não encontrado na rota')
      return
    }

    let targetVisualPosition: number
    
    if (currentSortOrder === 'asc') {
      // Ordem crescente: ↑ move para posição anterior, ↓ move para posterior
      if (direction === 'up') {
        targetVisualPosition = visualPosition - 1
      } else {
        targetVisualPosition = visualPosition + 1
      }
    } else {
      // Ordem decrescente: ↑ move para posição anterior (índice maior), ↓ move para posterior (índice menor)
      if (direction === 'up') {
        targetVisualPosition = visualPosition - 1
      } else {
        targetVisualPosition = visualPosition + 1
      }
    }

    // Validar limites
    if (targetVisualPosition < 0 || targetVisualPosition >= currentAssignments.length) {
      toast.error('Movimento não permitido')
      return
    }

    // Obter posições lógicas
    const currentLogicalPosition = getLogicalPosition(visualPosition, currentAssignments)
    const targetLogicalPosition = getLogicalPosition(targetVisualPosition, currentAssignments)
    
    if (currentLogicalPosition === -1 || targetLogicalPosition === -1) {
      toast.error('Erro ao calcular posições')
      return
    }

    // Mover cliente para nova posição lógica
    moveClientToPosition(clientId, currentDay, targetLogicalPosition)
  }, [getAssignmentsWithPendingChanges, getVisualPosition, getLogicalPosition, currentSortOrder, moveClientToPosition, currentDay])

  // Função para alterar a ordenação
  const changeSortOrder = useCallback((newSortOrder: 'asc' | 'desc') => {
    setCurrentSortOrder(newSortOrder)
  }, [])

  return {
    // Estado atual
    dayState: currentDayState,
    assignments: getAssignmentsWithPendingChanges(),
    availableClients: currentDayState?.available_clients || [],
    maxClients: currentDayState?.max_clients || 10,
    
    // Estados de loading e mudanças
    isLoading,
    pendingChanges,
    pendingChangesCount: pendingChanges.length,
    hasPendingChanges: pendingChanges.length > 0,
    
    // Funções
    loadDayState,
    addClientToRoute,
    removeClientFromRoute,
    moveClientToPosition,
    savePendingChanges,
    clearPendingChanges,
    moveClientByVisualPosition,
    changeSortOrder,
    
    // Dia atual
    currentDay,
    currentSortOrder
  }
}
