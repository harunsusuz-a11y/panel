import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { token, decision, note } = await req.json()
  if (!token || !decision) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const sb = await createClient()
  const { data: tokenRow, error } = await sb.from('client_portal_tokens')
    .select('id,approval_id')
    .eq('token', token)
    .single()

  if (error || !tokenRow) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  await sb.from('client_portal_tokens').update({
    client_decision: decision,
    client_note: note || null,
    client_decided_at: new Date().toISOString(),
  }).eq('id', tokenRow.id)

  if (tokenRow.approval_id) {
    await sb.from('approvals').update({
      client_status: decision === 'approved' ? 'client_approved' : 'client_rejected',
    }).eq('id', tokenRow.approval_id)
  }

  return NextResponse.json({ ok: true })
}
