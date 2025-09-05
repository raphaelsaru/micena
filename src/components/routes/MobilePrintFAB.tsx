'use client'

import { Printer, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface MobilePrintFABProps {
  selectedCount: number
  onPrint: () => Promise<void>
  isVisible: boolean
}

export function MobilePrintFAB({ selectedCount, onPrint, isVisible }: MobilePrintFABProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  
  if (!isVisible) return null

  const handlePrint = async () => {
    if (isGenerating) return
    
    try {
      setIsGenerating(true)
      await onPrint()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] md:hidden">
      <div className="relative">
        <button
          onClick={handlePrint}
          disabled={selectedCount === 0 || isGenerating}
          className={`
            h-16 w-16 rounded-full shadow-lg text-white font-medium
            flex flex-col items-center justify-center space-y-1
            transition-all duration-200 ease-in-out
            ${selectedCount === 0 || isGenerating
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer'
            }
          `}
          title={
            isGenerating 
              ? 'Gerando PDF...' 
              : selectedCount > 0 
                ? `Gerar PDF com ${selectedCount} cliente(s) selecionado(s)` 
                : 'Selecione clientes para imprimir'
          }
        >
          {isGenerating ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Printer size={20} />
          )}
          {!isGenerating && selectedCount > 0 && (
            <span className="text-xs font-bold">
              {selectedCount}
            </span>
          )}
        </button>
        
        {/* Tooltip informativo */}
        {selectedCount > 0 && !isGenerating && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
            Gerar PDF
            <div className="absolute top-full right-4 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        )}
        
        {/* Tooltip de carregamento */}
        {isGenerating && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-blue-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
            Gerando PDF...
            <div className="absolute top-full right-4 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-blue-900"></div>
          </div>
        )}
      </div>
    </div>
  )
}
