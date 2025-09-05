import { useState, useMemo, useCallback } from 'react'
import { RouteAssignment, DayOfWeek, DAY_LABELS } from '@/types/database'
import { DraggableRouteList } from './DraggableRouteList'
import { DraggableTwoColumnLayout } from './DraggableTwoColumnLayout'
import { PrintRouteList } from './PrintRouteList'
import { PrintSelectedRouteList } from './PrintSelectedRouteList'
import { MobilePrintFAB } from './MobilePrintFAB'
import { useMobileSelection } from '@/hooks/useMobileSelection'
import { FileText, Users, ArrowUp, ArrowDown, Save, Columns, List, CheckSquare, Square } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface RouteTabProps {
  dayOfWeek: DayOfWeek
  currentTeam: number
  assignments: RouteAssignment[]
  isLoading: boolean
  onRemoveClient: (clientId: string) => Promise<void>
  onEditClient: (clientId: string) => void
  onReorderClients: (newOrder: RouteAssignment[]) => void
  onSavePositions?: () => Promise<void>
  currentSortOrder: 'asc' | 'desc'
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void
}

export function RouteTab({ 
  dayOfWeek, 
  currentTeam,
  assignments, 
  isLoading, 
  onRemoveClient, 
  onEditClient,
  onReorderClients,
  onSavePositions,
  currentSortOrder,
  onSortOrderChange
}: RouteTabProps) {
  
  // Debug temporário
  console.log('🔍 DEBUG RouteTab - assignments recebidos:', assignments.map(a => ({ 
    id: a.client_id, 
    name: a.full_name, 
    neighborhood: a.neighborhood 
  })))
  const [isOperationInProgress, setIsOperationInProgress] = useState(false)
  const [isTwoColumnLayout, setIsTwoColumnLayout] = useState(true) // Layout de 2 colunas como padrão

  // Callbacks para limpeza de seleção
  const handleTeamChange = useCallback(() => {
    console.log('Team changed - clearing selection')
  }, [])

  const handleDayChange = useCallback(() => {
    console.log('Day changed - clearing selection')
  }, [])

  // Hook para seleção mobile
  const {
    isSelectionMode,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    toggleSelectionMode,
    toggleClientSelection,
    selectAllClients,
    deselectAllClients,
    getSelectedAssignments,
    isClientSelected
  } = useMobileSelection({ 
    assignments,
    onTeamChange: handleTeamChange,
    onDayChange: handleDayChange
  })

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

  // Função para imprimir selecionados
  const handlePrintSelected = async () => {
    // Detectar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      try {
        // Para mobile, gerar PDF no servidor
        console.log('📱 Gerando PDF no servidor para mobile...')
        
        // Obter o HTML do componente de impressão
        const printContainer = document.querySelector('.hidden.print\\:block') as HTMLElement
        
        if (!printContainer) {
          console.error('Componente de impressão não encontrado')
          return
        }

        // Clonar e exibir temporariamente para capturar HTML
        const clone = printContainer.cloneNode(true) as HTMLElement
        clone.className = 'block'
        clone.style.position = 'absolute'
        clone.style.left = '-9999px'
        clone.style.top = '0'
        clone.style.visibility = 'hidden'
        document.body.appendChild(clone)

        // Aguardar renderização completa
        await new Promise(resolve => setTimeout(resolve, 100))

        // Processar HTML para garantir cores corretas
        const processedClone = clone.cloneNode(true) as HTMLElement
        
        // REGRA 1: Aplicar color:#dc2626 diretamente nos elementos de Aspirar
        const aspirarElements = processedClone.querySelectorAll(`
          .service-aspirar,
          .service-aspirar-row,
          .service-aspirar-row .service-aspirar,
          .service-aspirar-row .client-key,
          .service-aspirar-row .client-key svg,
          .service-aspirar-row .client-neighborhood,
          .service-aspirar-row .service-icon svg,
          [class*="MaterialSymbolsVacuum"]
        `)
        
        aspirarElements.forEach(el => {
          const element = el as HTMLElement
          
          // Para SVG, aplicar stroke e fill
          if (element.tagName === 'svg' || element.querySelector('svg')) {
            const svg = element.tagName === 'svg' ? element : element.querySelector('svg')
            if (svg) {
              svg.setAttribute('style', `${svg.getAttribute('style') || ''} stroke: #dc2626 !important; fill: #dc2626 !important; color: #dc2626 !important;`)
            }
          }
          
          // Para elementos de texto, aplicar color
          element.setAttribute('style', `${element.getAttribute('style') || ''} color: #dc2626 !important;`)
        })

        // REGRA 1: Aplicar cores específicas nos SVGs de aspirar (vermelho)
        const vacuumSvgs = processedClone.querySelectorAll('svg[class*="MaterialSymbolsVacuum"]')
        vacuumSvgs.forEach(svg => {
          svg.setAttribute('style', `${svg.getAttribute('style') || ''} stroke: #dc2626 !important; fill: #dc2626 !important; color: #dc2626 !important;`)
        })

        // REGRA 1: Aplicar cores específicas nos SVGs de esfregar (preto)
        const spongeSvgs = processedClone.querySelectorAll('svg[class*="FluentEmojiHighContrastSponge"]')
        spongeSvgs.forEach(svg => {
          svg.setAttribute('style', `${svg.getAttribute('style') || ''} stroke: #000000 !important; fill: #000000 !important; color: #000000 !important;`)
        })

        // REGRA 1: Aplicar cores específicas nos SVGs de chave (preto)
        const keySvgs = processedClone.querySelectorAll('svg[class*="KeyIcon"]')
        keySvgs.forEach(svg => {
          svg.setAttribute('style', `${svg.getAttribute('style') || ''} stroke: #000000 !important; fill: #000000 !important; color: #000000 !important;`)
        })

        // REGRA 3: Substituir SVGs por versões inline para garantir renderização
        const allSvgs = processedClone.querySelectorAll('svg')
        allSvgs.forEach(svg => {
          const parent = svg.parentElement
          if (parent) {
            // Converter className para string para evitar erro com DOMTokenList
            const className = svg.className?.toString() || ''
            let replacementClass = ''
            
            if (className.includes('MaterialSymbolsVacuum') || className.includes('vacuum')) {
              replacementClass = 'icon-vacuum-inline'
            } else if (className.includes('FluentEmojiHighContrastSponge') || className.includes('sponge')) {
              replacementClass = 'icon-sponge-inline'
            } else if (className.includes('KeyIcon') || className.includes('key')) {
              replacementClass = 'icon-key-inline'
            }
            
            if (replacementClass) {
              const span = document.createElement('span')
              span.className = replacementClass
              span.setAttribute('style', 'display: inline-block; width: 14px; height: 14px; vertical-align: middle;')
              parent.replaceChild(span, svg)
            }
          }
        })

        // Capturar HTML do componente processado
        const html = processedClone.innerHTML

        // Remover clone temporário
        document.body.removeChild(clone)

        // Enviar para API de geração de PDF
        const response = await fetch('/api/routes/print-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html,
            dayOfWeek,
            currentTeam,
            selectedCount: isSelectionMode ? selectedCount : assignments.length
          }),
        })

        if (!response.ok) {
          throw new Error('Erro ao gerar PDF')
        }

        // Baixar o PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const fileName = `rota-${DAY_LABELS[dayOfWeek]}-equipe-${currentTeam}-${isSelectionMode ? selectedCount : assignments.length}-clientes.pdf`
        link.download = fileName
        
        // Adicionar ao DOM temporariamente e clicar
        document.body.appendChild(link)
        link.click()
        
        // Limpeza
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        console.log('✅ PDF gerado e baixado com sucesso!')
        
      } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error)
        
        // Mostrar erro mais detalhado
        let errorMessage = 'Erro ao gerar PDF. Tente novamente.'
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
          } else if (error.message.includes('Erro ao gerar PDF')) {
            errorMessage = 'Erro no servidor ao processar o PDF. Tente novamente em alguns instantes.'
          }
        }
        
        alert(errorMessage)
      }
    } else {
      // Para desktop, usar window.print() normal
      window.print()
    }
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
      {/* Componente de impressão (oculto na tela, visível na impressão) */}
      <div className="hidden print:block">
        {isSelectionMode && isSomeSelected && getSelectedAssignments().length > 0 ? (
          <PrintSelectedRouteList
            dayOfWeek={dayOfWeek}
            currentTeam={currentTeam}
            selectedAssignments={getSelectedAssignments()}
            printColor="#000000"
            printColumns="2"
            printFont="system-ui"
            printFontSize="10pt"
          />
        ) : (
          <PrintRouteList
            dayOfWeek={dayOfWeek}
            currentTeam={currentTeam}
            assignments={sortedAssignments}
            printColor="#000000"
            printColumns="2"
            printFont="system-ui"
            printFontSize="10pt"
          />
        )}
      </div>

      {/* Header com informações e controles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                {DAY_LABELS[dayOfWeek]} - Equipe {currentTeam}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {assignments.length} cliente(s)
              </span>
            </div>

            {/* Controles de seleção mobile */}
            <div className="md:hidden flex flex-col space-y-2">
              {!isSelectionMode ? (
                <Button
                  onClick={toggleSelectionMode}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 w-fit"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Selecionar</span>
                </Button>
              ) : (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={toggleSelectionMode}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Square className="w-4 h-4" />
                      <span>Cancelar</span>
                    </Button>
                    
                    {isSomeSelected && (
                      <span className="text-sm font-medium text-blue-600">
                        {selectedCount} selecionado(s)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllClients()
                        } else {
                          deselectAllClients()
                        }
                      }}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 checkbox-mobile"
                    />
                    <span className="text-xs text-gray-600">
                      {isAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
            {/* Controles de layout e ordenação */}
            <div className="flex flex-row items-center gap-3 xs:gap-4 lg:gap-6">
              {/* Toggle de layout */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="layout-toggle" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Layout:
                </Label>
                <Button
                  id="layout-toggle"
                  variant={isTwoColumnLayout ? "default" : "outline"}
                  size="sm"
                  onClick={toggleLayout}
                  className="flex items-center space-x-2 min-w-0"
                  title={isTwoColumnLayout ? "Alternar para 1 coluna" : "Alternar para 2 colunas"}
                >
                  {isTwoColumnLayout ? (
                    <>
                      <Columns className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">2 Colunas (Padrão)</span>
                      <span className="sm:hidden">2 Col</span>
                    </>
                  ) : (
                    <>
                      <List className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">1 Coluna</span>
                      <span className="sm:hidden">1 Col</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Controle de ordenação */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Ordenar por:
                </Label>
                <Select value={currentSortOrder} onValueChange={(value: 'asc' | 'desc') => onSortOrderChange(value)}>
                  <SelectTrigger id="sort-select" className="w-24 sm:w-32 min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center space-x-2">
                        <ArrowUp className="w-4 h-4 flex-shrink-0" />
                        <span>Crescente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center space-x-2">
                        <ArrowDown className="w-4 h-4 flex-shrink-0" />
                        <span>Decrescente</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botões de ação - Desktop: horizontal, Mobile: vertical */}
            <div className="flex flex-col xs:flex-row lg:flex-row lg:items-center gap-2 xs:gap-3 lg:gap-3">
              {/* Botão de Impressão - Oculto no mobile */}
              <Button
                onClick={handlePrint}
                variant="outline"
                className="hidden md:flex border-blue-600 text-blue-600 hover:bg-blue-50 w-full xs:w-auto lg:w-auto"
              >
                <FileText className="w-4 h-4 mr-2" />
                Imprimir
              </Button>

              {/* Botão Salvar Posições */}
              {onSavePositions && (
                <Button
                  onClick={onSavePositions}
                  disabled={isOperationInProgress}
                  className="bg-green-600 hover:bg-green-700 text-white w-full xs:w-auto lg:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Posições
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Informação sobre como usar  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg inline-block">
          <div className="text-xs text-blue-700">
            <span className="font-medium">💡 Como funciona:</span> 
            Arraste e solte os clientes para reordená-los, ou use as setas ↑↓ para mover clientes. 
            As setas se adaptam à ordenação atual: 
            {currentSortOrder === 'asc' ? ' Crescente (1→2→3)' : ' Decrescente (3→2→1)'}. 
            As mudanças são apenas visuais até você clicar em &quot;Salvar posições&quot;.
            {isTwoColumnLayout && ' No layout de 2 colunas, a fila funciona como uma única sequência contínua.'}
          </div>
        </div>*/}
       
      </div>

      {/* Lista de clientes com drag & drop */}
      <div className="print:hidden">
        {isTwoColumnLayout ? (
          // Layout de 2 colunas com drag & drop entre colunas
          <DraggableTwoColumnLayout
            leftColumn={leftColumn}
            rightColumn={rightColumn}
            onRemoveClient={handleRemoveClient}
            onEditClient={onEditClient}
            onReorderClients={onReorderClients}
            currentSortOrder={currentSortOrder}
            isSelectionMode={isSelectionMode}
            onToggleClientSelection={toggleClientSelection}
            isClientSelected={isClientSelected}
          />
        ) : (
          // Layout de 1 coluna (padrão)
          <DraggableRouteList
            assignments={sortedAssignments}
            onRemoveClient={handleRemoveClient}
            onEditClient={onEditClient}
            onReorderClients={onReorderClients}
            currentSortOrder={currentSortOrder}
            isSelectionMode={isSelectionMode}
            onToggleClientSelection={toggleClientSelection}
            isClientSelected={isClientSelected}
          />
        )}
      </div>

      {/* FAB para impressão mobile */}
      <MobilePrintFAB
        selectedCount={selectedCount}
        onPrint={handlePrintSelected}
        isVisible={isSelectionMode}
      />

      {/* Estado vazio */}
      {assignments.length === 0 && (
        <div className="text-center py-12 print:hidden">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum cliente na rota
          </h3>
          <p className="text-gray-600">
            Adicione clientes para começar a organizar a rota de {DAY_LABELS[dayOfWeek].toLowerCase()} da Equipe {currentTeam}
          </p>
        </div>
      )}
    </div>
  )
}
