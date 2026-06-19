'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const inp: React.CSSProperties = { background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif', width:'100%' }

export default function AyarlarPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ full_name:'', phone:'', department:'' })
  const [pwForm, setPwForm] = useState({ new_pw:'', confirm_pw:'' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'profile'|'security'>('profile')

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(async({data:{user}})=>{
      setUser(user)
      if (user) {
        const {data:p} = await sb.from('profiles').select('*').eq('id',user.id).single()
        setProfile(p)
        setForm({ full_name:p?.full_name||'', phone:p?.phone||'', department:p?.department||'' })
      }
    })
  },[])

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    const sb = createClient()
    const {error} = await sb.from('profiles').update(form).eq('id',user.id)
    setSaving(false)
    setToast(error?'Hata: '+error.message:'Profil güncellendi!')
    setTimeout(()=>setToast(''),3000)
  }

  async function changePassword() {
    if (pwForm.new_pw !== pwForm.confirm_pw) { setToast('Şifreler eşleşmiyor!'); setTimeout(()=>setToast(''),3000); return }
    if (pwForm.new_pw.length < 6) { setToast('Şifre en az 6 karakter olmalı!'); setTimeout(()=>setToast(''),3000); return }
    setSaving(true)
    const {error} = await createClient().auth.updateUser({password: pwForm.new_pw})
    setSaving(false)
    setToast(error?'Hata: '+error.message:'Şifre değiştirildi!')
    setPwForm({new_pw:'',confirm_pw:''})
    setTimeout(()=>setToast(''),3000)
  }

  const ROLE_L: Record<string,string> = { admin:'Admin', manager:'Yönetici', member:'Üye' }
  const ROLE_C: Record<string,string> = { admin:'var(--gold)', manager:'var(--blue)', member:'var(--t2)' }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Sistem Ayarları"/>
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
        {toast && <div style={{marginBottom:12,padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')||toast.includes('eşleşm')||toast.includes('karakt')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')||toast.includes('eşleşm')||toast.includes('karakt')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600}}>{toast}</div>}
        
        {/* Profil kartı */}
        {profile && (
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,padding:'16px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:50,height:50,borderRadius:'50%',background:'var(--gold-g)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#000'}}>
                {(profile.full_name||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{profile.full_name||'İsimsiz'}</div>
                <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{user?.email}</div>
                <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:`${ROLE_C[profile.role]||'var(--t3)'}18`,color:ROLE_C[profile.role]||'var(--t3)',display:'inline-block',marginTop:4}}>
                  {ROLE_L[profile.role]||profile.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sekmeler */}
        <div style={{display:'flex',gap:6,marginBottom:14}}>
          {([['profile','Profil Bilgileri'],['security','Güvenlik']] as const).map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:'7px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
              background:tab===k?'var(--gold)':'var(--s2)',color:tab===k?'#000':'var(--t2)'}}>
              {l}
            </button>
          ))}
        </div>

        {tab==='profile' ? (
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,padding:'20px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Ad Soyad</label>
                <input value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Telefon</label>
                <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="0532 xxx xx xx" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Departman</label>
                <input value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>E-posta (değiştirilemez)</label>
                <input value={user?.email||''} disabled style={{...inp,opacity:0.5,cursor:'not-allowed'}}/>
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:'11px 20px',borderRadius:9,border:'none',cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1}}>
              {saving?'Kaydediliyor...':'Kaydet'}
            </button>
          </div>
        ) : (
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,padding:'20px'}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>Şifre Değiştir</div>
            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
              <div>
                <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Yeni Şifre</label>
                <input type="password" value={pwForm.new_pw} onChange={e=>setPwForm(p=>({...p,new_pw:e.target.value}))} placeholder="En az 6 karakter" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Şifre Tekrar</label>
                <input type="password" value={pwForm.confirm_pw} onChange={e=>setPwForm(p=>({...p,confirm_pw:e.target.value}))} placeholder="Şifreyi tekrar girin" style={inp}/>
              </div>
            </div>
            <button onClick={changePassword} disabled={saving||!pwForm.new_pw} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:'11px 20px',borderRadius:9,border:'none',cursor:(saving||!pwForm.new_pw)?'not-allowed':'pointer',opacity:(saving||!pwForm.new_pw)?0.5:1}}>
              {saving?'Değiştiriliyor...':'Şifreyi Değiştir'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}