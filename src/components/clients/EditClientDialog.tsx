'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Client } from '@/types/database'

const editClientSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  document: z.string().min(11, 'Documento deve ter pelo menos 11 dígitos').max(18, 'Documento muito longo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(15, 'Telefone muito longo').optional().or(z.literal('')),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  pix_key: z.string().optional(),
  is_recurring: z.boolean(),
  notes: z.string().optional(),
})

type EditClientFormData = z.infer<typeof editClientSchema>

interface EditClientDialogProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdated: (id: string, clientData: Partial<Client>) => Promise<Client>
}

export function EditClientDialog({ client, open, onOpenChange, onClientUpdated }: EditClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
  })

  // Resetar formulário quando o cliente mudar
  useEffect(() => {
    if (client) {
      reset({
        full_name: client.full_name,
        document: client.document,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        postal_code: client.postal_code || '',
        pix_key: client.pix_key || '',
        is_recurring: client.is_recurring,
        notes: client.notes || '',
      })
    }
  }, [client, reset])

  const onSubmit = async (data: EditClientFormData) => {
    if (!client) return
    
    try {
      setIsSubmitting(true)
      
      // Limpar campos vazios
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          typeof value === 'string' && value.trim() === '' ? undefined : value
        ])
      )
      
      await onClientUpdated(client.id, cleanData)
      
      // Fechar diálogo
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Editar Cliente
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Edite as informações do cliente "{client.full_name}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Nome Completo / Razão Social *
              </Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="Nome completo ou razão social"
                className={errors.full_name ? 'border-red-500' : ''}
              />
              {errors.full_name && (
                <p className="text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">
                CPF/CNPJ *
              </Label>
              <Input
                id="document"
                {...register('document')}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                className={errors.document ? 'border-red-500' : ''}
              />
              {errors.document && (
                <p className="text-sm text-red-600">{errors.document.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="cliente@email.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(00) 00000-0000"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">CEP</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
                placeholder="00000-000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                {...register('pix_key')}
                placeholder="CPF, email, telefone ou chave aleatória"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_recurring" className="text-sm font-medium">
              Cliente mensalista (serviços recorrentes)
            </Label>
            <Controller
              name="is_recurring"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is_recurring"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre o cliente..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
