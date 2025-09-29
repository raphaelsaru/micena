'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MensalistasCheckbox } from '@/components/ui/mensalistas-checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'
import { 
  CheckSquare, 
  Square, 
  Users, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Client, Payment } from '@/types/database'
import { 
  ExtendedPaymentStatus, 
  isMonthActive,
  getActiveMonthsCount
} from '@/lib/mensalistas-utils'

interface MensalistaWithPayments extends Client {
  payments: Payment[]
}

interface BulkPaymentActionsProps {
  mensalistas: MensalistaWithPayments[]
  onBulkPayment: (clientIds: string[], month: number) => Promise<void>
  isClientEmAberto: (client: MensalistaWithPayments) => boolean
  isClientAtrasado: (client: MensalistaWithPayments) => boolean
  getPaymentStatus: (client: MensalistaWithPayments, month: number) => ExtendedPaymentStatus
  currentYear: number
  loading?: boolean
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

export function BulkPaymentActions({
  mensalistas,
  onBulkPayment,
  isClientEmAberto,
  isClientAtrasado,
  getPaymentStatus,
  currentYear,
  loading = false
}: BulkPaymentActionsProps) {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Filtrar mensalistas que podem ser selecionados (não inativos)
  const selectableMensalistas = mensalistas.filter(client => {
    const currentMonth = new Date().getMonth() + 1
    return isMonthActive(client, currentYear, currentMonth)
  })

  const handleSelectAll = () => {
    if (selectedClients.size === selectableMensalistas.length) {
      setSelectedClients(new Set())
    } else {
      setSelectedClients(new Set(selectableMensalistas.map(c => c.id)))
    }
  }

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
  }

  const handleBulkPayment = async () => {
    if (!selectedMonth || selectedClients.size === 0) return

    setIsProcessing(true)
    try {
      await onBulkPayment(Array.from(selectedClients), selectedMonth)
      setSelectedClients(new Set())
      setIsModalOpen(false)
      setSelectedMonth(null)
    } catch (error) {
      console.error('Erro ao processar pagamentos em massa:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getSelectedClientsInfo = () => {
    const selected = mensalistas.filter(c => selectedClients.has(c.id))
    const totalValue = selected.reduce((sum, client) => sum + (client.monthly_fee || 0), 0)
    
    return {
      count: selected.length,
      totalValue,
      clients: selected
    }
  }

  const getMonthStatus = (month: number) => {
    const selected = mensalistas.filter(c => selectedClients.has(c.id))
    const paidCount = selected.filter(client => {
      const status = getPaymentStatus(client, month)
      return status === 'PAGO'
    }).length
    
    const inactiveCount = selected.filter(client => {
      const status = getPaymentStatus(client, month)
      return status === 'INATIVO'
    }).length

    return {
      paid: paidCount,
      unpaid: selected.length - paidCount - inactiveCount,
      inactive: inactiveCount,
      total: selected.length
    }
  }

  const selectedInfo = getSelectedClientsInfo()
  const isAllSelected = selectedClients.size === selectableMensalistas.length && selectableMensalistas.length > 0
  const isPartiallySelected = selectedClients.size > 0 && selectedClients.size < selectableMensalistas.length

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Ações em Massa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <MensalistasCheckbox
                  id="select-all"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) (el as HTMLInputElement).indeterminate = isPartiallySelected
                  }}
                  onCheckedChange={handleSelectAll}
                  disabled={loading}
                />
                <label 
                  htmlFor="select-all" 
                  className="text-sm font-medium cursor-pointer"
                >
                  {isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </label>
              </div>
              
              {selectedClients.size > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedClients.size} selecionado{selectedClients.size !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {selectedClients.size > 0 && (
              <Button 
                onClick={() => setIsModalOpen(true)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Pago
              </Button>
            )}
          </div>

          {selectedClients.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{selectedInfo.count} cliente{selectedInfo.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">
                    {formatCurrency(selectedInfo.totalValue)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Marcar Mensalistas como Pagos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumo da Seleção */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Resumo da Seleção</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Clientes selecionados:</span>
                  <span className="font-medium ml-2">{selectedInfo.count}</span>
                </div>
                <div>
                  <span className="text-blue-700">Valor total:</span>
                  <span className="font-medium ml-2 text-green-600">
                    {formatCurrency(selectedInfo.totalValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Seleção do Mês */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Selecione o mês para marcar como pago:</label>
              <Select value={selectedMonth?.toString() || ''} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o mês" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => {
                    const monthStatus = getMonthStatus(month.number)
                    const isCurrentMonth = month.number === new Date().getMonth() + 1
                    
                    return (
                      <SelectItem key={month.number} value={month.number.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span className={isCurrentMonth ? 'font-medium' : ''}>
                            {month.name} {isCurrentMonth && '(Atual)'}
                          </span>
                          <div className="flex items-center gap-2 ml-4">
                            {monthStatus.paid > 0 && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                {monthStatus.paid} pago{monthStatus.paid !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {monthStatus.unpaid > 0 && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                {monthStatus.unpaid} em aberto
                              </Badge>
                            )}
                            {monthStatus.inactive > 0 && (
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300">
                                {monthStatus.inactive} inativo{monthStatus.inactive !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Aviso sobre meses inativos */}
            {selectedMonth && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Atenção:</p>
                    <p>
                      Apenas clientes com mensalidade ativa no mês selecionado serão marcados como pagos. 
                      Clientes inativos (que ainda não iniciaram a mensalidade) não serão afetados.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Clientes Selecionados */}
            <div className="space-y-2">
              <h3 className="font-medium">Clientes que serão marcados como pagos:</h3>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {selectedInfo.clients.map((client) => {
                  const status = selectedMonth ? getPaymentStatus(client, selectedMonth) : 'EM_ABERTO'
                  const isInactive = status === 'INATIVO'
                  const isAlreadyPaid = status === 'PAGO'
                  
                  return (
                    <div 
                      key={client.id} 
                      className={`flex items-center justify-between p-2 border-b last:border-b-0 ${
                        isInactive ? 'bg-gray-50' : isAlreadyPaid ? 'bg-green-50' : 'bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedClients.has(client.id)}
                          onCheckedChange={() => handleSelectClient(client.id)}
                          disabled={isProcessing}
                        />
                        <span className={`text-sm ${isInactive ? 'text-gray-500' : ''}`}>
                          {client.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(client.monthly_fee || 0)}
                        </span>
                        {isInactive && (
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                            Inativo
                          </Badge>
                        )}
                        {isAlreadyPaid && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-600">
                            Já Pago
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkPayment}
              disabled={!selectedMonth || selectedClients.size === 0 || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Pagamentos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
