import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = 'process.env.GOOGLE_CLIENT_ID'
const GOOGLE_CLIENT_SECRET = 'process.env.GOOGLE_CLIENT_SECRET'
const GOOGLE_REDIRECT_URI = 'https://micena.vercel.app/api/auth/google/callback'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      console.error('Erro na autorização Google:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/services?error=auth_failed`
      )
    }
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/services?error=no_code`
      )
    }
    
    // Trocar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    })
    
    if (!tokenResponse.ok) {
      throw new Error(`Erro ao trocar código por tokens: ${tokenResponse.status}`)
    }
    
    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/services?error=no_access_token`
      )
    }
    
    // Redirecionar para a página de serviços com os tokens
    const redirectUrl = new URL('/services', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002')
    redirectUrl.searchParams.set('auth_success', 'true')
    redirectUrl.searchParams.set('access_token', tokens.access_token)
    
    if (tokens.refresh_token) {
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)
    }
    
    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Erro no callback do Google:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/services?error=callback_failed`
    )
  }
}
