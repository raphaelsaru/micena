import { useState, useMemo } from 'react'
import { RouteAssignment, DayOfWeek, DAY_LABELS } from '@/types/database'
import { DraggableRouteList } from './DraggableRouteList'
import { DraggableTwoColumnLayout } from './DraggableTwoColumnLayout'
import { PrintToolbar } from './PrintToolbar'
import { PrintRouteList } from './PrintRouteList'
import { FileText, Users, ArrowUp, ArrowDown, Save, Columns, List } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface RouteTabProps {
  dayOfWeek: DayOfWeek
  assignments: RouteAssignment[]
  isLoading: boolean
  onRemoveClient: (clientId: string) => Promise<void>
  onReorderClients: (newOrder: RouteAssignment[]) => void
  onSavePositions?: () => Promise<void>
  currentSortOrder: 'asc' | 'desc'
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void
}

export function RouteTab({ 
  dayOfWeek, 
  assignments, 
  isLoading, 
  onRemoveClient, 
  onReorderClients,
  onSavePositions,
  currentSortOrder,
  onSortOrderChange
}: RouteTabProps) {
  const [isOperationInProgress, setIsOperationInProgress] = useState(false)
  const [isTwoColumnLayout, setIsTwoColumnLayout] = useState(false)
  
  // Estado para configurações de impressão
  const [printColor, setPrintColor] = useState('#000000')
  const [printColumns, setPrintColumns] = useState<'1' | '2'>('1')
  const [printFont, setPrintFont] = useState('system-ui')
  const [printFontSize, setPrintFontSize] = useState('12pt')

  // Aplicar ordenação
  const sortedAssignments = useMemo(() => {
    if (currentSortOrder === 'asc') {
      return [...assignments].sort((a, b) => a.order_index - b.order_index)
    } else {
      return [...assignments].sort((a, b) => b.order_index - a.order_index)
    }
  }, [assignments, currentSortOrder])

  // Dividir assignments para layout de 2 colunas
  const { leftColumn, rightColumn } = useMemo(() => {
    if (!isTwoColumnLayout || sortedAssignments.length === 0) {
      return { leftColumn: [], rightColumn: [] }
    }

    const totalClients = sortedAssignments.length
    const leftColumnSize = Math.ceil(totalClients / 2)
    
    return {
      leftColumn: sortedAssignments.slice(0, leftColumnSize),
      rightColumn: sortedAssignments.slice(leftColumnSize)
    }
  }, [isTwoColumnLayout, sortedAssignments])

  const handleRemoveClient = async (clientId: string) => {
    try {
      setIsOperationInProgress(true)
      await onRemoveClient(clientId)
    } catch (err) {
      console.error('Erro ao remover cliente:', err)
    } finally {
      setIsOperationInProgress(false)
    }
  }



  const toggleLayout = () => {
    setIsTwoColumnLayout(!isTwoColumnLayout)
  }



  // Função para imprimir
  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando rotas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar de impressão */}
      <PrintToolbar
        onPrint={handlePrint}
        printColor={printColor}
        onPrintColorChange={setPrintColor}
        printColumns={printColumns}
        onPrintColumnsChange={setPrintColumns}
        printFont={printFont}
        onPrintFontChange={setPrintFont}
        printFontSize={printFontSize}
        onPrintFontSizeChange={setPrintFontSize}
      />

      {/* Componente de impressão (oculto na tela, visível na impressão) */}
      <div className="hidden print:block">
        <PrintRouteList
          dayOfWeek={dayOfWeek}
          assignments={sortedAssignments}
          printColor={printColor}
          printColumns={printColumns}
          printFont={printFont}
          printFontSize={printFontSize}
        />
      </div>

      {/* Header com informações e controles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                {DAY_LABELS[dayOfWeek]}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {assignments.length} cliente(s)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Toggle de layout */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="layout-toggle" className="text-sm font-medium text-gray-700">
                Layout:
              </Label>
              <Button
                id="layout-toggle"
                variant={isTwoColumnLayout ? "default" : "outline"}
                size="sm"
                onClick={toggleLayout}
                className="flex items-center space-x-2"
                title={isTwoColumnLayout ? "Alternar para 1 coluna" : "Alternar para 2 colunas"}
              >
                {isTwoColumnLayout ? (
                  <>
                    <Columns className="w-4 h-4" />
                    <span>2 Colunas</span>
                  </>
                ) : (
                  <>
                    <List className="w-4 h-4" />
                    <span>1 Coluna</span>
                  </>
                )}
              </Button>
            </div>

            {/* Controle de ordenação */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                Ordenar por:
              </Label>
              <Select value={currentSortOrder} onValueChange={(value: 'asc' | 'desc') => onSortOrderChange(value)}>
                <SelectTrigger id="sort-select" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center space-x-2">
                      <ArrowUp className="w-4 h-4" />
                      <span>Crescente</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center space-x-2">
                      <ArrowDown className="w-4 h-4" />
                      <span>Decrescente</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botão Salvar Posições */}
            {onSavePositions && (
              <Button
                onClick={onSavePositions}
                disabled={isOperationInProgress}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Posições
              </Button>
            )}
          </div>
        </div>

        {/* Informação sobre como usar */}
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg inline-block">
          <div className="text-xs text-blue-700">
            <span className="font-medium">💡 Como funciona:</span> 
            Arraste e solte os clientes para reordená-los, ou use as setas ↑↓ para mover clientes. 
            As setas se adaptam à ordenação atual: 
            {currentSortOrder === 'asc' ? ' Crescente (1→2→3)' : ' Decrescente (3→2→1)'}. 
            As mudanças são apenas visuais até você clicar em &quot;Salvar posições&quot;.
            {isTwoColumnLayout && ' No layout de 2 colunas, a fila funciona como uma única sequência contínua.'}
          </div>
        </div>
      </div>

      {/* Lista de clientes com drag & drop */}
      <div className="print:hidden">
        {isTwoColumnLayout ? (
          // Layout de 2 colunas com drag & drop entre colunas
          <DraggableTwoColumnLayout
            leftColumn={leftColumn}
            rightColumn={rightColumn}
            onRemoveClient={handleRemoveClient}
            onReorderClients={onReorderClients}
            currentSortOrder={currentSortOrder}
          />
        ) : (
          // Layout de 1 coluna (padrão)
          <DraggableRouteList
            assignments={sortedAssignments}
            onRemoveClient={handleRemoveClient}
            onReorderClients={onReorderClients}
            currentSortOrder={currentSortOrder}
          />
        )}
      </div>

      {/* Estado vazio */}
      {assignments.length === 0 && (
        <div className="text-center py-12 print:hidden">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum cliente na rota
          </h3>
          <p className="text-gray-600">
            Adicione clientes para começar a organizar a rota de {DAY_LABELS[dayOfWeek].toLowerCase()}
          </p>
        </div>
      )}
    </div>
  )
}
