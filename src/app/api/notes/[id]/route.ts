import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, content, reminder_at, sms_enabled } = body
  const update: any = {}
  if (title !== undefined) update.title = title
  if (content !== undefined) update.content = content
  if ('reminder_at' in body) {
    update.reminder_at = reminder_at || null
    update.sms_sent = false // tarih değişince sms tekrar gönderilsin
  }
  if (sms_enabled !== undefined) {
    update.sms_enabled = sms_enabled
    update.sms_sent = false
  }
  const { data, error } = await sb.from('notes').update(update).eq('id', params.id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await sb.from('notes').delete().eq('id', params.id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
