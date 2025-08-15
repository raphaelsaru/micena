import { supabase } from './supabase-client'
import { DayOfWeek, DayState } from '@/types/database'

// Buscar estado completo de um dia da semana (1 leitura)
export async function getDayState(weekday: DayOfWeek): Promise<DayState> {
  try {
    const { data, error } = await supabase.rpc('get_day_state', {
      p_weekday: weekday
    })

    if (error) {
      console.error('Erro ao buscar estado do dia:', error)
      throw new Error(`Erro ao buscar estado do dia: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return {
        assignments: [],
        available_clients: [],
        max_clients: 10
      }
    }

    return data[0]
  } catch (err) {
    console.error('Erro ao buscar estado do dia:', err)
    throw new Error('Erro ao buscar estado do dia')
  }
}

// Salvar posições dos clientes (1 persistência)
export async function savePositions(
  weekday: DayOfWeek, 
  orderedClientIds: string[]
): Promise<void> {
  try {
    const { error } = await supabase.rpc('save_positions', {
      p_weekday: weekday,
      p_ordered_client_ids: orderedClientIds
    })

    if (error) {
      console.error('Erro ao salvar posições:', error)
      throw new Error(error.message || 'Erro ao salvar posições')
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('Erro detalhado ao salvar posições:', err)
      throw err
    }
    console.error('Erro inesperado ao salvar posições:', err)
    throw new Error('Erro inesperado ao salvar posições')
  }
}
