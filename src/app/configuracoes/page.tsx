'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute'
import { ToastContainer, useToast } from '@/components/ui/toast'

export default function ConfiguracoesPage() {
  const { user, signOut } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [mounted, setMounted] = useState(false)

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
      <RoleProtectedRoute allowedRoles={['admin']}>
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
        </div>

        {/* Container de Toasts */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
      </RoleProtectedRoute>
    </ProtectedRoute>
  )
}
