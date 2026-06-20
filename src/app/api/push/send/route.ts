import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId, title, body, url, type } = await req.json()
    if (!userId || !title) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Dynamic import - edge runtime'da çalışmaz, nodejs gerekir
    const webpush = (await import('web-push')).default

    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:mert@milgo.com.tr',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    )

    const sb = await createClient()
    const { data: subs } = await sb
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subs?.length) return NextResponse.json({ sent: 0 })

    const payload = JSON.stringify({
      title,
      body:  body  || '',
      url:   url   || '/dashboard',
      type:  type  || 'general',
      icon: '/icons/icon-192.png',
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { urgency: 'high', TTL: 86400 }
        )
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length

    // Expired subscription temizle
    const expired: string[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const e = r.reason as any
        if (e?.statusCode === 410 || e?.statusCode === 404) expired.push(subs[i].endpoint)
      }
    })
    if (expired.length) {
      await sb.from('push_subscriptions').delete().in('endpoint', expired)
    }

    return NextResponse.json({ sent, total: subs.length })
  } catch (err: any) {
    console.error('Push send error:', err?.message)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
