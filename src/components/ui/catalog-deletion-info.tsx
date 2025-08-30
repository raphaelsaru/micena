'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Trash2, AlertTriangle } from 'lucide-react'
import { getDeletableCatalogItems } from '@/lib/services'
import { toast } from 'sonner'

interface DeletableItem {
  id: string
  name: string
  unit_type: string | null
  can_delete: boolean
  reference_count: number
}

interface CatalogDeletionInfoProps {
  onRefresh?: () => void
}

export function CatalogDeletionInfo({ onRefresh }: CatalogDeletionInfoProps) {
  const [deletableItems, setDeletableItems] = useState<{
    services: DeletableItem[]
    materials: DeletableItem[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const loadDeletableItems = async () => {
    setLoading(true)
    try {
      const items = await getDeletableCatalogItems()
      setDeletableItems(items)
    } catch (error) {
      console.error('Erro ao carregar itens deletáveis:', error)
      toast.error('Erro ao carregar informações do catálogo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeletableItems()
  }, [])

  const handleRefresh = () => {
    loadDeletableItems()
    onRefresh?.()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informações do Catálogo</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!deletableItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informações do Catálogo</CardTitle>
          <CardDescription>Não foi possível carregar as informações</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const deletableServices = deletableItems.services.filter(item => item.can_delete)
  const nonDeletableServices = deletableItems.services.filter(item => !item.can_delete)
  const deletableMaterials = deletableItems.materials.filter(item => item.can_delete)
  const nonDeletableMaterials = deletableItems.materials.filter(item => !item.can_delete)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Status dos Catálogos</h3>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {/* Serviços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Catálogo de Serviços
          </CardTitle>
          <CardDescription>
            {deletableServices.length} podem ser excluídos, {nonDeletableServices.length} estão em uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deletableServices.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2">Pode excluir:</h4>
              <div className="space-y-1">
                {deletableServices.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.unit_type || 'Sem unidade'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nonDeletableServices.length > 0 && (
            <div>
              <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Em uso (não pode excluir):
              </h4>
              <div className="space-y-1">
                {nonDeletableServices.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-md">
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.reference_count} referência(s)
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materiais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Catálogo de Materiais
          </CardTitle>
          <CardDescription>
            {deletableMaterials.length} podem ser excluídos, {nonDeletableMaterials.length} estão em uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deletableMaterials.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2">Pode excluir:</h4>
              <div className="space-y-1">
                {deletableMaterials.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.unit_type || 'Sem unidade'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nonDeletableMaterials.length > 0 && (
            <div>
              <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Em uso (não pode excluir):
              </h4>
              <div className="space-y-1">
                {nonDeletableMaterials.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-md">
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.reference_count} referência(s)
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dica */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica:</strong> Para excluir um item que está em uso, primeiro remova todas as referências a ele nos serviços existentes.
        </AlertDescription>
      </Alert>
    </div>
  )
}
