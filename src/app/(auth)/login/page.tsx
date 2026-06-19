'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)', fontFamily:'Inter,sans-serif', padding:20,
    }}>
      {/* Subtle dot grid */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none', opacity:.35,
        backgroundImage:'radial-gradient(circle, var(--c3) 1px, transparent 0)',
        backgroundSize:'28px 28px',
      }}/>

      <div style={{
        position:'relative', width:'100%', maxWidth:340,
        background:'var(--c1)', border:'1px solid var(--bdr)',
        borderRadius:8, overflow:'hidden',
        boxShadow:'0 16px 48px rgba(0,0,0,0.45)',
      }}>
        {/* Top gold line */}
        <div style={{height:1,background:'linear-gradient(90deg,transparent,var(--gold),transparent)'}}/>

        <div style={{padding:'24px 22px 28px'}}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:24}}>
            <div style={{
              width:28, height:28, borderRadius:5,
              background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <LayoutDashboard size={14} color="#000" strokeWidth={2}/>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--text)',letterSpacing:'-.2px',lineHeight:1.2}}>Agency ERP</div>
              <div style={{fontSize:9,color:'var(--t3)',marginTop:1}}>Operasyon Yönetimi</div>
            </div>
          </div>

          <div style={{fontSize:17,fontWeight:700,color:'var(--text)',marginBottom:4,letterSpacing:'-.25px'}}>Giriş Yap</div>
          <div style={{fontSize:11,color:'var(--t2)',marginBottom:20,lineHeight:1.5}}>Sisteme erişmek için kimlik doğrulamanız gerekiyor.</div>

          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <label style={{fontSize:10.5,fontWeight:600,color:'var(--t2)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em'}}>E-posta</label>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                placeholder="emir@ajans.com" className="inp"
              />
            </div>
            <div>
              <label style={{fontSize:10.5,fontWeight:600,color:'var(--t2)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em'}}>Şifre</label>
              <input
                type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                placeholder="••••••••" className="inp"
              />
            </div>

            {error && (
              <div style={{
                padding:'8px 11px', borderRadius:5,
                background:'var(--red-d)', color:'var(--red)',
                border:'1px solid rgba(224,82,82,0.15)',
                fontSize:11.5, fontWeight:500
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn"
              style={{width:'100%',justifyContent:'center',padding:'9px',fontSize:12.5,marginTop:2,fontWeight:600}}>
              {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}