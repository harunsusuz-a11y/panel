import { createClient as createServiceClient } from '@supabase/supabase-js'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Bir kullanıcıya push bildirimi gönderir. Service role kullanır (RLS'e takılmaz),
 * bu yüzden SADECE server-side güvenilir kod yollarından çağrılmalı (route handler,
 * server action, vs.) — asla client'a expose edilmemeli.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
  type?: string
): Promise<{ sent: number; total: number }> {
  if (!userId || !title) return { sent: 0, total: 0 }

  const webpush = (await import('web-push')).default
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:mert@milgo.com.tr',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
  )

  const sb = svc()
  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return { sent: 0, total: 0 }

  const payload = JSON.stringify({
    title, body: body || '', url: url || '/dashboard', type: type || 'general',
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

  const expired: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const e = r.reason as any
      if (e?.statusCode === 410 || e?.statusCode === 404) expired.push(subs[i].endpoint)
    }
  })
  if (expired.length) await sb.from('push_subscriptions').delete().in('endpoint', expired)

  return { sent, total: subs.length }
}

/** İç servisler (pg_cron gibi) için paylaşılan sırrı doğrular */
export async function verifyInternalSecret(provided: string | null): Promise<boolean> {
  if (!provided) return false
  const sb = svc()
  const { data } = await sb.from('system_settings').select('value').eq('key', 'internal_api_secret').single()
  return !!data?.value && data.value === provided
}
