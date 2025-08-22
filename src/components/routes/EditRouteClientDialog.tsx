'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RouteAssignment } from '@/types/database'

interface EditRouteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: RouteAssignment | null
  onSave: (clientId: string, hasKey: boolean, serviceType: 'ASPIRAR' | 'ESFREGAR') => Promise<void>
  isLoading?: boolean
}

export function EditRouteClientDialog({
  open,
  onOpenChange,
  assignment,
  onSave
}: EditRouteClientDialogProps) {
  const [hasKey, setHasKey] = useState(false)
  const [serviceType, setServiceType] = useState<'ASPIRAR' | 'ESFREGAR'>('ASPIRAR')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Resetar estado quando dialog abrir/fechar ou assignment mudar
  useEffect(() => {
    if (open && assignment) {
      setHasKey(assignment.has_key || false)
      setServiceType(assignment.service_type || 'ASPIRAR')
    } else if (!open) {
      setHasKey(false)
      setServiceType('ASPIRAR')
      setIsSubmitting(false)
    }
  }, [open, assignment])

  const handleSubmit = async () => {
    if (!assignment) return

    try {
      setIsSubmitting(true)
      await onSave(assignment.client_id, hasKey, serviceType)
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Configurações de Serviço</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do cliente */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Cliente</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{assignment.full_name}</p>
              {assignment.neighborhood && (
                <p className="text-sm text-gray-600">Bairro: {assignment.neighborhood}</p>
              )}
            </div>
          </div>

          {/* Configurações de serviço */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Configurações de Serviço</Label>
            
            {/* Campo Possui Chave */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="has-key" className="text-sm font-medium">
                  Possui chave?
                </Label>
                <Switch
                  id="has-key"
                  checked={hasKey}
                  onCheckedChange={setHasKey}
                />
              </div>
              <p className="text-xs text-gray-500">
                Marque se o cliente possui chave para acesso
              </p>
            </div>

            {/* Campo Tipo de Serviço */}
            <div className="space-y-2">
              <Label htmlFor="service-type">Tipo de Serviço *</Label>
              <Select value={serviceType} onValueChange={(value: 'ASPIRAR' | 'ESFREGAR') => setServiceType(value)}>
                <SelectTrigger id="service-type">
                  <SelectValue placeholder="Selecione o tipo de serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASPIRAR">Aspirar</SelectItem>
                  <SelectItem value="ESFREGAR">Esfregar</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Escolha o tipo de serviço que será prestado
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
