'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 36px', width: 380 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 34, height: 34, background: 'var(--gold)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><rect x="3" y="3" width="7" height="11" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Panel</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>Ajans Yönetim Sistemi</div>
          </div>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Giriş Yap</h1>
        <p style={{ fontSize: 12.5, color: 'var(--t2)', marginBottom: 24 }}>Devam etmek için hesabınıza giriş yapın</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--t2)', marginBottom: 6 }}>E-posta</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="ornek@ajans.com"
              style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--t2)', marginBottom: 6 }}>Şifre</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(240,68,68,0.08)', padding: '8px 12px', borderRadius: 6 }}>{error}</p>}

          <button
            type="submit" disabled={loading}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 600, fontSize: 13, padding: '10px', borderRadius: 7, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif', marginTop: 4 }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
