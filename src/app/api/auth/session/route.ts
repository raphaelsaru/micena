import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decodeJwt } from 'jose'
import { verifyAuthToken, SESSION_COOKIE_NAME } from '@/lib/auth-server'

// Guarda o JWT (emitido pelo Better Auth hospedado pela Neon) num cookie
// first-party httpOnly, pra que Server Actions e Route Handlers do nosso
// próprio domínio consigam verificar quem está logado via cookies().
export async function POST(request: Request) {
  const { token } = await request.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token ausente' }, { status: 400 })
  }

  const user = await verifyAuthToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const { exp } = decodeJwt(token)
  const maxAge = exp ? Math.max(0, exp - Math.floor(Date.now() / 1000)) : 60 * 10

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  return NextResponse.json({ ok: true })
}
