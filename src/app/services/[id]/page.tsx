'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ServiceOrder } from '@/components/services/ServiceOrder'
import { getServiceById } from '@/lib/services'
import { ServiceWithClient } from '@/types/database'
import { Button } from '@/components/ui/button'

export default function ServiceOrderPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [service, setService] = useState<ServiceWithClient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchService = async () => {
      if (!params?.id) return
      const data = await getServiceById(params.id)
      setService(data)
      setLoading(false)
    }
    fetchService()
  }, [params?.id])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Carregando OS...</p>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Serviço não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/services')}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 px-2">
      <ServiceOrder service={service} onClose={() => router.push('/services')} />
    </div>
  )
}


