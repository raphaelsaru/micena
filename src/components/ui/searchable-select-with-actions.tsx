'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Check, ChevronsUpDown, Search, X, Edit2, Trash2 } from 'lucide-react'
import { cn, normalizeText } from '@/lib/utils'
import { ServiceCatalogItem, MaterialCatalogItem } from '@/types/database'
import { 
  EditServiceDialog, 
  EditMaterialDialog, 
  DeleteConfirmDialog 
} from './catalog-item-manager'
import { deleteServiceCatalogItem, deleteMaterialCatalogItem } from '@/lib/services'
import { toast } from 'sonner'

interface SearchableSelectWithActionsProps {
  type: 'service' | 'material'
  options: (ServiceCatalogItem | MaterialCatalogItem)[]
  value?: string
  onValueChange: (value: string) => void
  onOptionsChange: (options: (ServiceCatalogItem | MaterialCatalogItem)[]) => void
  placeholder?: string
  label?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function SearchableSelectWithActions({
  type,
  options,
  value,
  onValueChange,
  onOptionsChange,
  placeholder = "Selecione uma opção",
  label,
  searchPlaceholder = "Buscar...",
  className,
  disabled = false
}: SearchableSelectWithActionsProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOption, setSelectedOption] = useState<ServiceCatalogItem | MaterialCatalogItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<ServiceCatalogItem | MaterialCatalogItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<ServiceCatalogItem | MaterialCatalogItem | null>(null)
  
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filtrar opções baseado no termo de busca (ignorando acentos)
  const filteredOptions = options.filter(option =>
    normalizeText(option.name).includes(normalizeText(searchTerm))
  )

  // Encontrar opção selecionada
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.id === value)
      setSelectedOption(option || null)
    } else {
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

    // Adicionar listener apenas quando o dropdown estiver aberto
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    // Cleanup do listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleSelect = (option: ServiceCatalogItem | MaterialCatalogItem) => {
    setSelectedOption(option)
    onValueChange(option.id)
    setOpen(false)
    setSearchTerm('')
  }

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleEdit = (item: ServiceCatalogItem | MaterialCatalogItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setItemToEdit(item)
    setEditDialogOpen(true)
    setOpen(false)
    setSearchTerm('')
  }

  const handleDelete = (item: ServiceCatalogItem | MaterialCatalogItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setItemToDelete(item)
    setDeleteDialogOpen(true)
    setOpen(false)
    setSearchTerm('')
  }

  const handleItemUpdated = (updatedItem: ServiceCatalogItem | MaterialCatalogItem) => {
    const updatedOptions = options.map(option => 
      option.id === updatedItem.id ? updatedItem : option
    )
    onOptionsChange(updatedOptions)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      let success = false
      if (type === 'service') {
        success = await deleteServiceCatalogItem(itemToDelete.id)
      } else {
        success = await deleteMaterialCatalogItem(itemToDelete.id)
      }
      
      if (success) {
        // Remover item da lista
        const updatedOptions = options.filter(option => option.id !== itemToDelete.id)
        onOptionsChange(updatedOptions)
        
        // Se o item excluído estava selecionado, limpar seleção
        if (selectedOption?.id === itemToDelete.id) {
          setSelectedOption(null)
          onValueChange('')
        }
        
        toast.success(`${type === 'service' ? 'Serviço' : 'Material'} excluído com sucesso`)
      } else {
        toast.error(`Erro ao excluir ${type === 'service' ? 'serviço' : 'material'}`)
      }
    } catch (error) {
      console.error(`Erro ao excluir ${type}:`, error)
      toast.error(`Erro ao excluir ${type === 'service' ? 'serviço' : 'material'}`)
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  return (
    <>
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
                  Nenhuma opção encontrada
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 group",
                      selectedOption?.id === option.id && "bg-gray-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(option)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{option.name}</span>
                      {option.unit_type && (
                        <span className="text-sm text-gray-500">
                          {option.unit_type}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {selectedOption?.id === option.id && (
                        <Check className="h-4 w-4 text-blue-600 mr-1" />
                      )}
                      
                      {/* Botões de ação */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEdit(option, e)}
                          className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(option, e)}
                          className="h-6 w-6 p-0 hover:bg-red-50 text-red-600 hover:text-red-700"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
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

      {/* Diálogos de edição */}
      {type === 'service' && itemToEdit && (
        <EditServiceDialog
          item={itemToEdit as ServiceCatalogItem}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onItemUpdated={handleItemUpdated}
        />
      )}

      {type === 'material' && itemToEdit && (
        <EditMaterialDialog
          item={itemToEdit as MaterialCatalogItem}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onItemUpdated={handleItemUpdated}
        />
      )}

      {/* Diálogo de confirmação de exclusão */}
      {itemToDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          itemName={itemToDelete.name}
          itemType={type === 'service' ? 'serviço' : 'material'}
        />
      )}
    </>
  )
}
