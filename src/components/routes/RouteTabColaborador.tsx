'use client'

import { useState, useEffect, useMemo } from 'react'
import { RouteAssignment } from '@/types/database'
import { DAY_LABELS } from '@/types/database'
import { RouteClientCardColaborador } from './RouteClientCardColaborador'
import { Users, ArrowUp, ArrowDown, Save, Columns, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getClientById } from '@/lib/clients'
import { Client } from '@/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface RouteTabColaboradorProps {
  dayOfWeek: number
  currentTeam: number
  assignments: RouteAssignment[]
  isLoading: boolean
}

export function RouteTabColaborador({ 
  dayOfWeek, 
  currentTeam,
  assignments, 
  isLoading 
}: RouteTabColaboradorProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isTwoColumnLayout, setIsTwoColumnLayout] = useState(true)

  const handleViewClient = (clientId: string) => {
    setSelectedClientId(clientId)
  }

  const handleCloseClientDetails = () => {
    setSelectedClientId(null)
  }

  // Aplicar ordenação
  const sortedAssignments = useMemo(() => {
    if (currentSortOrder === 'asc') {
      return [...assignments].sort((a, b) => a.order_index - b.order_index)
    } else {
      return [...assignments].sort((a, b) => b.order_index - a.order_index)
    }
  }, [assignments, currentSortOrder])

  // Dividir assignments para layout de 2 colunas
  const { leftColumn, rightColumn } = useMemo(() => {
    if (!isTwoColumnLayout || sortedAssignments.length === 0) {
      return { leftColumn: [], rightColumn: [] }
    }

    const totalClients = sortedAssignments.length
    const leftColumnSize = Math.ceil(totalClients / 2)
    
    return {
      leftColumn: sortedAssignments.slice(0, leftColumnSize),
      rightColumn: sortedAssignments.slice(leftColumnSize)
    }
  }, [isTwoColumnLayout, sortedAssignments])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando rota...</span>
      </div>
    )
  }

  // Se não está carregando mas não tem assignments, pode ser que ainda não carregou
  if (!isLoading && assignments.length === 0) {
    return (
      <div className="text-center py-12 print:hidden">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum cliente na rota
        </h3>
        <p className="text-gray-600">
          Não há clientes atribuídos para {DAY_LABELS[dayOfWeek as keyof typeof DAY_LABELS].toLowerCase()} da Equipe {currentTeam}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles de ordenação e layout */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Controle de ordenação */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="sort-order" className="text-sm font-medium text-gray-700">
              Ordenação:
            </Label>
            <Select value={currentSortOrder} onValueChange={(value: 'asc' | 'desc') => setCurrentSortOrder(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">
                  <div className="flex items-center space-x-2">
                    <ArrowUp className="w-4 h-4" />
                    <span>Crescente</span>
                  </div>
                </SelectItem>
                <SelectItem value="desc">
                  <div className="flex items-center space-x-2">
                    <ArrowDown className="w-4 h-4" />
                    <span>Decrescente</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Controle de layout */}
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium text-gray-700">
              Layout:
            </Label>
            <div className="flex border rounded-md">
              <Button
                variant={isTwoColumnLayout ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setIsTwoColumnLayout(true)}
                className="rounded-r-none"
              >
                <Columns className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">2 Colunas</span>
              </Button>
              <Button
                variant={!isTwoColumnLayout ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setIsTwoColumnLayout(false)}
                className="rounded-l-none"
              >
                <List className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">1 Coluna</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="print:hidden">
        {isTwoColumnLayout ? (
          // Layout de 2 colunas
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna esquerda */}
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-500 mb-3 font-medium">
                Coluna 1
              </div>
              {leftColumn.map((assignment) => (
                <RouteClientCardColaborador
                  key={assignment.client_id}
                  assignment={assignment}
                  onView={() => handleViewClient(assignment.client_id)}
                  currentSortOrder={currentSortOrder}
                />
              ))}
            </div>
            
            {/* Coluna direita */}
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-500 mb-3 font-medium">
                Coluna 2
              </div>
              {rightColumn.map((assignment) => (
                <RouteClientCardColaborador
                  key={assignment.client_id}
                  assignment={assignment}
                  onView={() => handleViewClient(assignment.client_id)}
                  currentSortOrder={currentSortOrder}
                />
              ))}
            </div>
          </div>
        ) : (
          // Layout de 1 coluna
          <div className="space-y-3">
            {sortedAssignments.map((assignment) => (
              <RouteClientCardColaborador
                key={assignment.client_id}
                assignment={assignment}
                onView={() => handleViewClient(assignment.client_id)}
                currentSortOrder={currentSortOrder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalhes do cliente */}
      {selectedClientId && (
        <ClientDetailsModal
          clientId={selectedClientId}
          onClose={handleCloseClientDetails}
        />
      )}

    </div>
  )
}

// Modal para mostrar detalhes completos do cliente
function ClientDetailsModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true)
        setError(null)
        const clientData = await getClientById(clientId)
        setClient(clientData)
      } catch (err) {
        setError('Erro ao carregar dados do cliente')
        console.error('Erro ao carregar cliente:', err)
      } finally {
        setLoading(false)
      }
    }

    loadClient()
  }, [clientId])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Detalhes do Cliente</h3>
            <Button onClick={onClose} variant="outline" size="sm">
              ✕
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {client && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <p className="text-gray-900">{client.full_name}</p>
                </div>

                {client.document && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Documento
                    </label>
                    <p className="text-gray-900">{client.document}</p>
                  </div>
                )}

                {client.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <p className="text-gray-900">{client.email}</p>
                  </div>
                )}

                {client.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <p className="text-gray-900">{client.phone}</p>
                  </div>
                )}

                {client.neighborhood && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro
                    </label>
                    <p className="text-gray-900">{client.neighborhood}</p>
                  </div>
                )}

                {client.postal_code && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                    </label>
                    <p className="text-gray-900">{client.postal_code}</p>
                  </div>
                )}
              </div>

              {/* Endereço completo */}
              {client.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <p className="text-gray-900">{client.address}</p>
                </div>
              )}


              {/* Observações */}
              {client.notes && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {client.notes}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
