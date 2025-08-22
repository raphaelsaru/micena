import { supabase } from './supabase-client'
import { DayOfWeek, DayState, TeamId } from '@/types/database'

// Buscar estado completo de um dia da semana para uma equipe específica
export async function getDayState(weekday: DayOfWeek, teamId: TeamId = 1): Promise<DayState> {
  try {
    const { data, error } = await supabase.rpc('get_day_state', {
      p_weekday: weekday,
      p_team_id: teamId
    })

    if (error) {
      console.error('Erro ao buscar estado do dia:', error)
      throw new Error(`Erro ao buscar estado do dia: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return {
        assignments: [],
        available_clients: []
      }
    }

    return data[0]
  } catch (err) {
    console.error('Erro ao buscar estado do dia:', err)
    throw new Error('Erro ao buscar estado do dia')
  }
}

// Salvar posições dos clientes para uma equipe específica
export async function savePositions(
  weekday: DayOfWeek, 
  orderedClientIds: string[],
  teamId: TeamId = 1
): Promise<void> {
  try {
    console.log('🔧 DEBUG savePositions:')
    console.log('   weekday:', weekday)
    console.log('   teamId:', teamId)
    console.log('   orderedClientIds:', orderedClientIds)
    console.log('   total de clientes:', orderedClientIds.length)
    
    // Validar parâmetros antes de chamar a RPC
    if (!weekday || weekday < 1 || weekday > 5) {
      throw new Error(`Dia da semana inválido: ${weekday}. Deve estar entre 1 e 5.`)
    }
    
    if (!teamId || teamId < 1 || teamId > 4) {
      throw new Error(`ID da equipe inválido: ${teamId}. Deve estar entre 1 e 4.`)
    }
    
    if (!Array.isArray(orderedClientIds)) {
      throw new Error('orderedClientIds deve ser um array')
    }
    
    // Converter UUIDs para string se necessário
    const clientIdsAsStrings = orderedClientIds.map(id => id.toString())
    
    const { error } = await supabase.rpc('save_positions', {
      p_weekday: weekday,
      p_team_id: teamId,
      p_ordered_client_ids: clientIdsAsStrings
    })

    if (error) {
      console.error('Erro retornado pela RPC save_positions:', error)
      throw new Error(`Erro do servidor: ${error.message || 'Erro desconhecido'}`)
    }
    
    console.log('✅ savePositions executado com sucesso')
  } catch (err) {
    if (err instanceof Error) {
      console.error('Erro detalhado ao salvar posições:', err)
      throw err
    }
    console.error('Erro inesperado ao salvar posições:', err)
    throw new Error('Erro inesperado ao salvar posições')
  }
}
