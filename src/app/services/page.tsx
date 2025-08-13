'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServices } from '@/hooks/useServices'
import { ServiceList } from '@/components/services/ServiceList'
import { CreateServiceDialog } from '@/components/services/CreateServiceDialog'
import { EditServiceDialog } from '@/components/services/EditServiceDialog'
import { Service } from '@/types/database'

export default function ServicesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  const { 
    services, 
    isLoading, 
    addService, 
    editService, 
    removeService,
    searchServices 
  } = useServices()

  const handleEditService = (service: Service) => {
    setSelectedService(service)
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setSelectedService(null)
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
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      <ServiceList
        services={services}
        isLoading={isLoading}
        onEditService={handleEditService}
        onDeleteService={removeService}
        onSearchServices={searchServices}
      />

      <CreateServiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onServiceCreated={addService}
      />

      <EditServiceDialog
        service={selectedService}
        open={editDialogOpen}
        onOpenChange={handleCloseEditDialog}
        onServiceUpdated={editService}
      />
    </div>
  )
}
