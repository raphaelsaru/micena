'use server'

import { query, queryOne } from '@/lib/db'
import { requireUser } from '@/lib/auth-server'
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
  await requireUser()
  const result = await queryOne<DayState>(
    'SELECT * FROM get_day_state($1, $2)',
    [weekday, teamId]
  )

  return result ?? { assignments: [], available_clients: [] }
}

// Salvar posições dos clientes para uma equipe específica
export async function savePositions(
  weekday: DayOfWeek,
  orderedClientIds: string[],
  teamId: TeamId = 1,
  hasKeys?: boolean[],
  serviceTypes?: ('ASPIRAR' | 'ESFREGAR' | null)[]
): Promise<void> {
  await requireUser()
  if (!weekday || weekday < 1 || weekday > 6) {
    throw new Error(`Dia da semana inválido: ${weekday}. Deve estar entre 1 e 6.`)
  }
  if (!teamId || teamId < 1 || teamId > 5) {
    throw new Error(`ID da equipe inválido: ${teamId}. Deve estar entre 1 e 5.`)
  }
  if (!Array.isArray(orderedClientIds)) {
    throw new Error('orderedClientIds deve ser um array')
  }

  const clientIdsAsStrings = orderedClientIds.map((id) => id.toString())

  await query(
    'SELECT save_positions($1, $2, $3, $4, $5)',
    [weekday, clientIdsAsStrings, teamId, hasKeys ?? null, serviceTypes ?? null]
  )
}

// Atualizar atributos específicos de um cliente na rota
export async function updateRouteClientAttributes(
  clientId: string,
  weekday: DayOfWeek,
  teamId: TeamId,
  hasKey?: boolean,
  serviceType?: 'ASPIRAR' | 'ESFREGAR'
): Promise<boolean> {
  await requireUser()
  if (!clientId) {
    throw new Error('clientId é obrigatório')
  }
  if (!weekday || weekday < 1 || weekday > 6) {
    throw new Error(`Dia da semana inválido: ${weekday}. Deve estar entre 1 e 6.`)
  }
  if (!teamId || teamId < 1 || teamId > 5) {
    throw new Error(`ID da equipe inválido: ${teamId}. Deve estar entre 1 e 5.`)
  }

  const result = await queryOne<{ update_route_client_attributes: boolean }>(
    'SELECT update_route_client_attributes($1, $2, $3, $4, $5)',
    [clientId, weekday, teamId, hasKey ?? null, serviceType ?? null]
  )

  return result?.update_route_client_attributes ?? false
}

// Buscar cliente em todas as rotas por nome
export async function getClientRouteAssignments(clientName: string): Promise<ClientRouteAssignment[]> {
  await requireUser()
  return query<ClientRouteAssignment>(
    'SELECT * FROM search_client_in_routes($1)',
    [clientName]
  )
}
