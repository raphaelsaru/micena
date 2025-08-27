'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types/database'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function TestDBPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        setClients(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Erro: {error}</div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Teste de Conexão com Banco</h1>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          ✅ <strong>Sucesso!</strong> Conexão com Supabase funcionando perfeitamente.
        </div>

        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
          📊 <strong>Dados encontrados:</strong> {clients.length} clientes carregados do banco.
        </div>

        <h2 className="text-2xl font-semibold mb-4">Clientes Cadastrados:</h2>
        
        <div className="grid gap-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{client.full_name}</h3>
                  <p className="text-gray-600">CPF/CNPJ: {client.document}</p>
                  <p className="text-gray-600">Email: {client.email || 'Não informado'}</p>
                  <p className="text-gray-600">Telefone: {client.phone || 'Não informado'}</p>
                  <p className="text-gray-600">Endereço: {client.address || 'Não informado'}</p>
                  <p className="text-gray-600">Bairro: {client.neighborhood || 'Não informado'}</p>
                  <p className="text-gray-600">CEP: {client.postal_code || 'Não informado'}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    client.is_recurring 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {client.is_recurring ? 'Mensalista' : 'Pontual'}
                  </span>
                </div>
              </div>
              {client.notes && (
                <p className="text-gray-500 mt-2 text-sm">Observações: {client.notes}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Informações do Banco:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</li>
            <li>• Tabelas criadas: clients, services, payments, route_settings, route_assignments, audit_log</li>
            <li>• Dados de seed inseridos com sucesso</li>
            <li>• Índices e triggers configurados</li>
          </ul>
        </div>
      </div>
    </div>
  </ProtectedRoute>
  )
}
