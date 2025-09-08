'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/formatters'
import { displayDate } from '@/lib/utils'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User
} from 'lucide-react'
import { Client, Payment, PaymentStatus } from '@/types/database'
import { 
  ExtendedPaymentStatus, 
  isMonthActive,
  getActiveMonthsCount
} from '@/lib/mensalistas-utils'

interface MensalistaWithPayments extends Client {
  payments: Payment[]
}

interface MensalistaDetailsModalProps {
  client: MensalistaWithPayments | null
  isOpen: boolean
  onClose: () => void
  onTogglePayment: (clientId: string, month: number, currentStatus: ExtendedPaymentStatus) => void
  updatingPayments: Set<string>
  currentYear: number
  isClientEmAberto: (client: MensalistaWithPayments) => boolean
  isClientAtrasado: (client: MensalistaWithPayments) => boolean
}

const MONTHS = [
  { number: 1, name: 'Janeiro', short: 'Jan' },
  { number: 2, name: 'Fevereiro', short: 'Fev' },
  { number: 3, name: 'Março', short: 'Mar' },
  { number: 4, name: 'Abril', short: 'Abr' },
  { number: 5, name: 'Maio', short: 'Mai' },
  { number: 6, name: 'Junho', short: 'Jun' },
  { number: 7, name: 'Julho', short: 'Jul' },
  { number: 8, name: 'Agosto', short: 'Ago' },
  { number: 9, name: 'Setembro', short: 'Set' },
  { number: 10, name: 'Outubro', short: 'Out' },
  { number: 11, name: 'Novembro', short: 'Nov' },
  { number: 12, name: 'Dezembro', short: 'Dez' }
]

export function MensalistaDetailsModal({ 
  client, 
  isOpen, 
  onClose, 
  onTogglePayment,
  updatingPayments,
  currentYear,
  isClientEmAberto,
  isClientAtrasado
}: MensalistaDetailsModalProps) {
  if (!client) return null

  const getPaymentStatus = (month: number): ExtendedPaymentStatus => {
    if (!isMonthActive(client, currentYear, month)) {
      return 'INATIVO'
    }
    
    const payment = client.payments.find(p => p.month === month)
    return payment?.status || 'EM_ABERTO'
  }

  const getStatusInfo = (status: ExtendedPaymentStatus) => {
    switch (status) {
      case 'PAGO':
        return {
          color: 'bg-green-500',
          text: 'Pago',
          icon: CheckCircle
        }
      case 'EM_ABERTO':
        return {
          color: 'bg-yellow-500',
          text: 'Em Aberto',
          icon: AlertTriangle
        }
      case 'INATIVO':
        return {
          color: 'bg-gray-400',
          text: 'Inativo',
          icon: Clock
        }
      default:
        return {
          color: 'bg-gray-400',
          text: 'Desconhecido',
          icon: Clock
        }
    }
  }

  const getPaymentProgress = () => {
    const totalMonths = getActiveMonthsCount(client, currentYear)
    const paidMonths = client.payments.filter(p => 
      p.status === 'PAGO' && isMonthActive(client, currentYear, p.month)
    ).length
    
    return { paid: paidMonths, total: totalMonths }
  }

  const getCurrentSituation = () => {
    const isEmAberto = isClientEmAberto(client)
    const isAtrasado = isClientAtrasado(client)
    
    if (isAtrasado) {
      return {
        status: 'Atrasado',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        icon: Clock,
        description: 'Cliente possui pagamentos em atraso de meses anteriores'
      }
    } else if (isEmAberto) {
      return {
        status: 'Pendente',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        icon: AlertTriangle,
        description: 'Cliente possui pagamento pendente do mês atual'
      }
    } else {
      return {
        status: 'Adimplente',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        icon: CheckCircle,
        description: 'Cliente está em dia com todos os pagamentos'
      }
    }
  }

  const progress = getPaymentProgress()
  const currentSituation = getCurrentSituation()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            {client.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Situação Atual */}
          <Card className={`${currentSituation.bgColor} ${currentSituation.borderColor} border-2`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${currentSituation.color} rounded-full flex items-center justify-center`}>
                  <currentSituation.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${currentSituation.textColor}`}>
                    Situação Atual: {currentSituation.status}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentSituation.description}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${currentSituation.textColor} ${currentSituation.borderColor} ${currentSituation.bgColor} text-sm px-3 py-1`}
                >
                  {currentSituation.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Valor Mensal:</span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(client.monthly_fee || 0)}
                    </span>
                  </div>
                  
                  {client.subscription_start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Início da Mensalidade:</span>
                      <span>{displayDate(client.subscription_start_date)}</span>
                    </div>
                  )}

                  {client.neighborhood && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Bairro:</span>
                      <span>{client.neighborhood}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Telefone:</span>
                      <span>{client.phone}</span>
                    </div>
                  )}

                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Email:</span>
                      <span className="text-sm">{client.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant={client.is_recurring ? "default" : "secondary"}>
                      Mensalista
                    </Badge>
                  </div>
                </div>
              </div>

              {client.address && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-600 mt-1" />
                    <div>
                      <span className="font-medium">Endereço:</span>
                      <p className="text-sm text-gray-600 mt-1">{client.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {client.notes && (
                <div className="mt-4 pt-4 border-t">
                  <div>
                    <span className="font-medium">Observações:</span>
                    <p className="text-sm text-gray-600 mt-1">{client.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo de Pagamentos {currentYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{progress.paid}</p>
                  <p className="text-sm text-gray-600">Meses Pagos</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{progress.total}</p>
                  <p className="text-sm text-gray-600">Meses Ativos</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(progress.paid * (client.monthly_fee || 0))}
                  </p>
                  <p className="text-sm text-gray-600">Total Recebido</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Controle de Pagamentos por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-12 gap-3">
                {MONTHS.map((month) => {
                  const status = getPaymentStatus(month.number)
                  const statusInfo = getStatusInfo(status)
                  const StatusIcon = statusInfo.icon
                  const isPaid = status === 'PAGO'
                  const isInactive = status === 'INATIVO'
                  const isUpdating = updatingPayments.has(`${client.id}-${month.number}`)
                  
                  return (
                    <div key={month.number} className="text-center">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {month.short}
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        {isInactive ? (
                          <div 
                            className="w-8 h-8 bg-gray-300 rounded border-2 border-gray-400 cursor-not-allowed flex items-center justify-center" 
                            title="Mês anterior ao início da mensalidade"
                          >
                            <StatusIcon className="h-4 w-4 text-gray-500" />
                          </div>
                        ) : (
                          <div className="relative">
                            <Checkbox
                              checked={isPaid}
                              onCheckedChange={() => onTogglePayment(client.id, month.number, status as PaymentStatus)}
                              disabled={isUpdating}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-8 w-8"
                            />
                            {isUpdating && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {statusInfo.text}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
