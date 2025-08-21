import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { google_event_id } = await request.json()
    const { id } = await params
    const serviceId = id

    if (!google_event_id) {
      return NextResponse.json(
        { error: 'google_event_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Atualizar o google_event_id usando a função SQL
    const { error } = await supabase.rpc('update_service_google_event_id', {
      p_service_id: serviceId,
      p_google_event_id: google_event_id
    })

    if (error) {
      console.error('Erro ao atualizar google_event_id:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar serviço' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de atualização do google_event_id:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
