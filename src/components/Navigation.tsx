'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Calendar, Route, CreditCard, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Serviços', href: '/services', icon: Calendar },
  { name: 'Rotas', href: '/routes', icon: Route },
  { name: 'Financeiro', href: '/financial', icon: CreditCard },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
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
            {/* TODO: Adicionar menu do usuário quando implementar autenticação */}
            <div className="text-sm text-gray-500">
              Sistema de Gestão
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
