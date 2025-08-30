'use client'

import { ServiceItem, ServiceMaterial } from '@/types/database'
import { formatCurrency } from '@/lib/formatters'

interface ServiceTotalsProps {
  serviceItems: Omit<ServiceItem, 'id' | 'service_id' | 'created_at' | 'updated_at'>[]
  serviceMaterials: (Omit<ServiceMaterial, 'id' | 'service_id' | 'created_at' | 'updated_at'> & { total_price?: number })[]
}

export function ServiceTotals({ serviceItems, serviceMaterials }: ServiceTotalsProps) {
  const servicesTotal = serviceItems.reduce((sum, item) => sum + item.value, 0)
  const materialsTotal = serviceMaterials.reduce((sum, material) => sum + (material.quantity * material.unit_price), 0)
  const grandTotal = servicesTotal + materialsTotal

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Resumo Financeiro</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal Serviços:</span>
          <span className="font-medium">{formatCurrency(servicesTotal)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal Materiais:</span>
          <span className="font-medium">{formatCurrency(materialsTotal)}</span>
        </div>
        
        <div className="border-t pt-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Total Geral:</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
