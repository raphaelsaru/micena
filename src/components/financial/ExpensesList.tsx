'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useExpenses } from '@/hooks/useExpenses'
import { useMaterials } from '@/hooks/useMaterials'
import { ExpenseType, ExpenseWithMaterial } from '@/types/database'
import { Search, Filter, Edit, Trash2, Receipt, Package, Users, FileText, CreditCard, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

const EXPENSE_TYPE_LABELS: Record<ExpenseType, { label: string; icon: React.ReactNode; color: string }> = {
  MATERIAL: { label: 'Material', icon: <Package className="h-3 w-3" />, color: 'bg-blue-100 text-blue-800' },
  FOLHA_PAGAMENTO: { label: 'Folha de Pagamento', icon: <Users className="h-3 w-3" />, color: 'bg-green-100 text-green-800' },
  IMPOSTOS: { label: 'Impostos', icon: <FileText className="h-3 w-3" />, color: 'bg-red-100 text-red-800' },
  CONTAS_FIXAS: { label: 'Contas Fixas', icon: <CreditCard className="h-3 w-3" />, color: 'bg-purple-100 text-purple-800' },
  OUTROS: { label: 'Outros', icon: <MoreHorizontal className="h-3 w-3" />, color: 'bg-gray-100 text-gray-800' }
}

export function ExpensesList() {
  const { expenses, loading, error, updateExpense, deleteExpense } = useExpenses()
  const { materials } = useMaterials()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ExpenseType | 'TODOS'>('TODOS')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithMaterial | null>(null)
  const [formData, setFormData] = useState({
    description: '',
    expense_type: 'MATERIAL' as ExpenseType,
    amount: '',
    expense_date: '',
    material_id: '',
    quantity: '',
    unit_price: '',
    supplier: '',
    notes: ''
  })

  // Calcular valor total automaticamente para materiais
  React.useEffect(() => {
    if (formData.expense_type === 'MATERIAL' && formData.quantity && formData.unit_price) {
      const quantity = parseFloat(formData.quantity)
      const unitPrice = parseFloat(formData.unit_price)
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        setFormData(prev => ({ ...prev, amount: (quantity * unitPrice).toFixed(2) }))
      }
    }
  }, [formData.quantity, formData.unit_price, formData.expense_type])

  // Filtrar despesas
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (expense.supplier?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (expense.material?.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === 'TODOS' || expense.expense_type === typeFilter

    return matchesSearch && matchesType
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getExpenseTypeBadge = (type: ExpenseType) => {
    const config = EXPENSE_TYPE_LABELS[type]
    return (
      <Badge className={config.color}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    )
  }

  const handleEditExpense = (expense: ExpenseWithMaterial) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description || '',
      expense_type: expense.expense_type,
      amount: expense.amount?.toString() || '',
      expense_date: expense.expense_date || '',
      material_id: expense.material_id || '',
      quantity: expense.quantity?.toString() || '',
      unit_price: expense.unit_price?.toString() || '',
      supplier: expense.supplier || '',
      notes: expense.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingExpense) return

    try {
      // Validações
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

      await updateExpense(editingExpense.id, expenseData)

      toast.success('Despesa atualizada com sucesso!')
      setIsEditDialogOpen(false)
      setEditingExpense(null)
    } catch (err) {
      toast.error('Erro ao atualizar despesa')
    }
  }

  const handleDeleteExpense = async (expense: ExpenseWithMaterial) => {
    if (!confirm(`Tem certeza que deseja deletar a despesa "${expense.description}"?`)) {
      return
    }

    try {
      await deleteExpense(expense.id)
      toast.success('Despesa deletada com sucesso!')
    } catch (err) {
      toast.error('Erro ao deletar despesa')
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

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingExpense(null)
    setFormData({
      description: '',
      expense_type: 'MATERIAL',
      amount: '',
      expense_date: '',
      material_id: '',
      quantity: '',
      unit_price: '',
      supplier: '',
      notes: ''
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando despesas...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar despesas</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Despesas Registradas
        </CardTitle>
        <CardDescription>
          Visualize e gerencie todas as despesas lançadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar despesas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={typeFilter} onValueChange={(value: ExpenseType | 'TODOS') => setTypeFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os tipos</SelectItem>
                  {Object.entries(EXPENSE_TYPE_LABELS).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de despesas */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchQuery || typeFilter !== 'TODOS' ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa registrada'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {formatDate(expense.expense_date)}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        {getExpenseTypeBadge(expense.expense_type)}
                      </TableCell>
                      <TableCell>
                        {expense.material ? (
                          <div>
                            <div className="font-medium">{expense.material.name}</div>
                            {expense.quantity && expense.unit_price && (
                              <div className="text-xs text-gray-500">
                                {expense.quantity} × R$ {expense.unit_price.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{expense.supplier || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Dialog de edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Despesa</DialogTitle>
              <DialogDescription>
                Atualize as informações da despesa
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateExpense}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-expense_type">Tipo de Despesa</Label>
                  <Select
                    value={formData.expense_type}
                    onValueChange={handleExpenseTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_TYPE_LABELS).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            {config.label}
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
                      <Label htmlFor="edit-material_id">Material *</Label>
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
                        <Label htmlFor="edit-quantity">Quantidade</Label>
                        <Input
                          id="edit-quantity"
                          type="number"
                          step="1"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-unit_price">Preço Unitário (R$)</Label>
                        <Input
                          id="edit-unit_price"
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
                  <Label htmlFor="edit-description">
                    Descrição {formData.expense_type !== 'MATERIAL' && '*'}
                  </Label>
                  <Input
                    id="edit-description"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-amount">Valor Total (R$) *</Label>
                    <Input
                      id="edit-amount"
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
                  <div>
                    <Label htmlFor="edit-expense_date">Data *</Label>
                    <Input
                      id="edit-expense_date"
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-supplier">Fornecedor</Label>
                  <Input
                    id="edit-supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Observações</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={closeEditDialog}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}


