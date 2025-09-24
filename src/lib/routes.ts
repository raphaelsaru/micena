import { supabase } from './supabase'
import { DayOfWeek, DayState, TeamId } from '@/types/database'

export interface ClientRouteAssignment {
  client_id: string
  full_name: string
  weekday: DayOfWeek
  team_id: TeamId
  order_index: number
  neighborhood?: string
}

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
  teamId: TeamId = 1,
  hasKeys?: boolean[],
  serviceTypes?: ('ASPIRAR' | 'ESFREGAR' | null)[]
): Promise<void> {
  try {
    console.log('🔧 DEBUG savePositions:')
    console.log('   weekday:', weekday)
    console.log('   teamId:', teamId)
    console.log('   orderedClientIds:', orderedClientIds)
    console.log('   total de clientes:', orderedClientIds.length)
    
    // Validar parâmetros antes de chamar a RPC
    if (!weekday || weekday < 1 || weekday > 6) {
      throw new Error(`Dia da semana inválido: ${weekday}. Deve estar entre 1 e 6.`)
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
      p_ordered_client_ids: clientIdsAsStrings,
      p_has_keys: hasKeys || null,
      p_service_types: serviceTypes || null
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

// Atualizar atributos específicos de um cliente na rota
export async function updateRouteClientAttributes(
  clientId: string,
  weekday: DayOfWeek,
  teamId: TeamId,
  hasKey?: boolean,
  serviceType?: 'ASPIRAR' | 'ESFREGAR'
): Promise<boolean> {
  try {
    console.log('🔧 DEBUG updateRouteClientAttributes:')
    console.log('   clientId:', clientId)
    console.log('   weekday:', weekday)
    console.log('   teamId:', teamId)
    console.log('   hasKey:', hasKey)
    console.log('   serviceType:', serviceType)
    
    // Validar parâmetros
    if (!clientId) {
      throw new Error('clientId é obrigatório')
    }
    
    if (!weekday || weekday < 1 || weekday > 6) {
      throw new Error(`Dia da semana inválido: ${weekday}. Deve estar entre 1 e 6.`)
    }
    
    if (!teamId || teamId < 1 || teamId > 4) {
      throw new Error(`ID da equipe inválido: ${teamId}. Deve estar entre 1 e 4.`)
    }
    
    const { data, error } = await supabase.rpc('update_route_client_attributes', {
      p_client_id: clientId,
      p_weekday: weekday,
      p_team_id: teamId,
      p_has_key: hasKey,
      p_service_type: serviceType
    })

    if (error) {
      console.error('Erro retornado pela RPC update_route_client_attributes:', error)
      throw new Error(`Erro do servidor: ${error.message || 'Erro desconhecido'}`)
    }
    
    console.log('✅ updateRouteClientAttributes executado com sucesso, resultado:', data)
    return data || false
  } catch (err) {
    if (err instanceof Error) {
      console.error('Erro detalhado ao atualizar atributos do cliente:', err)
      throw err
    }
    console.error('Erro inesperado ao atualizar atributos do cliente:', err)
    throw new Error('Erro inesperado ao atualizar atributos do cliente')
  }
}

// Buscar cliente em todas as rotas por nome
export async function getClientRouteAssignments(clientName: string): Promise<ClientRouteAssignment[]> {
  try {
    console.log('🔍 Buscando cliente nas rotas:', clientName)
    
    const { data, error } = await supabase.rpc('search_client_in_routes', {
      p_client_name: clientName
    })

    if (error) {
      console.error('Erro ao buscar cliente nas rotas:', error)
      throw new Error(`Erro ao buscar cliente: ${error.message}`)
    }

    if (!data || data.length === 0) {
      console.log('Cliente não encontrado em nenhuma rota')
      return []
    }

    console.log('Cliente encontrado em', data.length, 'rota(s):', data)
    return data
  } catch (err) {
    console.error('Erro ao buscar cliente nas rotas:', err)
    throw new Error('Erro ao buscar cliente nas rotas')
  }
}
