'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  Mail,
  LogOut,
  KeyRound
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authClient } from '@/lib/auth-client'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastContainer, useToast } from '@/components/ui/toast'

export default function ConfiguracoesPage() {
  const { user, signOut } = useAuth()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [mounted, setMounted] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      showError('Senha muito curta', 'A nova senha precisa ter pelo menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      showError('Senhas não conferem', 'A confirmação precisa ser igual à nova senha')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })

      if (error) {
        showError('Erro ao trocar senha', error.message ?? 'Verifique a senha atual e tente novamente')
        return
      }

      showSuccess('Senha atualizada!', 'Sua senha foi trocada com sucesso')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      showError('Erro ao trocar senha', 'Erro inesperado, tente novamente')
    } finally {
      setIsChangingPassword(false)
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

          {/* Trocar Senha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Troque a senha temporária por uma de sua escolha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" disabled={isChangingPassword} className="w-full">
                  {isChangingPassword ? 'Salvando...' : 'Salvar nova senha'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Container de Toasts */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ProtectedRoute>
  )
}
