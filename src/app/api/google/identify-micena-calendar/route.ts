import { NextRequest, NextResponse } from 'next/server'
import { createUserServerClient } from '@/lib/supabase'
import { identifyAndSaveMicenaCalendar } from '@/lib/google-calendar-server'

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

    console.log('🔍 Identificando agenda "Micena" para usuário:', user.id)
    
    // Identificar e salvar a agenda "Micena"
    const result = await identifyAndSaveMicenaCalendar(user.id)
    
    if (result.success) {
      console.log('✅ Agenda "Micena" identificada com sucesso:', {
        calendarId: result.calendarId,
        calendarName: result.calendarName
      })
      
      return NextResponse.json({
        success: true,
        message: `Agenda "${result.calendarName}" identificada e salva com sucesso!`,
        calendarId: result.calendarId,
        calendarName: result.calendarName
      })
    } else {
      console.error('❌ Falha ao identificar agenda "Micena":', result.error)
      
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Erro desconhecido ao identificar agenda',
          message: 'Não foi possível identificar a agenda "Micena". Verifique se existe uma agenda com esse nome e que você é o proprietário.'
        },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('❌ Erro ao identificar agenda Micena:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
