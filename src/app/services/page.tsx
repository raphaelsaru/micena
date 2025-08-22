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
import { GoogleCalendarSync } from '@/components/services/GoogleCalendarSync'
import { BulkCalendarSync } from '@/components/services/BulkCalendarSync'

function ServicesPageContent() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceWithClient | null>(null)
  
  const { 
    services, 
    isLoading, 
    isLoadingMore,
    hasMore,
    addService, 
    editServiceComplete,
    removeService,
    searchServices,
    loadMoreServices
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

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os serviços prestados aos clientes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </Button>
        </div>
      </div>

      {/* Integração com Google Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <GoogleCalendarSync />
        <BulkCalendarSync services={services} />
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
        />
      </InfiniteList>

      <CreateServiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onServiceCreated={addService}
      />

      <EditServiceDialog
        service={selectedService}
        open={editDialogOpen}
        onOpenChange={handleCloseEditDialog}
        onServiceUpdated={editServiceComplete}
      />
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div>Carregando serviços...</div>}>
      <ServicesPageContent />
    </Suspense>
  )
}
