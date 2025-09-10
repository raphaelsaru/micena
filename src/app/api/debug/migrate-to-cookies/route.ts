import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Este endpoint não faz nada no servidor, é apenas para o frontend chamar
    // O frontend vai migrar os dados do localStorage para cookies
    return NextResponse.json({
      success: true,
      message: 'Endpoint para migração de localStorage para cookies',
      instructions: [
        '1. No frontend, leia os dados do localStorage do Supabase',
        '2. Salve os dados como cookies',
        '3. Teste a autenticação novamente'
      ]
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
