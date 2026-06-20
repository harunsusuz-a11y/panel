'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)', padding: 20, position: 'relative' }}
    >
      {/* dot grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
        {/* Card */}
        <div
          className="erp-card"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          {/* top accent line */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

          <div style={{ padding: '26px 24px 30px' }}>
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-7">
              <div
                className="erp-sidebar-mark flex-shrink-0"
                style={{ width: 30, height: 30, borderRadius: 7 }}
              >
                <LayoutDashboard size={14} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
                  Agency ERP
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                  Operasyon Paneli
                </p>
              </div>
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 5 }}>
              Giriş Yap
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22, lineHeight: 1.5 }}>
              Hesabınıza erişmek için bilgilerinizi girin.
            </p>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label className="erp-label">E-posta</label>
                <input
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="emir@ajans.com"
                  className="erp-input"
                />
              </div>
              <div>
                <label className="erp-label">Şifre</label>
                <input
                  type="password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="erp-input"
                />
              </div>

              {error && (
                <div className="erp-toast erp-toast-err" style={{ margin: 0 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="erp-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 13.5, marginTop: 3 }}
              >
                {loading ? 'Doğrulanıyor...' : (
                  <>Giriş Yap <ArrowRight size={15} strokeWidth={2} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}