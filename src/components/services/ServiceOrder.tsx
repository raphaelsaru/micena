'use client'

import { ServiceWithClient } from '@/types/database'
import { formatDate } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface ServiceOrderProps {
  service: ServiceWithClient
  onClose?: () => void
}

export function ServiceOrder({ service, onClose }: ServiceOrderProps) {

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
      <div className="flex justify-between items-start mb-8 print:mb-3 print:flex-col print:space-y-2">
        {/* Logo à esquerda */}
        <div className="flex-shrink-0">
          <img 
            src="/micena-logo.jpeg" 
            alt="MICENA PISCINAS - Logo" 
            className="h-32 w-auto object-contain brand-logo print:h-20"
          />
        </div>
        
        {/* Informações da empresa à direita */}
        <div className="flex justify-between w-full mt-4 print:mt-0">
          
          <div className="text-sm print:text-xs text-gray-600 mb-2 w-full ml-10 print:ml-0">
          <p>CNPJ: 38.311.624/0001-00</p>
            <p>Rodovia BR-020 km 13, 01, rua Jardim</p>
            <p>Campestre, Córrego Arrozal</p>
            <p>Brasília-DF, CEP 73007-995</p>
          </div>
          <div className="text-sm print:text-xs text-gray-600 mb-2 w-full ml-10 print:ml-0">
            <p>Telefone: (11) 99232-1622</p>
            <p>WhatsApp: (11) 98622-3409</p>
            <p>Email: contato@micenapiscinas.com</p>
          </div>
        </div>
      </div>

      {/* Informações do Cliente */}
      <div className="mb-6 print:mb-1">
        <h3 className="text-lg print:text-sm font-semibold text-gray-800 mb-3 print:mb-1">INFORMAÇÕES DO CLIENTE</h3>
        <div className="bg-gray-50 p-4 print:p-2 rounded-lg space-y-1">
          <div className="grid grid-cols-1">
            <div>
              <span className="font-medium text-gray-700 print:text-xs">Nome: </span>
              <span className="text-gray-600 print:text-xs">{service.clients?.full_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 print:text-xs">Documento: </span>
              <span className="text-gray-600 print:text-xs">{service.clients?.document || 'N/A'}</span>
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700 print:text-xs">Telefone: </span>
            <span className="text-gray-600 print:text-xs">{service.clients?.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Detalhes do Serviço */}
      <div className="mb-6 print:mb-3">
        <h3 className="text-lg print:text-sm font-semibold text-gray-800 mb-3 print:mb-1">DETALHES DO SERVIÇO</h3>
        <div className="bg-gray-50 p-4 print:p-2 rounded-lg space-y-2 print:space-y-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
            <div>
              <span className="font-medium text-gray-700 print:text-xs">Data do Serviço: </span>
              <span className="text-gray-600 print:text-xs">{formatDate(service.service_date)}</span>
            </div>
            {service.work_order_number && (
              <div>
                <span className="text-gray-600 print:text-xs">{service.work_order_number}</span>
              </div>
            )}
          </div>
          
          {service.notes && (
            <div>
              <span className="font-medium text-gray-700 print:text-xs">Observações: </span>
              <span className="text-gray-600 print:text-xs">{service.notes}</span>
            </div>
          )}
          
          {/* Informações de Pagamento */}
          {service.payment_method && (
            <div>
              <span className="font-medium text-gray-700 print:text-xs">Meio de Pagamento: </span>
              <span className="text-gray-600 print:text-xs">
                {(() => {
                  const labels = {
                    'PIX': 'PIX',
                    'TRANSFERENCIA': 'Transferência bancária',
                    'DINHEIRO': 'Dinheiro',
                    'CARTAO': 'Cartão',
                    'BOLETO': 'Boleto'
                  }
                  return labels[service.payment_method] || service.payment_method
                })()}
              </span>
              {service.payment_details && (
                <span className="text-gray-600 ml-2 print:ml-1">
                  <span className="font-medium print:text-xs">PIX: </span>
                  <span className="font-mono print:text-xs">{service.payment_details}</span>
                </span>
              )}
            </div>
          )}
          
          {service.next_service_date && (
            <div>
              <span className="font-medium text-gray-700 print:text-xs">Próximo Serviço: </span>
              <span className="text-gray-600 print:text-xs">{formatDate(service.next_service_date)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Serviços */}
      <div className="mb-6 print:mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4 print:text-lg print:mb-2 border-b-2 border-gray-300 pb-2 print:pb-1">SERVIÇOS</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-50 print:bg-gray-100">
              <tr>
                <th className="px-4 py-3 print:px-2 print:py-1 text-left text-sm print:text-xs font-medium text-gray-700 border-b border-gray-300">
                  Descrição
                </th>
                <th className="px-4 py-3 print:px-2 print:py-1 text-right text-sm print:text-xs font-medium text-gray-700 border-b border-gray-300">
                  Preço
                </th>
              </tr>
            </thead>
            <tbody>
              {service.service_items && service.service_items.length > 0 ? (
                service.service_items.map((item, index) => (
                  <tr key={`item-${index}`}>
                    <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200 text-right font-medium">
                      R$ {item.value.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                /* Fallback para serviços antigos sem itens */
                <tr>
                  <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200">
                    {getServiceTypeLabel(service.service_type || 'OUTRO')}
                  </td>
                  <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200 text-right font-medium">
                    R$ 150,00
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção de Materiais */}
      {service.service_materials && service.service_materials.length > 0 && (
        <div className="mb-6 print:mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-4 print:text-lg print:mb-2 border-b-2 border-gray-300 pb-2 print:pb-1">MATERIAIS</h3>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-blue-50 print:bg-gray-100">
                <tr>
                  <th className="px-2 py-2 print:px-1 print:py-1 text-left text-xs font-medium text-gray-700 border-b border-gray-300">
                    Descrição
                  </th>
                  <th className="px-2 py-2 print:px-1 print:py-1 text-center text-xs font-medium text-gray-700 border-b border-gray-300">
                    Unidade
                  </th>
                  <th className="px-2 py-2 print:px-1 print:py-1 text-right text-xs font-medium text-gray-700 border-b border-gray-300">
                    Preço Unit.
                  </th>
                  <th className="px-2 py-2 print:px-1 print:py-1 text-center text-xs font-medium text-gray-700 border-b border-gray-300">
                    Qtd.
                  </th>
                  <th className="px-2 py-2 print:px-1 print:py-1 text-right text-xs font-medium text-gray-700 border-b border-gray-300">
                    Preço
                  </th>
                </tr>
              </thead>
              <tbody>
                {service.service_materials.map((material, index) => (
                  <tr key={`material-${index}`}>
                    <td className="px-2 py-2 print:px-1 print:py-1 text-xs text-gray-600 border-b border-gray-200">
                      {material.description}
                    </td>
                    <td className="px-2 py-2 print:px-1 print:py-1 text-xs text-gray-600 border-b border-gray-200 text-center">
                      {material.unit}
                    </td>
                    <td className="px-2 py-2 print:px-1 print:py-1 text-xs text-gray-600 border-b border-gray-200 text-right">
                      R$ {material.unit_price.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 print:px-1 print:py-1 text-xs text-gray-600 border-b border-gray-200 text-center">
                      {material.quantity}
                    </td>
                    <td className="px-2 py-2 print:px-1 print:py-1 text-xs text-gray-600 border-b border-gray-200 text-right font-medium">
                      R$ {material.total_price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="mb-6 print:mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4 print:text-lg print:mb-2 border-b-2 border-gray-300 pb-2 print:pb-1">TOTAIS</h3>
        <div className="bg-gray-100 p-6 print:p-3 rounded-lg space-y-3 print:space-y-2">
          {/* Subtotal de Serviços */}
          {service.service_items && service.service_items.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-lg print:text-base font-medium text-gray-700">Serviços:</span>
              <span className="text-lg print:text-base font-medium text-gray-800">
                R$ {service.service_items.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Subtotal de Materiais */}
          {service.service_materials && service.service_materials.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-lg print:text-base font-medium text-gray-700">Materiais:</span>
              <span className="text-lg print:text-base font-medium text-gray-800">
                R$ {service.service_materials.reduce((sum, material) => sum + material.total_price, 0).toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Total Geral */}
          <div className="flex justify-between items-center pt-3 print:pt-2 border-t-2 border-gray-400">
            <span className="text-xl print:text-lg font-bold text-gray-800">Total:</span>
            <span className="text-2xl print:text-xl font-bold text-blue-600">
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

      {/* Informações de Pagamento */}
      {service.payment_method && (
        <div className="mb-6 print:mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-4 print:text-lg print:mb-2 border-b-2 border-gray-300 pb-2 print:pb-1">PAGAMENTO</h3>
          <div className="bg-gray-50 p-4 print:p-3 rounded-lg">
            <div>
              <span className="font-medium text-gray-700">Meios de pagamento: </span>
              <span className="text-gray-600">
                {(() => {
                  const labels = {
                    'PIX': 'PIX',
                    'TRANSFERENCIA': 'Transferência bancária',
                    'DINHEIRO': 'Dinheiro',
                    'CARTAO': 'Cartão',
                    'BOLETO': 'Boleto'
                  }
                  return labels[service.payment_method] || service.payment_method
                })()}
              </span>
            </div>
            
            {service.payment_details && (
              <div>
                <span className="font-medium text-gray-700">PIX: </span>
                <span className="text-gray-600">{service.payment_details}</span>
              </div>
            )}
          </div>
        </div>
      )}


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
