import RoutesPage from '@/components/routes/RoutesPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function Routes() {
  return (
    <ProtectedRoute>
      <RoutesPage />
    </ProtectedRoute>
  )
}
