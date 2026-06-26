import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { subscription } = await req.json()
    if (!subscription?.endpoint) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauth' }, { status: 401 })

    // Aynı endpoint başka kullanıcılara kayıtlıysa sil (cihaz değişimi / paylaşılan tarayıcı)
    await sb.from('push_subscriptions')
      .delete()
      .eq('endpoint', subscription.endpoint)
      .neq('user_id', user.id)

    await sb.from('push_subscriptions').upsert({
      user_id: user.id, endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh, auth: subscription.keys.auth,
      user_agent: req.headers.get('user-agent') || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,endpoint' })

    return NextResponse.json({ ok: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json()
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauth' }, { status: 401 })
    await sb.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)
    return NextResponse.json({ ok: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
