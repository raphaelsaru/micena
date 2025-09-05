'use client'

import Image from 'next/image'

interface OSSignatureFooterProps {
  clientName?: string
}

export function OSSignatureFooter({ clientName }: OSSignatureFooterProps) {
  // Formatar data atual no formato dd/mm/aaaa
  const formatCurrentDate = () => {
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="print-only-signature-footer" style={{ display: 'none' }}>
      {/* Data centralizada */}
      <div className="text-center mb-6 print:mb-4">
        <p className="text-sm print:text-xs text-gray-700 font-medium">
          Brasília, {formatCurrentDate()}
        </p>
      </div>

      {/* Layout de duas colunas para assinaturas */}
      <div className="signature-container">
        {/* Coluna esquerda - Empresa */}
        <div className="signature-company">
          {/* Imagem de assinatura da empresa */}
          <div className="signature-image-container">
            <Image
              src="/assinatura_empresa.png"
              alt="Assinatura Micena Piscinas"
              width={200}
              height={80}
              className="signature-image"
              priority
              onError={(e) => {
                // Se a imagem não carregar, mostrar texto de fallback
                const target = e.target as HTMLImageElement
                const container = target.parentElement
                if (container) {
                  container.innerHTML = '<div class="signature-fallback">[Assinatura da Empresa]</div>'
                }
              }}
            />
          </div>
          
          {/* Linha de assinatura da empresa */}
          <div className="signature-line" style={{ borderBottom: '2px solid #000000', width: '200px', height: '0', margin: '8px 0' }}></div>
          
          {/* Informações da empresa */}
          <div className="signature-info">
            <p className="signature-company-name">Micena Piscinas</p>
            <p className="signature-responsible">José Elias Alves de Oliveira — adm geral</p>
          </div>
        </div>

        {/* Coluna direita - Cliente */}
        <div className="signature-client">
          {/* Imagem em branco para alinhamento com a assinatura da empresa */}
          <div className="signature-image-container">
            <Image
              src="/blank_signature.png"
              alt="Espaço para assinatura do cliente"
              width={200}
              height={80}
              className="signature-image"
              priority
              onError={(e) => {
                // Se a imagem não carregar, mostrar espaço em branco
                const target = e.target as HTMLImageElement
                const container = target.parentElement
                if (container) {
                  container.innerHTML = '<div class="signature-fallback signature-blank">[Espaço para Assinatura]</div>'
                }
              }}
            />
          </div>
          
          {/* Linha de assinatura do cliente */}
          <div className="signature-line" style={{ borderBottom: '2px solid #000000', width: '200px', height: '0', margin: '8px 0' }}></div>
          
          {/* Nome do cliente */}
          <div className="signature-info">
            <p className="signature-client-name">
              {clientName || 'Assinatura do(a) Cliente'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
