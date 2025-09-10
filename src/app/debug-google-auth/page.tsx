'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Key, Database, Globe } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: any
}

export default function DebugGoogleAuthPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const addDiagnostic = (test: string, status: 'success' | 'error' | 'warning' | 'info', message: string, details?: any) => {
    setDiagnostics(prev => [...prev, { test, status, message, details }])
  }

  const clearDiagnostics = () => {
    setDiagnostics([])
  }

  const runDiagnostics = async () => {
    setIsLoading(true)
    clearDiagnostics()

    try {
      // 1. Verificar se o usuário está autenticado
      addDiagnostic(
        'Autenticação do Usuário',
        'info',
        'Verificando se o usuário está autenticado...'
      )

      const userResponse = await fetch('/api/debug/user')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.user)
        addDiagnostic(
          'Autenticação do Usuário',
          'success',
          `Usuário autenticado: ${userData.user?.email || 'N/A'}`,
          userData.user
        )
      } else {
        addDiagnostic(
          'Autenticação do Usuário',
          'error',
          'Usuário não autenticado',
          await userResponse.text()
        )
        return
      }

      // 2. Verificar variáveis de ambiente do servidor
      addDiagnostic(
        'Variáveis de Ambiente',
        'info',
        'Verificando configuração das variáveis de ambiente...'
      )

      const envResponse = await fetch('/api/debug/env')
      if (envResponse.ok) {
        const envData = await envResponse.json()
        addDiagnostic(
          'Variáveis de Ambiente',
          'success',
          'Variáveis de ambiente configuradas',
          envData
        )
      } else {
        addDiagnostic(
          'Variáveis de Ambiente',
          'error',
          'Erro ao verificar variáveis de ambiente',
          await envResponse.text()
        )
      }

      // 3. Testar geração de URL de autenticação
      addDiagnostic(
        'Geração de URL de Autenticação',
        'info',
        'Testando geração da URL de autenticação Google...'
      )

      const authUrlResponse = await fetch('/api/debug/google-auth-url')
      if (authUrlResponse.ok) {
        const authUrlData = await authUrlResponse.json()
        addDiagnostic(
          'Geração de URL de Autenticação',
          'success',
          'URL de autenticação gerada com sucesso',
          { url: authUrlData.url }
        )
      } else {
        addDiagnostic(
          'Geração de URL de Autenticação',
          'error',
          'Erro ao gerar URL de autenticação',
          await authUrlResponse.text()
        )
      }

      // 4. Verificar status atual do Google Calendar
      addDiagnostic(
        'Status Google Calendar',
        'info',
        'Verificando status atual da conexão Google Calendar...'
      )

      const statusResponse = await fetch('/api/google/status')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        addDiagnostic(
          'Status Google Calendar',
          statusData.data.connected ? 'success' : 'warning',
          statusData.data.connected ? 'Google Calendar conectado' : 'Google Calendar não conectado',
          statusData.data
        )
      } else {
        addDiagnostic(
          'Status Google Calendar',
          'error',
          'Erro ao verificar status do Google Calendar',
          await statusResponse.text()
        )
      }

      // 5. Testar conexão com Google OAuth
      addDiagnostic(
        'Teste de Conexão Google OAuth',
        'info',
        'Testando conexão direta com Google OAuth...'
      )

      const oauthTestResponse = await fetch('/api/debug/google-oauth-test')
      if (oauthTestResponse.ok) {
        const oauthData = await oauthTestResponse.json()
        addDiagnostic(
          'Teste de Conexão Google OAuth',
          'success',
          'Conexão com Google OAuth funcionando',
          oauthData
        )
      } else {
        addDiagnostic(
          'Teste de Conexão Google OAuth',
          'error',
          'Erro na conexão com Google OAuth',
          await oauthTestResponse.text()
        )
      }

      // 6. Testar callback do Google
      addDiagnostic(
        'Teste de Callback Google',
        'info',
        'Testando simulação do callback do Google...'
      )

      const callbackTestResponse = await fetch('/api/debug/google-callback-test')
      if (callbackTestResponse.ok) {
        const callbackData = await callbackTestResponse.json()
        addDiagnostic(
          'Teste de Callback Google',
          callbackData.results.tokenRequestOk ? 'success' : 'warning',
          callbackData.results.tokenRequestOk ? 'Callback funcionando corretamente' : 'Callback com problemas (esperado com código de teste)',
          callbackData
        )
      } else {
        addDiagnostic(
          'Teste de Callback Google',
          'error',
          'Erro no teste de callback',
          await callbackTestResponse.text()
        )
      }

    } catch (error) {
      addDiagnostic(
        'Erro Geral',
        'error',
        'Erro inesperado durante diagnóstico',
        error
      )
    } finally {
      setIsLoading(false)
    }
  }

  const testGoogleAuth = () => {
    window.open('/api/auth/google/login', '_blank')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info':
        return <RefreshCw className="w-4 h-4 text-blue-500" />
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Diagnóstico Google Calendar</h1>
          <p className="text-gray-600 mt-1">
            Página para diagnosticar problemas com a autenticação Google Calendar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Testes de Diagnóstico
              </CardTitle>
              <CardDescription>
                Execute os testes para identificar problemas na integração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runDiagnostics} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Executando Diagnóstico...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Executar Diagnóstico
                  </>
                )}
              </Button>

              <Button 
                onClick={testGoogleAuth} 
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Testar Autenticação Google
              </Button>

              {user && (
                <Alert>
                  <Database className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Usuário:</strong> {user.email}<br />
                    <strong>ID:</strong> {user.id}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Resultados do Diagnóstico
              </CardTitle>
              <CardDescription>
                {diagnostics.length === 0 ? 'Execute os testes para ver os resultados' : `${diagnostics.length} testes executados`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diagnostics.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Nenhum teste executado ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {diagnostics.map((diagnostic, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getStatusColor(diagnostic.status)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(diagnostic.status)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{diagnostic.test}</div>
                          <div className="text-sm text-gray-600 mt-1">{diagnostic.message}</div>
                          {diagnostic.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer">
                                Ver detalhes
                              </summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(diagnostic.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
