'use client'

import { Bell, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/formatters'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useMensalistasNotifications } from '@/contexts/MensalistasNotificationsContext'

export function MensalistasNotifications() {
  const { notifications, loading } = useMensalistasNotifications()
  
  const totalNotifications = notifications.totalAtrasados + notifications.totalEmAberto

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          title="Notificações de Mensalistas"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-400"
            >
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b">
          <Bell className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Notificações</h2>
        </div>

        {/* Conteúdo */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Carregando notificações...
            </div>
          ) : totalNotifications === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p className="font-medium">Todas as mensalidades estão em dia!</p>
            </div>
          ) : (
            <Tabs defaultValue="atrasados" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="atrasados" className="flex items-center gap-2 rounded-none">
                  <AlertTriangle className="h-5 w-5" />
                  Atrasados ({notifications.totalAtrasados})
                </TabsTrigger>
                <TabsTrigger value="em-aberto" className="flex items-center gap-2 rounded-none">
                  <DollarSign className="h-5 w-5" />
                  Em Aberto ({notifications.totalEmAberto})
                </TabsTrigger>
              </TabsList>

              {/* Aba Atrasados */}
              <TabsContent value="atrasados" className="p-4 m-0">
                {notifications.atrasados.length === 0 ? (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Nenhum cliente atrasado!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.atrasados.map((notification) => (
                      <div 
                        key={notification.id}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-red-900 text-sm">
                              {notification.full_name}
                            </h4>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-red-600">
                              {formatCurrency(notification.monthly_fee)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Aba Em Aberto */}
              <TabsContent value="em-aberto" className="p-4 m-0">
                {notifications.emAberto.length === 0 ? (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">Todos pagaram o mês atual!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.emAberto.map((notification) => (
                      <div 
                        key={notification.id}
                        className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-yellow-900 text-sm">
                              {notification.full_name}
                            </h4>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-yellow-600">
                              {formatCurrency(notification.monthly_fee)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
