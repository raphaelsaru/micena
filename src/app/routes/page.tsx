import RoutesPage from '@/components/routes/RoutesPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute'

export default function Routes() {
  return (
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={['admin']}>
        <RoutesPage />
      </RoleProtectedRoute>
    </ProtectedRoute>
  )
}
