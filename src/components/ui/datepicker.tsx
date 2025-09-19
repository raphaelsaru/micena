'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatepickerProps {
  selectedYear: number
  selectedMonth: number | null
  onYearChange: (year: number) => void
  onMonthChange: (month: number | null) => void
  availableYears: number[]
  className?: string
}

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' }
]

export function Datepicker({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  availableYears,
  className
}: DatepickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePreviousYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear)
    if (currentIndex < availableYears.length - 1) {
      onYearChange(availableYears[currentIndex + 1])
    }
  }

  const handleNextYear = () => {
    const currentIndex = availableYears.indexOf(selectedYear)
    if (currentIndex > 0) {
      onYearChange(availableYears[currentIndex - 1])
    }
  }

  const handleMonthSelect = (month: number) => {
    onMonthChange(month)
    setIsOpen(false)
  }

  const handleAllMonthsSelect = () => {
    onMonthChange(null)
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (selectedMonth) {
      const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || ''
      return `${monthLabel} / ${selectedYear}`
    }
    return `Todos / ${selectedYear}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 px-3 text-sm bg-gray-50 border-gray-200 hover:bg-gray-100",
            className
          )}
        >
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4">
          {/* Header com navegação de ano */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousYear}
              disabled={availableYears.indexOf(selectedYear) >= availableYears.length - 1}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700">
              {selectedYear}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextYear}
              disabled={availableYears.indexOf(selectedYear) <= 0}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-4 gap-1">
            {/* Botão "Todos" */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAllMonthsSelect}
              className={cn(
                "h-8 text-xs font-normal",
                !selectedMonth 
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Todos
            </Button>
            
            {/* Meses */}
            {MONTHS.map((month) => (
              <Button
                key={month.value}
                variant="ghost"
                size="sm"
                onClick={() => handleMonthSelect(month.value)}
                className={cn(
                  "h-8 text-xs font-normal",
                  selectedMonth === month.value
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {month.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
