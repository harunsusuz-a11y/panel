'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import DaydreamLogo from '@/components/DaydreamLogo'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => {
    setMounted(true)
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
      <style>{`
        @keyframes anim-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .anim-up{animation:anim-up .4s cubic-bezier(.22,1,.36,1) both}
        @keyframes logo-in{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
        .logo-in{animation:logo-in .5s cubic-bezier(.22,1,.36,1) .1s both}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .logo-float{animation:float 4s ease-in-out infinite}
      `}</style>

      {/* dot grid bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
      {/* glow */}
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, pointerEvents: 'none', background: 'radial-gradient(ellipse, rgba(124,106,247,0.12) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>

        {/* Logo üstte */}
        <div className="logo-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div className="logo-float">
            <DaydreamLogo size={72} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx)', marginTop: 14, letterSpacing: '-.4px', lineHeight: 1.2 }}>
            Daydream Production
          </p>
          <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>Agency Operasyon Paneli</p>
        </div>

        <div className="card anim-up" style={{ overflow: 'hidden', animationDelay: '.15s' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--ac), #5b4de0, transparent)' }} />
          <div style={{ padding: '26px 24px 30px' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.3px', marginBottom: 4 }}>Giriş Yap</h1>
            <p style={{ fontSize: 12.5, color: 'var(--tx3)', marginBottom: 22 }}>Ekibinizle çalışmaya başlayın.</p>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label className="label">E-posta</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ad@daydream.com" className="inp" autoComplete="email" />
              </div>
              <div>
                <label className="label">Şifre</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="inp" autoComplete="current-password" />
              </div>
              {error && <div className="toast toast-err" style={{ margin: 0 }}>{error}</div>}
              <button type="submit" disabled={loading} className="btn"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4, fontSize: 13.5 }}>
                {loading ? 'Doğrulanıyor...' : <><span>Giriş Yap</span><ArrowRight size={15} strokeWidth={2} /></>}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--tx3)', marginTop: 20 }}>
          Daydream Production © 2026
        </p>
      </div>
    </div>
  )
}
