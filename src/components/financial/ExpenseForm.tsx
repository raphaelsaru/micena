'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useExpenses } from '@/hooks/useExpenses'
import { useMaterials } from '@/hooks/useMaterials'
import { ExpenseType, Material } from '@/types/database'
import { Receipt, Package, Users, FileText, CreditCard, MoreHorizontal, Plus } from 'lucide-react'
import { toast } from 'sonner'

const EXPENSE_TYPE_OPTIONS: { value: ExpenseType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'MATERIAL',
    label: 'Material',
    icon: <Package className="h-4 w-4" />,
    description: 'Compra de materiais e produtos'
  },
  {
    value: 'FOLHA_PAGAMENTO',
    label: 'Folha de Pagamento',
    icon: <Users className="h-4 w-4" />,
    description: 'Salários e benefícios dos funcionários'
  },
  {
    value: 'IMPOSTOS',
    label: 'Impostos',
    icon: <FileText className="h-4 w-4" />,
    description: 'Impostos e taxas governamentais'
  },
  {
    value: 'CONTAS_FIXAS',
    label: 'Contas Fixas',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Aluguel, energia, água, telefone, etc.'
  },
  {
    value: 'OUTROS',
    label: 'Outros',
    icon: <MoreHorizontal className="h-4 w-4" />,
    description: 'Outras despesas não categorizadas'
  }
]

interface ExpenseFormProps {
  onExpenseCreated?: () => void
  variant?: 'button' | 'modal'
}

export function ExpenseForm({ onExpenseCreated, variant = 'modal' }: ExpenseFormProps) {
  const { createExpense } = useExpenses()
  const { materials } = useMaterials()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    expense_type: 'MATERIAL' as ExpenseType,
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    material_id: '',
    quantity: '',
    unit_price: '',
    supplier: '',
    notes: ''
  })

  const selectedExpenseType = EXPENSE_TYPE_OPTIONS.find(option => option.value === formData.expense_type)
  const selectedMaterial = materials.find(material => material.id === formData.material_id)

  // Calcular valor total automaticamente para materiais
  useEffect(() => {
    if (formData.expense_type === 'MATERIAL' && formData.quantity && formData.unit_price) {
      const quantity = parseFloat(formData.quantity)
      const unitPrice = parseFloat(formData.unit_price)
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        setFormData(prev => ({ ...prev, amount: (quantity * unitPrice).toFixed(2) }))
      }
    }
  }, [formData.quantity, formData.unit_price, formData.expense_type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validações
      // Descrição é obrigatória apenas para despesas que não são de material
      if (formData.expense_type !== 'MATERIAL' && !formData.description.trim()) {
        toast.error('Descrição é obrigatória')
        return
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error('Valor deve ser maior que zero')
        return
      }

      if (!formData.expense_date) {
        toast.error('Data da despesa é obrigatória')
        return
      }

      // Para despesas de material, validar se material foi selecionado
      if (formData.expense_type === 'MATERIAL' && !formData.material_id) {
        toast.error('Material é obrigatório para despesas de material')
        return
      }

      // Preparar dados para envio
      const expenseData: any = {
        description: formData.description.trim() || undefined,
        expense_type: formData.expense_type,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        supplier: formData.supplier.trim() || undefined,
        notes: formData.notes.trim() || undefined
      }

      // Adicionar dados específicos de material se aplicável
      if (formData.expense_type === 'MATERIAL') {
        expenseData.material_id = formData.material_id
        if (formData.quantity) {
          expenseData.quantity = parseFloat(formData.quantity)
        }
        if (formData.unit_price) {
          expenseData.unit_price = parseFloat(formData.unit_price)
        }
      }

      await createExpense(expenseData)
      
      toast.success('Despesa lançada com sucesso!')
      
      // Notificar componente pai para atualizar resumos
      if (onExpenseCreated) {
        onExpenseCreated()
      }
      
      // Limpar formulário e fechar modal
      setFormData({
        description: '',
        expense_type: 'MATERIAL',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        material_id: '',
        quantity: '',
        unit_price: '',
        supplier: '',
        notes: ''
      })
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Erro ao lançar despesa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExpenseTypeChange = (type: ExpenseType) => {
    setFormData(prev => ({
      ...prev,
      expense_type: type,
      material_id: type === 'MATERIAL' ? prev.material_id : '',
      quantity: type === 'MATERIAL' ? prev.quantity : '',
      unit_price: type === 'MATERIAL' ? prev.unit_price : ''
    }))
  }

  const resetForm = () => {
    setFormData({
      description: '',
      expense_type: 'MATERIAL',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      material_id: '',
      quantity: '',
      unit_price: '',
      supplier: '',
      notes: ''
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    resetForm()
  }

  // Se for variant button, retorna apenas o botão
  if (variant === 'button') {
    return (
      <>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Lançar Nova Despesa
              </DialogTitle>
              <DialogDescription>
                Registre uma nova despesa no sistema financeiro
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data da Despesa */}
              <div>
                <Label htmlFor="expense_date">Data da Despesa *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                  required
                />
              </div>

              {/* Tipo de Despesa */}
              <div>
                <Label htmlFor="expense_type">Tipo de Despesa *</Label>
                <Select value={formData.expense_type} onValueChange={handleExpenseTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campos específicos para Material */}
              {formData.expense_type === 'MATERIAL' && (
                <>
                  <div>
                    <Label htmlFor="material_id">Material *</Label>
                    <Select value={formData.material_id} onValueChange={(value) => setFormData(prev => ({ ...prev, material_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="1"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit_price">Preço Unitário (R$)</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Descrição */}
              <div>
                <Label htmlFor="description">
                  Descrição {formData.expense_type !== 'MATERIAL' && '*'}
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={formData.expense_type === 'MATERIAL' ? 'Descrição opcional...' : 'Descreva a despesa...'}
                  required={formData.expense_type !== 'MATERIAL'}
                />
                {formData.expense_type === 'MATERIAL' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Para despesas de material, a descrição é opcional
                  </p>
                )}
              </div>

              {/* Valor Total */}
              <div>
                <Label htmlFor="amount">Valor Total (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                  disabled={formData.expense_type === 'MATERIAL' && !!formData.quantity && !!formData.unit_price}
                />
                {formData.expense_type === 'MATERIAL' && formData.quantity && formData.unit_price && (
                  <p className="text-xs text-gray-500 mt-1">
                    Valor calculado automaticamente: {formData.quantity} × R$ {formData.unit_price} = R$ {formData.amount}
                  </p>
                )}
              </div>

              {/* Fornecedor */}
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Nome do fornecedor (opcional)"
                />
              </div>

              {/* Observações */}
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações adicionais (opcional)"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleModalClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Lançando...' : 'Lançar Despesa'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Variant modal (comportamento original) - mantido para compatibilidade
  return null
}
