'use client'

import { useState } from 'react'
import { Check, ChevronDown, Calendar, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'

export function CalendarSelector() {
  const { 
    calendars, 
    selectedCalendarId, 
    selectCalendar, 
    isLoading,
    loadCalendars 
  } = useGoogleCalendar()

  const [open, setOpen] = useState(false)

  const selectedCalendar = calendars.find(cal => cal.id === selectedCalendarId)

  const handleSelectCalendar = (calendarId: string) => {
    selectCalendar(calendarId)
    setOpen(false)
  }

  if (calendars.length === 0 && !isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            Seleção de Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Nenhuma agenda encontrada. Verifique as permissões.</span>
          </div>
          <Button 
            onClick={loadCalendars} 
            size="sm" 
            variant="outline" 
            className="mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Recarregar Agendas'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          Agenda para Sincronização
        </CardTitle>
        <CardDescription className="text-xs">
          Escolha qual agenda do Google Calendar usar para criar os eventos dos serviços
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-left font-normal"
              disabled={isLoading || calendars.length === 0}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: selectedCalendar?.backgroundColor || '#4285f4' 
                  }}
                />
                <span className="truncate">
                  {isLoading 
                    ? 'Carregando agendas...' 
                    : selectedCalendar?.summary || 'Selecione uma agenda'
                  }
                </span>
                {selectedCalendar?.primary && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">
                    Principal
                  </span>
                )}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="max-h-60 overflow-y-auto">
              {calendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                    calendar.id === selectedCalendarId ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectCalendar(calendar.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ 
                      backgroundColor: calendar.backgroundColor || '#4285f4' 
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {calendar.summary}
                      </span>
                      {calendar.primary && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">
                          Principal
                        </span>
                      )}
                    </div>
                    {calendar.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {calendar.description}
                      </p>
                    )}
                  </div>
                  {calendar.id === selectedCalendarId && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {selectedCalendar && (
          <div className="mt-3 p-2 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-600">
              <div><strong>Agenda:</strong> {selectedCalendar.summary}</div>
              <div><strong>Permissão:</strong> {
                selectedCalendar.accessRole === 'owner' ? 'Proprietário' : 'Editor'
              }</div>
              {selectedCalendar.description && (
                <div><strong>Descrição:</strong> {selectedCalendar.description}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
