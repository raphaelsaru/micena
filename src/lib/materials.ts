'use server'

import { query, insertRow, updateRow } from '@/lib/db'
import { requireUser } from '@/lib/auth-server'
import { Material, MaterialUnit } from '@/types/database'

export async function getMaterials(): Promise<Material[]> {
  await requireUser()
  return query<Material>('SELECT * FROM materials ORDER BY name')
}

export interface MaterialInput {
  name: string
  description?: string
  unit_type: MaterialUnit
}

export async function createMaterial(materialData: MaterialInput): Promise<Material> {
  await requireUser()
  const created = await insertRow<Material>('materials', materialData)
  if (!created) throw new Error('Erro ao criar material')
  return created
}

export async function updateMaterial(id: string, materialData: Partial<MaterialInput>): Promise<Material> {
  await requireUser()
  const updated = await updateRow<Material>('materials', id, materialData)
  if (!updated) throw new Error('Erro ao atualizar material')
  return updated
}

export async function deleteMaterial(id: string): Promise<void> {
  await requireUser()
  await query('DELETE FROM materials WHERE id = $1', [id])
}
