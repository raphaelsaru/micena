'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Globe, Cookie } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { supabase } from '@/lib/supabase'

export default function DebugFrontendAuthPage() {
  const [frontendAuth, setFrontendAuth] = useState<any>(null)
  const [backendAuth, setBackendAuth] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkFrontendAuth = async () => {
    try {
      // Verificar autenticação no frontend
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      setFrontendAuth({
        user: user ? {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        } : null,
        session: session ? {
          access_token: session.access_token ? 'Presente' : 'Ausente',
          refresh_token: session.refresh_token ? 'Presente' : 'Ausente',
          expires_at: session.expires_at
        } : null,
        errors: {
          user: userError,
          session: sessionError
        }
      })

      // Verificar cookies no navegador
      const cookies = document.cookie.split(';').map(c => c.trim())
      const supabaseCookies = cookies.filter(c => 
        c.includes('sb-') || 
        c.includes('supabase') ||
        c.includes('micena-auth')
      )

      setFrontendAuth((prev: any) => ({
        ...prev,
        cookies: {
          total: cookies.length,
          all: cookies,
          supabase: supabaseCookies,
          hasAuthCookies: supabaseCookies.length > 0
        }
      }))

    } catch (error) {
      console.error('Erro ao verificar autenticação frontend:', error)
    }
  }

  const checkBackendAuth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug/frontend-auth')
      if (response.ok) {
        const data = await response.json()
        setBackendAuth(data.analysis)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação backend:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runFullDiagnosis = async () => {
    await Promise.all([
      checkFrontendAuth(),
      checkBackendAuth()
    ])
  }

  const testLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123'
      })
      
      if (error) {
        alert(`Erro no login: ${error.message}`)
      } else {
        alert('Login realizado com sucesso!')
        await checkFrontendAuth()
      }
    } catch (error) {
      alert(`Erro: ${error}`)
    }
  }

  const testLogout = async () => {
    try {
      await supabase.auth.signOut()
      alert('Logout realizado com sucesso!')
      await checkFrontendAuth()
    } catch (error) {
      alert(`Erro: ${error}`)
    }
  }

  const migrateToCookies = async () => {
    try {
      // Ler dados do localStorage do Supabase
      const supabaseData = localStorage.getItem('micena-auth')
      if (supabaseData) {
        // Salvar como cookie
        const expires = new Date()
        expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 dias
        document.cookie = `micena-auth=${encodeURIComponent(supabaseData)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`
        
        alert('Dados migrados para cookies! Teste novamente.')
        await runFullDiagnosis()
      } else {
        alert('Nenhum dado encontrado no localStorage para migrar.')
      }
    } catch (error) {
      alert(`Erro na migração: ${error}`)
    }
  }

  useEffect(() => {
    runFullDiagnosis()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (condition: boolean) => {
    return condition ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Debug Frontend Auth</h1>
          <p className="text-gray-600 mt-1">
            Diagnóstico de autenticação no frontend vs backend
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Estado Frontend
              </CardTitle>
              <CardDescription>
                Autenticação verificada no navegador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runFullDiagnosis} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Autenticação
              </Button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(frontendAuth?.user?.id)}
                  <span className="text-sm">
                    Usuário: {frontendAuth?.user?.email || 'Não autenticado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(frontendAuth?.session?.access_token === 'Presente')}
                  <span className="text-sm">
                    Sessão: {frontendAuth?.session ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(frontendAuth?.cookies?.hasAuthCookies)}
                  <span className="text-sm">
                    Cookies: {frontendAuth?.cookies?.supabase?.length || 0} encontrados
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={testLogin} variant="outline" size="sm" className="w-full">
                  Testar Login
                </Button>
                <Button onClick={testLogout} variant="outline" size="sm" className="w-full">
                  Testar Logout
                </Button>
                <Button onClick={migrateToCookies} variant="outline" size="sm" className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                  Migrar para Cookies
                </Button>
              </div>

              {frontendAuth && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500">Ver detalhes frontend</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(frontendAuth, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Estado Backend
              </CardTitle>
              <CardDescription>
                O que o servidor recebe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={checkBackendAuth} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verificar Backend
                  </>
                )}
              </Button>

              {backendAuth && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(backendAuth.cookies.hasAuthCookies)}
                    <span className="text-sm">
                      Cookies recebidos: {backendAuth.cookies.total}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(backendAuth.cookies.supabase.length > 0)}
                    <span className="text-sm">
                      Cookies Supabase: {backendAuth.cookies.supabase.length}
                    </span>
                  </div>
                </div>
              )}

              {backendAuth && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500">Ver detalhes backend</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(backendAuth, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>

        {frontendAuth && backendAuth && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Análise Comparativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Alert>
                  <AlertDescription>
                    <strong>Problema identificado:</strong> {frontendAuth.cookies.hasAuthCookies && !backendAuth.cookies.hasAuthCookies ? 
                      'Cookies existem no frontend mas não chegam ao backend. Possível problema de CORS ou configuração de cookies.' :
                      !frontendAuth.cookies.hasAuthCookies ? 
                      'Usuário não está autenticado no frontend. Faça login primeiro.' :
                      'Autenticação funcionando corretamente.'
                    }
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
