import { jwtVerify, createRemoteJWKSet } from 'jose'
import { cookies } from 'next/headers'

const AUTH_ISSUER = new URL(process.env.NEXT_PUBLIC_AUTH_URL!).origin
const JWKS = createRemoteJWKSet(new URL(process.env.AUTH_JWKS_URL!))

export const SESSION_COOKIE_NAME = 'app_session'

export interface AuthUser {
  id: string
  email: string
  name: string
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: AUTH_ISSUER,
      audience: AUTH_ISSUER,
    })
    if (!payload.sub || !payload.email) return null
    return {
      id: payload.sub,
      email: payload.email as string,
      name: (payload.name as string) ?? '',
    }
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  return verifyAuthToken(token)
}

// Usado dentro de Server Actions e Route Handlers: lê o JWT do cookie first-party
// (setado por /api/auth/session após login) já que o cookie de sessão do Better
// Auth hospedado vive num domínio diferente e não chega nas nossas próprias rotas.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifyAuthToken(token)
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Não autenticado')
  }
  return user
}
