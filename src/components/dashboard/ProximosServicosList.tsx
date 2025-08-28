'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Wrench, ExternalLink } from 'lucide-react'
import { ProximoServico } from '@/lib/dashboard'
import Link from 'next/link'

interface ProximosServicosListProps {
  servicos: ProximoServico[]
}

// Função para obter a cor da categoria
const getCategoryColor = (serviceType: string): string => {
  // Para categorias antigas, retornar cores específicas
  if (serviceType === 'AREIA') return 'bg-yellow-100 text-yellow-800'
  if (serviceType === 'EQUIPAMENTO') return 'bg-blue-100 text-blue-800'
  if (serviceType === 'CAPA') return 'bg-green-100 text-green-800'
  if (serviceType === 'OUTRO') return 'bg-gray-100 text-gray-800'
  
  // Para categorias padrão, retornar cores específicas
  if (serviceType === 'LIMPEZA_PROFUNDA') return 'bg-cyan-100 text-cyan-800'
  if (serviceType === 'TRATAMENTO_QUIMICO') return 'bg-purple-100 text-purple-800'
  if (serviceType === 'REPARO_ESTRUTURAL') return 'bg-orange-100 text-orange-800'
  if (serviceType === 'INSTALACAO') return 'bg-pink-100 text-pink-800'
  if (serviceType === 'INSPECAO_TECNICA') return 'bg-red-100 text-red-800'
  if (serviceType === 'MANUTENCAO_PREVENTIVA') return 'bg-blue-100 text-blue-800'
  if (serviceType === 'DECORACAO') return 'bg-rose-100 text-rose-800'
  if (serviceType === 'SAZONAL') return 'bg-lime-100 text-lime-800'
  
  // Para outras categorias (incluindo personalizadas), retornar cor padrão
  return 'bg-gray-100 text-gray-800'
}

// Função para obter o nome da categoria
const getCategoryName = (serviceType: string): string => {
  // Para categorias antigas, retornar nomes em português
  if (serviceType === 'AREIA') return 'Troca de Areia'
  if (serviceType === 'EQUIPAMENTO') return 'Equipamento'
  if (serviceType === 'CAPA') return 'Capa da Piscina'
  if (serviceType === 'OUTRO') return 'Outro'
  
  // Para categorias padrão, retornar nomes em português
  if (serviceType === 'LIMPEZA_PROFUNDA') return 'Limpeza Profunda'
  if (serviceType === 'TRATAMENTO_QUIMICO') return 'Tratamento Químico'
  if (serviceType === 'REPARO_ESTRUTURAL') return 'Reparo Estrutural'
  if (serviceType === 'INSTALACAO') return 'Instalação'
  if (serviceType === 'INSPECAO_TECNICA') return 'Inspeção Técnica'
  if (serviceType === 'MANUTENCAO_PREVENTIVA') return 'Manutenção Preventiva'
  if (serviceType === 'DECORACAO') return 'Decoração'
  if (serviceType === 'SAZONAL') return 'Sazonal'
  
  // Para outras categorias (incluindo personalizadas), retornar o próprio valor
  return serviceType
}

export function ProximosServicosList({ servicos }: ProximosServicosListProps) {
  if (servicos.length === 0) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
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
          <Calendar className="h-6 w-6" />
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
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">{servico.dataFormatada}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{servico.cliente}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-gray-500" />
                  <Badge 
                    variant="secondary" 
                    className={getCategoryColor(servico.tipoServico)}
                  >
                    {getCategoryName(servico.tipoServico)}
                  </Badge>
                  <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
