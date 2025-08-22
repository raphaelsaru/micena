'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, User, Phone, FileText, ArrowUp, ArrowDown, Minus, Check, X, MapPin } from 'lucide-react'
import { AvailableClient, DayOfWeek, DAY_LABELS, RouteAssignment } from '@/types/database'
import { formatRouteNumber } from '@/lib/utils'

interface AddClientToRouteWithPositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDay: DayOfWeek
  currentTeam: number
  onAddClient: (clientIds: string[], position: 'start' | 'end' | 'between', betweenClientId?: string) => Promise<void>
  availableClients: AvailableClient[]
  currentAssignments: RouteAssignment[]
  isLoading?: boolean
}

export function AddClientToRouteWithPositionDialog({
  open,
  onOpenChange,
  selectedDay,
  currentTeam,
  onAddClient,
  availableClients,
  currentAssignments,
  isLoading = false
}: AddClientToRouteWithPositionDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClients, setFilteredClients] = useState<AvailableClient[]>([])
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [selectedPosition, setSelectedPosition] = useState<'start' | 'end' | 'between'>('end')
  const [betweenClientId, setBetweenClientId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrar clientes baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(availableClients)
    } else {
      const filtered = availableClients.filter(client =>
        client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.document && client.document.includes(searchTerm)) ||
        (client.phone && client.phone.includes(searchTerm))
      )
      setFilteredClients(filtered)
    }
  }, [searchTerm, availableClients])

  // Resetar estado quando dialog abrir/fechar
  useEffect(() => {
    if (!open) {
      setSearchTerm('')
      setSelectedClients(new Set())
      setSelectedPosition('end')
      setBetweenClientId('')
    }
  }, [open])

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    setSelectedClients(new Set(filteredClients.map(client => client.id)))
  }

  const handleDeselectAll = () => {
    setSelectedClients(new Set())
  }

  const handleSubmit = async () => {
    if (selectedClients.size === 0) {
      return
    }

    try {
      setIsSubmitting(true)
      
      if (selectedPosition === 'between' && !betweenClientId) {
        return
      }

      // Adicionar todos os clientes selecionados de uma vez
      const clientIds = Array.from(selectedClients)
      await onAddClient(clientIds, selectedPosition, betweenClientId || undefined)
      
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao adicionar clientes:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const canSubmit = selectedClients.size > 0 && (
    selectedPosition !== 'between' || betweenClientId
  )

  const selectedClientsList = Array.from(selectedClients).map(id => 
    availableClients.find(client => client.id === id)
  ).filter(Boolean) as AvailableClient[]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Adicionar Cliente à Rota - {DAY_LABELS[selectedDay]} - Equipe {currentTeam}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Campo de busca */}
          <div className="space-y-2">
            <Label htmlFor="client-search">Buscar Cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="client-search"
                placeholder="Buscar por nome, documento ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de clientes disponíveis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Clientes Disponíveis</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs"
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>
            
            {/* Contador de selecionados */}
            {selectedClients.size > 0 && (
              <div className="text-sm text-blue-600 font-medium">
                {selectedClients.size} cliente(s) selecionado(s)
              </div>
            )}
            
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Carregando clientes...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {searchTerm ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente disponível para este dia.'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedClients.has(client.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleClientToggle(client.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {client.full_name}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {client.neighborhood && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{client.neighborhood}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <FileText className="w-3 h-3" />
                                <span>{client.document}</span>
                              </div>
                              {client.phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{client.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {selectedClients.has(client.id) && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lista de clientes selecionados */}
          {selectedClientsList.length > 0 && (
            <div className="space-y-2">
              <Label>Clientes Selecionados</Label>
              <div className="border rounded-lg bg-blue-50 p-3">
                <div className="space-y-2">
                  {selectedClientsList.map((client) => (
                    <div key={client.id} className="flex items-center justify-between bg-white p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{client.full_name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClientToggle(client.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Seleção de posição */}
          {selectedClients.size > 0 && (
            <div className="space-y-4">
              <Label>Escolher Posição</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Menor número */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPosition === 'start'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPosition('start')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Menor número</div>
                      <div className="text-sm text-gray-600">Primeiro da lista</div>
                    </div>
                  </div>
                </div>

                {/* Maior número */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPosition === 'end'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPosition('end')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowDown className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Maior número</div>
                      <div className="text-sm text-gray-600">Último da lista</div>
                    </div>
                  </div>
                </div>

                {/* Entre clientes */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPosition === 'between'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPosition('between')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Minus className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Entre Clientes</div>
                      <div className="text-sm text-gray-600">Escolher posição</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seleção de cliente para posição entre */}
              {selectedPosition === 'between' && currentAssignments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="between-client">Escolher após qual cliente</Label>
                  <Select value={betweenClientId} onValueChange={setBetweenClientId}>
                    <SelectTrigger id="between-client">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentAssignments.map((assignment) => (
                        <SelectItem key={assignment.client_id} value={assignment.client_id}>
                          {formatRouteNumber(assignment.order_index)}. {assignment.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Informações adicionais */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p>
              <strong>Total de clientes disponíveis:</strong> {availableClients.length}
            </p>
            <p>
              <strong>Clientes filtrados:</strong> {filteredClients.length}
            </p>
            <p>
              <strong>Clientes selecionados:</strong> {selectedClients.size}
            </p>
            <p>
              <strong>Clientes na rota atual:</strong> {currentAssignments.length}
            </p>
          </div>
        </div>

        {/* Botões de ação - Fixos na parte inferior */}
        <div className="flex justify-end space-x-3 pt-4 border-t bg-white sticky bottom-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting 
              ? `Adicionando ${selectedClients.size} cliente(s)...` 
              : `Adicionar ${selectedClients.size} Cliente(s)`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
