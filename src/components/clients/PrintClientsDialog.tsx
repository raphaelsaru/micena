'use client'

import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PrintClientsList } from './PrintClientsList'
import { Client } from '@/types/database'
import { getClients } from '@/lib/clients'

interface PrintClientsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrintClientsDialog({ open, onOpenChange }: PrintClientsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const loadAllClientsAndPrint = async () => {
      try {
        setIsLoading(true)
        console.log('🔄 Carregando todos os clientes para impressão...')
        const allClientsData = await getClients()
        console.log(`✅ ${allClientsData.length} clientes carregados para impressão`)
        
        if (allClientsData.length === 0) {
          alert('Nenhum cliente encontrado para impressão.')
          onOpenChange(false)
          return
        }

        // Só executar a impressão após carregar os dados
        await executePrint(allClientsData)
        
      } catch (error) {
        console.error('❌ Erro ao carregar todos os clientes:', error)
        alert('Erro ao carregar clientes para impressão.')
        onOpenChange(false)
      } finally {
        setIsLoading(false)
      }
    }

    const executePrint = async (clientsToPrint: Client[]) => {

      // Criar uma nova janela para impressão
      const printWindow = window.open('', '_blank')
      
      if (!printWindow) {
        alert('Não foi possível abrir a janela de impressão. Verifique se o popup está bloqueado.')
        onOpenChange(false)
        return
      }

      // Escrever o HTML base na nova janela
      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lista de Clientes - MICENA PISCINAS</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #1f2937;
              background: white;
            }

            .print-clients-list {
              padding: 20px;
              max-width: 100%;
              margin: 0 auto;
            }

            .print-header {
              margin-bottom: 20px;
              text-align: center;
            }

            .print-header h1 {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
            }

            .print-header p {
              font-size: 12px;
              color: #6b7280;
            }

            .print-columns-layout {
              display: grid;
              grid-template-columns: 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }

            @media print {
              .print-clients-list {
                padding: 0;
              }
              
              .print-columns-layout {
                gap: 30px;
              }
            }

            /* Estilos da tabela */
            .excel-table-container {
              margin-bottom: 20px;
            }

            .table-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #1f2937;
            }

            .excel-style-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #1f2937;
              font-family: Arial, sans-serif;
              font-size: 12px;
            }

            .table-header {
              background-color: #1f2937;
              color: white;
            }

            .header-cell {
              border: 1px solid #1f2937;
              padding: 8px;
              text-align: left;
              font-weight: bold;
            }

            .checkbox-header {
              width: 30px;
              text-align: center;
            }

            .name-header {
              width: 35%;
            }

            .date-header {
              width: 25%;
            }

            .notes-header {
              width: 40%;
            }

            .table-row {
              border-bottom: 1px solid #d1d5db;
            }

            .row-even {
              background-color: transparent;
            }

            .row-odd {
              background-color: transparent;
            }

            .data-cell {
              border: 1px solid #d1d5db;
              padding: 6px 8px;
              vertical-align: top;
            }

            .checkbox-cell {
              text-align: center;
            }

            .checkbox {
              width: 12px;
              height: 12px;
              border: 1px solid #6b7280;
              display: inline-block;
            }

            .client-info {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .client-name {
              font-weight: 500;
            }

            .mensalista-badge {
              font-size: 10px;
              background-color: #10b981;
              color: white;
              padding: 2px 4px;
              border-radius: 3px;
              display: inline-block;
              width: fit-content;
            }

            .mensalista-row {
              background-color: transparent !important;
            }

            .icons-legend {
              margin-top: 20px;
              padding: 15px;
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 8px;
            }

            .legend-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #1f2937;
            }

            .legend-items {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              align-items: center;
            }

            .legend-item {
              display: flex;
              align-items: center;
              gap: 5px;
              font-size: 12px;
            }

            .legend-stats {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #d1d5db;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="print-clients-list">
            <div id="print-content"></div>
          </div>
        </body>
      </html>
      `)

      printWindow.document.close()

      // Aguardar o carregamento e renderizar o conteúdo
      printWindow.onload = () => {
        const container = printWindow.document.getElementById('print-content')
        if (container) {
        const root = createRoot(container)
        root.render(
          <PrintClientsList
            clients={clientsToPrint}
            printColor="#1f2937"
            printColumns="1"
            printFont="Arial"
            printFontSize="12px"
          />
        )
          
          // Aguardar um pouco para o conteúdo ser renderizado e então imprimir
          setTimeout(() => {
            printWindow.focus()
            printWindow.print()
            printWindow.close()
            // Fechar o diálogo após a impressão
            onOpenChange(false)
          }, 500)
        }
      }
    }

    loadAllClientsAndPrint()
  }, [open, onOpenChange])

  // Mostrar loading enquanto carrega os clientes
  if (open && isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando todos os clientes para impressão...</p>
        </div>
      </div>
    )
  }

  return null
}
