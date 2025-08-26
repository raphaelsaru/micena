'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Wrench, ExternalLink } from 'lucide-react'
import { ProximoServico } from '@/lib/dashboard'
import Link from 'next/link'

interface ProximosServicosListProps {
  servicos: ProximoServico[]
}

const SERVICE_TYPE_COLORS: Record<string, string> = {
  AREIA: 'bg-blue-100 text-blue-800',
  EQUIPAMENTO: 'bg-green-100 text-green-800',
  CAPA: 'bg-purple-100 text-purple-800',
  OUTRO: 'bg-gray-100 text-gray-800'
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  AREIA: 'Areia',
  EQUIPAMENTO: 'Equipamento',
  CAPA: 'Capa',
  OUTRO: 'Outro'
}

export function ProximosServicosList({ servicos }: ProximosServicosListProps) {
  if (servicos.length === 0) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Serviços (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">
            Nenhum serviço agendado para os próximos 7 dias
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximos Serviços (7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[320px] overflow-y-auto">
          {servicos.map((servico) => (
            <Link
              key={servico.id}
              href={`/services/${servico.id}`}
              className="block"
            >
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group border border-transparent hover:border-gray-300">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{servico.dataFormatada}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{servico.cliente}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-500" />
                  <Badge 
                    variant="secondary" 
                    className={SERVICE_TYPE_COLORS[servico.tipoServico] || 'bg-gray-100 text-gray-800'}
                  >
                    {SERVICE_TYPE_LABELS[servico.tipoServico] || servico.tipoServico}
                  </Badge>
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
