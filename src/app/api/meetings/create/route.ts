import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getValidToken(sb: any, userId: string) {
  const { data: tokenRow } = await sb.from('google_tokens').select('*').eq('user_id', userId).single()
  if (!tokenRow) return null
  if (new Date(tokenRow.expires_at) <= new Date()) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokenRow.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    const t = await res.json()
    if (!t.access_token) return null
    await sb.from('google_tokens').update({
      access_token: t.access_token,
      expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString()
    }).eq('user_id', userId)
    return t.access_token
  }
  return tokenRow.access_token
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, start_time, end_time, participants, client_id } = body
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

    const accessToken = await getValidToken(sb, user.id)
    let meetLink = null, googleEventId = null

    if (accessToken) {
      const calRes = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: title,
            description: description || '',
            start: { dateTime: start_time, timeZone: 'Europe/Istanbul' },
            end: { dateTime: end_time, timeZone: 'Europe/Istanbul' },
            conferenceData: {
              createRequest: {
                requestId: `daydream-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          }),
        }
      )
      const calData = await calRes.json()
      meetLink = calData.conferenceData?.entryPoints?.[0]?.uri || null
      googleEventId = calData.id || null
    }

    const { data: meeting, error } = await sb.from('meetings').insert({
      title, description, start_time, end_time,
      meet_link: meetLink, google_event_id: googleEventId,
      client_id: client_id || null, created_by: user.id, status: 'scheduled',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (participants?.length && meeting) {
      await sb.from('meeting_participants').insert(
        participants.map((uid: string) => ({ meeting_id: meeting.id, user_id: uid }))
      )
      const others = participants.filter((uid: string) => uid !== user.id)
      if (others.length) {
        await sb.from('notifications').insert(
          others.map((uid: string) => ({
            user_id: uid, type: 'meeting_invite',
            title: '📅 Toplantı Daveti',
            body: `"${title}" — ${new Date(start_time).toLocaleString('tr-TR')}`,
            entity_type: 'meetings', entity_id: meeting.id, is_read: false,
          }))
        )
      }
    }
    return NextResponse.json({ ok: true, meeting, meetLink })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
