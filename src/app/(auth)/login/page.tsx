'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Zaten giriş yapmışsa dashboard'a yönlendir
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
      
      if (err) {
        setError('E-posta veya şifre hatalı: ' + err.message)
        setLoading(false)
        return
      }
      
      if (data.session) {
        // Hard redirect - kesin çalışır
        window.location.replace('/dashboard')
      }
    } catch (ex) {
      setError('Beklenmedik hata oluştu.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width:'100%', background:'#16181f', border:'1px solid rgba(255,255,255,0.06)',
    borderRadius:7, padding:'10px 12px', fontSize:13, color:'#dde1f0',
    outline:'none', fontFamily:'Inter,sans-serif'
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0c0e14',fontFamily:'Inter,sans-serif'}}>
      <div style={{background:'#111318',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:'40px 36px',width:380}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
          <div style={{width:34,height:34,background:'#e9a825',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><rect x="3" y="3" width="7" height="11" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'#dde1f0'}}>Agency ERP</div>
            <div style={{fontSize:10,color:'#3e4258'}}>Ajans Yönetim Sistemi</div>
          </div>
        </div>
        <h1 style={{fontSize:20,fontWeight:600,marginBottom:6,color:'#dde1f0'}}>Giriş Yap</h1>
        <p style={{fontSize:12.5,color:'#7b8099',marginBottom:24}}>Hesabınıza erişmek için giriş yapın</p>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{display:'block',fontSize:11.5,fontWeight:500,color:'#7b8099',marginBottom:6}}>E-posta</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="emir@ajans.com" style={inp}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:11.5,fontWeight:500,color:'#7b8099',marginBottom:6}}>Şifre</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" style={inp}/>
          </div>
          {error && <div style={{fontSize:12,color:'#f04444',background:'rgba(240,68,68,0.1)',padding:'8px 12px',borderRadius:6}}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            background:'#e9a825',color:'#000',fontWeight:700,fontSize:13,
            padding:'12px',borderRadius:7,border:'none',
            cursor:loading?'not-allowed':'pointer',
            opacity:loading?0.7:1,fontFamily:'Inter,sans-serif',marginTop:4
          }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}
