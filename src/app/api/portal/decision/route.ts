import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function sendPush(userId: string, title: string, body: string, url: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://panelson.vercel.app'}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, url, type: 'client_response' }),
    })
  } catch {}
}

export async function POST(req: Request) {
  try {
    const { token, decision, note } = await req.json()
    if (!token || !decision) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const sb = await createClient()

    // Token'ı bul
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

    // Approval varsa güncelle
    if (tokenRow.approval_id) {
      await sb.from('approvals').update({
        client_status: decision === 'approved' ? 'client_approved' : 'client_rejected',
      }).eq('id', tokenRow.approval_id)
    }

    // Müşteri adını çek
    const { data: client } = await sb
      .from('clients').select('name').eq('id', tokenRow.client_id).single()
    const clientName = client?.name || 'Müşteri'

    // Onay bilgisini çek (title ve requested_by için)
    let approvalTitle = ''
    let requestedBy: string | null = null
    if (tokenRow.approval_id) {
      const { data: appr } = await sb
        .from('approvals')
        .select('title, requested_by, content_id')
        .eq('id', tokenRow.approval_id)
        .single()
      approvalTitle = appr?.title || ''
      requestedBy = appr?.requested_by || null

      // Revizyon → içeriği geri çek
      if (decision === 'revision' && appr?.content_id) {
        await sb.from('contents').update({ status: 'revision' }).eq('id', appr.content_id)
      }
    }

    // Bildirim metinleri
    const notifTitle = decision === 'approved'
      ? `✅ ${clientName} onayladı`
      : `🔄 ${clientName} revizyon istedi`
    const notifBody = approvalTitle
      ? `"${approvalTitle}"${note ? ` — Not: "${note}"` : ''}`
      : note ? `Not: "${note}"` : decision === 'approved' ? 'Müşteri onay verdi.' : 'Revizyon talebi gönderildi.'

    // Admin + manager'lara bildirim + push
    const { data: adminUsers } = await sb
      .from('profiles').select('id').in('role', ['admin', 'manager'])

    const adminIds = (adminUsers || []).map((u: any) => u.id)

    // İlgili personele de bildirim (talebi oluşturan, admin/manager değilse)
    const extraIds: string[] = []
    if (requestedBy && !adminIds.includes(requestedBy)) {
      extraIds.push(requestedBy)
    }

    const allRecipients = [...adminIds, ...extraIds]

    if (allRecipients.length > 0) {
      // DB bildirimi
      await sb.from('notifications').insert(
        allRecipients.map(uid => ({
          user_id: uid,
          type: 'client_response',
          title: notifTitle,
          body: notifBody,
          entity_type: tokenRow.approval_id ? 'approvals' : 'projects',
          entity_id: tokenRow.approval_id || tokenRow.project_id || null,
          is_read: false,
        }))
      )

      // Push bildirimi — her alıcıya ayrı gönder
      await Promise.allSettled(
        allRecipients.map(uid =>
          sendPush(uid, notifTitle, notifBody, '/dashboard/onay')
        )
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Decision API error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
