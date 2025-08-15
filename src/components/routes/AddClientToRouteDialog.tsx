import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, User, Phone, FileText } from 'lucide-react'
import { AvailableClient, DayOfWeek, DAY_LABELS } from '@/types/database'

interface AddClientToRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDay: DayOfWeek
  onAddClient: (clientId: string) => Promise<void>
  availableClients: AvailableClient[]
  isLoading?: boolean
}

export function AddClientToRouteDialog({
  open,
  onOpenChange,
  selectedDay,
  onAddClient,
  availableClients,
  isLoading = false
}: AddClientToRouteDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClients, setFilteredClients] = useState<AvailableClient[]>([])
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

  const handleSubmit = async (clientId: string) => {
    try {
      setIsSubmitting(true)
      await onAddClient(clientId)
      setSearchTerm('')
    } catch (err) {
      console.error('Erro ao adicionar cliente:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Adicionar Cliente à Rota - {DAY_LABELS[selectedDay]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, documento ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de clientes disponíveis */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
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
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSubmit(client.id)}
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
                      
                      <Button
                        size="sm"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informações adicionais */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p>
              <strong>Total de clientes disponíveis:</strong> {availableClients.length}
            </p>
            <p>
              <strong>Clientes filtrados:</strong> {filteredClients.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
