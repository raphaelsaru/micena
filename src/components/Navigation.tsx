'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, FileText, Route, DollarSign, Home, BarChart3, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MensalistasNotifications } from './MensalistasNotifications'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Serviços', href: '/services', icon: FileText },
  { name: 'Rotas', href: '/routes', icon: Route },
  { name: 'Mensalistas', href: '/mensalistas', icon: DollarSign },
  { name: 'Financeiro', href: '/financeiro', icon: BarChart3 },
]

function UserMenu() {
  const { user, signOut, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Não mostrar nada durante o loading ou se não estiver montado
  if (!mounted || loading || !user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
        >
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              Usuário do Sistema
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleNavigation = (href: string) => {
    onClose()
  }

  const handleLogout = async () => {
    await signOut()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-base font-bold text-gray-900 truncate">Micena Piscinas</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px]',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500">Usuário do Sistema</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start min-h-[48px]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className="bg-white shadow-sm border-b print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Micena Piscinas</span>
              </Link>
              
              {/* Navegação desktop */}
              <div className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notificações de Mensalistas */}
              <MensalistasNotifications />
              
              {/* Menu do usuário */}
              <UserMenu />
              
              {/* Botão do menu mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden h-8 w-8"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  )
}
