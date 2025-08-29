import { useState, useCallback } from 'react'
import { DayOfWeek, DayState, RouteAssignment, PendingChange, AvailableClient, TeamId } from '@/types/database'
import { getDayState, savePositions, updateRouteClientAttributes } from '@/lib/routes'
import { toast } from 'sonner'

export function useRoutes() {
  const [currentDayState, setCurrentDayState] = useState<DayState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [currentDay, setCurrentDay] = useState<DayOfWeek>(1)
  const [currentTeam, setCurrentTeam] = useState<TeamId>(1)
  const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc'>('desc')

  // Carregar estado do dia para uma equipe específica
  const loadDayState = useCallback(async (weekday: DayOfWeek, teamId: TeamId) => {
    console.log('🔄 loadDayState chamado:', { weekday, teamId, currentTeam })
    try {
      setIsLoading(true)
      console.log('   Buscando dados do banco...')
      const dayState = await getDayState(weekday, teamId)
      console.log('   Dados recebidos:', { 
        assignments: dayState.assignments?.length || 0, 
        available_clients: dayState.available_clients?.length || 0 
      })
      
      setCurrentDayState(dayState)
      setCurrentDay(weekday)
      setCurrentTeam(teamId)
      console.log('   Estado atualizado:', { weekday, teamId })
      
      // Limpar mudanças pendentes ao trocar de dia ou equipe
      setPendingChanges([])
    } catch (err) {
      console.error('Erro ao carregar estado do dia:', err)
      toast.error('Erro ao carregar rotas')
    } finally {
      setIsLoading(false)
    }
  }, [currentTeam])

  // Carregar estado inicial
  // useEffect removido para evitar conflito com RoutesPage
  // O estado inicial será carregado pelo RoutesPage

  // Trocar de equipe
  const changeTeam = useCallback((teamId: TeamId) => {
    console.log('🔄 changeTeam chamado:', { teamId, currentDay, currentTeam: currentTeam })
    console.log('   Estado atual - currentTeam:', currentTeam)
    console.log('   Novo teamId:', teamId)
    
    setCurrentTeam(teamId)
    console.log('   setCurrentTeam executado')
    
    // Carregar estado da nova equipe imediatamente
    console.log('   Chamando loadDayState:', { currentDay, teamId })
    loadDayState(currentDay, teamId)
  }, [currentDay, loadDayState, currentTeam])

  // Aplicar mudanças pendentes ao estado local (apenas visual)
  const applyPendingChanges = useCallback((assignments: RouteAssignment[]) => {
    if (pendingChanges.length === 0) return assignments

    console.log('🔧 DEBUG applyPendingChanges:')
    console.log('   Assignments originais:', assignments.map(a => ({ id: a.client_id, name: a.full_name, pos: a.order_index })))
    console.log('   Mudanças pendentes:', pendingChanges)

    const updatedAssignments = [...assignments]
    
    // Aplicar mudanças pendentes
    pendingChanges.forEach((change) => {
      if (change.newPosition === -1) {
        // Cliente foi removido, não aplicar mudança
        console.log(`   Cliente ${change.clientId} foi removido, pulando...`)
        return
      }
      
      if (change.oldPosition === 0) {
        // Cliente foi adicionado, não aplicar mudança (já está no estado)
        console.log(`   Cliente ${change.clientId} foi adicionado, pulando...`)
        return
      }
      
      const assignmentIndex = updatedAssignments.findIndex(assignment => 
        assignment.client_id === change.clientId
      )
      
      if (assignmentIndex !== -1) {
        console.log(`   Aplicando mudança: cliente ${change.clientId} de posição ${change.oldPosition} para ${change.newPosition}`)
        updatedAssignments[assignmentIndex] = {
          ...updatedAssignments[assignmentIndex],
          order_index: change.newPosition
        }
      } else {
        console.log(`   Cliente ${change.clientId} não encontrado nos assignments`)
      }
    })
    
    // Reordenar por order_index para manter a sequência visual
    const finalAssignments = updatedAssignments.sort((a, b) => a.order_index - b.order_index)
    
    console.log('   Assignments finais:', finalAssignments.map(a => ({ id: a.client_id, name: a.full_name, pos: a.order_index })))
    
    return finalAssignments
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
    dayOfWeek: DayOfWeek,
    teamId: TeamId = currentTeam
  ) => {
    console.log(`➕ addPendingChange chamado:`, { clientId, oldPosition, newPosition, dayOfWeek, teamId })
    
    setPendingChanges(prev => {
      const newChanges = [
        ...prev.filter(change => 
          !(change.clientId === clientId && change.dayOfWeek === dayOfWeek && change.teamId === teamId)
        ),
        { clientId, oldPosition, newPosition, dayOfWeek, teamId }
      ]
      
      console.log(`📝 Mudanças pendentes ANTES:`, prev)
      console.log(`📝 Mudanças pendentes DEPOIS:`, newChanges)
      
      return newChanges
    })
  }, [currentTeam])

  // Limpar todas as mudanças pendentes
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([])
  }, [])

  // Adicionar cliente à rota com posição específica (apenas no estado local)
  const addClientToRoute = useCallback((
    clientIds: string | string[], 
    position: 'start' | 'end' | 'between' = 'end',
    betweenClientId?: string,
    hasKey?: boolean,
    serviceType?: 'ASPIRAR' | 'ESFREGAR'
  ) => {
    if (!currentDayState) return

    // Converter para array se for string único
    const clientIdsArray = Array.isArray(clientIds) ? clientIds : [clientIds]
    
    // Encontrar todos os clientes na lista de disponíveis
    const clientsToAdd = clientIdsArray.map(id => 
      currentDayState.available_clients.find(c => c.id === id)
    ).filter(Boolean) as AvailableClient[]



    if (clientsToAdd.length === 0) {
      toast.error('Nenhum cliente válido encontrado')
      return
    }

    let updatedAssignments: RouteAssignment[] = [...currentDayState.assignments]

    if (position === 'start') {
      // Menor número (primeiro da lista)
      // Mover todos os clientes existentes N posições para baixo (onde N = número de clientes a adicionar)
      updatedAssignments = currentDayState.assignments.map(assignment => ({
        ...assignment,
        order_index: assignment.order_index + clientsToAdd.length
      }))
      
      // Adicionar todos os clientes no início
      clientsToAdd.forEach((client, index) => {
        updatedAssignments.unshift({
          client_id: client.id,
          full_name: client.full_name,
          neighborhood: client.neighborhood,
          order_index: index + 1,
          team_id: currentTeam,
          has_key: hasKey || false,
          service_type: serviceType || undefined
        } as RouteAssignment)
      })
    } else if (position === 'between' && betweenClientId) {
      // Posição entre dois clientes
      const targetAssignment = currentDayState.assignments.find(a => a.client_id === betweenClientId)
      if (!targetAssignment) {
        toast.error('Cliente de referência não encontrado')
        return
      }
      
      const startPosition = targetAssignment.order_index + 1
      
      // Mover todos os clientes que estão na posição ou abaixo N posições para baixo
      updatedAssignments = currentDayState.assignments.map(assignment => {
        if (assignment.order_index >= startPosition) {
          return {
            ...assignment,
            order_index: assignment.order_index + clientsToAdd.length
          }
        }
        return assignment
      })
      
      // Inserir todos os clientes na posição desejada
      clientsToAdd.forEach((client, index) => {
        updatedAssignments.splice(startPosition + index - 1, 0, {
          client_id: client.id,
          full_name: client.full_name,
          neighborhood: client.neighborhood,
          order_index: startPosition + index,
          team_id: currentTeam,
          has_key: hasKey || false,
          service_type: serviceType || undefined
        } as RouteAssignment)
      })
    } else {
      // Maior número (padrão)
      const startPosition = currentDayState.assignments.length + 1
      
      // Adicionar todos os clientes no final
      clientsToAdd.forEach((client, index) => {
        updatedAssignments = [
          ...updatedAssignments,
          {
            client_id: client.id,
            full_name: client.full_name,
            neighborhood: client.neighborhood,
            order_index: startPosition + index,
            team_id: currentTeam,
            has_key: hasKey || false,
            service_type: serviceType || undefined
          } as RouteAssignment
        ]
      })
    }

    // IMPORTANTE: Recalcular todas as posições sequencialmente para evitar duplicatas
    const finalAssignments = updatedAssignments
      .sort((a, b) => a.order_index - b.order_index) // Ordenar por posição atual
      .map((assignment, index) => ({
        ...assignment,
        order_index: index + 1 // Posições sequenciais: 1, 2, 3, 4...
      }))


    console.log('   Posições calculadas para novos clientes:', clientsToAdd.map((client, index) => {
      if (position === 'start') return { client: client.full_name, position: index + 1 }
      if (position === 'between' && betweenClientId) {
        const targetAssignment = currentDayState.assignments.find(a => a.client_id === betweenClientId)
        return { client: client.full_name, position: (targetAssignment?.order_index || 0) + 1 + index }
      }
      return { client: client.full_name, position: currentDayState.assignments.length + 1 + index }
    }))

    // Atualizar estado local
    setCurrentDayState(prev => {
      if (!prev) return prev

      const newState = {
        ...prev,
        assignments: finalAssignments,
        available_clients: prev.available_clients.filter(c => !clientIdsArray.includes(c.id))
      }
      
      console.log('🔍 DEBUG: Estado local atualizado:', {
        assignments: newState.assignments.map(a => ({ id: a.client_id, name: a.full_name, neighborhood: a.neighborhood }))
      })
      
      return newState
    })

    // Como estamos fazendo salvamento automático, não precisamos de mudanças pendentes
    // para clientes recém-adicionados. Eles já estão no estado local correto.
    console.log('⚠️ Mudanças pendentes removidas para debug - salvamento automático desabilitado')

    // SALVAMENTO AUTOMÁTICO: Salvar imediatamente após adicionar os clientes
    const saveAutomatically = async () => {
      try {
        // Extrair apenas os client_ids na ordem final (já reordenados)
        const orderedClientIds = finalAssignments.map(a => a.client_id)
        
        // Extrair arrays de has_keys e service_types na ordem final
        const orderedHasKeys = finalAssignments.map(a => a.has_key || false)
        const orderedServiceTypes = finalAssignments.map(a => a.service_type || null)
        
        // Salvar no banco
        await savePositions(currentDay, orderedClientIds, currentTeam, orderedHasKeys, orderedServiceTypes)
        
        // Limpar mudanças pendentes após salvar com sucesso
        setPendingChanges([])
        
        const clientCount = clientsToAdd.length
        const clientText = clientCount === 1 ? 'cliente' : 'clientes'
        toast.success(`${clientCount} ${clientText} adicionado(s) à rota e salvo(s) automaticamente!`)
        
        // REFRESH AUTOMÁTICO: Recarregar o estado do dia para garantir que todos os campos
        // (incluindo neighborhood) sejam carregados corretamente
        console.log('🔄 Fazendo refresh automático após adicionar cliente(s)...')
        await loadDayState(currentDay, currentTeam)
        
      } catch (err) {
        console.error('Erro ao salvar automaticamente:', err)
        toast.error('Cliente(s) adicionado(s) à rota, mas houve erro ao salvar. Clique em "Salvar posições" para tentar novamente.')
      }
    }

    // Executar salvamento automático
    saveAutomatically()
  }, [currentDayState, currentDay, currentTeam, loadDayState])

  // Remover cliente da rota (apenas no estado local)
  const removeClientFromRoute = useCallback(async (clientId: string) => {
    if (!currentDayState) {
      toast.error('Estado da rota não carregado')
      return
    }

    // Encontrar o cliente na lista de assignments
    const clientToRemove = currentDayState.assignments.find(a => a.client_id === clientId)
    if (!clientToRemove) {
      toast.error('Cliente não encontrado na rota')
      return
    }

    const removedPosition = clientToRemove.order_index

    try {
      // Calcular o novo estado ANTES de atualizar
      const updatedAssignments = currentDayState.assignments.filter(a => a.client_id !== clientId)
      
      // Reordenar automaticamente os clientes que estavam abaixo da posição removida
      const reorderedAssignments = updatedAssignments
        .sort((a, b) => a.order_index - b.order_index) // Ordenar por posição atual
        .map((assignment, index) => ({
          ...assignment,
          order_index: index + 1 // Posições sequenciais: 1, 2, 3, 4...
        }))

      // Adicionar o cliente removido de volta à lista de disponíveis
      const updatedAvailableClients = [
        ...currentDayState.available_clients,
        {
          id: clientToRemove.client_id,
          full_name: clientToRemove.full_name,
          document: '', // Será preenchido quando recarregar
          phone: undefined
        }
      ].sort((a, b) => a.full_name.localeCompare(b.full_name))

      console.log('🔧 DEBUG removeClientFromRoute:')
      console.log('   Cliente removido:', clientToRemove.full_name, 'posição:', removedPosition)
      console.log('   Assignments originais:', currentDayState.assignments.map(a => ({ id: a.client_id, name: a.full_name, pos: a.order_index })))
      console.log('   Assignments após remoção:', updatedAssignments.map(a => ({ id: a.client_id, name: a.full_name, pos: a.order_index })))
      console.log('   Assignments reordenados:', reorderedAssignments.map(a => ({ id: a.client_id, name: a.full_name, pos: a.order_index })))

      // Atualizar estado local
      setCurrentDayState(prev => {
        if (!prev) return prev
        return {
          ...prev,
          assignments: reorderedAssignments,
          available_clients: updatedAvailableClients
        }
      })

      // Limpar TODAS as mudanças pendentes antes de salvar
      setPendingChanges([])

      // Aguardar um tick para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 0))
      
      // Usar os dados calculados diretamente em vez de getAssignmentsWithPendingChanges
      const orderedClientIds = reorderedAssignments.map(a => a.client_id)
      
      console.log('🔧 DEBUG saveAutomatically após remoção:')
      console.log('   orderedClientIds:', orderedClientIds)
      console.log('   total de clientes:', orderedClientIds.length)
      console.log('   ✅ CONFIRMAÇÃO: Usando dados calculados diretamente, não getAssignmentsWithPendingChanges')
      
      // Extrair arrays de has_keys e service_types na ordem final
      const orderedHasKeys = reorderedAssignments.map(a => a.has_key || false)
      const orderedServiceTypes = reorderedAssignments.map(a => a.service_type || null)
      
      // Salvar no banco
      await savePositions(currentDay, orderedClientIds, currentTeam, orderedHasKeys, orderedServiceTypes)
      
      toast.success('Cliente removido da rota e salvo automaticamente!')
      
      // REFRESH AUTOMÁTICO: Recarregar o estado do dia para garantir que todos os campos
      // (incluindo neighborhood) sejam carregados corretamente na lista de clientes disponíveis
      console.log('🔄 Fazendo refresh automático após remover cliente...')
      await loadDayState(currentDay, currentTeam)
      
    } catch (err) {
      console.error('Erro ao remover cliente:', err)
      toast.error('Erro ao remover cliente da rota. Tente novamente.')
      
      // Em caso de erro, recarregar o estado do servidor
      console.log('🔄 Recarregando estado do servidor após erro...')
      console.log('   currentDay:', currentDay)
      console.log('   currentTeam:', currentTeam)
      await loadDayState(currentDay, currentTeam)
    }
  }, [currentDayState, currentDay, loadDayState, currentTeam])

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
    addPendingChange(clientId, oldPosition, newPosition, dayOfWeek, currentTeam)
    // Cliente de destino vai para posição antiga
    addPendingChange(targetAssignment.client_id, newPosition, oldPosition, dayOfWeek, currentTeam)
    
    // SALVAMENTO AUTOMÁTICO: Salvar imediatamente após mover o cliente
    const saveAutomatically = async () => {
      try {
        // Limpar mudanças pendentes antes de salvar
        setPendingChanges([])
        
        // Aguardar um tick para garantir que o estado foi atualizado
        await new Promise(resolve => setTimeout(resolve, 0))
        
        // Obter assignments com mudanças pendentes aplicadas
        const finalAssignments = getAssignmentsWithPendingChanges()
        
        // Filtrar apenas clientes válidos (não removidos)
        const validAssignments = finalAssignments.filter(a => a.order_index > 0)
        
        // Extrair apenas os client_ids na ordem final
        const orderedClientIds = validAssignments.map(a => a.client_id)
        
        console.log('🔧 DEBUG saveAutomatically após mover:')
        console.log('   orderedClientIds:', orderedClientIds)
        console.log('   total de clientes:', orderedClientIds.length)
        
        // Extrair arrays de has_keys e service_types na ordem final
        const orderedHasKeys = validAssignments.map(a => a.has_key || false)
        const orderedServiceTypes = validAssignments.map(a => a.service_type || null)
        
        // Salvar no banco
        await savePositions(currentDay, orderedClientIds, currentTeam, orderedHasKeys, orderedServiceTypes)
        
        toast.success('Posições trocadas e salvas automaticamente!')
      } catch (err) {
        console.error('Erro ao salvar automaticamente:', err)
        toast.error('Posições trocadas, mas houve erro ao salvar. Clique em "Salvar posições" para tentar novamente.')
        
        // Em caso de erro, recarregar o estado do servidor
        await loadDayState(currentDay, currentTeam)
      }
    }

    // Executar salvamento automático
    saveAutomatically()
  }, [getAssignmentsWithPendingChanges, addPendingChange, currentDay, loadDayState, currentTeam])

  // Salvar todas as mudanças pendentes no banco (1 persistência)
  const savePendingChanges = useCallback(async () => {
    if (!currentDayState || pendingChanges.length === 0) {
      toast.info('Nenhuma mudança pendente para salvar')
      return
    }

    try {
      setIsLoading(true)
      
      console.log('🔧 DEBUG savePendingChanges:')
      console.log('   Mudanças pendentes:', pendingChanges)
      
      // Obter assignments com mudanças pendentes aplicadas
      const finalAssignments = getAssignmentsWithPendingChanges()
      
      // Filtrar apenas clientes válidos (não removidos)
      const validAssignments = finalAssignments.filter(a => a.order_index > 0)
      
      // Extrair apenas os client_ids na ordem final
      const orderedClientIds = validAssignments.map(a => a.client_id)
      
      console.log('   orderedClientIds:', orderedClientIds)
      console.log('   total de clientes:', orderedClientIds.length)
      
              // Extrair arrays de has_keys e service_types na ordem final
        const orderedHasKeys = validAssignments.map(a => a.has_key || false)
        const orderedServiceTypes = validAssignments.map(a => a.service_type || null)
      
      // Salvar no banco (1 persistência)
      await savePositions(currentDay, orderedClientIds, currentTeam, orderedHasKeys, orderedServiceTypes)
      
      // Limpar mudanças pendentes após salvar com sucesso
      setPendingChanges([])
      
      // Recarregar estado do banco para confirmar
      await loadDayState(currentDay, currentTeam)
      
      toast.success(`${pendingChanges.length} mudanças salvas com sucesso!`)
    } catch (err) {
      console.error('Erro ao salvar mudanças pendentes:', err)
      toast.error('Erro ao salvar mudanças. Tente novamente.')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [currentDayState, pendingChanges, getAssignmentsWithPendingChanges, currentDay, loadDayState, currentTeam])

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

  // Função para reordenar clientes via drag & drop
  const reorderClients = useCallback((newOrderFromUI: RouteAssignment[]) => {
    if (!currentDayState) return

    console.log('🚀 DEBUG: reorderClients chamado!')
    console.log('📊 Estado atual:', currentDayState)
    console.log('🔄 Nova ordem recebida da UI:', newOrderFromUI)

    // A UI nos dá a nova ordem. Nós somos a fonte da verdade para o order_index.
    // 1. Criamos uma lista processada com o order_index correto baseado na ordenação atual.
    const processedAssignments = newOrderFromUI.map((assignment, index) => {
      let orderIndex: number
      
      if (currentSortOrder === 'asc') {
        // Ordem crescente: 1, 2, 3, 4...
        orderIndex = index + 1
      } else {
        // Ordem decrescente: 4, 3, 2, 1...
        orderIndex = newOrderFromUI.length - index
      }
      
      return {
        ...assignment,
        order_index: orderIndex,
      }
    });

    console.log('📋 Assignments processados:', processedAssignments.map(a => ({
      id: a.client_id,
      name: a.full_name,
      pos: a.order_index
    })))

    // 2. Comparamos a nova ordem processada com a ordem original (antes do drag)
    // para gerar as mudanças pendentes corretas.
    const originalAssignments = currentDayState.assignments;

    console.log('📋 Assignments originais:', originalAssignments.map(a => ({
      id: a.client_id,
      name: a.full_name,
      pos: a.order_index
    })))

    let mudancasDetectadas = 0

    processedAssignments.forEach((newAssignment) => {
      const originalAssignment = originalAssignments.find(
        (a) => a.client_id === newAssignment.client_id
      );

      if (originalAssignment) {
        console.log(`🔍 Comparando: ${newAssignment.full_name}`)
        console.log(`   Posição original: ${originalAssignment.order_index}`)
        console.log(`   Nova posição: ${newAssignment.order_index}`)
        
        // Se a posição original é diferente da nova posição processada, há uma mudança.
        if (originalAssignment.order_index !== newAssignment.order_index) {
          console.log(`✅ MUDANÇA DETECTADA: ${newAssignment.full_name} de ${originalAssignment.order_index} para ${newAssignment.order_index}`)
          addPendingChange(
            newAssignment.client_id,
            originalAssignment.order_index,
            newAssignment.order_index,
            currentDay,
            currentTeam
          );
          mudancasDetectadas++
        } else {
          console.log(`❌ Sem mudança para: ${newAssignment.full_name}`)
        }
      } else {
        // Este caso não deveria acontecer em um reorder, mas por segurança:
        // Se o cliente não existia antes, é uma adição.
        console.log(`➕ CLIENTE NOVO DETECTADO: ${newAssignment.full_name}`)
        addPendingChange(
          newAssignment.client_id,
          0, // Posição original 0 indica adição
          newAssignment.order_index,
          currentDay,
          currentTeam
        );
        mudancasDetectadas++
      }
    });
    
    console.log(`📊 Total de mudanças detectadas: ${mudancasDetectadas}`)
    console.log(`📝 Mudanças pendentes após operação:`, pendingChanges)
    
    // 3. Atualizamos o estado local com a lista processada, que tem os order_index corretos.
    setCurrentDayState(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        assignments: processedAssignments,
      };
    });
    
    toast.info('Ordem atualizada. Clique em "Salvar posições" para confirmar.')

  }, [currentDayState, addPendingChange, currentDay, pendingChanges, currentSortOrder, currentTeam])

  // Atualizar atributos específicos de um cliente na rota
  const updateClientAttributes = useCallback(async (
    clientId: string,
    hasKey?: boolean,
    serviceType?: 'ASPIRAR' | 'ESFREGAR'
  ) => {
    try {
      console.log('🔄 updateClientAttributes chamado:', { clientId, hasKey, serviceType, currentDay, currentTeam })
      
      // Atualizar no banco
      const success = await updateRouteClientAttributes(
        clientId,
        currentDay,
        currentTeam,
        hasKey,
        serviceType
      )
      
      if (success) {
        // Atualizar o estado local
        setCurrentDayState(prev => {
          if (!prev) return prev
          
          return {
            ...prev,
            assignments: prev.assignments.map(assignment => 
              assignment.client_id === clientId
                ? {
                    ...assignment,
                    has_key: hasKey !== undefined ? hasKey : assignment.has_key,
                    service_type: serviceType !== undefined ? serviceType : assignment.service_type
                  }
                : assignment
            )
          }
        })
        
        toast.success('Configurações do cliente atualizadas com sucesso!')
        return true
      } else {
        toast.error('Erro ao atualizar configurações do cliente')
        return false
      }
    } catch (err) {
      console.error('Erro ao atualizar atributos do cliente:', err)
      toast.error('Erro ao atualizar configurações do cliente')
      return false
    }
  }, [currentDay, currentTeam])

  return {
    // Estado atual
    dayState: currentDayState,
    assignments: getAssignmentsWithPendingChanges(),
    availableClients: currentDayState?.available_clients || [],
    
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
    reorderClients,
    changeTeam, // Adicionado para trocar de equipe
    updateClientAttributes, // Adicionado para atualizar atributos
    
    // Dia atual
    currentDay,
    currentSortOrder,
    currentTeam // Adicionado para mostrar a equipe atual
  }
}
