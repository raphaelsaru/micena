'use client'

import { useState } from 'react'
import { generateAuthUrl } from '@/lib/google-calendar'

export default function DebugGoogleConfig() {
  const [authUrl, setAuthUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  const checkConfig = () => {
    try {
      setError('')
      const url = generateAuthUrl()
      setAuthUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Google OAuth Config</h1>
      
      <div className="space-y-4">
        <button
          onClick={checkConfig}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Verificar Configuração
        </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {authUrl && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">URL de Autenticação Gerada:</h2>
            <div className="bg-gray-100 p-4 rounded">
              <code className="text-sm break-all">{authUrl}</code>
            </div>
            
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <strong>Próximos passos:</strong>
              <ul className="mt-2 list-disc list-inside">
                <li>Verifique se o Client ID está correto no Google Cloud Console</li>
                <li>Verifique se o Redirect URI está autorizado</li>
                <li>Verifique se os escopos estão habilitados</li>
                <li>Teste a URL gerada em uma nova aba</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
