export type ServiceType = 'AREIA' | 'EQUIPAMENTO' | 'CAPA' | 'OUTRO'
export type PaymentStatus = 'PAGO' | 'EM_ABERTO'
export type MaterialUnit = 'un' | 'kg' | 'cx' | 'm' | 'm2' | 'm3' | 'L'
export type PaymentMethod = 'PIX' | 'TRANSFERENCIA' | 'DINHEIRO' | 'CARTAO' | 'BOLETO'

// Sistema de Rotas
export type DayOfWeek = 1 | 2 | 3 | 4 | 5

export interface RouteAssignment {
  client_id: string
  full_name: string
  order_index: number
}

export interface AvailableClient {
  id: string
  full_name: string
  document?: string
  phone?: string
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

export interface Client {
  id: string
  full_name: string
  document?: string
  email?: string
  phone?: string
  address?: string
  postal_code?: string
  pix_key?: string
  is_recurring: boolean
  monthly_fee?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  client_id: string
  service_date: string
  service_type: ServiceType
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
  created_at: string
  updated_at: string
}

export interface RouteAssignment {
  id: string
  client_id: string
  weekday: number
  order_index: number
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
