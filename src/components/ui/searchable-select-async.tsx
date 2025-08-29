'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchableSelectAsyncOption {
  id: string
  name: string
  unit_type?: string
}

interface SearchableSelectAsyncProps {
  searchFunction: (query: string) => Promise<SearchableSelectAsyncOption[]>
  loadAllFunction: () => Promise<SearchableSelectAsyncOption[]>
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  label?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function SearchableSelectAsync({
  searchFunction,
  loadAllFunction,
  value,
  onValueChange,
  placeholder = "Selecione uma opção",
  label,
  searchPlaceholder = "Buscar...",
  className,
  disabled = false
}: SearchableSelectAsyncProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [options, setOptions] = useState<SearchableSelectAsyncOption[]>([])
  const [selectedOption, setSelectedOption] = useState<SearchableSelectAsyncOption | null>(null)
  const [loading, setLoading] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce da busca para evitar muitas requisições
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Função para carregar dados
  const loadData = useCallback(async (query: string = '') => {
    setLoading(true)
    try {
      let data: SearchableSelectAsyncOption[]
      if (query.trim()) {
        data = await searchFunction(query)
      } else {
        data = await loadAllFunction()
      }
      setOptions(data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [searchFunction, loadAllFunction])

  // Carregar dados quando abrir ou quando termo de busca mudar
  useEffect(() => {
    if (open) {
      loadData(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm, open, loadData])

  // Encontrar opção selecionada
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find(opt => opt.id === value)
      setSelectedOption(option || null)
    } else if (!value) {
      setSelectedOption(null)
    }
  }, [value, options])

  // Focar no input de busca quando abrir
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [open])

  // Detectar cliques fora do componente para fechar o dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
        setSearchTerm('')
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleSelect = (option: SearchableSelectAsyncOption) => {
    setSelectedOption(option)
    onValueChange(option.id)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    setSelectedOption(null)
    onValueChange('')
    setSearchTerm('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchTerm('')
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleOpenChange(!open)
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <Label className="text-sm font-medium mb-2 block">
          {label}
        </Label>
      )}
      
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={handleButtonClick}
        disabled={disabled}
      >
        {selectedOption ? (
          <span className="truncate">
            {selectedOption.name}
            {selectedOption.unit_type && (
              <span className="text-muted-foreground ml-2">
                ({selectedOption.unit_type})
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div 
          className="absolute z-[99999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden"
        >
          {/* Campo de busca */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-8"
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Lista de opções */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Carregando...
              </div>
            ) : options.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhuma opção encontrada
              </div>
            ) : (
              options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100",
                    selectedOption?.id === option.id && "bg-gray-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(option)
                  }}
                >
                  <div className="flex-1">
                    <span className="block font-medium">{option.name}</span>
                    {option.unit_type && (
                      <span className="text-sm text-gray-500">
                        {option.unit_type}
                      </span>
                    )}
                  </div>
                  {selectedOption?.id === option.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Botão limpar */}
          {selectedOption && (
            <div className="p-2 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Limpar seleção
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
