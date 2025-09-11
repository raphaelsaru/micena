'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Clock
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { CalendarSelector } from '@/components/services/CalendarSelector'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastContainer, useToast } from '@/components/ui/toast'

export default function ConfiguracoesPage() {
  const { user, signOut } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [mounted, setMounted] = useState(false)
  
  const {
    isAuthenticated,
    isLoading,
    needsReconnect,
    isInitialized,
    startAuth, 
    disconnect,
    calendars,
    refreshStatus
  } = useGoogleCalendar()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Carregando...</div>
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      showError('Erro ao sair', 'Ocorreu um erro ao fazer logout')
    }
  }

  return (
    <ProtectedRoute>
      <div className="container-mobile mobile-py">
        <div className="mobile-header mb-6">
          <div>
            <h1 className="mobile-header-title">Configurações</h1>
            <p className="text-gray-600 mt-1 mobile-text-base">
              Gerencie suas configurações pessoais e integrações
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Usuário
              </CardTitle>
              <CardDescription>
                Suas informações de conta e perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <p className="text-sm text-gray-500">Usuário do Sistema</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 my-4"></div>
              
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair da Conta
              </Button>
            </CardContent>
          </Card>

          {/* Configurações do Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Google Calendar
              </CardTitle>
              <CardDescription>
                Configure a sincronização com sua agenda do Google
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isInitialized ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                    <span>Inicializando Google Calendar...</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Verificando status da conexão e carregando configurações
                  </div>
                </div>
              ) : !isAuthenticated ? (
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
                <div className="space-y-4">
                  {needsReconnect ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-600">Precisa reconectar ao Google Calendar</span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Reconexão necessária
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Conectado ao Google Calendar</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Sincronizado
                      </Badge>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Status:</span> {needsReconnect ? 'Reconexão necessária' : 'Ativo'}
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Agendas:</span> {calendars.length}
                    </div>
                  </div>

                  {/* Seletor de Calendários */}
                  <CalendarSelector />
                  
                  <div className="flex gap-2">
                    {needsReconnect ? (
                      <Button 
                        onClick={startAuth} 
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reconectar
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={refreshStatus}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                      </Button>
                    )}
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
                  
                  {/* Configurações de Sincronização */}
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configurações de Sincronização
                    </h4>
                    <div className="space-y-2 text-xs text-blue-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Eventos são criados automaticamente ao definir data do próximo serviço</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Lembretes configurados: 1 dia antes (email) e 1 hora antes (popup)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Duração padrão: Dia inteiro (sem horário específico)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Formato: Eventos de dia inteiro para evitar problemas de timezone</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Container de Toasts */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ProtectedRoute>
  )
}
