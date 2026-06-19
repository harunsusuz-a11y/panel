'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace('/dashboard')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError('E-posta veya şifre hatalı.'); setLoading(false); return }
      if (data.session) window.location.replace('/dashboard')
    } catch { setError('Beklenmedik hata oluştu.'); setLoading(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 9,
    padding: '11px 14px',
    fontSize: 13,
    color: '#e8ecf7',
    outline: 'none',
    fontFamily: 'Inter,sans-serif',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07090f',
      fontFamily: 'Inter,sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }}/>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300,
        background: 'radial-gradient(ellipse, rgba(240,180,41,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div style={{
        background: 'rgba(13,15,24,0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18,
        padding: '40px 38px',
        width: 390,
        position: 'relative',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(240,180,41,0.6), transparent)',
          borderRadius: 1,
        }}/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #f0b429 0%, #e8941a 100%)',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(240,180,41,0.35)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
              <rect x="3" y="3" width="7" height="11" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e8ecf7', letterSpacing: '-0.2px' }}>Agency ERP</div>
            <div style={{ fontSize: 10, color: '#3a3f57', fontWeight: 500, marginTop: 1 }}>Ajans Yönetim Sistemi</div>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8ecf7', marginBottom: 6, letterSpacing: '-0.3px' }}>Giriş Yap</h1>
        <p style={{ fontSize: 13, color: '#7882a0', marginBottom: 28, lineHeight: 1.5 }}>Hesabınıza erişmek için bilgilerinizi girin.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7882a0', marginBottom: 7 }}>E-posta</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="emir@ajans.com" style={inp}
              onFocus={e => (e.target.style.borderColor = 'rgba(240,180,41,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7882a0', marginBottom: 7 }}>Şifre</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••" style={inp}
              onFocus={e => (e.target.style.borderColor = 'rgba(240,180,41,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 12, color: '#f04444',
              background: 'rgba(240,68,68,0.1)',
              border: '1px solid rgba(240,68,68,0.2)',
              padding: '10px 14px', borderRadius: 8,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            background: 'linear-gradient(135deg, #f0b429 0%, #e8941a 100%)',
            color: '#000', fontWeight: 700, fontSize: 13.5,
            padding: '13px', borderRadius: 10, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'Inter,sans-serif',
            marginTop: 4,
            letterSpacing: '0.01em',
            boxShadow: '0 4px 16px rgba(240,180,41,0.25)',
            transition: 'opacity 0.2s, transform 0.1s',
          }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
          </button>
        </form>
      </div>
    </div>
  )
}