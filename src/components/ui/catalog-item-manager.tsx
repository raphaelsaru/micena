'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ServiceCatalogItem, MaterialCatalogItem, MaterialUnit } from '@/types/database'
import { 
  updateServiceCatalogItem, 
  updateMaterialCatalogItem, 
  deleteServiceCatalogItem, 
  deleteMaterialCatalogItem 
} from '@/lib/services'
import { Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditServiceDialogProps {
  item: ServiceCatalogItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemUpdated: (item: ServiceCatalogItem) => void
}

interface EditMaterialDialogProps {
  item: MaterialCatalogItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemUpdated: (item: MaterialCatalogItem) => void
}

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemName: string
  itemType: 'serviço' | 'material'
}

const MATERIAL_UNITS: { value: MaterialUnit; label: string }[] = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'm2', label: 'Metro² (m²)' },
  { value: 'm3', label: 'Metro³ (m³)' },
  { value: 'L', label: 'Litro (L)' },
]

// Componente de diálogo para editar serviço
export function EditServiceDialog({ item, open, onOpenChange, onItemUpdated }: EditServiceDialogProps) {
  const [name, setName] = useState(item.name)
  const [unitType, setUnitType] = useState(item.unit_type || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(item.name)
      setUnitType(item.unit_type || '')
    }
  }, [item, open])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome do serviço é obrigatório')
      return
    }

    setLoading(true)
    try {
      const updatedItem = await updateServiceCatalogItem(item.id, name.trim(), unitType || undefined)
      if (updatedItem) {
        onItemUpdated(updatedItem)
        onOpenChange(false)
        toast.success('Serviço atualizado com sucesso')
      } else {
        toast.error('Erro ao atualizar serviço')
      }
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error)
      toast.error('Erro ao atualizar serviço')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-[10000]">
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
          <DialogDescription>
            Altere as informações do serviço no catálogo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Nome do serviço"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit-type" className="text-right">
              Tipo
            </Label>
            <Input
              id="unit-type"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="col-span-3"
              placeholder="Tipo de unidade (opcional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente de diálogo para editar material
export function EditMaterialDialog({ item, open, onOpenChange, onItemUpdated }: EditMaterialDialogProps) {
  const [name, setName] = useState(item.name)
  const [unitType, setUnitType] = useState(item.unit_type || 'un')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(item.name)
      setUnitType(item.unit_type || 'un')
    }
  }, [item, open])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome do material é obrigatório')
      return
    }

    setLoading(true)
    try {
      const updatedItem = await updateMaterialCatalogItem(item.id, name.trim(), unitType)
      if (updatedItem) {
        onItemUpdated(updatedItem)
        onOpenChange(false)
        toast.success('Material atualizado com sucesso')
      } else {
        toast.error('Erro ao atualizar material')
      }
    } catch (error) {
      console.error('Erro ao atualizar material:', error)
      toast.error('Erro ao atualizar material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-[10000]">
        <DialogHeader>
          <DialogTitle>Editar Material</DialogTitle>
          <DialogDescription>
            Altere as informações do material no catálogo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Nome do material"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit-type" className="text-right">
              Unidade
            </Label>
            <Select value={unitType} onValueChange={setUnitType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a unidade" />
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Componente de diálogo de confirmação para exclusão
export function DeleteConfirmDialog({ open, onOpenChange, onConfirm, itemName, itemType }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="z-[10000]">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o {itemType} "{itemName}"? 
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Componente de botões de ação para itens do catálogo
interface CatalogItemActionsProps {
  type: 'service' | 'material'
  item: ServiceCatalogItem | MaterialCatalogItem
  onEdit: () => void
  onDelete: () => void
}

export function CatalogItemActions({ type, item, onEdit, onDelete }: CatalogItemActionsProps) {
  const handleDelete = async () => {
    try {
      let success = false
      if (type === 'service') {
        success = await deleteServiceCatalogItem(item.id)
      } else {
        success = await deleteMaterialCatalogItem(item.id)
      }
      
      if (success) {
        onDelete()
        toast.success(`${type === 'service' ? 'Serviço' : 'Material'} excluído com sucesso`)
      } else {
        toast.error(`Erro ao excluir ${type === 'service' ? 'serviço' : 'material'}`)
      }
    } catch (error) {
      console.error(`Erro ao excluir ${type}:`, error)
      toast.error(`Erro ao excluir ${type === 'service' ? 'serviço' : 'material'}`)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
        title="Editar"
      >
        <Edit2 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 hover:text-red-700"
        title="Excluir"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
