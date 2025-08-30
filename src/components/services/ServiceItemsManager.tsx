'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/formatters'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ServiceItem } from '@/types/database'
import { Plus, Trash2, Edit } from 'lucide-react'

interface ServiceItemsManagerProps {
  items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]
  onChange: (items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]) => void
}

export function ServiceItemsManager({ items, onChange }: ServiceItemsManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newItem, setNewItem] = useState({ description: '', value: '' })

  const addItem = () => {
    if (newItem.description.trim() && newItem.value) {
      const value = parseFloat(newItem.value)
      if (!isNaN(value) && value > 0) {
        const updatedItems = [...items, { description: newItem.description.trim(), value }]
        onChange(updatedItems)
        setNewItem({ description: '', value: '' })
      }
    }
  }

  const updateItem = (index: number, field: 'description' | 'value', value: string) => {
    const updatedItems = [...items]
    if (field === 'value') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue > 0) {
        updatedItems[index][field] = numValue
      }
    } else {
      updatedItems[index][field] = value
    }
    onChange(updatedItems)
  }

  const saveEdit = (index: number) => {
    if (items[index].description.trim() && items[index].value > 0) {
      setEditingIndex(null)
    }
  }

  const deleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    onChange(updatedItems)
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
  }

  const totalValue = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Itens de Serviço</Label>
        <span className="text-sm text-gray-600">
          Total: {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Formulário para adicionar novo item */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="new-item-description">Descrição</Label>
          <Input
            id="new-item-description"
            placeholder="Descrição do serviço"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
        </div>
        <div>
          <Label htmlFor="new-item-value">Valor (R$)</Label>
          <CurrencyInput
            id="new-item-value"
            placeholder="0,00"
            value={newItem.value}
            onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={addItem}
        disabled={!newItem.description.trim() || !newItem.value}
        className="w-full"
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Serviço
      </Button>

      {/* Lista de itens */}
      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700">
              <span>Descrição</span>
              <span>Valor</span>
              <span>Ações</span>
            </div>
          </div>
          <div className="divide-y">
            {items.map((item, index) => (
              <div key={index} className="px-4 py-3">
                {editingIndex === index ? (
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      onBlur={() => saveEdit(index)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit(index)}
                    />
                    <CurrencyInput
                      value={item.value.toString()}
                      onChange={(e) => updateItem(index, 'value', e.target.value)}
                      onBlur={() => saveEdit(index)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit(index)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveEdit(index)}
                        variant="outline"
                      >
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={cancelEdit}
                        variant="ghost"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <span className="text-sm">{item.description}</span>
                    <span className="text-medium">{formatCurrency(item.value)}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => startEdit(index)}
                        variant="ghost"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => deleteItem(index)}
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
