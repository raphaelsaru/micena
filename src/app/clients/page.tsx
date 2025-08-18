'use client'

import { useState, useRef } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientList } from '@/components/clients/ClientList'
import { CreateClientDialog } from '@/components/clients/CreateClientDialog'
import { useClients } from '@/hooks/useClients'
import { normalizeText } from '@/lib/utils'

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { clients, isLoading, addClient, editClient, removeClient } = useClients()
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const filteredClients = clients?.filter(client =>
    normalizeText(client.full_name).includes(normalizeText(searchQuery)) ||
    (client.document && client.document.includes(searchQuery)) ||
    (client.email && normalizeText(client.email).includes(normalizeText(searchQuery)))
  ) || []

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar por nome, documento ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="search"
            />
          </div>
          
                                                      <ClientList
                        clients={filteredClients}
                        isLoading={isLoading}
                        onClientUpdated={editClient}
                        onClientDeleted={removeClient}
                        onBeforeOpenDialog={() => searchInputRef.current?.blur()}
                      />
        </CardContent>
      </Card>

      <CreateClientDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onClientCreated={addClient}
      />
    </div>
  )
}
