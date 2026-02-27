import { Client } from '@/types/database'
import { useState, useEffect } from 'react'

interface PrintClientsListProps {
  clients: Client[]
  printColor: string
  printColumns: '1' | '2'
  printFont: string
  printFontSize: string
}

export function PrintClientsList({
  clients,
  printColor,
  printColumns,
  printFont,
  printFontSize
}: PrintClientsListProps) {
  const [printTimestamp, setPrintTimestamp] = useState<string>('')

  // Definir timestamp apenas no cliente para evitar erro de hidratação
  useEffect(() => {
    setPrintTimestamp(new Date().toLocaleString('pt-BR'))
  }, [])

  // Dividir clientes para impressão em colunas
  const getColumnsForPrint = () => {
    if (printColumns === '1' || clients.length === 0) {
      return { leftColumn: [], rightColumn: [] }
    }

    const totalClients = clients.length
    const leftColumnSize = Math.ceil(totalClients / 2)
    
    return {
      leftColumn: clients.slice(0, leftColumnSize),
      rightColumn: clients.slice(leftColumnSize)
    }
  }

  const { leftColumn, rightColumn } = getColumnsForPrint()

  // Calcular estatísticas dos clientes
  const totalClients = clients.length
  const mensalistasCount = clients.filter(client => client.is_recurring).length
  const avulsosCount = totalClients - mensalistasCount

  // Aplicar estilos de impressão via variáveis CSS
  const printStyles = {
    '--print-color': printColor,
    '--print-font-family': printFont,
    '--print-font-size': printFontSize,
    '--print-columns': printColumns === '2' ? '1fr 1fr' : '1fr'
  } as React.CSSProperties

  // Função para manter nomes completos (sem truncamento)
  const keepFullName = (name: string) => {
    return name;
  };

  // Função para formatar data de início da mensalidade
  const formatSubscriptionDate = (dateString?: string) => {
    if (!dateString) return 'Não informado'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  // Função para renderizar uma tabela no estilo Google Sheets/Excel
  const renderExcelStyleTable = (clients: Client[], columnTitle: string) => (
    <div className="excel-table-container">
      <h3 className="table-title">{columnTitle}</h3>
      <table className="excel-style-table">
        <thead>
          <tr className="table-header">
            <th className="header-cell checkbox-header">✓</th>
            <th className="header-cell name-header">Nome Completo / Razão Social</th>
            <th className="header-cell contact-header">Contato</th>
            <th className="header-cell date-header">Data de Início da Mensalidade</th>
            <th className="header-cell notes-header">Observações</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client, index) => {
            return (
              <tr 
                key={client.id} 
                className="table-row"
              >
                <td className="data-cell checkbox-cell">
                  <div className="checkbox"></div>
                </td>
                <td className="data-cell name-cell">
                  <div className="client-info">
                    <span className="client-name">{keepFullName(client.full_name)}</span>
                  </div>
                </td>
                <td className="data-cell contact-cell">
                  <div className="client-info">
                    {client.phone && <span>{client.phone}</span>}
                    {client.email && <span>{client.email}</span>}
                    {!client.phone && !client.email && <span>-</span>}
                  </div>
                </td>
                <td className="data-cell date-cell">
                  {formatSubscriptionDate(client.subscription_start_date)}
                </td>
                <td className="data-cell notes-cell">
                  {client.notes ? keepFullName(client.notes) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      {/* Estilos específicos para impressão */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .clients-print-watermark {
              opacity: 0.2 !important;
              display: block !important;
              visibility: visible !important;
            }
            .print-logo-title {
              text-align: center !important;
              width: 100% !important;
              display: block !important;
            }
          }

          @media screen and (max-width: 768px) {
            .clients-print-watermark {
              opacity: 0.3 !important;
              display: block !important;
              visibility: visible !important;
              z-index: 1 !important;
              position: absolute !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              pointer-events: none !important;
            }
            .print-logo-title {
              text-align: center !important;
              width: 100% !important;
              display: block !important;
            }
          }

          .clients-print-watermark {
            opacity: 0.2;
            display: block;
            visibility: visible;
            z-index: 1;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
          }

          .print-logo-title {
            text-align: center;
            width: 100%;
            display: block;
          }

          /* Estilos específicos para a tabela de clientes */
          .excel-table-container {
            margin-bottom: 20px;
          }

          .table-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--print-color, #1f2937);
          }

          .excel-style-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid var(--print-color, #1f2937);
            font-family: var(--print-font-family, Arial, sans-serif);
            font-size: var(--print-font-size, 12px);
          }

          .table-header {
            background-color: var(--print-color, #1f2937);
            color: white;
          }

          .header-cell {
            border: 1px solid var(--print-color, #1f2937);
            padding: 8px;
            text-align: left;
            font-weight: bold;
          }

          .checkbox-header {
            width: 30px;
            text-align: center;
          }

          .name-header {
            width: 30%;
          }

          .contact-header {
            width: 20%;
          }

          .date-header {
            width: 20%;
          }

          .notes-header {
            width: 30%;
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
            color: var(--print-color, #1f2937);
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
        `
      }} />

      <div
        className="print-clients-list excel-print-layout relative"
        style={printStyles}
      >
        {/* Logo como marca d'água */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/watermark-logo.png"
          alt=""
          className="pointer-events-none clients-print-watermark"
          style={{
            width: '300px',
            height: '300px',
            objectFit: 'contain',
            zIndex: 9999,
            WebkitPrintColorAdjust: 'exact',
            colorAdjust: 'exact',
            printColorAdjust: 'exact',
            display: 'block',
            visibility: 'visible',
            opacity: 0.15,
            position: 'fixed',
            top: '50vh',
            left: '50vw',
            transform: 'translate(-50%, -50%)',
            margin: 0,
            padding: 0
          }}
        />

        {/* Todo o conteúdo */}
        <div className="relative">
          {/* Título da empresa */}
          <div className="text-center mb-4 print-logo-title">
            <h1 className="text-3xl print:text-2xl font-bold text-gray-800">MICENA PISCINAS</h1>
          </div>

          {/* Título da lista de clientes para impressão centralizado */}
          <div className="print-header text-center">
            <p className="text-sm opacity-75">{printTimestamp || '...'}</p>
          </div>

          {/* Layout de colunas para impressão */}
          <div className="print-columns-layout">
            {printColumns === '1' ? (
              // Coluna única
              renderExcelStyleTable(clients, 'Lista Completa de Clientes')
            ) : (
              // Duas colunas
              <>
                {leftColumn.length > 0 && renderExcelStyleTable(leftColumn, 'Coluna 1')}
                {rightColumn.length > 0 && renderExcelStyleTable(rightColumn, 'Coluna 2')}
              </>
            )}
          </div>

          {/* Estatísticas */}
          <div className="icons-legend">
            <div
              className="legend-stats legend-item border-t border-gray-300 flex justify-center items-center"
              style={{ width: '100%' }}
            >
              <span className="text-center w-full block">
                Total de clientes: {totalClients} | Mensalistas: {mensalistasCount} | Avulsos: {avulsosCount}
              </span>
            </div>
          </div>
        </div> {/* Fecha div do conteúdo */}
      </div>
    </>
  )
}
