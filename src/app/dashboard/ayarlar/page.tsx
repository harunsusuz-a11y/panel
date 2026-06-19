'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { User, Lock, MessageSquare, Mail, Building2, Send } from 'lucide-react'

const TABS = [
  { k:'profile',  l:'Profil',      Icon:User          },
  { k:'security', l:'Güvenlik',    Icon:Lock          },
  { k:'netgsm',   l:'Netgsm SMS',  Icon:MessageSquare },
  { k:'smtp',     l:'E-posta',     Icon:Mail          },
  { k:'company',  l:'Şirket',      Icon:Building2     },
] as const
type Tab = typeof TABS[number]['k']

export default function AyarlarPage() {
  const [user,    setUser]    = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tab,     setTab]     = useState<Tab>('profile')
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [testing, setTesting] = useState(false)

  const [profileForm, setProfileForm] = useState({ full_name:'', phone:'', department:'' })
  const [pwForm,      setPwForm]      = useState({ new_pw:'', confirm_pw:'' })
  const [netgsmForm,  setNetgsmForm]  = useState({ netgsm_username:'', netgsm_password:'', netgsm_header:'AJANSPANEL' })
  const [smtpForm,    setSmtpForm]    = useState({ smtp_host:'', smtp_port:'587', smtp_user:'', smtp_pass:'', smtp_from_name:'Agency ERP', smtp_from_email:'' })
  const [companyForm, setCompanyForm] = useState({ company_name:'', company_email:'', company_phone:'', company_address:'' })
  const [testPhone,   setTestPhone]   = useState('')

  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),4000) }

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(async({data:{user}})=>{
      if (!user) return
      setUser(user)
      const {data:p} = await sb.from('profiles').select('*').eq('id',user.id).single()
      setProfile(p)
      setProfileForm({ full_name:p?.full_name||'', phone:p?.phone||'', department:p?.department||'' })
    })
    sb.from('system_settings').select('key,value').then(({data})=>{
      if (!data) return
      const m: Record<string,string> = {}
      data.forEach((x:any)=>{ m[x.key]=x.value||'' })
      setNetgsmForm({ netgsm_username:m.netgsm_username||'', netgsm_password:m.netgsm_password||'', netgsm_header:m.netgsm_header||'AJANSPANEL' })
      setSmtpForm({ smtp_host:m.smtp_host||'', smtp_port:m.smtp_port||'587', smtp_user:m.smtp_user||'', smtp_pass:m.smtp_pass||'', smtp_from_name:m.smtp_from_name||'Agency ERP', smtp_from_email:m.smtp_from_email||'' })
      setCompanyForm({ company_name:m.company_name||'', company_email:m.company_email||'', company_phone:m.company_phone||'', company_address:m.company_address||'' })
    })
  },[])

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    const {error} = await createClient().from('profiles').update(profileForm).eq('id',user.id)
    setSaving(false)
    showToast(error?'Hata: '+error.message:'Profil güncellendi!')
  }

  async function changePassword() {
    if (pwForm.new_pw!==pwForm.confirm_pw) { showToast('Hata: Şifreler eşleşmiyor'); return }
    if (pwForm.new_pw.length<6) { showToast('Hata: En az 6 karakter'); return }
    setSaving(true)
    const {error} = await createClient().auth.updateUser({password:pwForm.new_pw})
    setSaving(false)
    if (error) showToast('Hata: '+error.message)
    else { showToast('Şifre değiştirildi!'); setPwForm({new_pw:'',confirm_pw:''}) }
  }

  async function saveSettings(keys: Record<string,string>) {
    setSaving(true)
    const sb = createClient()
    const updates = Object.entries(keys).map(([k,v]) =>
      sb.from('system_settings').upsert({key:k,value:v},{onConflict:'key'})
    )
    await Promise.all(updates)
    setSaving(false)
    showToast('Ayarlar kaydedildi!')
  }

  async function testNetgsm() {
    if (!testPhone.trim()) { showToast('Hata: Telefon numarası girin'); return }
    if (!netgsmForm.netgsm_username||!netgsmForm.netgsm_password) { showToast('Hata: Netgsm bilgilerini önce kaydedin'); return }
    setTesting(true)
    try {
      const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${netgsmForm.netgsm_username}&password=${netgsmForm.netgsm_password}&gsmno=${testPhone.replace(/\s/g,'')}&message=Agency ERP - Netgsm baglantisi basarili!&msgheader=${netgsmForm.netgsm_header||'AJANSPANEL'}&dil=TR`
      const res = await fetch(url)
      const text = await res.text()
      if (text.startsWith('00')||text.startsWith('01')) showToast('✓ Test SMS gönderildi!')
      else showToast('Netgsm yanıtı: '+text+' (Netgsm hata kodlarını kontrol edin)')
    } catch(e:any) { showToast('Hata: '+e.message) }
    setTesting(false)
  }

  const ROLE_L: Record<string,string> = { admin:'Admin', manager:'Yönetici', member:'Üye' }

  const Field = ({label,children}:{label:string;children:React.ReactNode}) => (
    <div>
      <label className="modal-label">{label}</label>
      {children}
    </div>
  )

  return (
    <>
      <style>{`
        .set-tabs{display:flex;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;}
        .set-tab{padding:11px 16px;font-size:13px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--text-dim);border-bottom:2px solid transparent;display:flex;align-items:center;gap:7px;transition:color .12s;}
        .set-tab:hover{color:var(--text);}
        .set-tab.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600;}
        @media(max-width:600px){.set-tab span{display:none}}
      `}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Ayarlar"/>
        {toast && <div className={`toast ${toast.startsWith('Hata')?'err':'ok'}`}>{toast}</div>}

        <div className="set-tabs">
          {TABS.map(({k,l,Icon})=>(
            <button key={k} className={`set-tab${tab===k?' active':''}`} onClick={()=>setTab(k)}>
              <Icon size={14} strokeWidth={1.8}/><span>{l}</span>
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'20px 22px 80px',maxWidth:600}}>

          {/* ── Profil ── */}
          {tab==='profile' && profile && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:14,padding:'16px 18px',borderRadius:12,border:'1px solid var(--border)',background:'var(--surface)',marginBottom:4}}>
                <div style={{width:46,height:46,borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {(profile.full_name||'?').split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div>
                  <div style={{fontSize:15,fontWeight:700}}>{profile.full_name||'İsimsiz'}</div>
                  <div style={{fontSize:12,color:'var(--text-dim)',marginTop:2}}>{user?.email}</div>
                  <span className={`badge ${profile.role==='admin'?'badge-accent':profile.role==='manager'?'badge-blue':'badge'}`} style={profile.role==='member'?{background:'var(--surface-2)',color:'var(--text-faint)'}:{}}>
                    {ROLE_L[profile.role]||profile.role}
                  </span>
                </div>
              </div>
              <div className="modal-grid">
                <Field label="Ad Soyad"><input value={profileForm.full_name} onChange={e=>setProfileForm(p=>({...p,full_name:e.target.value}))}/></Field>
                <Field label="Telefon"><input value={profileForm.phone} onChange={e=>setProfileForm(p=>({...p,phone:e.target.value}))} placeholder="05XX XXX XX XX"/></Field>
                <Field label="Departman" ><input value={profileForm.department} onChange={e=>setProfileForm(p=>({...p,department:e.target.value}))}/></Field>
                <Field label="E-posta"><input value={user?.email||''} disabled style={{opacity:.5,cursor:'not-allowed'}}/></Field>
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn" style={{alignSelf:'flex-start',padding:'9px 20px'}}>
                {saving?'Kaydediliyor...':'Kaydet'}
              </button>
            </div>
          )}

          {/* ── Güvenlik ── */}
          {tab==='security' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{fontSize:13.5,fontWeight:600,marginBottom:4}}>Şifre Değiştir</div>
              <Field label="Yeni Şifre"><input type="password" value={pwForm.new_pw} onChange={e=>setPwForm(p=>({...p,new_pw:e.target.value}))} placeholder="En az 6 karakter"/></Field>
              <Field label="Şifre Tekrar"><input type="password" value={pwForm.confirm_pw} onChange={e=>setPwForm(p=>({...p,confirm_pw:e.target.value}))} placeholder="Şifreyi tekrar girin"/></Field>
              <button onClick={changePassword} disabled={saving||!pwForm.new_pw} className="btn" style={{alignSelf:'flex-start',padding:'9px 20px',opacity:(!pwForm.new_pw||saving)?.5:1}}>
                {saving?'Değiştiriliyor...':'Şifreyi Değiştir'}
              </button>
            </div>
          )}

          {/* ── Netgsm ── */}
          {tab==='netgsm' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{padding:'12px 14px',borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)',fontSize:13,color:'var(--text-dim)',lineHeight:1.7,marginBottom:4}}>
                📱 <strong>Netgsm SMS API</strong> bilgilerinizi girin. Otomasyonlarda ve gecikme bildirimlerinde SMS göndermek için kullanılır.<br/>
                API bilgilerinizi <a href="https://www.netgsm.com.tr" target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>netgsm.com.tr</a> panelinden alabilirsiniz.
              </div>
              <Field label="Kullanıcı Adı (API)"><input value={netgsmForm.netgsm_username} onChange={e=>setNetgsmForm(p=>({...p,netgsm_username:e.target.value}))} placeholder="Netgsm kullanıcı adı" autoComplete="off"/></Field>
              <Field label="Şifre (API)"><input type="password" value={netgsmForm.netgsm_password} onChange={e=>setNetgsmForm(p=>({...p,netgsm_password:e.target.value}))} placeholder="Netgsm API şifresi" autoComplete="new-password"/></Field>
              <Field label="SMS Başlığı (Msgheader)">
                <input value={netgsmForm.netgsm_header} onChange={e=>setNetgsmForm(p=>({...p,netgsm_header:e.target.value}))} placeholder="AJANSPANEL" maxLength={11}/>
                <div style={{fontSize:11,color:'var(--text-faint)',marginTop:5}}>Netgsm panelinde tanımlanmış başlık (maks. 11 karakter)</div>
              </Field>

              <div style={{display:'flex',gap:8,alignItems:'flex-start',flexWrap:'wrap'}}>
                <button onClick={()=>saveSettings(netgsmForm)} disabled={saving} className="btn" style={{padding:'9px 20px'}}>
                  {saving?'Kaydediliyor...':'Kaydet'}
                </button>
                <div style={{display:'flex',gap:8,alignItems:'center',flex:1,minWidth:200}}>
                  <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="Test numarası: 05XX..." style={{flex:1}}/>
                  <button onClick={testNetgsm} disabled={testing||!netgsmForm.netgsm_username} className="btn-ghost" style={{display:'flex',alignItems:'center',gap:5,fontSize:13,whiteSpace:'nowrap',flexShrink:0}}>
                    <Send size={13}/>{testing?'Gönderiliyor...':'Test SMS'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SMTP ── */}
          {tab==='smtp' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{padding:'12px 14px',borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)',fontSize:13,color:'var(--text-dim)',lineHeight:1.7,marginBottom:4}}>
                📧 <strong>E-posta (SMTP)</strong> ayarlarını girin. Otomatik e-posta gönderimi için kullanılır.<br/>
                Örn: Gmail için host: <code style={{background:'var(--surface-3)',padding:'1px 5px',borderRadius:4}}>smtp.gmail.com</code>, port: <code style={{background:'var(--surface-3)',padding:'1px 5px',borderRadius:4}}>587</code>
              </div>
              <div className="modal-grid">
                <Field label="SMTP Host"><input value={smtpForm.smtp_host} onChange={e=>setSmtpForm(p=>({...p,smtp_host:e.target.value}))} placeholder="smtp.gmail.com"/></Field>
                <Field label="Port"><input value={smtpForm.smtp_port} onChange={e=>setSmtpForm(p=>({...p,smtp_port:e.target.value}))} placeholder="587"/></Field>
                <Field label="Kullanıcı Adı"><input value={smtpForm.smtp_user} onChange={e=>setSmtpForm(p=>({...p,smtp_user:e.target.value}))} placeholder="mail@sirket.com"/></Field>
                <Field label="Şifre"><input type="password" value={smtpForm.smtp_pass} onChange={e=>setSmtpForm(p=>({...p,smtp_pass:e.target.value}))} autoComplete="new-password"/></Field>
                <Field label="Gönderen Adı"><input value={smtpForm.smtp_from_name} onChange={e=>setSmtpForm(p=>({...p,smtp_from_name:e.target.value}))} placeholder="Agency ERP"/></Field>
                <Field label="Gönderen E-posta"><input value={smtpForm.smtp_from_email} onChange={e=>setSmtpForm(p=>({...p,smtp_from_email:e.target.value}))} placeholder="noreply@sirket.com"/></Field>
              </div>
              <button onClick={()=>saveSettings(smtpForm)} disabled={saving} className="btn" style={{alignSelf:'flex-start',padding:'9px 20px'}}>
                {saving?'Kaydediliyor...':'Kaydet'}
              </button>
            </div>
          )}

          {/* ── Şirket ── */}
          {tab==='company' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <Field label="Şirket Adı"><input value={companyForm.company_name} onChange={e=>setCompanyForm(p=>({...p,company_name:e.target.value}))}/></Field>
              <div className="modal-grid">
                <Field label="E-posta"><input value={companyForm.company_email} onChange={e=>setCompanyForm(p=>({...p,company_email:e.target.value}))}/></Field>
                <Field label="Telefon"><input value={companyForm.company_phone} onChange={e=>setCompanyForm(p=>({...p,company_phone:e.target.value}))}/></Field>
              </div>
              <Field label="Adres"><textarea value={companyForm.company_address} onChange={e=>setCompanyForm(p=>({...p,company_address:e.target.value}))} rows={3}/></Field>
              <button onClick={()=>saveSettings(companyForm)} disabled={saving} className="btn" style={{alignSelf:'flex-start',padding:'9px 20px'}}>
                {saving?'Kaydediliyor...':'Kaydet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}