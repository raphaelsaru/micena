'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, MapPin, Calendar, Users } from 'lucide-react'
import { DayOfWeek, DAY_LABELS, TeamId } from '@/types/database'
import { getClientRouteAssignments, ClientRouteAssignment } from '@/lib/routes'

interface ClientSearchDialogProps {
  children: React.ReactNode
}

export function ClientSearchDialog({ children }: ClientSearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ClientRouteAssignment[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const results = await getClientRouteAssignments(searchTerm.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const resetSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setHasSearched(false)
  }

  const formatTeamName = (teamId: TeamId) => {
    return `Equipe ${teamId}`
  }

  const formatDayName = (weekday: DayOfWeek) => {
    return DAY_LABELS[weekday]
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        resetSearch()
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Cliente nas Rotas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite o nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchTerm.trim()}
              className="px-4"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {/* Resultados da busca */}
          {hasSearched && (
            <div className="space-y-3">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">
                    Cliente encontrado em {searchResults.length} rota(s):
                  </h3>
                  
                  {/* Container com scroll para resultados */}
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                    {searchResults.map((assignment, index) => (
                      <div 
                        key={`${assignment.client_id}-${assignment.weekday}-${assignment.team_id}`}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            {assignment.full_name}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">
                              <strong>Dia:</strong> {formatDayName(assignment.weekday)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">
                              <strong>Equipe:</strong> {formatTeamName(assignment.team_id)}
                            </span>
                          </div>
                          
                          {assignment.neighborhood && (
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <MapPin className="w-4 h-4 text-gray-600" />
                              <span className="text-gray-700">
                                <strong>Bairro:</strong> {assignment.neighborhood}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <span className="text-gray-700">
                              <strong>Posição na rota:</strong> #{assignment.order_index}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">
                    Cliente não encontrado
                  </h3>
                  <p className="text-gray-600 text-sm">
                    O cliente "{searchTerm}" não está adicionado em nenhuma rota.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
