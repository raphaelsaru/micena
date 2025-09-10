import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      GOOGLE_CLIENT_ID: {
        exists: !!process.env.GOOGLE_CLIENT_ID,
        length: process.env.GOOGLE_CLIENT_ID?.length || 0,
        startsWith: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...' || 'N/A'
      },
      GOOGLE_CLIENT_SECRET: {
        exists: !!process.env.GOOGLE_CLIENT_SECRET,
        length: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
        startsWith: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 10) + '...' || 'N/A'
      },
      GOOGLE_REDIRECT_URI: {
        exists: !!process.env.GOOGLE_REDIRECT_URI,
        value: process.env.GOOGLE_REDIRECT_URI || 'N/A'
      },
      NEXT_PUBLIC_APP_URL: {
        exists: !!process.env.NEXT_PUBLIC_APP_URL,
        value: process.env.NEXT_PUBLIC_APP_URL || 'N/A'
      },
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'N/A'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      }
    }

    const allConfigured = Object.values(envCheck).every(env => env.exists)

    return NextResponse.json({
      success: true,
      allConfigured,
      environment: envCheck,
      nodeEnv: process.env.NODE_ENV
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
