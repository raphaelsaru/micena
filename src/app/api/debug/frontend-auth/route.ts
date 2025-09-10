import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar se há cookies de autenticação
    const cookies = request.headers.get('cookie')
    const cookieList = cookies ? cookies.split(';').map(c => c.trim()) : []
    
    // Procurar por cookies específicos do Supabase
    const supabaseCookies = cookieList.filter(c => 
      c.includes('sb-') || 
      c.includes('supabase') ||
      c.includes('micena-auth')
    )
    
    // Verificar headers importantes
    const headers = {
      'cookie': cookies || 'Nenhum cookie encontrado',
      'authorization': request.headers.get('authorization') || 'Não encontrado',
      'x-forwarded-for': request.headers.get('x-forwarded-for') || 'Não encontrado',
      'x-real-ip': request.headers.get('x-real-ip') || 'Não encontrado'
    }

    // Verificar se é uma requisição AJAX
    const isAjax = request.headers.get('x-requested-with') === 'XMLHttpRequest'
    const acceptHeader = request.headers.get('accept') || ''

    return NextResponse.json({
      success: true,
      analysis: {
        cookies: {
          total: cookieList.length,
          all: cookieList,
          supabase: supabaseCookies,
          hasAuthCookies: supabaseCookies.length > 0
        },
        headers: headers,
        request: {
          isAjax,
          accept: acceptHeader,
          method: request.method,
          url: request.url
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          host: request.headers.get('host'),
          userAgent: request.headers.get('user-agent')?.substring(0, 100) + '...'
        },
        recommendations: supabaseCookies.length === 0 ? [
          'Nenhum cookie de autenticação encontrado',
          'O usuário pode não estar logado no frontend',
          'Verifique se o login está funcionando corretamente',
          'Verifique se os cookies estão sendo definidos no navegador'
        ] : [
          'Cookies de autenticação encontrados',
          'Verifique se os cookies estão sendo enviados corretamente'
        ]
      }
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
