'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Search, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientList } from '@/components/clients/ClientList'
import { CreateClientDialog } from '@/components/clients/CreateClientDialog'
import { InfiniteList } from '@/components/ui/infinite-list'
import { useClients } from '@/hooks/useClients'
import { useDebounce } from '@/hooks/useDebounce'

export default function ClientsPage() {
  const [searchInputValue, setSearchInputValue] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { 
    clients, 
    isLoading, 
    isLoadingMore,
    hasMore,
    searchQuery,
    isSearching,
    addClient, 
    editClient, 
    removeClient, 
    loadMoreClients,
    searchClientsByQuery,
    clearSearch
  } = useClients()
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Debounce da busca para evitar muitas requisições
  const debouncedSearchQuery = useDebounce(searchInputValue, 300)

  // Efeito para executar a busca quando o valor debounced mudar
  useEffect(() => {
    searchClientsByQuery(debouncedSearchQuery)
  }, [debouncedSearchQuery, searchClientsByQuery])

  const handleLoadMore = () => {
    loadMoreClients()
  }

  const handleClearSearch = () => {
    setSearchInputValue('')
    clearSearch()
    searchInputRef.current?.focus()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
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
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              className="pl-10 pr-10"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              inputMode="search"
            />
            {searchInputValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Indicador de busca */}
          {searchQuery && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {isSearching ? 'Buscando...' : `Resultados para "${searchQuery}" (${clients.length} clientes encontrados)`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="text-blue-600 hover:text-blue-700"
              >
                Limpar busca
              </Button>
            </div>
          )}
          
          {/* Lista com paginação incremental (apenas quando não há busca) */}
          {!searchQuery && (
            <InfiniteList
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
            >
              <ClientList
                clients={clients}
                isLoading={isLoading}
                onClientUpdated={editClient}
                onClientDeleted={removeClient}
                onBeforeOpenDialog={() => searchInputRef.current?.blur()}
              />
            </InfiniteList>
          )}

          {/* Lista sem paginação quando há busca */}
          {searchQuery && (
            <ClientList
              clients={clients}
              isLoading={isLoading || isSearching}
              onClientUpdated={editClient}
              onClientDeleted={removeClient}
              onBeforeOpenDialog={() => searchInputRef.current?.blur()}
            />
          )}
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
