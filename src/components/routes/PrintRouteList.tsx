import { RouteAssignment } from '@/types/database'
import { DAY_LABELS } from '@/types/database'
import { useState, useEffect } from 'react'
import { formatRouteNumber } from '@/lib/utils'
import { KeyIcon, MaterialSymbolsVacuum, FluentEmojiHighContrastSponge } from '@/components/ui/icons'
import Image from 'next/image'

interface PrintRouteListProps {
  dayOfWeek: number
  currentTeam: number
  assignments: RouteAssignment[]
  printColor: string
  printColumns: '1' | '2'
  printFont: string
  printFontSize: string
}

export function PrintRouteList({
  dayOfWeek,
  currentTeam,
  assignments,
  printColor,
  printColumns,
  printFont,
  printFontSize
}: PrintRouteListProps) {
  const [printTimestamp, setPrintTimestamp] = useState<string>('')

  // Definir timestamp apenas no cliente para evitar erro de hidratação
  useEffect(() => {
    setPrintTimestamp(new Date().toLocaleString('pt-BR'))
  }, [])

  // Dividir assignments para impressão em colunas
  const getColumnsForPrint = () => {
    if (printColumns === '1' || assignments.length === 0) {
      return { leftColumn: [], rightColumn: [] }
    }

    const totalClients = assignments.length
    const leftColumnSize = Math.ceil(totalClients / 2)
    
    return {
      leftColumn: assignments.slice(0, leftColumnSize),
      rightColumn: assignments.slice(leftColumnSize)
    }
  }

  const { leftColumn, rightColumn } = getColumnsForPrint()

  // Calcular estatísticas da rota
  const totalClients = assignments.length
  const aspirarCount = assignments.filter(assignment => assignment.service_type === 'ASPIRAR').length
  const esfregarCount = assignments.filter(assignment => assignment.service_type === 'ESFREGAR').length

  // Aplicar estilos de impressão via variáveis CSS
  const printStyles = {
    '--print-color': printColor,
    '--print-font-family': printFont,
    '--print-font-size': printFontSize,
    '--print-columns': printColumns === '2' ? '1fr 1fr' : '1fr'
  } as React.CSSProperties

  // Função para truncar nomes longos
  const truncateName = (name: string, maxLength: number = 21) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Função para renderizar uma tabela no estilo Google Sheets/Excel
  const renderExcelStyleTable = (assignments: RouteAssignment[], columnTitle: string) => (
    <div className="excel-table-container">
      <h3 className="table-title">{columnTitle}</h3>
      <table className="excel-style-table">
        <thead>
          <tr className="table-header">
            <th className="header-cell checkbox-header">✓</th>
            <th className="header-cell position-header">Pos.</th>
            <th className="header-cell client-header">Cliente</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment, index) => {
            const isAspirar = assignment.service_type === 'ASPIRAR';
            return (
              <tr 
                key={assignment.client_id} 
                className={`table-row ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}
              >
                <td className="data-cell checkbox-cell">
                  <div className="checkbox"></div>
                </td>
                <td className={`data-cell position-cell ${isAspirar ? 'service-aspirar-row' : ''}`}>
                  {formatRouteNumber(assignment.order_index)}
                </td>
                <td className={`data-cell client-cell ${isAspirar ? 'service-aspirar-row' : ''}`}>
                  <div className="client-info">
                    <span className="client-name">{truncateName(assignment.full_name)}</span>
                    {assignment.neighborhood && (
                      <span className="client-neighborhood"> - {assignment.neighborhood}</span>
                    )}
                    {assignment.has_key && (
                      <span className="client-key">
                        <KeyIcon className="w-4 h-4" />
                      </span>
                    )}
                    {assignment.service_type && (
                      <span className="client-service">
                        <span className="service-icon">
                          {assignment.service_type === 'ASPIRAR' ? 
                            <MaterialSymbolsVacuum className="w-4 h-4" /> : 
                            <FluentEmojiHighContrastSponge className="w-4 h-4" />
                          }
                        </span>
                        <span className={`service-initial ${assignment.service_type === 'ASPIRAR' ? 'service-aspirar' : 'service-esfregar'}`}>
                          {assignment.service_type === 'ASPIRAR' ? 'A' : 'E'}
                        </span>
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div 
      className="print-route-list excel-print-layout"
      style={printStyles}
    >
      {/* Logo da empresa centralizado */}
      <div className="print-logo-container mb-4 text-center">
        <Image 
          src="/logo-routes-print.png" 
          alt="Micena Piscinas" 
          className="print-logo mx-auto"
          width={200}
          height={80}
        />
      </div>

      {/* Título da rota para impressão centralizado */}
      <div className="print-header mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Rota de {DAY_LABELS[dayOfWeek as keyof typeof DAY_LABELS]} - Equipe {currentTeam}</h1>
        <p className="text-sm opacity-75">{printTimestamp || '...'}</p>
      </div>

      {/* Layout de colunas para impressão */}
      <div className="print-columns-layout">
        {printColumns === '1' ? (
          // Coluna única
          renderExcelStyleTable(assignments, 'Lista Completa')
        ) : (
          // Duas colunas
          <>
            {leftColumn.length > 0 && renderExcelStyleTable(leftColumn, '')}
            {rightColumn.length > 0 && renderExcelStyleTable(rightColumn, '')}
          </>
        )}
      </div>

      {/* Legenda dos ícones */}
      <div className="icons-legend">
        <h4 className="legend-title">Legenda dos Ícones:</h4>
        <div className="legend-items">
          <div className="legend-item">
            <KeyIcon className="w-4 h-4" />
            <span>Equipe possui chave</span>
          </div>
          <div className="legend-item">
            <MaterialSymbolsVacuum className="w-4 h-4 text-red-600" />
            <span className="text-red-600">Serviço: Aspirar ({aspirarCount})</span>
          </div>
          <div className="legend-item">
            <FluentEmojiHighContrastSponge className="w-4 h-4" />
            <span>Serviço: Esfregar ({esfregarCount})</span>
          </div>
        </div>
        <div 
          className="legend-stats legend-item mt-3 pt-3 border-t border-gray-300 flex justify-center items-center"
          style={{ width: '100%' }}
        >
          <span className="text-center w-full block">
            Total de clientes na rota: {totalClients}
          </span>
        </div>
      </div>
    </div>
  )
}
