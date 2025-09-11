'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/formatters'
import { displayDate } from '@/lib/utils'
import { 
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Phone,
  MapPin
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

interface MensalistasTableProps {
  mensalistas: MensalistaWithPayments[]
  onViewDetails: (client: MensalistaWithPayments) => void
  isClientEmAberto: (client: MensalistaWithPayments) => boolean
  isClientAtrasado: (client: MensalistaWithPayments) => boolean
  getPaymentStatus: (client: MensalistaWithPayments, month: number) => ExtendedPaymentStatus
  currentYear: number
  selectedClients?: Set<string>
  onSelectClient?: (clientId: string) => void
  showSelection?: boolean
}

type SortField = 'name' | 'monthly_fee' | 'neighborhood' | 'status'
type SortDirection = 'asc' | 'desc'

export function MensalistasTable({ 
  mensalistas, 
  onViewDetails, 
  isClientEmAberto,
  isClientAtrasado,
  getPaymentStatus,
  currentYear,
  selectedClients = new Set(),
  onSelectClient,
  showSelection = false
}: MensalistasTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const getStatusInfo = (client: MensalistaWithPayments) => {
    const isEmAberto = isClientEmAberto(client)
    const isAtrasado = isClientAtrasado(client)
    
    if (isAtrasado) {
      return {
        color: 'bg-red-500',
        text: 'Atrasado',
        icon: Clock
      }
    } else if (isEmAberto) {
      return {
        color: 'bg-yellow-500',
        text: 'Pendente',
        icon: AlertTriangle
      }
    } else {
      return {
        color: 'bg-green-500',
        text: 'Adimplente',
        icon: CheckCircle
      }
    }
  }

  const getPaymentProgress = (client: MensalistaWithPayments) => {
    const totalMonths = getActiveMonthsCount(client, currentYear)
    const paidMonths = client.payments.filter(p => 
      p.status === 'PAGO' && isMonthActive(client, currentYear, p.month)
    ).length
    
    return `${paidMonths}/${totalMonths}`
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedMensalistas = [...mensalistas].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'name':
        aValue = a.full_name.toLowerCase()
        bValue = b.full_name.toLowerCase()
        break
      case 'monthly_fee':
        aValue = a.monthly_fee || 0
        bValue = b.monthly_fee || 0
        break
      case 'neighborhood':
        aValue = (a.neighborhood || '').toLowerCase()
        bValue = (b.neighborhood || '').toLowerCase()
        break
      case 'status':
        const aStatus = isClientAtrasado(a) ? 3 : isClientEmAberto(a) ? 2 : 1
        const bStatus = isClientAtrasado(b) ? 3 : isClientEmAberto(b) ? 2 : 1
        aValue = aStatus
        bValue = bStatus
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showSelection && (
              <TableHead className="w-12">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                </div>
              </TableHead>
            )}
            <TableHead className="w-12">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                {sortField === 'status' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                Cliente
                {sortField === 'name' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('monthly_fee')}
            >
              <div className="flex items-center gap-2">
                Valor Mensal
                {sortField === 'monthly_fee' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('neighborhood')}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Bairro
                {sortField === 'neighborhood' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="w-12">Ver</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMensalistas.map((client) => {
            const statusInfo = getStatusInfo(client)
            const StatusIcon = statusInfo.icon
            
            return (
              <TableRow 
                key={client.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onViewDetails(client)}
              >
                {showSelection && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedClients.has(client.id)}
                      onCheckedChange={() => onSelectClient?.(client.id)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`
                      text-xs
                      ${statusInfo.color === 'bg-red-500' ? 'text-red-700 border-red-300 bg-red-50' : ''}
                      ${statusInfo.color === 'bg-yellow-500' ? 'text-yellow-700 border-yellow-300 bg-yellow-50' : ''}
                      ${statusInfo.color === 'bg-green-500' ? 'text-green-700 border-green-300 bg-green-50' : ''}
                    `}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.text}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{client.full_name}</div>
                    {client.subscription_start_date && (
                      <div className="text-xs text-gray-500">
                        Início: {displayDate(client.subscription_start_date)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(client.monthly_fee || 0)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {client.neighborhood || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {client.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">
                        {client.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{getPaymentProgress(client)}</div>
                    <div className="text-xs text-gray-500">meses</div>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => onViewDetails(client)}
                    title="Ver detalhes"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
