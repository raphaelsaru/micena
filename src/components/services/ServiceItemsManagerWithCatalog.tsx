'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { SearchableSelectWithActions } from '@/components/ui/searchable-select-with-actions'
import { ServiceCatalogItem, ServiceItem } from '@/types/database'
import { getServiceCatalog, insertServiceCatalogItem } from '@/lib/services'
import { usePriceHistory } from '@/hooks/usePriceHistory'
import { formatCurrency } from '@/lib/formatters'
import { Plus, X, RotateCcw, PlusCircle } from 'lucide-react'

interface ServiceItemsManagerWithCatalogProps {
  items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]
  onChange: (items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]) => void
}

interface ServiceItemWithCatalog extends Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'> {
  catalog_item_id?: string
  catalog_item_name?: string
  last_price?: number
  price_source?: 'manual' | 'history'
}

export function ServiceItemsManagerWithCatalog({ items, onChange }: ServiceItemsManagerWithCatalogProps) {
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState<ServiceItemWithCatalog>({
    description: '',
    value: 0,
    catalog_item_id: '',
    catalog_item_name: '',
    last_price: undefined,
    price_source: 'manual'
  })
  const [showNewServiceForm, setShowNewServiceForm] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [addingNewService, setAddingNewService] = useState(false)
  
  const { getLastPriceForItem } = usePriceHistory()

  // Carregar catálogo de serviços
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const catalog = await getServiceCatalog()
        setServiceCatalog(catalog)
      } catch (error) {
        console.error('Erro ao carregar catálogo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [])

  // Função para adicionar novo serviço ao catálogo
  const handleAddNewService = async () => {
    if (!newServiceName.trim()) return

    setAddingNewService(true)
    try {
      const newService = await insertServiceCatalogItem(newServiceName.trim())
      if (newService) {
        // Atualizar o catálogo local
        setServiceCatalog(prev => [...prev, newService])
        
        // Selecionar automaticamente o novo serviço
        setNewItem(prev => ({
          ...prev,
          catalog_item_id: newService.id,
          catalog_item_name: newService.name,
          description: newService.name
        }))
        
        // Limpar formulário e esconder
        setNewServiceName('')
        setShowNewServiceForm(false)
      }
    } catch (error) {
      console.error('Erro ao adicionar novo serviço:', error)
    } finally {
      setAddingNewService(false)
    }
  }

  // Buscar último preço quando um serviço é selecionado
  const handleServiceSelect = async (serviceId: string) => {
    if (!serviceId) {
      setNewItem(prev => ({
        ...prev,
        catalog_item_id: '',
        catalog_item_name: '',
        last_price: undefined,
        price_source: 'manual'
      }))
      return
    }

    const selectedService = serviceCatalog.find(s => s.id === serviceId)
    if (!selectedService) return

    setNewItem(prev => ({
      ...prev,
      catalog_item_id: serviceId,
      catalog_item_name: selectedService.name,
      description: selectedService.name
    }))

    // Buscar último preço
    try {
      const lastPrice = await getLastPriceForItem('service', serviceId)
      if (lastPrice) {
        setNewItem(prev => ({
          ...prev,
          value: lastPrice.price_numeric,
          last_price: lastPrice.price_numeric,
          price_source: 'history'
        }))
      } else {
        setNewItem(prev => ({
          ...prev,
          value: 0,
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
    if (newItem.last_price) {
      setNewItem(prev => ({
        ...prev,
        value: prev.last_price!,
        price_source: 'history'
      }))
    }
  }

  // Adicionar item
  const addItem = () => {
    if (newItem.description.trim() && newItem.value > 0) {
      const itemToAdd = {
        description: newItem.description.trim(),
        value: newItem.value,
        catalog_item_id: newItem.catalog_item_id
      }

      const updatedItems = [...items, itemToAdd]
      onChange(updatedItems)

      // Limpar formulário
      setNewItem({
        description: '',
        value: 0,
        catalog_item_id: '',
        catalog_item_name: '',
        last_price: undefined,
        price_source: 'manual'
      })
    }
  }

  // Remover item
  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    onChange(updatedItems)
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
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Serviço</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableSelectWithActions
                  type="service"
                  options={serviceCatalog}
                  value={newItem.catalog_item_id || ''}
                  onValueChange={handleServiceSelect}
                  onOptionsChange={setServiceCatalog}
                  placeholder="Selecione um serviço"
                  searchPlaceholder="Buscar serviço..."
                  disabled={loading}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowNewServiceForm(true)}
                className="shrink-0"
                title="Adicionar novo serviço ao catálogo"
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Formulário para novo serviço */}
            {showNewServiceForm && (
              <div className="mt-3 p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nome do novo serviço"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNewService()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewService}
                    disabled={!newServiceName.trim() || addingNewService}
                  >
                    {addingNewService ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewServiceForm(false)
                      setNewServiceName('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="new-item-value">Valor (R$)</Label>
            <CurrencyInput
              id="new-item-value"
              placeholder="0,00"
              value={newItem.value.toString()}
              onChange={(e) => setNewItem({ ...newItem, value: parseFloat(e.target.value) || 0, price_source: 'manual' })}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newItem.description.trim() && newItem.value > 0) {
                  e.preventDefault()
                  addItem()
                }
              }}
              className="mt-1"
            />
            
            {/* Indicador de último preço */}
            {newItem.last_price && newItem.price_source === 'history' && (
              <div className="mt-1 flex items-center gap-2 text-sm text-blue-600">
                <span>Usando último valor: {formatCurrency(newItem.last_price)}</span>
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
        </div>

        <Button
          type="button"
          onClick={addItem}
          disabled={!newItem.description.trim() || !newItem.value || newItem.value <= 0}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Serviço
        </Button>
      </div>

      {/* Lista de itens */}
      {items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
            <h4 className="font-medium text-blue-800">Itens Adicionados</h4>
          </div>
          <div className="divide-y divide-blue-100">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-blue-900">{item.description}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-blue-800">{formatCurrency(item.value)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
