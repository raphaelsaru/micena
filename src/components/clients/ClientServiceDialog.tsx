'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClientServiceHistory } from '@/components/services/ClientServiceHistory'
import { Client } from '@/types/database'

interface ClientServiceDialogProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientServiceDialog({ client, open, onOpenChange }: ClientServiceDialogProps) {
  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Serviços - {client.full_name}</DialogTitle>
        </DialogHeader>
        
        <ClientServiceHistory 
          clientId={client.id} 
          clientName={client.full_name}
        />
      </DialogContent>
    </Dialog>
  )
}
