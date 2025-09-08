'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Filter, 
  X, 
  MapPin, 
  DollarSign,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { Client, Payment } from '@/types/database'

interface MensalistaWithPayments extends Client {
  payments: Payment[]
}

interface AdvancedFiltersProps {
  mensalistas: MensalistaWithPayments[]
  onFiltersChange: (filters: FilterState) => void
  isClientEmAberto: (client: MensalistaWithPayments) => boolean
  isClientAtrasado: (client: MensalistaWithPayments) => boolean
}

export interface FilterState {
  status: 'all' | 'em_aberto' | 'atrasados' | 'both' | 'adimplente'
  neighborhoods: string[]
  minValue: number | null
  maxValue: number | null
  searchTerm: string
}

export function AdvancedFilters({ 
  mensalistas, 
  onFiltersChange,
  isClientEmAberto,
  isClientAtrasado
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    neighborhoods: [],
    minValue: null,
    maxValue: null,
    searchTerm: ''
  })

  // Extrair bairros únicos dos mensalistas
  const uniqueNeighborhoods = Array.from(
    new Set(
      mensalistas
        .map(client => client.neighborhood)
        .filter(Boolean)
        .sort()
    )
  )

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const handleNeighborhoodToggle = (neighborhood: string) => {
    const newNeighborhoods = filters.neighborhoods.includes(neighborhood)
      ? filters.neighborhoods.filter(n => n !== neighborhood)
      : [...filters.neighborhoods, neighborhood]
    
    handleFilterChange({ neighborhoods: newNeighborhoods })
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      status: 'all',
      neighborhoods: [],
      minValue: null,
      maxValue: null,
      searchTerm: ''
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.neighborhoods.length > 0) count++
    if (filters.minValue !== null || filters.maxValue !== null) count++
    if (filters.searchTerm) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="space-y-4">
      {/* Barra de Busca */}
      <div className="relative">
        <Input
          placeholder="Buscar mensalistas..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
          className="pl-10"
        />
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      </div>

      {/* Filtros Avançados */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros</h4>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Filtro por Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Status
              </Label>
              <Select 
                value={filters.status} 
                onValueChange={(value: any) => handleFilterChange({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="adimplente">Adimplente</SelectItem>
                  <SelectItem value="em_aberto">Mês Atual</SelectItem>
                  <SelectItem value="atrasados">Atrasados</SelectItem>
                  <SelectItem value="both">Pendentes + Atrasados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Bairro */}
            {uniqueNeighborhoods.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Bairro
                </Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {uniqueNeighborhoods.map((neighborhood) => (
                    <label key={neighborhood} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.neighborhoods.includes(neighborhood || '')}
                        onChange={() => handleNeighborhoodToggle(neighborhood || '')}
                        className="rounded border-gray-300"
                      />
                      <span>{neighborhood}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro por Faixa de Valor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Faixa de Valor
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minValue" className="text-xs text-gray-500">
                    Mínimo
                  </Label>
                  <Input
                    id="minValue"
                    type="number"
                    placeholder="0"
                    value={filters.minValue || ''}
                    onChange={(e) => handleFilterChange({ 
                      minValue: e.target.value ? Number(e.target.value) : null 
                    })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="maxValue" className="text-xs text-gray-500">
                    Máximo
                  </Label>
                  <Input
                    id="maxValue"
                    type="number"
                    placeholder="1000"
                    value={filters.maxValue || ''}
                    onChange={(e) => handleFilterChange({ 
                      maxValue: e.target.value ? Number(e.target.value) : null 
                    })}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {
                filters.status === 'adimplente' ? 'Adimplente' :
                filters.status === 'em_aberto' ? 'Mês Atual' :
                filters.status === 'atrasados' ? 'Atrasados' :
                filters.status === 'both' ? 'Pendentes + Atrasados' : 'Todos'
              }
            </Badge>
          )}
          
          {filters.neighborhoods.map((neighborhood) => (
            <Badge 
              key={neighborhood} 
              variant="secondary" 
              className="text-xs cursor-pointer"
              onClick={() => handleNeighborhoodToggle(neighborhood)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {neighborhood}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          
          {(filters.minValue !== null || filters.maxValue !== null) && (
            <Badge variant="secondary" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              {filters.minValue || 0} - {filters.maxValue || '∞'}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
