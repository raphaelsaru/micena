'use client'

import { useState, useEffect } from 'react'
import { getMaterials, createMaterial as createMaterialAction, updateMaterial as updateMaterialAction, deleteMaterial as deleteMaterialAction, MaterialInput } from '@/lib/materials'
import { Material } from '@/types/database'
import { withAuthRetry } from '@/lib/with-auth-retry'

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)

      setMaterials(await withAuthRetry(() => getMaterials()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar materiais')
    } finally {
      setLoading(false)
    }
  }

  const createMaterial = async (materialData: MaterialInput) => {
    try {
      const data = await createMaterialAction(materialData)

      setMaterials(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar material')
      throw err
    }
  }

  const updateMaterial = async (id: string, materialData: Partial<MaterialInput>) => {
    try {
      const data = await updateMaterialAction(id, materialData)

      setMaterials(prev =>
        prev.map(material =>
          material.id === id ? data : material
        ).sort((a, b) => a.name.localeCompare(b.name))
      )

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar material')
      throw err
    }
  }

  const deleteMaterial = async (id: string) => {
    try {
      await deleteMaterialAction(id)

      setMaterials(prev => prev.filter(material => material.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar material')
      throw err
    }
  }

  const getMaterialById = (id: string) => {
    return materials.find(material => material.id === id)
  }

  const searchMaterials = (query: string) => {
    if (!query.trim()) return materials

    return materials.filter(material =>
      material.name.toLowerCase().includes(query.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(query.toLowerCase()))
    )
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  return {
    materials,
    loading,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialById,
    searchMaterials,
    refetch: fetchMaterials
  }
}
