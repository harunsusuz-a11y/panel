import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { token, decision, note } = await req.json()
    if (!token || !decision) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const sb = await createClient()

    // Token'ı bul — hem proje bazlı hem müşteri bazlı tokenlar desteklenir
    const { data: tokenRow, error: te } = await sb
      .from('client_portal_tokens')
      .select('id, approval_id, client_id, project_id, is_client_token')
      .eq('token', token)
      .single()

    if (te || !tokenRow) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

    // Token kararını güncelle
    await sb.from('client_portal_tokens').update({
      client_decision: decision,
      client_note: note || null,
      client_decided_at: new Date().toISOString(),
    }).eq('id', tokenRow.id)

    // Eğer approval_id varsa → o onayı güncelle
    if (tokenRow.approval_id) {
      await sb.from('approvals').update({
        client_status: decision === 'approved' ? 'client_approved' : 'client_rejected',
      }).eq('id', tokenRow.approval_id)
    }

    // Müşteri ismini çek
    const { data: client } = await sb
      .from('clients')
      .select('name')
      .eq('id', tokenRow.client_id)
      .single()
    const clientName = client?.name || 'Müşteri'

    // Admin ve manager'lara bildirim gönder
    const { data: adminUsers } = await sb
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager'])

    if (adminUsers && adminUsers.length > 0) {
      const notifTitle = decision === 'approved'
        ? `✅ ${clientName} onayladı`
        : `🔄 ${clientName} revizyon istedi`
      const notifBody = decision === 'approved'
        ? `${note ? `Not: "${note}"` : 'Müşteri içeriği/projeyi onayladı.'}`
        : `Revizyon talebi${note ? `: "${note}"` : ' gönderildi.'}`

      const notifs = adminUsers.map((u: any) => ({
        user_id: u.id,
        type: 'client_response',
        title: notifTitle,
        body: notifBody,
        entity_type: tokenRow.approval_id ? 'approvals' : 'projects',
        entity_id: tokenRow.approval_id || tokenRow.project_id || null,
        is_read: false,
      }))

      await sb.from('notifications').insert(notifs)
    }

    // Eğer revizyon ise ve content_id veya project bağlı onay varsa durumu güncelle
    if (decision === 'revision' && tokenRow.approval_id) {
      const { data: approval } = await sb
        .from('approvals')
        .select('content_id')
        .eq('id', tokenRow.approval_id)
        .single()

      if (approval?.content_id) {
        await sb.from('contents').update({ status: 'revision' }).eq('id', approval.content_id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
