import { useState, useCallback, useEffect } from 'react'
import { RouteAssignment } from '@/types/database'

interface UseMobileSelectionProps {
  assignments: RouteAssignment[]
  onTeamChange?: () => void
  onDayChange?: () => void
}

export function useMobileSelection({ 
  assignments, 
  onTeamChange, 
  onDayChange 
}: UseMobileSelectionProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set())

  // Limpar seleção quando trocar de equipe ou dia
  useEffect(() => {
    setSelectedClientIds(new Set())
  }, [onTeamChange, onDayChange])

  // Limpar seleção quando assignments mudarem (nova rota)
  useEffect(() => {
    setSelectedClientIds(new Set())
  }, [assignments])

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      const newMode = !prev
      if (!newMode) {
        // Sair do modo seleção - limpar seleção
        setSelectedClientIds(new Set())
      }
      return newMode
    })
  }, [])

  const toggleClientSelection = useCallback((clientId: string) => {
    setSelectedClientIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }, [])

  const selectAllClients = useCallback(() => {
    const allClientIds = assignments.map(a => a.client_id)
    setSelectedClientIds(new Set(allClientIds))
  }, [assignments])

  const deselectAllClients = useCallback(() => {
    setSelectedClientIds(new Set())
  }, [])

  const isAllSelected = selectedClientIds.size === assignments.length && assignments.length > 0
  const isSomeSelected = selectedClientIds.size > 0
  const selectedCount = selectedClientIds.size

  const getSelectedAssignments = useCallback(() => {
    return assignments.filter(a => selectedClientIds.has(a.client_id))
  }, [assignments, selectedClientIds])

  return {
    isSelectionMode,
    selectedClientIds,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    toggleSelectionMode,
    toggleClientSelection,
    selectAllClients,
    deselectAllClients,
    getSelectedAssignments,
    isClientSelected: (clientId: string) => selectedClientIds.has(clientId)
  }
}
