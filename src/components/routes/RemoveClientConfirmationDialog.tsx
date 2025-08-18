'use client'

import { useState } from 'react'
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
import { RouteAssignment } from '@/types/database'

interface RemoveClientConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientToRemove: RouteAssignment | null
  onConfirmRemove: () => Promise<void>
}

export function RemoveClientConfirmationDialog({
  open,
  onOpenChange,
  clientToRemove,
  onConfirmRemove,
}: RemoveClientConfirmationDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleConfirm = async () => {
    if (!clientToRemove) return
    
    try {
      setIsRemoving(true)
      await onConfirmRemove()
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao remover cliente:', err)
    } finally {
      setIsRemoving(false)
    }
  }

  const handleClose = () => {
    if (!isRemoving) {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover o cliente <strong>&quot;{clientToRemove?.full_name}&quot;</strong> da rota?
            <br /><br />
            Esta ação irá:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="px-6 -mt-2">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Remover o cliente da rota atual</li>
            <li>Reordenar automaticamente os demais clientes</li>
            <li>Adicionar o cliente de volta à lista de disponíveis</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            A operação será salva automaticamente após a confirmação.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isRemoving}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isRemoving ? 'Removendo...' : 'Remover Cliente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
