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
    createClient().auth.getSession().then(({data:{session}}) => {
      if (session) window.location.replace('/dashboard')
    })
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const {data,error:err} = await createClient().auth.signInWithPassword({email,password})
    if (err) { setError('E-posta veya şifre hatalı.'); setLoading(false) }
    else if (data.session) window.location.replace('/dashboard')
  }

  return (
    <div style={{
      minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--bg)',padding:20,position:'relative',
    }}>
      {/* Grid bg */}
      <div style={{
        position:'fixed',inset:0,pointerEvents:'none',
        backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 0)',
        backgroundSize:'30px 30px',
      }}/>
      {/* Glow */}
      <div style={{
        position:'fixed',top:'20%',left:'50%',transform:'translateX(-50%)',
        width:500,height:200,pointerEvents:'none',
        background:'radial-gradient(ellipse,rgba(99,102,241,0.06) 0%,transparent 70%)',
      }}/>

      <div style={{
        position:'relative',width:'100%',maxWidth:380,
        background:'var(--surface)',
        border:'1px solid var(--border-strong)',
        borderRadius:20,overflow:'hidden',
        boxShadow:'0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{padding:'28px 26px 32px'}}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:28}}>
            <div style={{
              width:34,height:34,borderRadius:9,
              background:'var(--accent)',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <LayoutDashboard size={16} color="#fff" strokeWidth={2}/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text)',letterSpacing:'-.2px',lineHeight:1.2}}>Agency ERP</div>
              <div style={{fontSize:11,color:'var(--text-faint)',marginTop:2}}>Operasyon Yönetimi</div>
            </div>
          </div>

          <div className="page-title" style={{fontSize:22,marginBottom:6}}>Giriş Yap</div>
          <div style={{fontSize:13.5,color:'var(--text-dim)',marginBottom:24,lineHeight:1.5}}>
            Hesabınıza erişmek için kimlik doğrulamanız gerekiyor.
          </div>

          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{fontSize:12,fontWeight:500,color:'var(--text-dim)',display:'block',marginBottom:7}}>E-posta</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="emir@ajans.com"/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:500,color:'var(--text-dim)',display:'block',marginBottom:7}}>Şifre</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/>
            </div>

            {error && (
              <div style={{
                padding:'10px 14px',borderRadius:10,
                background:'var(--red-soft)',color:'var(--red)',
                border:'1px solid rgba(248,113,113,0.2)',
                fontSize:13,fontWeight:500
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn" style={{width:'100%',justifyContent:'center',padding:'11px',marginTop:4,fontSize:14}}>
              {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}