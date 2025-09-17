'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useMaterials } from '@/hooks/useMaterials'
import { Material, MaterialUnit } from '@/types/database'
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'

const UNIT_OPTIONS: { value: MaterialUnit; label: string }[] = [
  { value: 'un', label: 'Unidade' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'cx', label: 'Caixa' },
  { value: 'm', label: 'Metro' },
  { value: 'm2', label: 'Metro Quadrado' },
  { value: 'm3', label: 'Metro Cúbico' },
  { value: 'L', label: 'Litro' }
]

export function MaterialsManagement() {
  const { materials, loading, error, createMaterial, updateMaterial, deleteMaterial, searchMaterials } = useMaterials()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_type: 'un' as MaterialUnit
  })

  const filteredMaterials = searchMaterials(searchQuery)

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome do material é obrigatório')
      return
    }

    try {
      await createMaterial(formData)
      toast.success('Material criado com sucesso!')
      setIsCreateDialogOpen(false)
      setFormData({ name: '', description: '', unit_type: 'un' })
    } catch (err) {
      toast.error('Erro ao criar material')
    }
  }

  const handleEditMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingMaterial || !formData.name.trim()) {
      toast.error('Nome do material é obrigatório')
      return
    }

    try {
      await updateMaterial(editingMaterial.id, formData)
      toast.success('Material atualizado com sucesso!')
      setIsEditDialogOpen(false)
      setEditingMaterial(null)
      setFormData({ name: '', description: '', unit_type: 'un' })
    } catch (err) {
      toast.error('Erro ao atualizar material')
    }
  }

  const handleDeleteMaterial = async (material: Material) => {
    if (!confirm(`Tem certeza que deseja deletar o material "${material.name}"?`)) {
      return
    }

    try {
      await deleteMaterial(material.id)
      toast.success('Material deletado com sucesso!')
    } catch (err) {
      toast.error('Erro ao deletar material')
    }
  }

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      description: material.description || '',
      unit_type: material.unit_type
    })
    setIsEditDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingMaterial(null)
    setFormData({ name: '', description: '', unit_type: 'un' })
  }

  const getUnitLabel = (unit: MaterialUnit) => {
    return UNIT_OPTIONS.find(option => option.value === unit)?.label || unit
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando materiais...</p>
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
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar materiais</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gerenciamento de Materiais
            </CardTitle>
            <CardDescription>
              Gerencie o catálogo de materiais disponíveis para compra
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Material</DialogTitle>
                <DialogDescription>
                  Adicione um novo material ao catálogo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMaterial}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Material *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Cloro Granulado"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição detalhada do material"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_type">Unidade de Medida</Label>
                    <Select
                      value={formData.unit_type}
                      onValueChange={(value: MaterialUnit) => setFormData(prev => ({ ...prev, unit_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={closeDialogs}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Material</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Barra de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar materiais..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabela de materiais */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {searchQuery ? 'Nenhum material encontrado' : 'Nenhum material cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getUnitLabel(material.unit_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMaterial(material)}
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
              <DialogTitle>Editar Material</DialogTitle>
              <DialogDescription>
                Atualize as informações do material
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditMaterial}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome do Material *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Cloro Granulado"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada do material"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit_type">Unidade de Medida</Label>
                  <Select
                    value={formData.unit_type}
                    onValueChange={(value: MaterialUnit) => setFormData(prev => ({ ...prev, unit_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={closeDialogs}>
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


