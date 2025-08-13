'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ServiceOrder } from './ServiceOrder'
import { ServiceWithClient } from '@/types/database'

interface ServiceOrderDialogProps {
  service: ServiceWithClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServiceOrderDialog({ service, open, onOpenChange }: ServiceOrderDialogProps) {
  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Ordem de Serviço - {service.clients?.full_name}</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-0">
          <ServiceOrder service={service} onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
