import { createAuthClient } from 'better-auth/react'

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL!

export const authClient = createAuthClient({
  baseURL: AUTH_URL,
})

// Better Auth aqui é hospedado pela Neon num domínio diferente do app,
// então o cookie de sessão não é enviado pras nossas próprias rotas de API.
// Buscamos um JWT (verificável via JWKS) e mandamos como Bearer token.
export async function getAuthToken(): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_URL}/token`, { credentials: 'include' })
    if (!res.ok) return null
    const data = await res.json()
    return data.token ?? null
  } catch {
    return null
  }
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}

// Espelha o JWT num cookie first-party (httpOnly) pra que Server Actions no
// nosso próprio domínio consigam autenticar via cookies(), já que o cookie de
// sessão do Better Auth hospedado não é enviado pro nosso servidor.
export async function syncSessionCookie(): Promise<boolean> {
  const token = await getAuthToken()
  if (!token) return false
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function clearSessionCookie(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' })
  } catch {
    // ignorar - cookie httpOnly expira sozinho de qualquer forma
  }
}
