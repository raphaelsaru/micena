import { Dashboard } from '@/components/dashboard/Dashboard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleBasedRedirect } from '@/components/auth/RoleBasedRedirect'

// Desabilitar SSR para esta página
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <ProtectedRoute>
      <RoleBasedRedirect />
      <Dashboard />
    </ProtectedRoute>
  )
}
