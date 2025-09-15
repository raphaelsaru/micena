'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrimmedInput, TrimmedTextarea } from '@/components/ui/trimmed-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  getAllServiceCategories, 
  addCustomServiceCategory, 
  updateCustomServiceCategory, 
  removeCustomServiceCategory,
  deleteCustomServiceCategory,
  getCustomServiceCategoriesWithUsage
} from '@/lib/services'
import { ServiceCategory, CustomServiceCategory } from '@/types/database'
import { Plus, Edit, Trash2, Palette } from 'lucide-react'
import { toast } from 'sonner'

interface CustomCategoriesManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryChange?: () => void
}

export function CustomCategoriesManager({ 
  open, 
  onOpenChange, 
  onCategoryChange 
}: CustomCategoriesManagerProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [categoriesWithUsage, setCategoriesWithUsage] = useState<Array<{
    id: string
    name: string
    description: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
    services_count: number
  }>>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CustomServiceCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280'
  })

  // Cores predefinidas para seleção
  const predefinedColors = [
    '#6B7280', '#EF4444', '#F59E0B', '#10B981', 
    '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4',
    '#84CC16', '#F97316', '#6366F1', '#14B8A6'
  ]

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const [categoriesData, categoriesWithUsageData] = await Promise.all([
        getAllServiceCategories(),
        getCustomServiceCategoriesWithUsage()
      ])
      setCategories(categoriesData)
      setCategoriesWithUsage(categoriesWithUsageData)
    } catch (error) {
      toast.error('Erro ao carregar categorias')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    // Normalizar: trim, uppercase e remover espaços extras
    const normalizedName = formData.name.trim().toUpperCase().replace(/\s+/g, ' ')
    
    if (!normalizedName) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    try {
      await addCustomServiceCategory(normalizedName, formData.description?.trim(), formData.color)
      toast.success('Categoria criada com sucesso!')
      setShowAddDialog(false)
      setFormData({ name: '', description: '', color: '#6B7280' })
      loadCategories()
      onCategoryChange?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar categoria'
      toast.error(errorMessage)
      console.error(error)
    }
  }

  const handleEditCategory = async () => {
    // Normalizar: trim, uppercase e remover espaços extras
    const normalizedName = formData.name.trim().toUpperCase().replace(/\s+/g, ' ')
    
    if (!editingCategory || !normalizedName) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    try {
      await updateCustomServiceCategory(editingCategory.id, {
        name: normalizedName,
        description: formData.description?.trim(),
        color: formData.color
      })
      toast.success('Categoria atualizada com sucesso!')
      setShowEditDialog(false)
      setEditingCategory(null)
      setFormData({ name: '', description: '', color: '#6B7280' })
      loadCategories()
      onCategoryChange?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar categoria'
      toast.error(errorMessage)
      console.error(error)
    }
  }

  const handleDeleteCategory = async (category: CustomServiceCategory) => {
    // Buscar informações sobre o uso da categoria
    const categoryWithUsage = categoriesWithUsage.find(c => c.id === category.id)
    const servicesCount = categoryWithUsage?.services_count || 0
    
    if (servicesCount > 0) {
      // Se há serviços usando, mostrar aviso e perguntar se quer fazer soft delete
      if (!confirm(`A categoria "${category.name}" está sendo usada por ${servicesCount} serviço(s).\n\nDeseja marcá-la como inativa (soft delete) em vez de deletá-la permanentemente?`)) {
        return
      }
      
      try {
        await removeCustomServiceCategory(category.id)
        toast.success('Categoria marcada como inativa com sucesso!')
        loadCategories()
        onCategoryChange?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao marcar categoria como inativa'
        toast.error(errorMessage)
        console.error(error)
      }
    } else {
      // Se não há serviços usando, perguntar se quer deletar permanentemente
      if (!confirm(`Tem certeza que deseja deletar permanentemente a categoria "${category.name}"?\n\nEsta ação não pode ser desfeita.`)) {
        return
      }
      
      try {
        await deleteCustomServiceCategory(category.id)
        toast.success('Categoria deletada permanentemente com sucesso!')
        loadCategories()
        onCategoryChange?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar categoria'
        toast.error(errorMessage)
        console.error(error)
      }
    }
  }

  const openEditDialog = (category: CustomServiceCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color
    })
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#6B7280' })
    setEditingCategory(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias de Serviços</DialogTitle>
            <DialogDescription>
              Gerencie as categorias personalizadas de serviços. As categorias padrão não podem ser editadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Categorias Disponíveis</h3>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 border rounded-lg ${
                      category.is_custom ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: category.color }}
                          />
                          <h4 className="font-medium text-gray-900">
                            {category.name}
                          </h4>
                          {!category.is_custom && (
                            <Badge variant="secondary" className="text-xs">
                              Padrão
                            </Badge>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {category.description}
                          </p>
                        )}
                        
                        {/* Mostrar informações sobre o uso da categoria */}
                        {category.is_custom && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Serviços: </span>
                            {(() => {
                              const categoryWithUsage = categoriesWithUsage.find(c => c.id === category.id)
                              const servicesCount = categoryWithUsage?.services_count || 0
                              return (
                                <Badge 
                                  variant={servicesCount > 0 ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {servicesCount}
                                </Badge>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                      {category.is_custom && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Só permitir edição se for categoria personalizada
                              if (category.is_custom) {
                                // Criar um objeto CustomServiceCategory com as propriedades necessárias
                                const customCategory: CustomServiceCategory = {
                                  id: category.id,
                                  name: category.name,
                                  description: category.description,
                                  color: category.color,
                                  is_active: true, // Valor padrão
                                  created_at: new Date().toISOString(), // Valor padrão
                                  updated_at: new Date().toISOString() // Valor padrão
                                }
                                openEditDialog(customCategory)
                              }
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Só permitir exclusão se for categoria personalizada
                              if (category.is_custom) {
                                // Criar um objeto CustomServiceCategory com as propriedades necessárias
                                const customCategory: CustomServiceCategory = {
                                  id: category.id,
                                  name: category.name,
                                  description: category.description,
                                  color: category.color,
                                  is_active: true, // Valor padrão
                                  created_at: new Date().toISOString(), // Valor padrão
                                  updated_at: new Date().toISOString() // Valor padrão
                                }
                                handleDeleteCategory(customCategory)
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar categoria */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria Personalizada</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar melhor seus serviços.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nome da Categoria *</Label>
              <TrimmedInput
                id="category-name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value.toUpperCase().replace(/\s+/g, ' ') })}
                placeholder="Ex: LIMPEZA PROFUNDA"
                className="w-full"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div>
              <Label htmlFor="category-description">Descrição (opcional)</Label>
              <TrimmedTextarea
                id="category-description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Descreva o tipo de serviço que esta categoria representa"
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <Label>Cor da Categoria</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCategory}>Criar Categoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar categoria */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Edite os detalhes da categoria personalizada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Nome da Categoria *</Label>
              <TrimmedInput
                id="edit-category-name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value.toUpperCase().replace(/\s+/g, ' ') })}
                placeholder="Ex: LIMPEZA PROFUNDA"
                className="w-full"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div>
              <Label htmlFor="edit-category-description">Descrição (opcional)</Label>
              <TrimmedTextarea
                id="edit-category-description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Descreva o tipo de serviço que esta categoria representa"
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <Label>Cor da Categoria</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-8 p-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
