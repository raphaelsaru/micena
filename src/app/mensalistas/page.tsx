'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Edit,
  Save,
  X
} from 'lucide-react'
import { Client, Payment, PaymentStatus } from '@/types/database'
import { supabase } from '@/lib/supabase-client'

interface MensalistaWithPayments extends Client {
  payments: Payment[]
}

interface MensalistasSummary {
  totalMensalistas: number
  totalPrevisto: number
  totalRecebido: number
  percentualAdimplencia: number
  clientesEmAberto: string[]
}

const MONTHS = [
  { number: 1, name: 'Jan', short: 'Jan' },
  { number: 2, name: 'Fev', short: 'Fev' },
  { number: 3, name: 'Mar', short: 'Mar' },
  { number: 4, name: 'Abr', short: 'Abr' },
  { number: 5, name: 'Mai', short: 'Mai' },
  { number: 6, name: 'Jun', short: 'Jun' },
  { number: 7, name: 'Jul', short: 'Jul' },
  { number: 8, name: 'Ago', short: 'Ago' },
  { number: 9, name: 'Set', short: 'Set' },
  { number: 10, name: 'Out', short: 'Out' },
  { number: 11, name: 'Nov', short: 'Nov' },
  { number: 12, name: 'Dez', short: 'Dez' }
]

const CURRENT_YEAR = new Date().getFullYear()

export default function MensalistasPage() {
  const [mensalistas, setMensalistas] = useState<MensalistaWithPayments[]>([])
  const [summary, setSummary] = useState<MensalistasSummary>({
    totalMensalistas: 0,
    totalPrevisto: 0,
    totalRecebido: 0,
    percentualAdimplencia: 0,
    clientesEmAberto: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<string | null>(null)
  const [editingMonthlyFee, setEditingMonthlyFee] = useState('')
  const [updatingPayments, setUpdatingPayments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadMensalistas()
  }, [])

  useEffect(() => {
    const calculateSummary = () => {
      const totalMensalistas = mensalistas.length
      const totalPrevisto = mensalistas.reduce((sum, client) => sum + (client.monthly_fee || 0), 0) * 12
      const totalRecebido = mensalistas.reduce((sum, client) => {
        const paidPayments = client.payments.filter(p => p.status === 'PAGO')
        return sum + paidPayments.reduce((clientSum, payment) => 
          clientSum + (payment.amount || client.monthly_fee || 0), 0)
      }, 0)
      
      const percentualAdimplencia = totalPrevisto > 0 ? (totalRecebido / totalPrevisto) * 100 : 0
      
      const clientesEmAberto = mensalistas
        .filter(client => {
          const paidMonths = client.payments.filter(p => p.status === 'PAGO').length
          return paidMonths < 12
        })
        .map(client => client.full_name)

      setSummary({
        totalMensalistas,
        totalPrevisto,
        totalRecebido,
        percentualAdimplencia,
        clientesEmAberto
      })
    }

    calculateSummary()
  }, [mensalistas])

  const loadMensalistas = async () => {
    try {
      setLoading(true)
      
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
        .eq('year', CURRENT_YEAR)

      if (paymentsError) throw paymentsError

      // Combinar clientes com pagamentos
      const mensalistasWithPayments = clients.map(client => {
        const clientPayments = payments.filter(p => p.client_id === client.id)
        return {
          ...client,
          payments: clientPayments
        }
      })

      setMensalistas(mensalistasWithPayments)
    } catch (error) {
      console.error('Erro ao carregar mensalistas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatus = (client: MensalistaWithPayments, month: number): PaymentStatus => {
    const payment = client.payments.find(p => p.month === month)
    return payment?.status || 'EM_ABERTO'
  }

  const togglePaymentStatus = async (clientId: string, month: number, currentStatus: PaymentStatus) => {
    const paymentKey = `${clientId}-${month}`
    
    try {
      const newStatus: PaymentStatus = currentStatus === 'PAGO' ? 'EM_ABERTO' : 'PAGO'
      const client = mensalistas.find(c => c.id === clientId)
      if (!client) return

      // Marcar como atualizando
      setUpdatingPayments(prev => new Set(prev).add(paymentKey))

      // Atualização otimista - atualizar o estado local imediatamente
      setMensalistas(prevMensalistas => 
        prevMensalistas.map(c => {
          if (c.id === clientId) {
            const existingPayment = c.payments.find(p => p.month === month)
            
            if (existingPayment) {
              // Atualizar pagamento existente
              const updatedPayments = c.payments.map(p => 
                p.month === month 
                  ? { ...p, status: newStatus, paid_at: newStatus === 'PAGO' ? new Date().toISOString() : undefined }
                  : p
              )
              return { ...c, payments: updatedPayments }
            } else {
              // Criar novo pagamento
              const newPayment: Payment = {
                id: `temp-${Date.now()}`, // ID temporário
                client_id: clientId,
                year: CURRENT_YEAR,
                month,
                status: newStatus,
                receipt_url: undefined,
                marked_by_receipt: false,
                amount: client.monthly_fee,
                paid_at: newStatus === 'PAGO' ? new Date().toISOString() : undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              return { ...c, payments: [...c.payments, newPayment] }
            }
          }
          return c
        })
      )

      // Atualizar no banco de dados em background
      const payment = client.payments.find(p => p.month === month)
      
      if (payment) {
        // Atualizar pagamento existente
        const { error } = await supabase
          .from('payments')
          .update({ 
            status: newStatus,
            paid_at: newStatus === 'PAGO' ? new Date().toISOString() : null,
            amount: client.monthly_fee
          })
          .eq('id', payment.id)

        if (error) {
          // Em caso de erro, reverter a mudança otimista
          console.error('Erro ao atualizar pagamento:', error)
          setMensalistas(prevMensalistas => 
            prevMensalistas.map(c => {
              if (c.id === clientId) {
                const revertedPayments = c.payments.map(p => 
                  p.month === month 
                    ? { ...p, status: currentStatus, paid_at: currentStatus === 'PAGO' ? new Date().toISOString() : undefined }
                    : p
                )
                return { ...c, payments: revertedPayments }
              }
              return c
            })
          )
          // Aqui você pode adicionar um toast de erro se quiser
          return
        }
      } else {
        // Criar novo pagamento
        const { data: newPaymentData, error } = await supabase
          .from('payments')
          .insert({
            client_id: clientId,
            year: CURRENT_YEAR,
            month,
            status: newStatus,
            amount: client.monthly_fee,
            paid_at: newStatus === 'PAGO' ? new Date().toISOString() : null
          })
          .select()
          .single()

        if (error) {
          // Em caso de erro, reverter a mudança otimista
          console.error('Erro ao criar pagamento:', error)
          setMensalistas(prevMensalistas => 
            prevMensalistas.map(c => {
              if (c.id === clientId) {
                const revertedPayments = c.payments.filter(p => p.month !== month)
                return { ...c, payments: revertedPayments }
              }
              return c
            })
          )
          // Aqui você pode adicionar um toast de erro se quiser
          return
        }

        // Atualizar o ID temporário com o ID real do banco
        setMensalistas(prevMensalistas => 
          prevMensalistas.map(c => {
            if (c.id === clientId) {
              const updatedPayments = c.payments.map(p => 
                p.month === month && p.id.startsWith('temp-')
                  ? { ...p, id: newPaymentData.id }
                  : p
              )
              return { ...c, payments: updatedPayments }
            }
            return c
          })
        )
      }

      // Não é mais necessário recarregar os dados
      // await loadMensalistas()
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error)
      // Em caso de erro geral, reverter todas as mudanças
      await loadMensalistas()
    } finally {
      // Remover do estado de atualização
      setUpdatingPayments(prev => {
        const newSet = new Set(prev)
        newSet.delete(paymentKey)
        return newSet
      })
    }
  }

  const startEditMonthlyFee = (client: MensalistaWithPayments) => {
    setEditingClient(client.id)
    setEditingMonthlyFee(client.monthly_fee?.toString() || '0')
  }

  const saveMonthlyFee = async (clientId: string) => {
    try {
      const newFee = parseFloat(editingMonthlyFee)
      if (isNaN(newFee) || newFee < 0) return

      const { error } = await supabase
        .from('clients')
        .update({ monthly_fee: newFee })
        .eq('id', clientId)

      if (error) throw error

      setEditingClient(null)
      setEditingMonthlyFee('')
      await loadMensalistas()
    } catch (error) {
      console.error('Erro ao atualizar valor mensal:', error)
    }
  }

  const cancelEdit = () => {
    setEditingClient(null)
    setEditingMonthlyFee('')
  }

  const filteredMensalistas = mensalistas.filter(client =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando mensalistas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mensalistas</h1>
          <p className="text-gray-600 mt-2">Controle de pagamentos mensais e adimplência</p>
        </div>
      </div>

      {/* Resumo/Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{summary.totalMensalistas}</p>
              <p className="text-sm text-gray-600">Total Mensalistas</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                R$ {summary.totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600">Previsto Anual</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                R$ {summary.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600">Recebido</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">
                {summary.percentualAdimplencia.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Adimplência</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{summary.clientesEmAberto.length}</p>
              <p className="text-sm text-gray-600">Em Aberto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Mensalistas</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Detalhado</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar mensalistas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de Mensalistas */}
          <div className="space-y-4">
            {filteredMensalistas.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{client.full_name}</h3>
                        <p className="text-sm text-gray-600">
                          {client.document && `Doc: ${client.document}`}
                          {client.phone && ` • Tel: ${client.phone}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant={client.is_recurring ? "default" : "secondary"}>
                        Mensalista
                      </Badge>
                      
                      {editingClient === client.id ? (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`fee-${client.id}`} className="text-sm">R$</Label>
                          <Input
                            id={`fee-${client.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingMonthlyFee}
                            onChange={(e) => setEditingMonthlyFee(e.target.value)}
                            className="w-24"
                          />
                          <Button size="sm" onClick={() => saveMonthlyFee(client.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-green-600">
                            R$ {(client.monthly_fee || 0).toFixed(2)}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => startEditMonthlyFee(client)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Status dos pagamentos em {CURRENT_YEAR}:</span>
                      <span className="font-medium">
                        {client.payments.filter(p => p.status === 'PAGO').length}/12 meses
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-12 gap-1">
                      {MONTHS.map((month) => {
                        const status = getPaymentStatus(client, month.number)
                        const isPaid = status === 'PAGO'
                        const isUpdating = updatingPayments.has(`${client.id}-${month.number}`)
                        
                        return (
                          <div key={month.number} className="text-center">
                            <div className="text-xs text-gray-500 mb-1">{month.short}</div>
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={isPaid}
                                onCheckedChange={() => togglePaymentStatus(client.id, month.number, status)}
                                disabled={isUpdating}
                                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                              />
                              {isUpdating && (
                                <span className="ml-1 text-xs text-blue-600">...</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          {/* Resumo Detalhado */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes com Pagamentos em Aberto</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.clientesEmAberto.length > 0 ? (
                <div className="space-y-2">
                  {summary.clientesEmAberto.map((nome, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-red-800">{nome}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">Todos os mensalistas estão em dia!</p>
                  <p className="text-sm">Parabéns pela excelente gestão!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
