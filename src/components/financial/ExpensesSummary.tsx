'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useExpenses } from '@/hooks/useExpenses'
import { ExpenseType } from '@/types/database'
import { Package, Users, FileText, CreditCard, MoreHorizontal, TrendingDown } from 'lucide-react'

const EXPENSE_TYPE_CONFIG: Record<ExpenseType, { 
  label: string; 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
}> = {
  MATERIAL: { 
    label: 'Materiais', 
    icon: <Package className="h-4 w-4" />, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50' 
  },
  FOLHA_PAGAMENTO: { 
    label: 'Folha de Pagamento', 
    icon: <Users className="h-4 w-4" />, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50' 
  },
  IMPOSTOS: { 
    label: 'Impostos', 
    icon: <FileText className="h-4 w-4" />, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50' 
  },
  CONTAS_FIXAS: { 
    label: 'Contas Fixas', 
    icon: <CreditCard className="h-4 w-4" />, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50' 
  },
  OUTROS: { 
    label: 'Outros', 
    icon: <MoreHorizontal className="h-4 w-4" />, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50' 
  }
}

interface ExpensesSummaryProps {
  refreshTrigger?: number
  selectedYear?: number
  selectedMonth?: number | null
}

export function ExpensesSummary({ refreshTrigger, selectedYear, selectedMonth }: ExpensesSummaryProps) {
  const { summary, refetch } = useExpenses(selectedYear, selectedMonth)

  // Atualizar quando o trigger mudar
  React.useEffect(() => {
    if (refreshTrigger) {
      refetch()
    }
  }, [refreshTrigger, refetch])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const expenseCategories = [
    { type: 'MATERIAL' as ExpenseType, amount: summary.materialExpenses },
    { type: 'FOLHA_PAGAMENTO' as ExpenseType, amount: summary.payrollExpenses },
    { type: 'IMPOSTOS' as ExpenseType, amount: summary.taxExpenses },
    { type: 'CONTAS_FIXAS' as ExpenseType, amount: summary.fixedExpenses },
    { type: 'OUTROS' as ExpenseType, amount: summary.otherExpenses }
  ].filter(category => category.amount > 0)

  const getPercentage = (amount: number) => {
    if (summary.totalExpenses === 0) return 0
    return Math.round((amount / summary.totalExpenses) * 100)
  }

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <TrendingDown className="h-5 w-5" />
          Resumo de Despesas por Categoria
        </CardTitle>
        <CardDescription>
          Distribuição das despesas por tipo e período
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total das despesas */}
          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-100">
            <div className="text-3xl font-bold text-red-700">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <div className="text-sm text-red-600 font-medium">Total de Despesas</div>
            <div className="text-xs text-red-500 mt-1">
              {formatCurrency(summary.monthlyExpenses)} este mês
            </div>
          </div>

          {/* Categorias */}
          {expenseCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">Nenhuma despesa registrada ainda</p>
              <p className="text-sm">Comece lançando sua primeira despesa</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenseCategories.map((category) => {
                const config = EXPENSE_TYPE_CONFIG[category.type]
                const percentage = getPercentage(category.amount)
                
                return (
                  <div key={category.type} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${config.bgColor}`}>
                        <div className={config.color}>
                          {config.icon}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{config.label}</div>
                        <div className="text-sm text-gray-500">{percentage}% do total</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(category.amount)}</div>
                      <div className="text-sm text-gray-500">
                        Categoria principal
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Despesas do mês - destaque */}

        </div>
      </CardContent>
    </Card>
  )
}
