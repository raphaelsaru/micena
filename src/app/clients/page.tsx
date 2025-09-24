'use client'

import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { Plus, Search, Users, X, Filter, Calendar, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrimmedInput } from '@/components/ui/trimmed-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfiniteList } from '@/components/ui/infinite-list'
import { Datepicker } from '@/components/ui/datepicker'
import { useClients } from '@/hooks/useClients'
import { useDebounce } from '@/hooks/useDebounce'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute'

// Lazy load componentes pesados
const ClientList = lazy(() => import('@/components/clients/ClientList').then(module => ({ default: module.ClientList })))
const CreateClientDialog = lazy(() => import('@/components/clients/CreateClientDialog').then(module => ({ default: module.CreateClientDialog })))
const PrintClientsDialog = lazy(() => import('@/components/clients/PrintClientsDialog').then(module => ({ default: module.PrintClientsDialog })))

// Desabilitar SSR para esta página
export const dynamic = 'force-dynamic'

export default function ClientsPage() {
  const [searchInputValue, setSearchInputValue] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  
  // Estados para filtro de data de início da mensalidade
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [availableYears] = useState(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 10 }, (_, i) => currentYear - i)
  })
  
  const { 
    clients, 
    isLoading, 
    isLoadingMore,
    hasMore,
    searchQuery,
    isSearching,
    showOnlyMensalistas,
    totalMensalistas,
    addClient, 
    editClient, 
    removeClient, 
    loadMoreClients,
    searchClientsByQuery,
    clearSearch,
    toggleMensalistasFilter,
    filterBySubscriptionStartDate
  } = useClients()
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Debounce da busca para evitar muitas requisições
  const debouncedSearchQuery = useDebounce(searchInputValue, 300)

  // Efeito para executar a busca quando o valor debounced mudar
  useEffect(() => {
    searchClientsByQuery(debouncedSearchQuery)
  }, [debouncedSearchQuery, searchClientsByQuery])

  // Efeito para aplicar filtro de data de início da mensalidade
  useEffect(() => {
    if (showOnlyMensalistas) {
      filterBySubscriptionStartDate(selectedYear, selectedMonth)
    }
  }, [selectedYear, selectedMonth, showOnlyMensalistas, filterBySubscriptionStartDate])

  const handleLoadMore = () => {
    loadMoreClients()
  }

  const handleClearSearch = () => {
    setSearchInputValue('')
    clearSearch()
    searchInputRef.current?.focus()
  }

  return (
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={['admin']}>
        <div className="container-mobile mobile-py mobile-space-y">
        <div className="mobile-header">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <h1 className="mobile-header-title">Clientes</h1>
          </div>
          <div className="mobile-header-actions">
            <Button 
              onClick={toggleMensalistasFilter}
              variant={showOnlyMensalistas ? "default" : "outline"}
              className={`mobile-button-sm ${showOnlyMensalistas ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="mobile-text-sm">{showOnlyMensalistas ? 'Apenas Mensalistas' : 'Todos os Clientes'}</span>
            </Button>
            {showOnlyMensalistas && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Datepicker
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  onYearChange={setSelectedYear}
                  onMonthChange={setSelectedMonth}
                  availableYears={availableYears}
                />
              </div>
            )}
            <Button 
              onClick={() => setIsPrintDialogOpen(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 mobile-button-sm"
            >
              <Printer className="h-4 w-4 mr-2" />
              <span className="mobile-text-sm">Imprimir</span>
            </Button>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 mobile-button-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="mobile-text-sm">Novo Cliente</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {showOnlyMensalistas ? 'Gerenciar Mensalistas' : 'Gerenciar Clientes'}
              {showOnlyMensalistas && (
                <span className="ml-2 text-sm font-normal text-green-600">
                  ({totalMensalistas} mensalistas)
                  {selectedMonth && (
                    <span className="ml-1">
                      - {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  {!selectedMonth && (
                    <span className="ml-1">
                      - {selectedYear}
                    </span>
                  )}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <TrimmedInput
                ref={searchInputRef}
                placeholder={showOnlyMensalistas ? "Buscar mensalistas por nome, documento ou email..." : "Buscar por nome, documento ou email..."}
                value={searchInputValue}
                onChange={(value) => setSearchInputValue(value)}
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
                  {isSearching ? 'Buscando...' : `Resultados para "${searchQuery}" (${clients.length} ${showOnlyMensalistas ? 'mensalistas' : 'clientes'} encontrados)`}
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
                <Suspense fallback={
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }>
                  <ClientList
                    clients={clients}
                    isLoading={isLoading}
                    onClientUpdated={editClient}
                    onClientDeleted={removeClient}
                    onBeforeOpenDialog={() => searchInputRef.current?.blur()}
                  />
                </Suspense>
              </InfiniteList>
            )}

            {/* Lista sem paginação quando há busca */}
            {searchQuery && (
              <Suspense fallback={
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }>
                <ClientList
                  clients={clients}
                  isLoading={isLoading || isSearching}
                  onClientUpdated={editClient}
                  onClientDeleted={removeClient}
                  onBeforeOpenDialog={() => searchInputRef.current?.blur()}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>

        <Suspense fallback={null}>
          <CreateClientDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onClientCreated={addClient}
          />
        </Suspense>

        <Suspense fallback={null}>
          <PrintClientsDialog
            open={isPrintDialogOpen}
            onOpenChange={setIsPrintDialogOpen}
          />
        </Suspense>
        </div>
      </RoleProtectedRoute>
    </ProtectedRoute>
  )
}
