'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { Edit, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ClientServiceDialog } from './ClientServiceDialog'
import { EditClientDialog } from './EditClientDialog'
import { Client } from '@/types/database'
import { formatCurrency, formatDocument, formatPhone } from '@/lib/formatters'
import { displayDate } from '@/lib/utils'


interface ClientListProps {
  clients: Client[]
  isLoading: boolean
  onClientUpdated: (id: string, clientData: Partial<Client>) => Promise<Client>
  onClientDeleted: (id: string) => Promise<void>
  onBeforeOpenDialog?: () => void
}

const ClientListComponent = memo(function ClientList({ clients, isLoading, onClientUpdated, onClientDeleted, onBeforeOpenDialog }: ClientListProps) {
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [serviceDialogClient, setServiceDialogClient] = useState<Client | null>(null)

  // Remove duplicatas baseado no ID para evitar erros de chave
  const uniqueClients = clients.filter((client, index, self) => 
    index === self.findIndex(c => c.id === client.id)
  )

  const handleDelete = async () => {
    if (!clientToDelete) return
    
    try {
      await onClientDeleted(clientToDelete.id)
      setClientToDelete(null)
    } catch {
      // Erro já tratado no hook
    }
  }

  // Função otimizada para abrir o modal de edição
  const handleEditClick = useCallback((client: Client) => {
    // Chamar onBeforeOpenDialog se existir
    onBeforeOpenDialog?.()
    
    // Usar setTimeout para garantir que o modal abra após o blur
    setTimeout(() => {
      setClientToEdit({ ...client })
    }, 50)
  }, [onBeforeOpenDialog])

  // Função otimizada para abrir o modal de serviços
  const handleServiceClick = useCallback((client: Client) => {
    onBeforeOpenDialog?.()
    
    setTimeout(() => {
      setServiceDialogClient({ ...client })
    }, 50)
  }, [onBeforeOpenDialog])

  // Função otimizada para abrir o modal de exclusão
  const handleDeleteClick = useCallback((client: Client) => {
    onBeforeOpenDialog?.()
    
    setTimeout(() => {
      setClientToDelete({ ...client })
    }, 50)
  }, [onBeforeOpenDialog])

  const formatDocument = (document?: string) => {
    if (!document) return 'Não informado'
    
    if (document.length === 11) {
      // CPF: 000.000.000-00
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (document.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return document
  }

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Nenhum cliente encontrado</p>
        <p className="text-sm text-gray-400">Comece criando seu primeiro cliente</p>
      </div>
    )
  }

  return (
    <>
      <div className="mobile-grid-1">
        {uniqueClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="mobile-card-content">
              <div className="space-y-3">
                {/* Cabeçalho do cliente */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mobile-text-lg text-gray-900 truncate">
                      {client.full_name}
                    </h3>
                    {client.is_recurring && (
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 mobile-text-sm">
                          Mensalista
                        </Badge>
                        {client.monthly_fee && (
                          <Badge variant="outline" className="text-green-700 border-green-300 mobile-text-sm">
                            {formatCurrency(client.monthly_fee)}
                          </Badge>
                        )}
                        {client.subscription_start_date && (
                          <Badge variant="outline" className="text-blue-700 border-blue-300 mobile-text-sm">
                            <span className="mobile-hidden">Início: </span>
                            {displayDate(client.subscription_start_date)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Informações do cliente */}
                <div className="space-y-2 mobile-text-sm text-gray-600">
                  {client.document && (
                    <div>
                      <span className="font-medium">CPF/CNPJ:</span> {formatDocument(client.document)}
                    </div>
                  )}
                  {client.address && (
                    <div>
                      <span className="font-medium">Endereço:</span> {client.address}
                      {client.neighborhood && ` - ${client.neighborhood}`}
                      {client.postal_code && ` - ${client.postal_code}`}
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <span className="font-medium">Telefone:</span> {formatPhone(client.phone)}
                    </div>
                  )}
                  {client.pix_key && (
                    <div>
                      <span className="font-medium">Responsável Pgto.:</span> {client.pix_key}
                    </div>
                  )}
                  {client.notes && (
                    <div>
                      <span className="font-medium">Observações:</span> {client.notes}
                    </div>
                  )}
                </div>
                
                {/* Botões de ação */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(client)}
                    className="min-h-[40px] min-w-[40px]"
                  >
                    <Edit className="h-5 w-5" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServiceClick(client)}
                    title="Ver histórico de serviços"
                    className="min-h-[40px] min-w-[40px]"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="sr-only">Histórico</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(client)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[40px] min-w-[40px]"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EditClientDialog
        client={clientToEdit}
        open={!!clientToEdit}
        onOpenChange={(open) => !open && setClientToEdit(null)}
        onClientUpdated={onClientUpdated}
      />

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente &quot;{clientToDelete?.full_name}&quot;? 
              Esta ação não pode ser desfeita e também removerá todos os serviços e pagamentos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClientServiceDialog
        client={serviceDialogClient}
        open={!!serviceDialogClient}
        onOpenChange={(open) => !open && setServiceDialogClient(null)}
      />
    </>
  )
})

export { ClientListComponent as ClientList }
