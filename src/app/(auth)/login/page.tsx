'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace('/dashboard')
    })
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: err } = await createClient().auth.signInWithPassword({ email, password })
    if (err) { setError('E-posta veya şifre hatalı.'); setLoading(false) }
    else if (data.session) window.location.replace('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20, position: 'relative',
    }}>
      {/* dot grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }} />
      {/* glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 200, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(124,106,247,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
        <div className="card anim-up" style={{ overflow: 'hidden' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ac), transparent)' }} />
          <div style={{ padding: '26px 24px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
              <div className="sb-mark" style={{ width: 30, height: 30, borderRadius: 8 }}>
                <LayoutDashboard size={14} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--tx)', lineHeight: 1.2 }}>Agency ERP</p>
                <p style={{ fontSize: 9.5, color: 'var(--tx3)', marginTop: 2 }}>Operasyon Paneli</p>
              </div>
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.4px', marginBottom: 5 }}>Giriş Yap</h1>
            <p style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 22, lineHeight: 1.5 }}>
              Hesabınıza erişmek için bilgilerinizi girin.
            </p>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label className="label">E-posta</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="emir@ajans.com" className="inp" />
              </div>
              <div>
                <label className="label">Şifre</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="inp" />
              </div>
              {error && (
                <div className="toast toast-err" style={{ margin: 0 }}>{error}</div>
              )}
              <button type="submit" disabled={loading} className="btn"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 4, fontSize: 13.5 }}>
                {loading ? 'Doğrulanıyor...' : <><span>Giriş Yap</span><ArrowRight size={15} strokeWidth={2} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
