import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const clamp = (v: unknown) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}
const clean = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

export async function POST(req: Request) {
  try {
    const b = await req.json()
    // honeypot: botlar bu alanı doldurur
    if (b.website) return NextResponse.json({ ok: true })

    const q1 = clamp(b.q1), q2 = clamp(b.q2), q3 = clamp(b.q3), q4 = clamp(b.q4)
    if (!q1 || !q2 || !q3 || !q4) {
      return NextResponse.json({ error: 'Lütfen tüm soruları puanlayın.' }, { status: 400 })
    }

    // Müşteriler giriş yapmadan katılır: anon anahtar + sadece INSERT izni (RLS politikası survey_insert_anon).
    // Servis anahtarına bağımlı değil; okuma/silme anonim için kapalı.
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { error } = await sb.from('survey_responses').insert({
      full_name: clean(b.full_name, 120),
      company: clean(b.company, 120),
      q1_satisfaction: q1,
      q2_creative: q2,
      q3_communication: q3,
      q4_process: q4,
      comment: clean(b.comment, 2000),
    })
    if (error) {
      console.error('survey insert error:', error.message)
      return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }
}
