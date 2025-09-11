export type ServiceType = 
  | 'AREIA' 
  | 'EQUIPAMENTO' 
  | 'CAPA' 
  | 'LIMPEZA_PROFUNDA'
  | 'TRATAMENTO_QUIMICO'
  | 'REPARO_ESTRUTURAL'
  | 'INSTALACAO'
  | 'INSPECAO_TECNICA'
  | 'MANUTENCAO_PREVENTIVA'
  | 'DECORACAO'
  | 'SAZONAL'
  | 'OUTRO'
  | string // Para categorias personalizadas com UUID
export type PaymentStatus = 'PAGO' | 'EM_ABERTO'
export type MaterialUnit = 'un' | 'kg' | 'cx' | 'm' | 'm2' | 'm3' | 'L'
export type PaymentMethod = 'PIX' | 'TRANSFERENCIA' | 'DINHEIRO' | 'CARTAO' | 'BOLETO'
export type UserRole = 'admin' | 'colaborador'

// Novos tipos para catálogos e histórico de preços
export interface ServiceCatalogItem {
  id: string
  name: string
  unit_type?: string
  created_at: string
  updated_at: string
}

export interface MaterialCatalogItem {
  id: string
  name: string
  unit_type?: string
  created_at: string
  updated_at: string
}

// Interface para categorias personalizadas
export interface CustomServiceCategory {
  id: string
  name: string
  description?: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Interface para todas as categorias (padrão + personalizadas)
export interface ServiceCategory {
  id: string
  name: string
  description: string
  color: string
  is_custom: boolean
}

export interface PriceHistoryItem {
  id: string
  item_type: 'service' | 'material'
  item_id: string
  price_numeric: number
  org_id?: string
  created_at: string
}

export interface LastPriceResult {
  price_numeric: number
  created_at: string
}

// Sistema de Rotas
export type DayOfWeek = 1 | 2 | 3 | 4 | 5
export type TeamId = 1 | 2 | 3 | 4

export interface RouteAssignment {
  client_id: string
  full_name: string
  neighborhood?: string
  order_index: number
  team_id: TeamId
  has_key?: boolean
  service_type?: 'ASPIRAR' | 'ESFREGAR'
}

export interface AvailableClient {
  id: string
  full_name: string
  document?: string
  phone?: string
  neighborhood?: string
}

export interface DayState {
  assignments: RouteAssignment[]
  available_clients: AvailableClient[]
}

export interface PendingChange {
  clientId: string
  oldPosition: number
  newPosition: number
  dayOfWeek: DayOfWeek
  teamId: TeamId
}

// Constantes para os dias da semana
export const DAY_LABELS: Record<DayOfWeek, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira'
}

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex'
}

// Constantes para as equipes
export const TEAM_LABELS: Record<TeamId, string> = {
  1: 'Equipe 1',
  2: 'Equipe 2',
  3: 'Equipe 3',
  4: 'Equipe 4'
}

export const TEAM_COLORS: Record<TeamId, string> = {
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-purple-500',
  4: 'bg-orange-500'
}

export interface Client {
  id: string
  full_name: string
  document?: string
  email?: string
  phone?: string
  address?: string
  neighborhood?: string
  postal_code?: string
  pix_key?: string
  is_recurring: boolean
  monthly_fee?: number
  subscription_start_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  client_id: string
  service_date: string
  service_type?: ServiceType // Agora opcional
  equipment_details?: string
  notes?: string
  next_service_date?: string
  work_order_number?: string
  google_event_id?: string
  payment_method?: PaymentMethod
  payment_details?: string
  total_amount?: number
  created_at: string
  updated_at: string
}

export interface ServiceItem {
  id: string
  service_id: string
  description: string
  value: number
  catalog_item_id?: string
  created_at: string
  updated_at: string
}

export interface ServiceMaterial {
  id: string
  service_id: string
  description: string
  unit: MaterialUnit
  quantity: number
  unit_price: number
  total_price: number
  catalog_item_id?: string
  created_at: string
  updated_at: string
}

export interface ServiceWithDetails extends Service {
  service_items: ServiceItem[]
  service_materials: ServiceMaterial[]
  clients?: {
    full_name: string
    document?: string
    phone?: string
  }
}

export interface ServiceWithClient extends Service {
  clients?: {
    full_name: string
    document?: string
    phone?: string
  }
  service_items?: ServiceItem[]
  service_materials?: ServiceMaterial[]
}

export interface Payment {
  id: string
  client_id: string
  year: number
  month: number
  status: PaymentStatus
  receipt_url?: string
  marked_by_receipt: boolean
  amount?: number
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface RouteSetting {
  id: string
  weekday: number // 1=Monday, 2=Tuesday, ..., 5=Friday
  max_clients: number
  team_id: TeamId
  created_at: string
  updated_at: string
}

export interface RouteAssignment {
  id: string
  client_id: string
  weekday: number
  order_index: number
  team_id: TeamId
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_user_id?: string
  action: string
  entity: string
  entity_id?: string
  payload?: Record<string, unknown>
  created_at: string
}

// Extended types for UI
export interface ClientWithServices extends Client {
  services: Service[]
  payments: Payment[]
  route_assignments: RouteAssignment[]
}

// Removido - definição duplicada

export interface PaymentWithClient extends Payment {
  client: Client
}

export interface RouteAssignmentWithClient extends RouteAssignment {
  client: Client
}

// Route display types
export interface RouteDisplay {
  weekday: number
  weekdayName: string
  assignments: RouteAssignmentWithClient[]
  columns: RouteColumn[]
}

export interface RouteColumn {
  clients: RouteAssignmentWithClient[]
  displayNumbers: number[]
}

// Função para categorizar automaticamente um serviço baseado nos itens
export function categorizeServiceByItems(items: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]): ServiceType {
  if (items.length === 0) return 'OUTRO'
  
  const descriptions = items.map(item => item.description.toLowerCase())
  
  // Verificar se contém palavras-chave relacionadas a areia
  if (descriptions.some(desc => 
    desc.includes('areia') || 
    desc.includes('filtro') || 
    desc.includes('troca de areia') ||
    desc.includes('substituição de areia') ||
    desc.includes('substituicao de areia')
  )) {
    return 'AREIA'
  }
  
  // Verificar se contém palavras-chave relacionadas a equipamentos
  if (descriptions.some(desc => 
    desc.includes('bomba') || 
    desc.includes('motor') || 
    desc.includes('filtro') ||
    desc.includes('aquecimento') ||
    desc.includes('clorador') ||
    desc.includes('equipamento') ||
    desc.includes('reparo') ||
    desc.includes('manutenção') ||
    desc.includes('manutencao')
  )) {
    return 'EQUIPAMENTO'
  }
  
  // Verificar se contém palavras-chave relacionadas a capas
  if (descriptions.some(desc => 
    desc.includes('capa') || 
    desc.includes('cobertura') || 
    desc.includes('lona') ||
    desc.includes('proteção') ||
    desc.includes('protecao')
  )) {
    return 'CAPA'
  }
  
  // Verificar se contém palavras-chave relacionadas a limpeza profunda
  if (descriptions.some(desc => 
    desc.includes('limpeza profunda') ||
    desc.includes('limpeza completa') ||
    desc.includes('aspiração') ||
    desc.includes('aspiracao') ||
    desc.includes('escovação') ||
    desc.includes('escovacao') ||
    desc.includes('paredes') ||
    desc.includes('fundo')
  )) {
    return 'LIMPEZA_PROFUNDA'
  }
  
  // Verificar se contém palavras-chave relacionadas a tratamento químico
  if (descriptions.some(desc => 
    desc.includes('ph') ||
    desc.includes('cloro') ||
    desc.includes('alcalinidade') ||
    desc.includes('dureza') ||
    desc.includes('tratamento químico') ||
    desc.includes('tratamento quimico') ||
    desc.includes('ajuste químico') ||
    desc.includes('ajuste quimico') ||
    desc.includes('dosagem')
  )) {
    return 'TRATAMENTO_QUIMICO'
  }
  
  // Verificar se contém palavras-chave relacionadas a reparo estrutural
  if (descriptions.some(desc => 
    desc.includes('azulejo') ||
    desc.includes('borda') ||
    desc.includes('fissura') ||
    desc.includes('vazamento') ||
    desc.includes('reparo estrutural') ||
    desc.includes('reparo na piscina') ||
    desc.includes('conserto')
  )) {
    return 'REPARO_ESTRUTURAL'
  }
  
  // Verificar se contém palavras-chave relacionadas a reparo hidráulico
  if (descriptions.some(desc => 
    desc.includes('hidráulica') ||
    desc.includes('hidraulica') ||
    desc.includes('cano') ||
    desc.includes('tubulação') ||
    desc.includes('tubulacao') ||
    desc.includes('válvula') ||
    desc.includes('valvula') ||
    desc.includes('conexão') ||
    desc.includes('conexao') ||
    desc.includes('reparo hidráulico') ||
    desc.includes('reparo hidraulico')
  )) {
    return 'REPARO HIDRAULICO'
  }
  
  // Verificar se contém palavras-chave relacionadas a instalação
  if (descriptions.some(desc => 
    desc.includes('instalação') ||
    desc.includes('instalacao') ||
    desc.includes('montagem') ||
    desc.includes('novo equipamento') ||
    desc.includes('novo sistema')
  )) {
    return 'INSTALACAO'
  }
  
  // Verificar se contém palavras-chave relacionadas a inspeção técnica
  if (descriptions.some(desc => 
    desc.includes('inspeção') ||
    desc.includes('inspecao') ||
    desc.includes('diagnóstico') ||
    desc.includes('diagnostico') ||
    desc.includes('verificação') ||
    desc.includes('verificacao') ||
    desc.includes('análise') ||
    desc.includes('analise')
  )) {
    return 'INSPECAO_TECNICA'
  }
  
  // Verificar se contém palavras-chave relacionadas a manutenção preventiva
  if (descriptions.some(desc => 
    desc.includes('manutenção preventiva') ||
    desc.includes('manutencao preventiva') ||
    desc.includes('preventiva') ||
    desc.includes('manutenção regular') ||
    desc.includes('manutencao regular') ||
    desc.includes('check-up') ||
    desc.includes('checkup')
  )) {
    return 'MANUTENCAO_PREVENTIVA'
  }
  
  // Verificar se contém palavras-chave relacionadas a decoração
  if (descriptions.some(desc => 
    desc.includes('iluminação') ||
    desc.includes('iluminacao') ||
    desc.includes('cascata') ||
    desc.includes('decorativo') ||
    desc.includes('decoracao') ||
    desc.includes('decoração') ||
    desc.includes('led') ||
    desc.includes('spot')
  )) {
    return 'DECORACAO'
  }
  
  // Verificar se contém palavras-chave relacionadas a serviços sazonais
  if (descriptions.some(desc => 
    desc.includes('inverno') ||
    desc.includes('verão') ||
    desc.includes('verao') ||
    desc.includes('sazonal') ||
    desc.includes('temporada') ||
    desc.includes('estação') ||
    desc.includes('estacao')
  )) {
    return 'SAZONAL'
  }
  
  return 'OUTRO'
}
