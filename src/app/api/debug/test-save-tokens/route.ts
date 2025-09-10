import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { saveInitialTokens } from '@/lib/google-calendar-server'

export async function POST(request: NextRequest) {
  try {
    // Obter usuário autenticado
    const supabase = createUserServerClient(request)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Testar salvamento de tokens
    const testTokens = {
      accessToken: 'test_access_token_' + Date.now(),
      refreshToken: 'test_refresh_token_' + Date.now(),
      expiresIn: 3600 // 1 hora
    }

    console.log('🧪 Testando salvamento de tokens para usuário:', user.id)
    
    const saved = await saveInitialTokens(
      user.id,
      testTokens.accessToken,
      testTokens.refreshToken,
      testTokens.expiresIn
    )

    if (saved) {
      console.log('✅ Teste de salvamento bem-sucedido')
      
      // Limpar o token de teste
      await supabase.rpc('delete_user_google_tokens', {
        p_user_id: user.id
      })
      
      return NextResponse.json({
        success: true,
        message: 'Teste de salvamento de tokens bem-sucedido',
        testTokens,
        userId: user.id
      })
    } else {
      console.error('❌ Teste de salvamento falhou')
      return NextResponse.json(
        { 
          error: 'Falha no teste de salvamento de tokens',
          userId: user.id
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de salvamento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
