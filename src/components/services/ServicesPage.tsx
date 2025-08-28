
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  Settings,
  Filter 
} from 'lucide-react'
import { ServiceWithClient, ServiceType } from '@/types/database'
import { 
  getServices, 
  deleteService, 
  getAllServiceCategories 
} from '@/lib/services'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { toast } from 'sonner'
import { CreateServiceDialog } from './CreateServiceDialog'
import { EditServiceDialog } from './EditServiceDialog'
import { CustomCategoriesManager } from './CustomCategoriesManager'

export function ServicesPage() {
  const [services, setServices] = useState<ServiceWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingService, setEditingService] = useState<ServiceWithClient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ServiceType | string>('')
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoriesManager, setShowCategoriesManager] = useState(false)

  // Carregar categorias
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await getAllServiceCategories()
      setCategories(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  // Função para obter o nome da categoria
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  // Função para obter a cor da categoria
  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.color : '#6B7280'
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-600">Gerencie todos os serviços prestados</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCategoriesManager(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Categorias
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Buscar serviços</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                placeholder="Buscar por cliente, OS ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-48">
            <Label htmlFor="category-filter">Filtrar por categoria</Label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ... existing table code ... */}

      {/* ... existing dialogs ... */}

      {/* Gerenciador de Categorias */}
      <CustomCategoriesManager
        open={showCategoriesManager}
        onOpenChange={setShowCategoriesManager}
        onCategoryChange={loadCategories}
      />
    </div>
  )
}
