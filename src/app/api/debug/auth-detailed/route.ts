import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createUserServerClient()
    
    // Verificar configuração do Supabase
    const supabaseConfig = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'Não configurado'
    }

    // Tentar obter usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Verificar cookies
    const cookies = request.headers.get('cookie')
    const authCookies = cookies ? cookies.split(';').filter(c => c.includes('sb-') || c.includes('supabase')) : []
    
    // Verificar headers
    const headers = {
      'user-agent': request.headers.get('user-agent'),
      'origin': request.headers.get('origin'),
      'referer': request.headers.get('referer'),
      'host': request.headers.get('host')
    }

    // Tentar obter sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // Verificar se é problema de CORS ou cookies
    const isLocalhost = request.headers.get('host')?.includes('localhost')
    const isVercel = request.headers.get('host')?.includes('vercel.app')

    return NextResponse.json({
      success: true,
      diagnosis: {
        user: {
          exists: !!user,
          error: userError,
          data: user ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          } : null
        },
        session: {
          exists: !!session,
          error: sessionError,
          data: session ? {
            access_token: session.access_token ? 'Presente' : 'Ausente',
            refresh_token: session.refresh_token ? 'Presente' : 'Ausente',
            expires_at: session.expires_at
          } : null
        },
        supabase: {
          config: supabaseConfig,
          clientCreated: !!supabase
        },
        cookies: {
          total: cookies ? cookies.split(';').length : 0,
          authCookies: authCookies.length,
          authCookiesList: authCookies
        },
        environment: {
          isLocalhost,
          isVercel,
          nodeEnv: process.env.NODE_ENV,
          host: request.headers.get('host')
        },
        headers: headers
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
