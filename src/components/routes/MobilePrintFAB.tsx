'use client'

import { Printer } from 'lucide-react'

interface MobilePrintFABProps {
  selectedCount: number
  onPrint: () => void
  isVisible: boolean
}

export function MobilePrintFAB({ selectedCount, onPrint, isVisible }: MobilePrintFABProps) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] md:hidden">
      <button
        onClick={onPrint}
        disabled={selectedCount === 0}
        className={`
          h-14 w-14 rounded-full shadow-lg text-white font-medium
          flex flex-col items-center justify-center space-y-1
          transition-all duration-200 ease-in-out
          ${selectedCount === 0 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer'
          }
        `}
      >
        <Printer size={20} />
        {selectedCount > 0 && (
          <span className="text-xs font-bold">
            {selectedCount}
          </span>
        )}
      </button>
    </div>
  )
}
