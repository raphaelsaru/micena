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

    // Permitir null para limpar o google_event_id, mas não undefined
    if (google_event_id === undefined) {
      return NextResponse.json(
        { error: 'google_event_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Tentar primeiro com a função SQL
    const { error } = await supabase.rpc('update_service_google_event_id', {
      p_service_id: serviceId,
      p_google_event_id: google_event_id
    })

    // Se falhar, tentar com UPDATE direto
    if (error) {
      const { error: updateError } = await supabase
        .from('services')
        .update({ 
          google_event_id: google_event_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Erro ao atualizar serviço', details: updateError.message },
          { status: 500 }
        )
      }
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
