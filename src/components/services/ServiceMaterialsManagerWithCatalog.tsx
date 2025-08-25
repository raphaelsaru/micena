'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { MaterialCatalogItem, ServiceMaterial, MaterialUnit } from '@/types/database'
import { getMaterialCatalog } from '@/lib/services'
import { usePriceHistory } from '@/hooks/usePriceHistory'
import { Plus, X, RotateCcw } from 'lucide-react'

interface ServiceMaterialsManagerWithCatalogProps {
  materials: (Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> & { total_price?: number })[]
  onChange: (materials: (Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> & { total_price?: number })[]) => void
}

interface MaterialWithCatalog extends Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> {
  catalog_item_id?: string
  catalog_item_name?: string
  last_price?: number
  price_source?: 'manual' | 'history'
  total_price?: number
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

export function ServiceMaterialsManagerWithCatalog({ materials, onChange }: ServiceMaterialsManagerWithCatalogProps) {
  const [materialCatalog, setMaterialCatalog] = useState<MaterialCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newMaterial, setNewMaterial] = useState<MaterialWithCatalog>({
    description: '',
    unit: 'un',
    quantity: 0,
    unit_price: 0,
    catalog_item_id: '',
    catalog_item_name: '',
    last_price: undefined,
    price_source: 'manual',
    total_price: 0
  })
  
  const { getLastPriceForItem } = usePriceHistory()

  // Carregar catálogo de materiais
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const catalog = await getMaterialCatalog()
        setMaterialCatalog(catalog)
      } catch (error) {
        console.error('Erro ao carregar catálogo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [])

  // Buscar último preço quando um material é selecionado
  const handleMaterialSelect = async (materialId: string) => {
    if (!materialId) {
      setNewMaterial(prev => ({
        ...prev,
        catalog_item_id: '',
        catalog_item_name: '',
        last_price: undefined,
        price_source: 'manual'
      }))
      return
    }

    const selectedMaterial = materialCatalog.find(m => m.id === materialId)
    if (!selectedMaterial) return

    setNewMaterial(prev => ({
      ...prev,
      catalog_item_id: materialId,
      catalog_item_name: selectedMaterial.name,
      description: selectedMaterial.name,
      unit: (selectedMaterial.unit_type as MaterialUnit) || 'un'
    }))

    // Buscar último preço
    try {
      const lastPrice = await getLastPriceForItem('material', materialId)
      if (lastPrice) {
        setNewMaterial(prev => ({
          ...prev,
          unit_price: lastPrice.price_numeric,
          last_price: lastPrice.price_numeric,
          price_source: 'history'
        }))
      } else {
        setNewMaterial(prev => ({
          ...prev,
          unit_price: 0,
          last_price: undefined,
          price_source: 'manual'
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar último preço:', error)
    }
  }

  // Aplicar último preço
  const handleApplyLastPrice = () => {
    if (newMaterial.last_price) {
      setNewMaterial(prev => ({
        ...prev,
        unit_price: prev.last_price!,
        price_source: 'history'
      }))
    }
  }

  // Calcular total quando quantidade ou preço unitário mudam
  useEffect(() => {
    const total = newMaterial.quantity * newMaterial.unit_price
    setNewMaterial(prev => ({ ...prev, total_price: total }))
  }, [newMaterial.quantity, newMaterial.unit_price])

  // Adicionar material
  const addMaterial = () => {
    if (newMaterial.description.trim() && newMaterial.quantity > 0 && newMaterial.unit_price > 0) {
      const materialToAdd = {
        description: newMaterial.description.trim(),
        unit: newMaterial.unit,
        quantity: newMaterial.quantity,
        unit_price: newMaterial.unit_price,
        total_price: newMaterial.total_price || 0,
        catalog_item_id: newMaterial.catalog_item_id
      }

      const updatedMaterials = [...materials, materialToAdd]
      onChange(updatedMaterials)

      // Limpar formulário
      setNewMaterial({
        description: '',
        unit: 'un',
        quantity: 0,
        unit_price: 0,
        catalog_item_id: '',
        catalog_item_name: '',
        last_price: undefined,
        price_source: 'manual',
        total_price: 0
      })
    }
  }

  // Remover material
  const removeMaterial = (index: number) => {
    const updatedMaterials = materials.filter((_, i) => i !== index)
    onChange(updatedMaterials)
  }

  const totalValue = materials.reduce((sum, material) => sum + (material.total_price || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Materiais</Label>
        <span className="text-sm text-gray-600">
          Total: R$ {totalValue.toFixed(2)}
        </span>
      </div>

      {/* Formulário para adicionar novo material */}
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SearchableSelect
              options={materialCatalog}
              value={newMaterial.catalog_item_id || ''}
              onValueChange={handleMaterialSelect}
              placeholder="Selecione um material"
              label="Material"
              searchPlaceholder="Buscar material..."
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="new-material-unit">Unidade</Label>
            <Select 
              value={newMaterial.unit} 
              onValueChange={(value: MaterialUnit) => setNewMaterial({ ...newMaterial, unit: value })}
            >
              <SelectTrigger className="mt-1">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="new-material-quantity">Quantidade</Label>
            <Input
              id="new-material-quantity"
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              value={newMaterial.quantity || ''}
              onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="new-material-unit-price">Preço Unitário (R$)</Label>
            <CurrencyInput
              id="new-material-unit-price"
              placeholder="0,00"
              value={newMaterial.unit_price.toString()}
              onChange={(e) => setNewMaterial({ ...newMaterial, unit_price: parseFloat(e.target.value) || 0, price_source: 'manual' })}
              className="mt-1"
            />
            
            {/* Indicador de último preço */}
            {newMaterial.last_price && newMaterial.price_source === 'history' && (
              <div className="mt-1 flex items-center gap-2 text-sm text-blue-600">
                <span>Usando último valor: R$ {newMaterial.last_price.toFixed(2)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleApplyLastPrice()
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reaplicar
                </Button>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="new-material-total">Total (R$)</Label>
            <Input
              id="new-material-total"
              type="text"
              value={`R$ ${(newMaterial.total_price || 0).toFixed(2)}`}
              className="mt-1 bg-gray-100"
              readOnly
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={addMaterial}
          disabled={!newMaterial.description.trim() || !newMaterial.quantity || newMaterial.quantity <= 0 || !newMaterial.unit_price || newMaterial.unit_price <= 0}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Material
        </Button>
      </div>

      {/* Lista de materiais */}
      {materials.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h4 className="font-medium text-gray-700">Materiais Adicionados</h4>
          </div>
          <div className="divide-y">
            {materials.map((material, index) => (
              <div key={index} className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{material.description}</p>
                  <p className="text-sm text-gray-600">
                    {material.quantity} {material.unit} × R$ {material.unit_price.toFixed(2)} = R$ {(material.total_price || 0).toFixed(2)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMaterial(index)
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
