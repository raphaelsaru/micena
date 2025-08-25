'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDocument, formatPhone, formatCEP, formatMonthlyFeeInput, isValidDocument, isValidPhone } from '@/lib/formatters'
import { Client } from '@/types/database'
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


const createClientSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  document: z.string()
    .refine((val) => !val || val === '' || isValidDocument(val), 'CPF ou CNPJ inválido')
    .optional(),
  email: z.string().refine((val) => !val || val === '' || z.string().email().safeParse(val).success, 'Email inválido'),
  phone: z.string().refine((val) => !val || val === '' || isValidPhone(val), 'Telefone inválido'),
  address: z.string(),
  neighborhood: z.string(),
  postal_code: z.string(),
  pix_key: z.string(),
  is_recurring: z.boolean(),
  monthly_fee: z.string().refine((val) => {
    if (!val || val === '') return true // Campo opcional
    const num = parseFloat(val.replace(',', '.'))
    return !isNaN(num) && num >= 0
  }, 'Valor deve ser um número positivo').optional(),
  subscription_start_date: z.string().optional(),
  notes: z.string(),
})

type CreateClientFormData = z.infer<typeof createClientSchema>

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<Client>
}

export function CreateClientDialog({ open, onOpenChange, onClientCreated }: CreateClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isValid, isSubmitted },
  } = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      full_name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      neighborhood: '',
      postal_code: '',
      pix_key: '',
      is_recurring: false,
      monthly_fee: '',
      subscription_start_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

  // Observar valores dos campos obrigatórios
  const watchedValues = watch(['full_name'])
  const hasRequiredFields = watchedValues[0]
  const canSubmit = hasRequiredFields && (isValid || !isSubmitted)

  const onSubmit = async (data: CreateClientFormData) => {
    try {
      setIsSubmitting(true)
      
      // Limpar campos vazios
      const cleanData: Omit<Client, 'id' | 'created_at' | 'updated_at'> = {
        full_name: data.full_name,
        ...(data.document && data.document.trim() !== '' ? { document: data.document } : {}),
        email: data.email.trim() === '' ? undefined : data.email,
        phone: data.phone.trim() === '' ? undefined : data.phone,
        address: data.address.trim() === '' ? undefined : data.address,
        neighborhood: data.neighborhood.trim() === '' ? undefined : data.neighborhood,
        postal_code: data.postal_code.trim() === '' ? undefined : data.postal_code,
        pix_key: data.pix_key.trim() === '' ? undefined : data.pix_key,
        is_recurring: data.is_recurring,
        monthly_fee: data.monthly_fee && data.monthly_fee.trim() !== '' ? 
          (data.monthly_fee.includes(',') ? parseFloat(data.monthly_fee.trim().replace(',', '.')) : parseFloat(data.monthly_fee.trim() + '.00')) : undefined,
        subscription_start_date: data.subscription_start_date || undefined,
        notes: data.notes.trim() === '' ? undefined : data.notes,
      }
      
      await onClientCreated(cleanData)
      
      // Resetar formulário e fechar diálogo
      reset()
      onOpenChange(false)
    } catch {
      // Erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo cliente. Os campos marcados com * são obrigatórios.
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
              placeholder="Rua, número, cidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              {...register('neighborhood')}
              placeholder="Nome do bairro"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      maxLength={10}
                    />
                  )}
                />
                {errors.monthly_fee && (
                  <p className="text-sm text-red-600">{errors.monthly_fee.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_start_date">Data de Início da Mensalidade</Label>
                <Input
                  id="subscription_start_date"
                  type="date"
                  {...register('subscription_start_date')}
                  className={errors.subscription_start_date ? 'border-red-500' : ''}
                />
                {errors.subscription_start_date && (
                  <p className="text-sm text-red-600">{errors.subscription_start_date.message}</p>
                )}
              </div>
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
              title={!hasRequiredFields ? 'Preencha o Nome para habilitar' : ''}
            >
              {isSubmitting ? 'Criando...' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
