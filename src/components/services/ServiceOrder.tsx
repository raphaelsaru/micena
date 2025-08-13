'use client'

import { ServiceWithClient } from '@/types/database'
import { formatDate, formatPhone } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'

interface ServiceOrderProps {
  service: ServiceWithClient
  onClose?: () => void
}

export function ServiceOrder({ service, onClose }: ServiceOrderProps) {

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Implementar download como PDF
    console.log('Download da OS implementado')
  }

  const getServiceTypeLabel = (type: string) => {
    const labels = {
      'AREIA': 'Troca de Areia',
      'EQUIPAMENTO': 'Equipamento',
      'CAPA': 'Capa da Piscina',
      'OUTRO': 'Outro'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0">
      {/* Cabeçalho da OS */}
      <div className="text-center mb-8 print:mb-6">
        <div className="flex justify-center mb-4">
          {/* Logo Micena Piscinas */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/micena-logo.jpeg" 
                alt="MICENA PISCINAS - Logo" 
                className="h-36 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Informações da OS */}
      <div className="border-b-2 border-blue-300 pb-4 mb-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ORDEM DE SERVIÇO</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">OS:</span> {service.work_order_number || 'OS-' + new Date().getFullYear() + '-' + String(service.id).slice(-4)}</p>
              <p><span className="font-medium">Data:</span> {formatDate(service.service_date)}</p>
              <p><span className="font-medium">Tipo:</span> {getServiceTypeLabel(service.service_type)}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">CLIENTE</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Nome:</span> {service.clients?.full_name || 'N/A'}</p>
              <p><span className="font-medium">Documento:</span> {service.clients?.document || 'N/A'}</p>
              <p><span className="font-medium">Telefone:</span> {formatPhone(service.clients?.phone || '') || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes do Serviço */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">DETALHES DO SERVIÇO</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {service.equipment_details && (
            <div className="mb-3">
              <p className="font-medium text-gray-700">Equipamentos:</p>
              <p className="text-gray-600">{service.equipment_details}</p>
            </div>
          )}
          {service.notes && (
            <div className="mb-3">
              <p className="font-medium text-gray-700">Observações:</p>
              <p className="text-gray-600">{service.notes}</p>
            </div>
          )}
          {service.next_service_date && (
            <div>
              <p className="font-medium text-gray-700">Próximo Serviço:</p>
              <p className="text-gray-600">{formatDate(service.next_service_date)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Serviços */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">SERVIÇOS REALIZADOS</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-300">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-300">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-300">
                  Valor Unit.
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-300">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                  {getServiceTypeLabel(service.service_type)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                  1
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                  R$ 150,00
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200 font-medium">
                  R$ 150,00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Total e Assinaturas */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">TOTAL:</span>
              <span className="text-2xl font-bold text-blue-600">R$ 150,00</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-300 pt-4">
            <p className="text-sm text-gray-600 mb-2">Assinatura do Cliente</p>
            <div className="h-16 border-b-2 border-gray-300"></div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
        <p>Micena Piscinas - Qualidade e confiança em cada serviço</p>
        <p>Contato: (11) 99232-1622 / (11) 98622-3409</p>
      </div>

      {/* Botões de Ação (não aparecem na impressão) */}
      <div className="flex justify-center gap-4 mt-8 print:hidden">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir OS
        </Button>
        <Button onClick={handleDownload} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        )}
      </div>
    </div>
  )
}
