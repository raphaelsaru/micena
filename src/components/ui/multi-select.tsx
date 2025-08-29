'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectOption {
  id: string
  name: string
  unit_type?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  label?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecione opções",
  label,
  searchPlaceholder = "Buscar...",
  className,
  disabled = false
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<MultiSelectOption[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filtrar opções baseado no termo de busca e remover já selecionadas
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option.id)
  )

  // Encontrar opções selecionadas
  useEffect(() => {
    const selected = options.filter(opt => value.includes(opt.id))
    setSelectedOptions(selected)
  }, [value, options])

  // Focar no input de busca quando abrir
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSelect = (option: MultiSelectOption) => {
    const newValue = [...value, option.id]
    onValueChange(newValue)
    setSearchTerm('')
  }

  const handleRemove = (optionId: string) => {
    const newValue = value.filter(id => id !== optionId)
    onValueChange(newValue)
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

  const handleClearAll = () => {
    onValueChange([])
  }

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className={cn("relative", className)}>
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
        className="w-full justify-between min-h-[42px]"
        onClick={handleButtonClick}
        disabled={disabled}
      >
        <div className="flex-1 text-left">
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="text-foreground">
              {selectedOptions.length} item(s) selecionado(s)
            </span>
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Chips dos itens selecionados */}
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="truncate max-w-[200px]">
                {option.name}
                {option.unit_type && (
                  <span className="text-muted-foreground ml-1">
                    ({option.unit_type})
                  </span>
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(option.id)}
                className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleClearAll()
            }}
            className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-red-50"
          >
            Limpar todos
          </Button>
        </div>
      )}

      {open && (
        <div 
          className="absolute z-[99999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden"
          onClick={handleDropdownClick}
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
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Nenhuma opção encontrada' : 'Todas as opções já foram selecionadas'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
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
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
