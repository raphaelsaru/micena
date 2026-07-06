'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getMensalistasWithPayments, markPaymentAsUnpaid } from '@/lib/mensalistas-notifications'
import { isMonthActive, isAfterDay26 } from '@/lib/mensalistas-utils'
import { Payment } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'
import { withAuthRetry } from '@/lib/with-auth-retry'


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
  const { user, loading: authLoading } = useAuth()

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1 // Janeiro = 1, Dezembro = 12

      // Buscar todos os clientes mensalistas com pagamentos do ano atual
      const clientsWithPayments = await withAuthRetry(() => getMensalistasWithPayments(currentYear))

      const atrasados: MensalistaNotification[] = []
      const emAberto: MensalistaNotification[] = []

      clientsWithPayments.forEach(client => {
        const clientPayments = client.payments
        
        // Verificar se o cliente tem meses anteriores não pagos (atrasados)
        const previousMonths = Array.from({ length: currentMonth - 1 }, (_, i) => i + 1)
        const hasUnpaidPreviousMonths = previousMonths.some(month => {
          // Verificar se este mês está ativo para o cliente
          if (!isMonthActive(client, currentYear, month)) {
            return false
          }
          
          const payment = clientPayments.find((p: Payment) => p.month === month)
          return !payment || payment.status === 'EM_ABERTO'
        })

        // Verificar se o cliente está atrasado no mês atual (apenas a partir do dia 26)
        const isCurrentMonthOverdue = isAfterDay26() && 
          isMonthActive(client, currentYear, currentMonth) && 
          (!clientPayments.find((p: Payment) => p.month === currentMonth) || 
           clientPayments.find((p: Payment) => p.month === currentMonth)?.status === 'EM_ABERTO')

        // Se tem meses anteriores não pagos ou está atrasado no mês atual, adicionar como atrasado
        if (hasUnpaidPreviousMonths || isCurrentMonthOverdue) {
          atrasados.push({
            id: `${client.id}-${currentYear}-atrasado`,
            clientId: client.id,
            full_name: client.full_name,
            year: currentYear,
            month: 0, // 0 indica que é um status geral de atrasado
            status: 'ATRASADO',
            monthly_fee: client.monthly_fee || 0
          })
        }

        // Verificar mês atual (em aberto) - apenas se estiver ativo para o cliente
        if (!isMonthActive(client, currentYear, currentMonth)) {
          return
        }
        
        const currentMonthPayment = clientPayments.find((p: Payment) => p.month === currentMonth)
        // Adicionar como "em aberto" se não tem pagamento ou está EM_ABERTO
        // (independente de estar atrasado, pois atrasado e em aberto são status separados)
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

  const markAsUnpaid = async (clientId: string, year: number, month: number) => {
    try {
      await markPaymentAsUnpaid(clientId, year, month)

      // Recarregar notificações
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar como não pago:', error)
      throw error
    }
  }

  useEffect(() => {
    // Espera o AuthContext terminar de carregar (e sincronizar o cookie de
    // sessão) antes de disparar a Server Action, senão ela vê "Não autenticado".
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id])

  const value = {
    notifications,
    loading,
    refreshNotifications: loadNotifications,
    markAsUnpaid
  }

  return (
    <MensalistasNotificationsContext.Provider value={value}>
      {children}
    </MensalistasNotificationsContext.Provider>
  )
}
