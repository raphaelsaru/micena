'use client'

import { ServiceWithClient } from '@/types/database'
import { formatDate, formatPhone } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface ServiceOrderProps {
  service: ServiceWithClient
  onClose?: () => void
}

export function ServiceOrder({ service, onClose }: ServiceOrderProps) {

  // Função auxiliar para padStart (compatibilidade com navegadores antigos)
  const padStart = (str: string, targetLength: number, padString: string): string => {
    if (str.length >= targetLength) {
      return str
    }
    const pad = padString.repeat(Math.ceil((targetLength - str.length) / padString.length))
    return pad.slice(0, targetLength - str.length) + str
  }

  const handlePrint = () => {
    // Abre o diálogo de impressão do navegador
    // O usuário pode escolher salvar como PDF
    try {
      // Tenta impressão direta primeiro
      window.print()
    } catch (error) {
      console.error('Erro na impressão:', error)
      // Fallback: abre em nova janela
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const content = document.querySelector('.print-content')?.outerHTML
        printWindow.document.write(`
          <html>
            <head>
              <title>Ordem de Serviço - ${service.clients?.full_name || 'Cliente'}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .print-content { background: white; color: black; }
                img { max-width: 100%; height: auto; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 8px; }
              </style>
            </head>
            <body>${content}</body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
      }
    }
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
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0 print:bg-white print:text-black">
      {/* Conteúdo para impressão */}
      <div 
        className="print-content" 
        style={{
          backgroundColor: '#ffffff',
         color: '#000000'
        }}
      >
        {/* Cabeçalho da OS */}
      <div className="flex justify-between items-start mb-8 print:mb-6">
        {/* Logo à esquerda */}
        <div className="flex-shrink-0">
          <img 
            src="/micena-logo.jpeg" 
            alt="MICENA PISCINAS - Logo" 
            className="h-32 w-auto object-contain brand-logo"
          />
        </div>
        
        {/* Informações da empresa à direita */}
        <div className="flex justify-between w-full mt-4">
          
          <div className="text-sm text-gray-600 mb-2 w-full ml-10">
          <p>CNPJ: 38.311.624/0001-00</p>
            <p>Rodovia BR-020 km 13, 01, rua Jardim</p>
            <p>Campestre, Córrego Arrozal</p>
            <p>Brasília-DF, CEP 73007-995</p>
          </div>
          <div className="text-sm text-gray-600 mb-2 w-full ml-10">
            <p>elias-bsb@hotmail.com</p>
            <p>+55 (61) 99232-1622</p>
          </div>
        </div>
      </div>

      {/* Informações da OS */}
      <div className="border-b-2 border-blue-300 pb-4 mb-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">ORDEM DE SERVIÇO</h3>
            <div className="text-sm">
              <p>OS: {service.work_order_number || 'OS-' + new Date().getFullYear() + '-' + padStart(String(service.id).slice(-4), 4, '0')}</p>
              <p>Data: {formatDate(service.service_date)}</p>
              <p>Tipo: {getServiceTypeLabel(service.service_type || 'OUTRO')}</p>
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">CLIENTE</h3>
            <div className="text-sm">
              <p>Nome: {service.clients?.full_name || 'N/A'}</p>
              <p>CPF/CNPJ: {service.clients?.document || 'N/A'}</p>
              <p>Telefone: {formatPhone(service.clients?.phone || '') || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes do Serviço */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-800 mb-3">DETALHES DO SERVIÇO</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {service.notes && (
            <div className="mb-3">
              <p className="font-medium text-gray-700">Observações:</p>
              <p className="text-gray-600">{service.notes}</p>
            </div>
          )}
          
          {/* Informações de Pagamento */}
          {service.payment_method && (
            <div className="mb-3">
              <p className="font-medium text-gray-700">Meio de Pagamento:</p>
              <p className="text-gray-600">
                {(() => {
                  const labels = {
                    'PIX': 'PIX',
                    'TRANSFERENCIA': 'Transferência',
                    'DINHEIRO': 'Dinheiro',
                    'CARTAO': 'Cartão',
                    'BOLETO': 'Boleto'
                  }
                  return labels[service.payment_method] || service.payment_method
                })()}
              </p>
              {service.payment_details && (
                <p className="text-gray-600 mt-1">
                  <span className="font-medium">Detalhes:</span> {service.payment_details}
                </p>
              )}
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

      {/* Resumo Financeiro */}
      {(service.service_items && service.service_items.length > 0) || (service.service_materials && service.service_materials.length > 0) ? (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-3">RESUMO FINANCEIRO</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            {/* Subtotal de Serviços */}
            {service.service_items && service.service_items.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal de Serviços:</span>
                <span className="font-medium">
                  R$ {service.service_items.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
                </span>
              </div>
            )}
            
            {/* Subtotal de Materiais */}
            {service.service_materials && service.service_materials.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal de Materiais:</span>
                <span className="font-medium">
                  R$ {service.service_materials.reduce((sum, material) => sum + material.total_price, 0).toFixed(2)}
                </span>
              </div>
            )}
            
            {/* Total Geral */}
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="text-lg font-semibold text-gray-800">Total Geral:</span>
              <span className="text-lg font-bold text-blue-600">
                R$ {(() => {
                  let total = 0
                  
                  // Somar itens de serviço
                  if (service.service_items && service.service_items.length > 0) {
                    total += service.service_items.reduce((sum, item) => sum + item.value, 0)
                  }
                  
                  // Somar materiais
                  if (service.service_materials && service.service_materials.length > 0) {
                    total += service.service_materials.reduce((sum, material) => sum + material.total_price, 0)
                  }
                  
                  return total.toFixed(2)
                })()}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabela de Serviços */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-800 mb-3">SERVIÇOS REALIZADOS</h3>
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
              {/* Itens de Serviço */}
              {service.service_items && service.service_items.length > 0 ? (
                service.service_items.map((item, index) => (
                  <tr key={`item-${index}`}>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                      1
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                      R$ {item.value.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200 font-medium">
                      R$ {item.value.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                /* Fallback para serviços antigos sem itens */
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                    {getServiceTypeLabel(service.service_type || 'OUTRO')}
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
              )}
              
              {/* Materiais */}
              {service.service_materials && service.service_materials.length > 0 && 
                service.service_materials.map((material, index) => (
                  <tr key={`material-${index}`}>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                      {material.description} ({material.quantity} {material.unit})
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                      {material.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                      R$ {material.unit_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200 font-medium">
                      R$ {material.total_price.toFixed(2)}
                    </td>
                  </tr>
                ))
              }
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
              <span className="text-2xl font-bold text-blue-600">
                R$ {(() => {
                  let total = 0
                  
                  // Somar itens de serviço
                  if (service.service_items && service.service_items.length > 0) {
                    total += service.service_items.reduce((sum, item) => sum + item.value, 0)
                  } else {
                    // Fallback para serviços antigos
                    total += 150
                  }
                  
                  // Somar materiais
                  if (service.service_materials && service.service_materials.length > 0) {
                    total += service.service_materials.reduce((sum, material) => sum + material.total_price, 0)
                  }
                  
                  return total.toFixed(2)
                })()}
              </span>
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
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}
