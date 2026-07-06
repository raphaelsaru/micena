import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-server'
import { queryOne } from '@/lib/db'
import { UserProfile } from '@/types/database'

export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
  }

  const profile = await queryOne<UserProfile>(
    'SELECT id, email, role, created_at, updated_at FROM user_profiles WHERE id = $1',
    [user.id]
  )

  return NextResponse.json({ profile })
}
