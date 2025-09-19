'use client'

import { ServiceWithClient } from '@/types/database'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import Image from 'next/image'
import { OSSignatureFooter } from './OSSignatureFooter'

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





  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0 print:bg-white print:text-black">
      {/* Conteúdo para impressão */}
      <div 
        className="print-content print:mt-8" 
        style={{
          backgroundColor: '#ffffff',
          color: '#000000'
        }}
        id="service-order-print-content"
      >
        {/* Cabeçalho da OS */}
      <div className="flex justify-between items-start mb-8 print:mb-3 print:flex-col print:space-y-2">
        {/* Logo à esquerda */}
        <div className="flex-shrink-0">
          <Image 
            src="/micena-logo.jpeg" 
            alt="MICENA PISCINAS - Logo" 
            width={200}
            height={200}
            className="h-32 w-auto object-contain brand-logo print:h-32"
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
            <p>Telefone: (61) 99232-1622</p>
            <p>Email: elias-bsb@hotmail.com</p>
          </div>
        </div>
      </div>

      {/* Destaque da Ordem de Serviço */}
      <div className="mb-3 print:mb-3">
        <div className="bg-gray-800 print:bg-gray-800 text-white p-2 print:p-1 rounded-lg">
          <div className="text-center print:pt-1">
            <h2 className="text-xl print:text-xl font-bold text-white">
              {service.work_order_number || 'Ordem de Serviço'}
            </h2>
          </div>
        </div>
      </div>

      {/* Informações do Cliente */}
      <div className="mb-6 print:mb-1">
        <h3 className="text-lg print:text-sm font-semibold text-gray-800 mb-3 print:mb-1">INFORMAÇÕES DO CLIENTE</h3>
        <div className="bg-gray-50 p-4 print:p-2 rounded-lg">
          <p className="text-sm print:text-xs text-gray-600 mb-1">
            <span className="font-medium text-gray-700">Nome: </span>
            {service.clients?.full_name || 'N/A'}
          </p>
          {service.clients?.document && (
            <p className="text-sm print:text-xs text-gray-600 mb-1">
              <span className="font-medium text-gray-700">CPF/CNPJ: </span>
              {service.clients.document}
            </p>
          )}
          <p className="text-sm print:text-xs text-gray-600 mb-1">
            <span className="font-medium text-gray-700">Telefone: </span>
            {service.clients?.phone || 'N/A'}
          </p>
        </div>
      </div>

      {/* Detalhes do Serviço */}
      <div className="mb-6 print:mb-3">
        <h3 className="text-lg print:text-sm font-semibold text-gray-800 mb-3 print:mb-1">DETALHES DO SERVIÇO</h3>
        <div className="bg-gray-50 p-4 print:p-2 rounded-lg">
          <p className="text-sm print:text-xs text-gray-600 mb-1">
            <span className="font-medium text-gray-700">Data do Serviço: </span>
            {formatDate(service.service_date)}
          </p>
          
          {service.notes && (
            <p className="text-sm print:text-xs text-gray-600 mb-1">
              <span className="font-medium text-gray-700">Observações: </span>
              {service.notes}
            </p>
          )}
          
          {/* Informações de Pagamento */}
          {service.payment_method && (
            <>
              <p className="text-sm print:text-xs text-gray-600 mb-1">
                <span className="font-medium text-gray-700">Meio de Pagamento: </span>
                {(() => {
                  const labels = {
                    'PIX': 'PIX',
                    'TRANSFERENCIA': 'Transferência bancária',
                    'DINHEIRO': 'Dinheiro',
                    'CARTAO': 'Cartão',
                    'BOLETO': 'Boleto'
                  }
                  return labels[service.payment_method as keyof typeof labels] || service.payment_method
                })()}
              </p>
              {service.payment_details && (
                <p className="text-sm print:text-xs text-gray-600 mb-1">
                  <span className="font-medium text-gray-700">Detalhes do Pgto.: </span>
                  <span className="font-mono">{service.payment_details}</span>
                </p>
              )}
            </>
          )}
          
          {service.next_service_date && (
            <p className="text-sm print:text-xs text-gray-600 mb-1">
              <span className="font-medium text-gray-700">Próximo Serviço: </span>
              {formatDate(service.next_service_date)}
            </p>
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
                      {formatCurrency(item.value)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200 text-center" colSpan={2}>
                    Nenhum serviço cadastrado
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
                  <th className="px-4 py-3 print:px-2 print:py-1 text-left text-sm print:text-xs font-medium text-gray-700 border-b border-gray-300">
                    Descrição
                  </th>
                  <th className="px-4 py-3 print:px-2 print:py-1 text-center text-sm print:text-xs font-medium text-gray-700 border-b border-gray-300">
                    Unidade
                  </th>
                  <th className="px-4 py-3 print:px-2 print:py-1 text-right text-sm print:text-xs font-medium text-gray-700 border-b border-gray-300">
                    Preço Unit.
                  </th>
                  <th className="px-4 py-3 print:px-2 print:py-1 text-center text-sm print:text-xs font-medium text-gray-700 border-b border-gray-300">
                    Qtd.
                  </th>
                  <th className="px-4 py-3 print:px-2 print:py-1 text-right text-sm print:text-xs font-medium text-gray-700 border-b border-gray-300">
                    Preço
                  </th>
                </tr>
              </thead>
              <tbody>
                {service.service_materials.map((material, index) => (
                  <tr key={`material-${index}`}>
                    <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200">
                      {material.description}
                    </td>
                    <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200 text-center">
                      {material.unit}
                    </td>
                    <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200 text-right">
                      {formatCurrency(material.unit_price)}
                    </td>
                    <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200 text-center">
                      {material.quantity}
                    </td>
                    <td className="px-4 py-3 print:px-2 print:py-1 text-sm print:text-xs text-gray-600 border-b border-gray-200 text-right font-medium">
                      {formatCurrency(material.total_price)}
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
          {service.service_items && service.service_items.length > 0 ? (
            <div className="flex justify-between items-center">
              <span className="text-lg print:text-base font-medium text-gray-700">Serviços:</span>
              <span className="text-lg print:text-base font-medium text-gray-800">
                {formatCurrency(service.service_items.reduce((sum, item) => sum + item.value, 0))}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-lg print:text-base font-medium">Serviços:</span>
              <span className="text-lg print:text-base">Nenhum serviço cadastrado</span>
            </div>
          )}
          
          {/* Subtotal de Materiais */}
          {service.service_materials && service.service_materials.length > 0 ? (
            <div className="flex justify-between items-center">
              <span className="text-lg print:text-base font-medium text-gray-700">Materiais:</span>
              <span className="text-lg print:text-base font-medium text-gray-800">
                {formatCurrency(service.service_materials.reduce((sum, material) => sum + material.total_price, 0))}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-lg print:text-base font-medium">Materiais:</span>
              <span className="text-lg print:text-base">Nenhum material cadastrado</span>
            </div>
          )}
          
          {/* Total Geral */}
          <div className="flex justify-between items-center pt-3 print:pt-2 border-t-2 border-gray-400">
            <span className="text-xl print:text-lg font-bold text-gray-800">Total:</span>
            <span className="text-2xl print:text-xl font-bold text-blue-600">
              {(() => {
                let total = 0
                
                // Somar itens de serviço
                if (service.service_items && service.service_items.length > 0) {
                  total += service.service_items.reduce((sum, item) => sum + item.value, 0)
                }
                
                // Somar materiais
                if (service.service_materials && service.service_materials.length > 0) {
                  total += service.service_materials.reduce((sum, material) => sum + material.total_price, 0)
                }
                
                return formatCurrency(total)
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
                <span className="font-medium text-gray-700">Detalhes do Pgto.: </span>
                <span className="text-gray-600">{service.payment_details}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rodapé de Assinaturas (apenas na impressão) */}
      <OSSignatureFooter clientName={service.clients?.full_name} />

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
