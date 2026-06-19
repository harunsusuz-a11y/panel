'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Mail, Lock, ArrowRight } from 'lucide-react'

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: err } = await createClient().auth.signInWithPassword({ email, password })
    if (err) { setError('E-posta veya şifre hatalı.'); setLoading(false) }
    else if (data.session) window.location.replace('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'Inter,sans-serif', padding: 16, position: 'relative', overflow: 'hidden'
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--s4) 1px, transparent 0)',
        backgroundSize: '32px 32px', pointerEvents: 'none'
      }}/>
      {/* Gold glow */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 250, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(232,160,32,0.06) 0%, transparent 70%)',
      }}/>

      <div style={{
        position: 'relative', width: '100%', maxWidth: 380,
        background: 'var(--s1)', border: '1px solid var(--glass-border)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {/* Top accent */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}/>

        <div style={{ padding: '28px 28px 32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: 'var(--gold-g)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(232,160,32,0.3)',
            }}>
              <LayoutDashboard size={16} color="#000" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.2px' }}>Agency ERP</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>Operasyon Yönetimi</div>
            </div>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-.3px' }}>
            Giriş Yap
          </h1>
          <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 24, lineHeight: 1.5 }}>
            Hesabınıza erişmek için bilgilerinizi girin.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>E-posta</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--t3)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="emir@ajans.com" className="erp-input"
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>Şifre</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--t3)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" className="erp-input"
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '9px 12px', borderRadius: 7, background: 'var(--red-d)', color: 'var(--red)', fontSize: 12, fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="erp-btn"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4, fontSize: 13, gap: 8 }}>
              {loading ? 'Giriş yapılıyor...' : <><span>Giriş Yap</span><ArrowRight size={15} strokeWidth={2}/></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}