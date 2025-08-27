'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, FileText, Route, DollarSign, Home, BarChart3, LogOut } from 'lucide-react'
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

export function Navigation() {
  const pathname = usePathname()

  return (
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
          </div>
        </div>
      </div>
    </nav>
  )
}
