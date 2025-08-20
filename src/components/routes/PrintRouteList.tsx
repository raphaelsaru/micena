import { RouteAssignment } from '@/types/database'
import { DAY_LABELS } from '@/types/database'
import { useState, useEffect } from 'react'
import { formatRouteNumber } from '@/lib/utils'

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

  // Aplicar estilos de impressão via variáveis CSS
  const printStyles = {
    '--print-color': printColor,
    '--print-font-family': printFont,
    '--print-font-size': printFontSize,
    '--print-columns': printColumns === '2' ? '1fr 1fr' : '1fr'
  } as React.CSSProperties

  return (
    <div 
      className="print-route-list"
      style={printStyles}
    >
      {/* Título da rota para impressão */}
      <div className="print-header mb-6">
        <h1 className="text-2xl font-bold mb-2">Rota de {DAY_LABELS[dayOfWeek as keyof typeof DAY_LABELS]} - Equipe {currentTeam}</h1>
      </div>

      {/* Lista de clientes para impressão em formato de planilha */}
      {printColumns === '2' ? (
        // Layout de 2 colunas para impressão
        <div className="print-grid">
          {/* Coluna esquerda */}
          <div className="print-column">

            {leftColumn.map((assignment) => (
              <div key={assignment.client_id} className="print-table-row">
                <div className="print-checkbox"></div>
                <div className="print-position">#{formatRouteNumber(assignment.order_index)}</div>
                <div className="print-name">{assignment.full_name}</div>
              </div>
            ))}
          </div>

          {/* Coluna direita */}
          <div className="print-column">

            {rightColumn.map((assignment) => (
              <div key={assignment.client_id} className="print-table-row">
                <div className="print-checkbox"></div>
                <div className="print-position">#{formatRouteNumber(assignment.order_index)}</div>
                <div className="print-name">{assignment.full_name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Layout de 1 coluna para impressão
        <div className="print-single-column">
          {assignments.map((assignment) => (
            <div key={assignment.client_id} className="print-table-row">
              <div className="print-checkbox"></div>
              <div className="print-position">#{formatRouteNumber(assignment.order_index)}</div>
              <div className="print-name">{assignment.full_name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rodapé da impressão */}
      <div className="print-footer mt-6 pt-4 border-t">
        <p className="text-xs opacity-75 text-center">
          Impresso em {printTimestamp || '...'}
        </p>
      </div>
    </div>
  )
}
