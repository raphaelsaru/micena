'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle, XCircle, RefreshCw, Settings } from 'lucide-react'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'

export function GoogleCalendarSync() {
  const { 
    isAuthenticated, 
    isLoading, 
    startAuth, 
    disconnect 
  } = useGoogleCalendar()

  const [showSettings, setShowSettings] = useState(false)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Sincronização Google Calendar
        </CardTitle>
        <CardDescription>
          Conecte sua conta Google para sincronizar automaticamente os serviços com sua agenda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Não conectado ao Google Calendar</span>
            </div>
            <Button 
              onClick={startAuth} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Conectar Google Calendar
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Ao conectar, você autoriza o sistema a criar, editar e remover eventos em seu calendário
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Conectado ao Google Calendar</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Sincronizado
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Status:</span> Ativo
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Sincronização:</span> Automática
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={disconnect}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            </div>
            
            {showSettings && (
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-medium text-sm text-blue-800 mb-2">Configurações de Sincronização</h4>
                <div className="space-y-2 text-xs text-blue-700">
                  <div>• Eventos são criados automaticamente ao definir data do próximo serviço</div>
                  <div>• Lembretes configurados: 1 dia antes (email) e 1 hora antes (popup)</div>
                  <div>• Duração padrão: 1 hora por serviço</div>
                  <div>• Fuso horário: America/Sao_Paulo</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


