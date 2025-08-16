'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, User, Phone, FileText, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { AvailableClient, DayOfWeek, DAY_LABELS, RouteAssignment } from '@/types/database'

interface AddClientToRouteWithPositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDay: DayOfWeek
  onAddClient: (clientId: string, position: 'start' | 'end' | 'between', betweenClientId?: string) => Promise<void>
  availableClients: AvailableClient[]
  currentAssignments: RouteAssignment[]
  isLoading?: boolean
}

export function AddClientToRouteWithPositionDialog({
  open,
  onOpenChange,
  selectedDay,
  onAddClient,
  availableClients,
  currentAssignments,
  isLoading = false
}: AddClientToRouteWithPositionDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClients, setFilteredClients] = useState<AvailableClient[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
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
        client.document.includes(searchTerm) ||
        (client.phone && client.phone.includes(searchTerm))
      )
      setFilteredClients(filtered)
    }
  }, [searchTerm, availableClients])

  // Resetar estado quando dialog abrir/fechar
  useEffect(() => {
    if (!open) {
      setSearchTerm('')
      setSelectedClient('')
      setSelectedPosition('end')
      setBetweenClientId('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedClient) {
      return
    }

    try {
      setIsSubmitting(true)
      
      if (selectedPosition === 'between' && !betweenClientId) {
        return
      }

      await onAddClient(selectedClient, selectedPosition, betweenClientId || undefined)
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao adicionar cliente:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const canSubmit = selectedClient && (
    selectedPosition !== 'between' || betweenClientId
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Adicionar Cliente à Rota - {DAY_LABELS[selectedDay]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
            <Label>Clientes Disponíveis</Label>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
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
                        selectedClient === client.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => setSelectedClient(client.id)}
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
                        
                        {selectedClient === client.id && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seleção de posição */}
          {selectedClient && (
            <div className="space-y-4">
              <Label>Escolher Posição</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Posição inicial */}
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
                      <div className="font-medium text-gray-900">Posição Inicial</div>
                      <div className="text-sm text-gray-600">Primeiro da lista</div>
                    </div>
                  </div>
                </div>

                {/* Posição final */}
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
                      <div className="font-medium text-gray-900">Posição Final</div>
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
                          {assignment.order_index}. {assignment.full_name}
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
              <strong>Clientes na rota atual:</strong> {currentAssignments.length}
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3">
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
              {isSubmitting ? 'Adicionando...' : 'Adicionar Cliente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
