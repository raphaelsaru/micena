'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Material, MaterialUnit } from '@/types/database'

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar todos os materiais
  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('materials')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError

      setMaterials(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar materiais')
    } finally {
      setLoading(false)
    }
  }

  // Criar novo material
  const createMaterial = async (materialData: {
    name: string
    description?: string
    unit_type: MaterialUnit
  }) => {
    try {
      const { data, error: createError } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single()

      if (createError) throw createError

      // Atualizar lista local
      setMaterials(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar material')
      throw err
    }
  }

  // Atualizar material
  const updateMaterial = async (id: string, materialData: {
    name?: string
    description?: string
    unit_type?: MaterialUnit
  }) => {
    try {
      const { data, error: updateError } = await supabase
        .from('materials')
        .update(materialData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Atualizar lista local
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

  // Deletar material
  const deleteMaterial = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Atualizar lista local
      setMaterials(prev => prev.filter(material => material.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar material')
      throw err
    }
  }

  // Buscar material por ID
  const getMaterialById = (id: string) => {
    return materials.find(material => material.id === id)
  }

  // Filtrar materiais por nome
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


