'use client'

import { useState, Suspense } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServices } from '@/hooks/useServices'
import { ServiceList } from '@/components/services/ServiceList'
import { CreateServiceDialog } from '@/components/services/CreateServiceDialog'
import { EditServiceDialog } from '@/components/services/EditServiceDialog'
import { InfiniteList } from '@/components/ui/infinite-list'
import { ServiceWithClient } from '@/types/database'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastContainer, useToast } from '@/components/ui/toast'

// Desabilitar SSR para esta página
export const dynamic = 'force-dynamic'

function ServicesPageContent() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceWithClient | null>(null)
  const { toasts, removeToast, showSuccess, showError } = useToast()
  
  const { 
    services, 
    isLoading, 
    isLoadingMore,
    hasMore,
    addService, 
    editServiceComplete,
    removeService,
    searchServices,
    loadMoreServices,
    updateServiceGoogleEventId,
    refreshServices
  } = useServices()

  const handleEditService = (service: ServiceWithClient) => {
    setSelectedService(service)
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setSelectedService(null)
  }

  const handleLoadMore = () => {
    loadMoreServices()
  }

  const handleServiceSyncSuccess = (serviceId: string, googleEventId: string) => {
    updateServiceGoogleEventId(serviceId, googleEventId)
    showSuccess('Serviço sincronizado!', 'Evento criado no Google Calendar com sucesso')
  }

  const handleServiceSyncError = (serviceId: string, error: string) => {
    showError('Falha na sincronização', `Erro ao sincronizar serviço: ${error}`)
  }

  return (
    <div className="container-mobile mobile-py">
      <div className="mobile-header mb-6">
        <div>
          <h1 className="mobile-header-title">Serviços</h1>
          <p className="text-gray-600 mt-1 mobile-text-base">
            Gerencie todos os serviços prestados aos clientes
          </p>
        </div>
        <div className="mobile-header-actions">
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 mobile-button-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="mobile-text-sm">Novo Serviço</span>
          </Button>
        </div>
      </div>


      <InfiniteList
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      >
        <ServiceList
          services={services}
          isLoading={isLoading}
          onEditService={handleEditService}
          onDeleteService={removeService}
          onSearchServices={searchServices}
          onServiceSyncSuccess={handleServiceSyncSuccess}
          onServiceSyncError={handleServiceSyncError}
        />
      </InfiniteList>

      <CreateServiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onServiceCreated={addService}
        onRefresh={refreshServices}
      />

      <EditServiceDialog
        service={selectedService}
        open={editDialogOpen}
        onOpenChange={handleCloseEditDialog}
        onServiceUpdated={editServiceComplete}
      />

      {/* Container de Toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}

export default function ServicesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Carregando serviços...</div>}>
        <ServicesPageContent />
      </Suspense>
    </ProtectedRoute>
  )
}
