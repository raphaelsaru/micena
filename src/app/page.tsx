import Link from 'next/link'
import { Users, Calendar, Route, CreditCard, Plus, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  const quickActions = [
    {
      title: 'Novo Cliente',
      description: 'Cadastrar um novo cliente no sistema',
      icon: Plus,
      href: '/clients',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Gerenciar Clientes',
      description: 'Visualizar e editar clientes existentes',
      icon: Users,
      href: '/clients',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Ver Rotas',
      description: 'Visualizar rotas de atendimento',
      icon: Route,
      href: '/routes',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Financeiro',
      description: 'Gerenciar pagamentos e mensalistas',
      icon: CreditCard,
      href: '/financial',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
  ]

  const systemFeatures = [
    {
      title: 'Gestão de Clientes',
      description: 'Cadastro completo com histórico de serviços e informações de contato',
      icon: Users,
    },
    {
      title: 'Controle de Serviços',
      description: 'Registro de serviços prestados com agendamento e lembretes',
      icon: Calendar,
    },
    {
      title: 'Planejamento de Rotas',
      description: 'Organização semanal de atendimentos com drag & drop',
      icon: Route,
    },
    {
      title: 'Gestão Financeira',
      description: 'Controle de mensalistas, pagamentos e comprovantes',
      icon: CreditCard,
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bem-vindo ao Sistema Micena Piscinas
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Sistema completo para gerenciamento de clientes, serviços e rotas de atendimento
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <action.icon className="h-8 w-8 text-gray-600" />
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <Button asChild className={`w-full ${action.color}`}>
                  <Link href={action.href}>
                    Acessar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Funcionalidades do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {systemFeatures.map((feature) => (
            <Card key={feature.title} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Comece Agora</CardTitle>
            <CardDescription>
              Para começar a usar o sistema, cadastre seu primeiro cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/clients">
                <Plus className="h-5 w-5 mr-2" />
                Cadastrar Primeiro Cliente
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
