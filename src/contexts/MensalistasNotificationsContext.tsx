'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase-client'


interface MensalistaNotification {
  id: string
  clientId: string
  full_name: string
  year: number
  month: number
  status: 'ATRASADO' | 'EM_ABERTO'
  monthly_fee: number
}

interface NotificationsSummary {
  totalAtrasados: number
  totalEmAberto: number
  atrasados: MensalistaNotification[]
  emAberto: MensalistaNotification[]
}

interface MensalistasNotificationsContextType {
  notifications: NotificationsSummary
  loading: boolean
  refreshNotifications: () => Promise<void>
  markAsPaid: (clientId: string, year: number, month: number) => Promise<void>
  markAsUnpaid: (clientId: string, year: number, month: number) => Promise<void>
}

const MensalistasNotificationsContext = createContext<MensalistasNotificationsContextType | undefined>(undefined)

export function useMensalistasNotifications() {
  const context = useContext(MensalistasNotificationsContext)
  if (context === undefined) {
    throw new Error('useMensalistasNotifications must be used within a MensalistasNotificationsProvider')
  }
  return context
}

interface MensalistasNotificationsProviderProps {
  children: ReactNode
}

export function MensalistasNotificationsProvider({ children }: MensalistasNotificationsProviderProps) {
  const [notifications, setNotifications] = useState<NotificationsSummary>({
    totalAtrasados: 0,
    totalEmAberto: 0,
    atrasados: [],
    emAberto: []
  })
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1 // Janeiro = 1, Dezembro = 12

      // Buscar clientes mensalistas
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_recurring', true)
        .order('full_name')

      if (clientsError) throw clientsError

      // Buscar pagamentos para o ano atual
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('year', currentYear)

      if (paymentsError) throw paymentsError

      const atrasados: MensalistaNotification[] = []
      const emAberto: MensalistaNotification[] = []

      clients.forEach(client => {
        const clientPayments = payments.filter(p => p.client_id === client.id)
        
        // Verificar meses anteriores (atrasados)
        for (let month = 1; month < currentMonth; month++) {
          const payment = clientPayments.find(p => p.month === month)
          if (!payment || payment.status === 'EM_ABERTO') {
            atrasados.push({
              id: `${client.id}-${currentYear}-${month}`,
              clientId: client.id,
              full_name: client.full_name,
              year: currentYear,
              month,
              status: 'ATRASADO',
              monthly_fee: client.monthly_fee || 0
            })
          }
        }

        // Verificar mês atual (em aberto)
        const currentMonthPayment = clientPayments.find(p => p.month === currentMonth)
        if (!currentMonthPayment || currentMonthPayment.status === 'EM_ABERTO') {
          emAberto.push({
            id: `${client.id}-${currentYear}-${currentMonth}`,
            clientId: client.id,
            full_name: client.full_name,
            year: currentYear,
            month: currentMonth,
            status: 'EM_ABERTO',
            monthly_fee: client.monthly_fee || 0
          })
        }
      })

      setNotifications({
        totalAtrasados: atrasados.length,
        totalEmAberto: emAberto.length,
        atrasados,
        emAberto
      })
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (clientId: string, year: number, month: number) => {
    try {
      // Verificar se já existe um pagamento
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month)
        .single()

      if (existingPayment) {
        // Atualizar pagamento existente
        const { error } = await supabase
          .from('payments')
          .update({
            status: 'PAGO',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id)

        if (error) throw error
      } else {
        // Criar novo pagamento
        const { error } = await supabase
          .from('payments')
          .insert({
            client_id: clientId,
            year,
            month,
            status: 'PAGO',
            paid_at: new Date().toISOString()
          })

        if (error) throw error
      }

      // Recarregar notificações
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      throw error
    }
  }

  const markAsUnpaid = async (clientId: string, year: number, month: number) => {
    try {
      // Verificar se existe um pagamento
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month)
        .single()

      if (existingPayment) {
        // Atualizar pagamento para EM_ABERTO
        const { error } = await supabase
          .from('payments')
          .update({
            status: 'EM_ABERTO',
            paid_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id)

        if (error) throw error
      } else {
        // Criar novo pagamento EM_ABERTO
        const { error } = await supabase
          .from('payments')
          .insert({
            client_id: clientId,
            year,
            month,
            status: 'EM_ABERTO'
          })

        if (error) throw error
      }

      // Recarregar notificações
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar como não pago:', error)
      throw error
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const value = {
    notifications,
    loading,
    refreshNotifications: loadNotifications,
    markAsPaid,
    markAsUnpaid
  }

  return (
    <MensalistasNotificationsContext.Provider value={value}>
      {children}
    </MensalistasNotificationsContext.Provider>
  )
}
