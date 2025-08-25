'use client'

import { useState, useCallback } from 'react'
import { Edit, Trash2, FileText, DollarSign } from 'lucide-react'
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
import { formatCurrency } from '@/lib/formatters'


interface ClientListProps {
  clients: Client[]
  isLoading: boolean
  onClientUpdated: (id: string, clientData: Partial<Client>) => Promise<Client>
  onClientDeleted: (id: string) => Promise<void>
  onBeforeOpenDialog?: () => void
}

export function ClientList({ clients, isLoading, onClientUpdated, onClientDeleted, onBeforeOpenDialog }: ClientListProps) {
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [serviceDialogClient, setServiceDialogClient] = useState<Client | null>(null)

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
      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {client.full_name}
                    </h3>
                    {client.is_recurring && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Mensalista
                        </Badge>
                        {client.monthly_fee && (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            {formatCurrency(client.monthly_fee)}
                          </Badge>
                        )}
                        {client.subscription_start_date && (
                          <Badge variant="outline" className="text-blue-700 border-blue-300">
                            Início: {new Date(client.subscription_start_date).toLocaleDateString('pt-BR')}
                          </Badge>
                        )}
                        {client.document && (
                      <div>
                        <span className="font-medium">CPF/CNPJ:</span> {formatDocument(client.document)}
                      </div>
                    )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    
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
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServiceClick(client)}
                    title="Ver histórico de serviços"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* TODO: Navegar para financeiro */}}
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(client)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
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
}
