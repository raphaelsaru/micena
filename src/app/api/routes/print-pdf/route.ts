import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { getSignatureImagesBase64 } from '@/lib/image-utils'

export async function POST(request: NextRequest) {
  try {
    const { html, dayOfWeek, currentTeam, selectedCount, assignmentsInOrder } = await request.json()

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    console.log('🖨️ Gerando PDF para:', { dayOfWeek, currentTeam, selectedCount })
    
    // Converter imagens de assinatura para base64
    const signatureImages = getSignatureImagesBase64()
    console.log('📸 Imagens de assinatura carregadas:', {
      companySignature: signatureImages.companySignature ? '✅' : '❌',
      blankSignature: signatureImages.blankSignature ? '✅' : '❌'
    })
    
    // REGRA: Usar ordem recebida do frontend (não reordenar)
    if (assignmentsInOrder && Array.isArray(assignmentsInOrder)) {
      console.log('📋 Usando ordem do frontend:', assignmentsInOrder.map(a => ({ 
        id: a.client_id, 
        name: a.full_name, 
        order_index: a.order_index 
      })))
    } else {
      console.warn('⚠️ assignmentsInOrder não fornecido, usando ordem do HTML')
    }

    // REGRA 4: Validar HTML enviado
    if (!html || html.trim().length === 0) {
      return NextResponse.json(
        { error: 'HTML content is empty or invalid' },
        { status: 400 }
      )
    }

    // Verificar se contém elementos esperados do layout de impressão
    if (!html.includes('excel-style-table') && !html.includes('print-route-list')) {
      console.warn('⚠️ HTML pode não conter layout de impressão esperado')
    }

    // Lançar browser em modo headless
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })

    const page = await browser.newPage()

    // Configurar viewport e media para impressão
    await page.setViewport({ width: 1200, height: 800 })
    await page.emulateMediaType('print')

    // HTML completo com estilos
    const fullHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rota de Impressão - Micena Piscinas</title>
      <script>
        // Substituir imagens de assinatura por versões base64
        window.addEventListener('DOMContentLoaded', function() {
          const companySignatureImg = document.querySelector('img[src="/assinatura_empresa.png"]');
          const blankSignatureImg = document.querySelector('img[src="/blank_signature.png"]');
          
          if (companySignatureImg && '${signatureImages.companySignature}') {
            companySignatureImg.src = '${signatureImages.companySignature}';
            console.log('✅ Imagem de assinatura da empresa substituída por base64');
          }
          
          if (blankSignatureImg && '${signatureImages.blankSignature}') {
            blankSignatureImg.src = '${signatureImages.blankSignature}';
            console.log('✅ Imagem de assinatura em branco substituída por base64');
          }
        });
      </script>
      <style>
        /* REGRA 1: Habilitar cores de fundo e fidelidade de cor */
        html, body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          margin: 0;
          padding: 0;
          line-height: 1.5;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
        }

        /* Reset básico com fidelidade de cor */
        *, ::before, ::after {
          box-sizing: border-box;
          border-width: 0;
          border-style: solid;
          border-color: #e5e7eb;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* REGRA 5: Configurações de página A4 */
        @page {
          size: A4;
          margin: 12mm;
        }

        /* REGRA 1: Contêiner principal com largura fixa para A4 */
        .print-page {
          width: 186mm;
          max-width: 186mm;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 0;
          overflow: visible;
        }

        /* Layout principal de impressão */
        .excel-print-layout {
          font-family: var(--print-font-family, 'Arial, sans-serif');
          font-size: var(--print-font-size, 10pt);
          color: #000000;
          max-width: 100%;
          margin: 0 auto;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* REGRA 2: Grid das colunas com gap de 6mm */
        .print-columns-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6mm;
          width: 100%;
          margin-bottom: 2rem;
          box-sizing: border-box;
        }

        .print-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6mm;
          width: 100%;
          box-sizing: border-box;
        }

        /* REGRA 2 e 3: Markup <table> com bordas 1pt */
        .print-column, .print-single-column {
          background-color: #ffffff;
          border: 1pt solid #000000;
          border-radius: 0;
          padding: 0.5rem;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* REGRA 3: Tabela principal com layout automático e padding de 2mm */
        .excel-style-table {
          width: 100%;
          table-layout: auto;
          border-collapse: collapse;
          border: 1pt solid #000000;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .excel-style-table th,
        .excel-style-table td {
          border: 1pt solid #000000;
          padding: 2mm;
          text-align: left;
          vertical-align: middle;
          font-size: 9pt;
          line-height: 1.2;
          box-sizing: border-box;
          word-break: break-word;
          overflow: visible;
        }

        /* Larguras proporcionais das colunas */
        .excel-style-table .checkbox-cell {
          width: 20px;
          min-width: 20px;
          max-width: 30px;
        }

        .excel-style-table .position-cell {
          width: 40px;
          min-width: 40px;
          max-width: 50px;
        }

        .excel-style-table .client-cell {
          width: auto;
          min-width: 0;
        }

        .excel-style-table th {
          background-color: #f3f4f6;
          font-weight: bold;
          border-bottom: 2pt solid #000000;
        }

        .excel-style-table tr {
          border: 1pt solid #000000;
        }

        .excel-style-table tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .excel-style-table tr:nth-child(odd) {
          background-color: #ffffff;
        }

        /* Células específicas */
        .header-cell {
          border: 1pt solid #000000;
          padding: 0.2rem 0.4rem;
          background-color: #f3f4f6;
          font-weight: bold;
          text-align: center;
          font-size: 8pt;
        }

        .data-cell {
          border: 1pt solid #000000;
          padding: 0.2rem 0.4rem;
          vertical-align: middle;
          font-size: 9pt;
        }

        .checkbox-cell {
          width: 20px;
          text-align: center;
        }

        .position-cell {
          width: 40px;
          text-align: center;
          font-weight: bold;
        }

        .client-cell {
          text-align: left;
        }

        /* Container da tabela */
        .excel-table-container {
          margin-bottom: 1rem;
        }

        .table-title {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 0.5rem;
          text-align: center;
          color: #000000;
        }

        /* REGRA 2: Cores em HEX para elementos críticos */
        .print-checkbox {
          width: 14px;
          height: 14px;
          border: 1pt solid #000000;
          border-radius: 2px;
          margin-right: 8px;
          flex-shrink: 0;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-position {
          font-size: 8pt;
          min-width: 24px;
          padding: 2px 4px;
          background-color: #e5e7eb;
          border: 1pt solid #000000;
          border-radius: 3px;
          text-align: center;
          margin-right: 8px;
          font-weight: 500;
          line-height: 1.3;
          flex-shrink: 0;
          color: #000000;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-name {
          flex: 1;
          font-size: 9pt;
          line-height: 1.3;
          color: #000000;
        }

        .print-address {
          font-size: 7pt;
          color: #6b7280;
          margin-left: 4px;
        }

        .print-icons {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
          flex-shrink: 0;
        }

        .print-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        /* REGRA 2: Cores vermelhas sólidas em HEX */
        .text-red-600, .print-service-vacuum {
          color: #dc2626 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Ícones de serviço com cores específicas */
        .print-service-aspirar, .print-service-vacuum {
          color: #dc2626 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-service-esfregar, .print-service-sponge {
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-has-key {
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-header {
          margin-bottom: 1.5rem;
          text-align: center;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-header h1 {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 0.3rem;
          color: #000000;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-header p {
          font-size: 9pt;
          color: #666666;
          margin: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .icons-legend {
          margin-top: 2rem;
          page-break-inside: avoid;
          border: 1pt solid #000000;
          padding: 0.5rem;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .legend-title {
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #000000;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 8pt;
          color: #000000;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .legend-item .text-red-600 {
          color: #dc2626 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Controle de quebra de página */
        .print-route-list {
          page-break-inside: auto;
          break-inside: auto;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-table-row, .print-table-row-flex {
          page-break-inside: avoid;
          break-inside: avoid;
          border: 1pt solid #000000;
        }

        /* Utilitários Tailwind essenciais com cores HEX */
        .text-2xl { font-size: 1.5rem; line-height: 2rem; color: #000000; }
        .font-bold { font-weight: 700; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; color: #000000; }
        .w-4 { width: 1rem; }
        .h-4 { height: 1rem; }
        .text-red-600 { 
          color: #dc2626 !important; 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .space-x-2 > :not([hidden]) ~ :not([hidden]) { 
          margin-right: 0; 
          margin-left: 0.5rem; 
        }
        .gap-6 { gap: 1.5rem; }

        /* REGRA 4: Remover overflow e garantir visibilidade */
        .print-page,
        .print-page *,
        .excel-print-layout,
        .excel-print-layout * {
          overflow: visible !important;
          box-sizing: border-box;
        }

        /* REGRA 6: Imagens e SVGs com max-width: 100% */
        img, svg {
          max-width: 100% !important;
          height: auto !important;
          display: inline-block;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Estilos específicos para imagens de assinatura */
        .signature-image {
          max-height: 80px !important;
          width: auto !important;
          height: auto !important;
          object-fit: contain !important;
          display: block !important;
          margin: 0 auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .signature-image-container {
          display: block !important;
          text-align: center !important;
          margin-bottom: 8px !important;
        }

        /* Garantir que o rodapé de assinatura seja visível na impressão */
        .print-only-signature-footer {
          display: block !important;
          page-break-inside: avoid !important;
          margin-top: 2rem !important;
          padding-top: 1rem !important;
          border-top: 1px solid #e5e7eb !important;
        }

        .signature-container {
          display: flex !important;
          justify-content: space-between !important;
          gap: 24px !important;
          align-items: flex-start !important;
          page-break-inside: avoid !important;
        }

        .signature-company,
        .signature-client {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          min-height: 140px !important;
        }

        /* Estilos para fallback de assinatura */
        .signature-fallback {
          height: 80px !important;
          width: 200px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 1px dashed #cccccc !important;
          background-color: #f9f9f9 !important;
          font-size: 10px !important;
          color: #666666 !important;
          text-align: center !important;
          margin: 0 auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .signature-fallback.signature-blank {
          background-color: #ffffff !important;
          border: 1px solid #e5e7eb !important;
        }

        /* REGRA 3: SVGs inline com cores definidas */
        svg {
          display: inline-block;
          width: 14px;
          height: 14px;
          max-width: 100% !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Forçar cores específicas nos ícones */
        svg[class*="vacuum"], svg[class*="MaterialSymbolsVacuum"] {
          color: #dc2626 !important;
          fill: #dc2626 !important;
          stroke: #dc2626 !important;
        }

        svg[class*="sponge"], svg[class*="FluentEmojiHighContrastSponge"] {
          color: #000000 !important;
          fill: #000000 !important;
          stroke: #000000 !important;
        }

        svg[class*="key"], svg[class*="KeyIcon"] {
          color: #000000 !important;
          fill: #000000 !important;
          stroke: #000000 !important;
        }

        /* Garantir que ícones de esfregar sejam pretos */
        .service-icon svg[class*="FluentEmojiHighContrastSponge"],
        .service-icon svg[class*="sponge"] {
          color: #000000 !important;
          fill: #000000 !important;
          stroke: #000000 !important;
        }

        /* Garantir que ícones de aspirar sejam vermelhos */
        .service-icon svg[class*="MaterialSymbolsVacuum"],
        .service-icon svg[class*="vacuum"] {
          color: #dc2626 !important;
          fill: #dc2626 !important;
          stroke: #dc2626 !important;
        }

        /* Cores específicas para elementos de esfregar */
        .service-esfregar {
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .service-esfregar svg {
          color: #000000 !important;
          fill: #000000 !important;
          stroke: #000000 !important;
        }

        /* REGRA 3: SVGs inline para garantir renderização */
        .icon-vacuum-inline {
          display: inline-block;
          width: 14px;
          height: 14px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23dc2626' d='M4 22q-1.25 0-2.125-.875T1 19t.875-2.125T4 16t2.125.875T7 19t-.875 2.125T4 22m0-2q.425 0 .713-.288T5 19t-.288-.712T4 18t-.712.288T3 19t.288.713T4 20m4 2q.5-.65.75-1.425T9 19q0-2.075-1.463-3.537T4 14q-.5 0-1.012.1T2 14.4V9h3V5.6q0-1.925 1.338-3.262T9.6 1q1.4 0 2.55.763t1.7 2.037L20.675 20H23v2h-7v-2h2.5L12.025 4.6q-.3-.725-.962-1.162T9.6 3q-1.075 0-1.837.763T7 5.6V9h2q1.65 0 2.825 1.175T13 13v9z'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
        }

        .icon-sponge-inline {
          display: inline-block;
          width: 14px;
          height: 14px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000000' d='M8.5 2.5c-.83 0-1.5.67-1.5 1.5v1c0 .83.67 1.5 1.5 1.5h7c.83 0 1.5-.67 1.5-1.5V4c0-.83-.67-1.5-1.5-1.5h-7zM8 6v12c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V6H8zm2 2h4v8H10V8z'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
        }

        .icon-key-inline {
          display: inline-block;
          width: 14px;
          height: 14px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000000' d='M7 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
        }

        /* Media print específica */
        @media print {
          html, body, * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .text-red-600 {
            color: #dc2626 !important;
          }
          
          .print-table-row, .print-table-row-flex {
            border: 1pt solid #000000 !important;
          }
          
          .print-column, .print-single-column {
            border: 1.25pt solid #000000 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-page">
        ${html}
      </div>
    </body>
    </html>
    `

    // REGRA 4: Carregar HTML e aguardar fontes
    await page.setContent(fullHtml, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })

    // Aguardar fontes carregarem completamente
    await page.evaluateHandle('document.fonts.ready')
    
    // Aguardar imagens carregarem
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
        })
      );
    });
    
    // Aguardar um pouco mais para garantir renderização completa
    await new Promise(resolve => setTimeout(resolve, 1000))

    // REGRA 5: Gerar PDF com configurações otimizadas para A4
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 1,
      landscape: false,
      width: '210mm',
      height: '297mm'
    })

    await browser.close()

    console.log('✅ PDF gerado com sucesso')

    // Retornar PDF como resposta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rota-${dayOfWeek}-equipe-${currentTeam}-${selectedCount || 'todos'}-clientes.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar PDF' },
      { status: 500 }
    )
  }
}
