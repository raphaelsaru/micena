'use client'

import { Suspense } from 'react'
import { GoogleCalendarSync } from '@/components/services/GoogleCalendarSync'
import { BulkCalendarSync } from '@/components/services/BulkCalendarSync'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function TestGoogleCalendarContent() {
  const { isAuthenticated, tokens, isLoading } = useGoogleCalendar()

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Teste Google Calendar</h1>
        <p className="text-gray-600 mt-1">
          Página para testar a integração com Google Calendar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoogleCalendarSync />
        <BulkCalendarSync 
          services={[]} 
          onServiceUpdated={async () => true}
        />
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Status da Integração</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Autenticado:</strong> {isAuthenticated ? 'Sim' : 'Não'}</div>
          <div><strong>Carregando:</strong> {isLoading ? 'Sim' : 'Não'}</div>
          <div><strong>Tokens:</strong> {tokens ? 'Presentes' : 'Ausentes'}</div>
          {tokens && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
              <div><strong>Access Token:</strong> {tokens.accessToken.substring(0, 20)}...</div>
              {tokens.refreshToken && (
                <div><strong>Refresh Token:</strong> {tokens.refreshToken.substring(0, 20)}...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TestGoogleCalendarPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Carregando...</div>}>
        <TestGoogleCalendarContent />
      </Suspense>
    </ProtectedRoute>
  )
}
