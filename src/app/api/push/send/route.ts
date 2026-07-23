import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUser, verifyInternalSecret } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId, title, body, url, type } = await req.json()
    if (!userId || !title) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Yetki kontrolü: ya iç servis sırrı (pg_cron), ya da geçerli oturum
    const internalSecret = req.headers.get('x-internal-secret')
    const isInternal = await verifyInternalSecret(internalSecret)

    if (!isInternal) {
      const sb = await createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      if (user.id !== userId) {
        const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !['admin', 'manager'].includes(profile.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    const result = await sendPushToUser(userId, title, body, url, type)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Push send error:', err?.message)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
