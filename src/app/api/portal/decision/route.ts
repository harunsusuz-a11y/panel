import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/push'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function sendPush(userId: string, title: string, body: string, url: string) {
  try { await sendPushToUser(userId, title, body, url, 'client_response') } catch {}
}

export async function POST(req: Request) {
  try {
    const { token, decision, note } = await req.json()
    if (!token || !decision) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Bu endpoint kasıtlı olarak oturumsuz (müşteri portalı, giriş gerekmez) —
    // gerçek yetkilendirme token'ın kendisi, bu yüzden service role ile RLS'i bypass ediyoruz.
    const sb = svc()

    const { data: tokenRow, error: te } = await sb
      .from('client_portal_tokens')
      .select('id, approval_id, client_id, project_id, is_client_token, expires_at')
      .eq('token', token)
      .single()

    if (te || !tokenRow) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 410 })
    }

    await sb.from('client_portal_tokens').update({
      client_decision: decision,
      client_note: note || null,
      client_decided_at: new Date().toISOString(),
    }).eq('id', tokenRow.id)

    if (tokenRow.approval_id) {
      await sb.from('approvals').update({
        client_status: decision === 'approved' ? 'client_approved' : 'client_rejected',
      }).eq('id', tokenRow.approval_id)
    } else if (tokenRow.is_client_token && tokenRow.client_id) {
      const { data: latestApproval } = await sb
        .from('approvals')
        .select('id, content_id, requested_by, title')
        .eq('client_id', tokenRow.client_id)
        .eq('client_status', 'sent')
        .order('client_sent_at', { ascending: false })
        .limit(1)
        .single()
      if (latestApproval) {
        await sb.from('approvals').update({
          client_status: decision === 'approved' ? 'client_approved' : 'client_rejected',
        }).eq('id', latestApproval.id)
        if (decision === 'revision' && latestApproval.content_id) {
          await sb.from('contents').update({ status: 'revision' }).eq('id', latestApproval.content_id)
        }
      }
    }

    const { data: client } = await sb
      .from('clients').select('name').eq('id', tokenRow.client_id).single()
    const clientName = client?.name || 'Müşteri'

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

      if (appr?.content_id) {
        if (decision === 'approved') {
          await sb.from('contents').update({ status: 'published' }).eq('id', appr.content_id)
        } else if (decision === 'revision') {
          await sb.from('contents').update({ status: 'revision' }).eq('id', appr.content_id)
        }
      }
    }

    const notifTitle = decision === 'approved'
      ? `✅ ${clientName} onayladı`
      : `🔄 ${clientName} revizyon istedi`
    const notifBody = approvalTitle
      ? `"${approvalTitle}"${note ? ` — Not: "${note}"` : ''}`
      : note ? `Not: "${note}"` : decision === 'approved' ? 'Müşteri onay verdi.' : 'Revizyon talebi gönderildi.'

    const { data: adminUsers } = await sb
      .from('profiles').select('id').in('role', ['admin', 'manager'])

    const adminIds = (adminUsers || []).map((u: any) => u.id)

    const extraIds: string[] = []
    if (requestedBy && !adminIds.includes(requestedBy)) {
      extraIds.push(requestedBy)
    }

    const allRecipients = [...adminIds, ...extraIds]

    if (allRecipients.length > 0) {
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

