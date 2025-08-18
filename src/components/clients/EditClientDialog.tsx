'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDocument, formatPhone, formatCEP, formatMonthlyFeeInput, isValidDocument, isValidPhone } from '@/lib/formatters'
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
  document: z.string()
    .refine((val) => !val || val === '' || isValidDocument(val), 'CPF ou CNPJ inválido')
    .optional(),
  email: z.string().refine((val) => !val || val === '' || z.string().email().safeParse(val).success, 'Email inválido'),
  phone: z.string().refine((val) => !val || val === '' || isValidPhone(val), 'Telefone inválido'),
  address: z.string(),
  postal_code: z.string(),
  pix_key: z.string(),
  is_recurring: z.boolean(),
  monthly_fee: z.string().refine((val) => {
    if (!val || val === '') return true // Campo opcional
    const num = parseFloat(val.replace(',', '.'))
    return !isNaN(num) && num >= 0
  }, 'Valor deve ser um número positivo').optional(),
  notes: z.string(),
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
    watch,
    formState: { errors, isValid, isSubmitted },
  } = useForm<EditClientFormData>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      full_name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      postal_code: '',
      pix_key: '',
      is_recurring: false,
      monthly_fee: '',
      notes: '',
    },
  })

  // Resetar formulário quando o cliente mudar
  useEffect(() => {
    if (client && open) {
      // Pequeno delay para garantir que o modal esteja completamente aberto
      const timer = setTimeout(() => {
        reset({
          full_name: client.full_name || '',
          document: client.document || '',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          postal_code: client.postal_code || '',
          pix_key: client.pix_key || '',
          is_recurring: client.is_recurring || false,
          monthly_fee: client.monthly_fee ? client.monthly_fee.toString() : '',
          notes: client.notes || '',
        })
      }, 100)
      
      return () => clearTimeout(timer)
    } else if (!client) {
      // Reset para valores padrão quando não há cliente
      reset({
        full_name: '',
        document: '',
        email: '',
        phone: '',
        address: '',
        postal_code: '',
        pix_key: '',
        is_recurring: false,
        monthly_fee: '',
        notes: '',
      })
    }
  }, [client, open, reset])

  // Observar valores dos campos obrigatórios
  const watchedValues = watch(['full_name'])
  const hasRequiredFields = watchedValues[0]
  const canSubmit = hasRequiredFields && (isValid || !isSubmitted)

  const onSubmit = async (data: EditClientFormData) => {
    if (!client) return
    
    try {
      setIsSubmitting(true)
      
      // Limpar campos vazios e converter tipos
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          if (key === 'monthly_fee' && typeof value === 'string') {
            return [key, value && value.trim() !== '' ? 
              (value.includes(',') ? parseFloat(value.replace(',', '.')) : parseFloat(value + '.00')) : undefined]
          }
          if (key === 'document') {
            return [key, typeof value === 'string' && value.trim() === '' ? null : value]
          }
          return [key, typeof value === 'string' && value.trim() === '' ? undefined : value]
        })
      )
      
      await onClientUpdated(client.id, cleanData)
      
      // Fechar diálogo
      onOpenChange(false)
    } catch {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            {client ? `Edite as informações do cliente "${client.full_name}".` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {client ? (
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
                CPF/CNPJ
              </Label>
              <Controller
                name="document"
                control={control}
                render={({ field }) => (
                  <Input
                    id="document"
                    value={field.value || ''}
                    onChange={(e) => {
                      const formatted = formatDocument(e.target.value)
                      field.onChange(formatted)
                    }}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    className={errors.document ? 'border-red-500' : ''}
                    maxLength={18}
                  />
                )}
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
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    value={field.value || ''}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value)
                      field.onChange(formatted)
                    }}
                    placeholder="(00) 00000-0000"
                    className={errors.phone ? 'border-red-500' : ''}
                    maxLength={15}
                  />
                )}
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
              <Controller
                name="postal_code"
                control={control}
                render={({ field }) => (
                  <Input
                    id="postal_code"
                    value={field.value || ''}
                    onChange={(e) => {
                      const formatted = formatCEP(e.target.value)
                      field.onChange(formatted)
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix_key">Responsável Pgto.</Label>
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

          {watch('is_recurring') && (
            <div className="space-y-2">
                             <Label htmlFor="monthly_fee">Valor Mensal (R$)</Label>
              <Controller
                name="monthly_fee"
                control={control}
                render={({ field }) => (
                  <Input
                    id="monthly_fee"
                    value={field.value || ''}
                                         onChange={(e) => {
                       const formatted = formatMonthlyFeeInput(e.target.value)
                       field.onChange(formatted)
                     }}
                                         placeholder="Digite o valor"
                    className={errors.monthly_fee ? 'border-red-500' : ''}
                  />
                )}
              />
              {errors.monthly_fee && (
                <p className="text-sm text-red-600">{errors.monthly_fee.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre o cliente..."
              rows={3}
            />
          </div>

          {!hasRequiredFields && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-red-500">*</span>
              <span>Campo obrigatório: Nome deve ser preenchido</span>
            </div>
          )}

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
              disabled={!canSubmit || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
              title={!hasRequiredFields ? 'Preencha Nome e Documento para habilitar' : ''}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
