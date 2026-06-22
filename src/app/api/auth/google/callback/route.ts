import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect('/dashboard/toplanti?error=no_code')

  const clientId     = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri  = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://panelson.vercel.app'}/api/auth/google/callback`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  })
  const tokens = await res.json()
  if (!tokens.access_token) return NextResponse.redirect('/dashboard/toplanti?error=token_fail')

  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  await sb.from('google_tokens').upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
  }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://panelson.vercel.app'}/dashboard/toplanti?connected=1`)
}
