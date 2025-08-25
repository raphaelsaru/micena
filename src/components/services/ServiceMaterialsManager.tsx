'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ServiceMaterial, MaterialUnit } from '@/types/database'
import { Plus, Trash2, Edit } from 'lucide-react'

interface ServiceMaterialsManagerProps {
  materials: (Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> & { total_price?: number })[]
  onChange: (materials: (Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> & { total_price?: number })[]) => void
}

const MATERIAL_UNITS: { value: MaterialUnit; label: string }[] = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'm2', label: 'Metro quadrado (m²)' },
  { value: 'm3', label: 'Metro cúbico (m³)' },
  { value: 'L', label: 'Litro (L)' },
]

export function ServiceMaterialsManager({ materials, onChange }: ServiceMaterialsManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newMaterial, setNewMaterial] = useState({
    description: '',
    unit: 'un' as MaterialUnit,
    quantity: '',
    unit_price: ''
  })

  const addMaterial = () => {
    if (newMaterial.description.trim() && newMaterial.quantity && newMaterial.unit_price) {
      const quantity = parseFloat(newMaterial.quantity)
      const unitPrice = parseFloat(newMaterial.unit_price)
      
      if (!isNaN(quantity) && quantity > 0 && !isNaN(unitPrice) && unitPrice > 0) {
        const updatedMaterials = [...materials, {
          description: newMaterial.description.trim(),
          unit: newMaterial.unit,
          quantity,
          unit_price: unitPrice,
          total_price: quantity * unitPrice
        }]
        onChange(updatedMaterials)
        setNewMaterial({
          description: '',
          unit: 'un',
          quantity: '',
          unit_price: ''
        })
      }
    }
  }

  const updateMaterial = (index: number, field: keyof typeof newMaterial, value: string | MaterialUnit) => {
    const updatedMaterials = [...materials]
    if (field === 'quantity' || field === 'unit_price') {
      const numValue = parseFloat(value as string)
      if (!isNaN(numValue) && numValue > 0) {
        updatedMaterials[index][field] = numValue
      }
    } else if (field === 'unit') {
      updatedMaterials[index][field] = value as MaterialUnit
    } else {
      updatedMaterials[index][field] = value
    }
    onChange(updatedMaterials)
  }

  const saveEdit = (index: number) => {
    if (materials[index].description.trim() && materials[index].quantity > 0 && materials[index].unit_price > 0) {
      setEditingIndex(null)
    }
  }

  const deleteMaterial = (index: number) => {
    const updatedMaterials = materials.filter((_, i) => i !== index)
    onChange(updatedMaterials)
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

  const totalValue = materials.reduce((sum, material) => sum + (material.quantity * material.unit_price), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Materiais</Label>
        <span className="text-sm text-gray-600">
          Total: R$ {totalValue.toFixed(2)}
        </span>
      </div>

      {/* Formulário para adicionar novo material */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="new-material-description">Descrição</Label>
          <Input
            id="new-material-description"
            placeholder="Descrição do material"
            value={newMaterial.description}
            onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
          />
        </div>
        <div>
          <Label htmlFor="new-material-unit">Unidade</Label>
          <Select value={newMaterial.unit} onValueChange={(value: MaterialUnit) => setNewMaterial({ ...newMaterial, unit: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="new-material-quantity">Quantidade</Label>
          <Input
            id="new-material-quantity"
            type="number"
            step="1"
            min="0"
            placeholder="0"
            value={newMaterial.quantity}
            onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
          />
        </div>
        <div>
          <Label htmlFor="new-material-unit-price">Preço Unitário (R$)</Label>
          <CurrencyInput
            id="new-material-unit-price"
            placeholder="0,00"
            value={newMaterial.unit_price}
            onChange={(e) => setNewMaterial({ ...newMaterial, unit_price: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={addMaterial}
        disabled={!newMaterial.description.trim() || !newMaterial.quantity || !newMaterial.unit_price}
        className="w-full"
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Material
      </Button>

      {/* Lista de materiais */}
      {materials.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
              <span>Descrição</span>
              <span>Unidade</span>
              <span>Quantidade</span>
              <span>Preço Unit.</span>
              <span>Total</span>
              <span>Ações</span>
            </div>
          </div>
          <div className="divide-y">
            {materials.map((material, index) => (
              <div key={index} className="px-4 py-3">
                {editingIndex === index ? (
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <Input
                      value={material.description}
                      onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                      onBlur={() => saveEdit(index)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit(index)}
                    />
                    <Select 
                      value={material.unit} 
                      onValueChange={(value: MaterialUnit) => updateMaterial(index, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={material.quantity}
                      onChange={(e) => updateMaterial(index, 'quantity', e.target.value)}
                      onBlur={() => saveEdit(index)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit(index)}
                    />
                    <CurrencyInput
                      value={material.unit_price.toString()}
                      onChange={(e) => updateMaterial(index, 'unit_price', e.target.value)}
                      onBlur={() => saveEdit(index)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit(index)}
                    />
                    <span className="text-sm font-medium">
                      R$ {(material.quantity * material.unit_price).toFixed(2)}
                    </span>
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
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <span className="text-sm">{material.description}</span>
                    <span className="text-sm">{material.unit}</span>
                    <span className="text-sm">{material.quantity}</span>
                    <span className="text-sm font-medium">R$ {material.unit_price.toFixed(2)}</span>
                    <span className="text-sm font-medium">
                      R$ {(material.quantity * material.unit_price).toFixed(2)}
                    </span>
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
                        onClick={() => deleteMaterial(index)}
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
