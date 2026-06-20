'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { User, Lock, MessageSquare, Mail, Building2, Send } from 'lucide-react'

const TABS = [
  {k:'profile', l:'Profil',     Icon:User},
  {k:'security',l:'Güvenlik',   Icon:Lock},
  {k:'netgsm',  l:'Netgsm SMS', Icon:MessageSquare},
  {k:'smtp',    l:'E-posta',    Icon:Mail},
  {k:'company', l:'Şirket',     Icon:Building2},
] as const
type Tab = typeof TABS[number]['k']

export default function AyarlarPage() {
  const [user, setUser]         = useState<any>(null)
  const [profile, setProfile]   = useState<any>(null)
  const [tab, setTab]           = useState<Tab>('profile')
  const [saving, setSaving]     = useState(false)
  const [testing, setTesting]   = useState(false)
  const [toast, setToast]       = useState('')
  const [profileForm, setProfileForm] = useState({full_name:'',phone:'',department:''})
  const [pwForm, setPwForm]     = useState({new_pw:'',confirm_pw:''})
  const [netgsm, setNetgsm]     = useState({netgsm_username:'',netgsm_password:'',netgsm_header:'AJANSPANEL'})
  const [smtp, setSmtp]         = useState({smtp_host:'',smtp_port:'587',smtp_user:'',smtp_pass:'',smtp_from_name:'Agency ERP',smtp_from_email:''})
  const [company, setCompany]   = useState({company_name:'',company_email:'',company_phone:'',company_address:''})
  const [testPhone, setTestPhone] = useState('')

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),4000) }

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(async({data:{user}})=>{
      if (!user) return
      setUser(user)
      const {data:p} = await sb.from('profiles').select('*').eq('id',user.id).single()
      setProfile(p)
      setProfileForm({full_name:p?.full_name||'',phone:p?.phone||'',department:p?.department||''})
    })
    sb.from('system_settings').select('key,value').then(({data})=>{
      if (!data) return
      const m:Record<string,string>={};data.forEach((x:any)=>{m[x.key]=x.value||''})
      setNetgsm({netgsm_username:m.netgsm_username||'',netgsm_password:m.netgsm_password||'',netgsm_header:m.netgsm_header||'AJANSPANEL'})
      setSmtp({smtp_host:m.smtp_host||'',smtp_port:m.smtp_port||'587',smtp_user:m.smtp_user||'',smtp_pass:m.smtp_pass||'',smtp_from_name:m.smtp_from_name||'Agency ERP',smtp_from_email:m.smtp_from_email||''})
      setCompany({company_name:m.company_name||'',company_email:m.company_email||'',company_phone:m.company_phone||'',company_address:m.company_address||''})
    })
  },[])

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    const {error} = await createClient().from('profiles').update(profileForm).eq('id',user.id)
    setSaving(false); showToast(error?'Hata: '+error.message:'Profil güncellendi!')
  }

  async function changePassword() {
    if (pwForm.new_pw!==pwForm.confirm_pw){showToast('Hata: Şifreler eşleşmiyor');return}
    if (pwForm.new_pw.length<6){showToast('Hata: En az 6 karakter');return}
    setSaving(true)
    const {error} = await createClient().auth.updateUser({password:pwForm.new_pw})
    setSaving(false)
    if (error) showToast('Hata: '+error.message)
    else {showToast('Şifre değiştirildi!');setPwForm({new_pw:'',confirm_pw:''})}
  }

  async function saveSettings(keys:Record<string,string>) {
    setSaving(true)
    await Promise.all(Object.entries(keys).map(([k,v])=>createClient().from('system_settings').upsert({key:k,value:v},{onConflict:'key'})))
    setSaving(false); showToast('Ayarlar kaydedildi!')
  }

  async function testNetgsm() {
    if (!testPhone.trim()){showToast('Hata: Telefon girin');return}
    if (!netgsm.netgsm_username){showToast('Hata: Önce bilgileri kaydedin');return}
    setTesting(true)
    try {
      const url=`https://api.netgsm.com.tr/sms/send/get/?usercode=${netgsm.netgsm_username}&password=${netgsm.netgsm_password}&gsmno=${testPhone.replace(/\s/g,'')}&message=Agency ERP test!&msgheader=${netgsm.netgsm_header}&dil=TR`
      const res=await fetch(url); const text=await res.text()
      showToast(text.startsWith('00')||text.startsWith('01')?'✓ SMS gönderildi!':'Netgsm yanıtı: '+text)
    } catch(e:any){showToast('Hata: '+e.message)}
    setTesting(false)
  }

  const ROLE_L:Record<string,string>={admin:'Admin',manager:'Yönetici',member:'Üye'}

  return (
    <>
      <style>{`.set-tabs{display:flex;border-bottom:1px solid var(--bdr);background:var(--s1);flex-shrink:0;overflow-x:auto}.set-tab{padding:11px 15px;font-size:12.5px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--tx2);border-bottom:2px solid transparent;display:flex;align-items:center;gap:6px;white-space:nowrap;transition:color .12s}.set-tab:hover{color:var(--tx)}.set-tab.active{color:var(--ac);border-bottom-color:var(--ac);font-weight:600}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Ayarlar"/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}
        <div className="set-tabs">
          {TABS.map(({k,l,Icon})=>(
            <button key={k} className={`set-tab${tab===k?' active':''}`} onClick={()=>setTab(k)}>
              <Icon size={13} strokeWidth={1.8}/>{l}
            </button>
          ))}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'20px',maxWidth:580}}>

          {tab==='profile'&&profile&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:10,border:'1px solid var(--bdr)',background:'var(--s1)',marginBottom:4}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,var(--ac),#5b4de0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {(profile.full_name||'?').split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div>
                  <p style={{fontSize:15,fontWeight:700}}>{profile.full_name||'—'}</p>
                  <p style={{fontSize:12.5,color:'var(--tx2)',marginTop:2}}>{user?.email}</p>
                  <span className={`badge ${profile.role==='admin'?'badge-ac':profile.role==='manager'?'badge-blue':'badge-muted'}`}>{ROLE_L[profile.role]||profile.role}</span>
                </div>
              </div>
              <div className="modal-grid">
                <div><label className="label">Ad Soyad</label><input value={profileForm.full_name} onChange={e=>setProfileForm(p=>({...p,full_name:e.target.value}))} className="inp"/></div>
                <div><label className="label">Telefon</label><input value={profileForm.phone} onChange={e=>setProfileForm(p=>({...p,phone:e.target.value}))} className="inp"/></div>
                <div><label className="label">Departman</label><input value={profileForm.department} onChange={e=>setProfileForm(p=>({...p,department:e.target.value}))} className="inp"/></div>
                <div><label className="label">E-posta</label><input value={user?.email||''} disabled className="inp" style={{opacity:.5}}/></div>
              </div>
              <button className="btn" onClick={saveProfile} disabled={saving} style={{alignSelf:'flex-start',padding:'8px 18px'}}>{saving?'Kaydediliyor...':'Kaydet'}</button>
            </div>
          )}

          {tab==='security'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <p style={{fontSize:14,fontWeight:600,marginBottom:4}}>Şifre Değiştir</p>
              <div><label className="label">Yeni Şifre</label><input type="password" value={pwForm.new_pw} onChange={e=>setPwForm(p=>({...p,new_pw:e.target.value}))} placeholder="En az 6 karakter" className="inp"/></div>
              <div><label className="label">Şifre Tekrar</label><input type="password" value={pwForm.confirm_pw} onChange={e=>setPwForm(p=>({...p,confirm_pw:e.target.value}))} className="inp"/></div>
              <button className="btn" onClick={changePassword} disabled={saving||!pwForm.new_pw} style={{alignSelf:'flex-start',padding:'8px 18px',opacity:(!pwForm.new_pw||saving)?.5:1}}>{saving?'Değiştiriliyor...':'Şifreyi Değiştir'}</button>
            </div>
          )}

          {tab==='netgsm'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{padding:'12px 14px',borderRadius:9,background:'var(--s2)',border:'1px solid var(--bdr)',fontSize:13,color:'var(--tx2)',lineHeight:1.7,marginBottom:4}}>
                📱 <strong>Netgsm SMS API</strong> bilgilerini girin. Otomasyonlarda ve gecikme bildirimlerinde kullanılır.
              </div>
              <div><label className="label">Kullanıcı Adı</label><input value={netgsm.netgsm_username} onChange={e=>setNetgsm(p=>({...p,netgsm_username:e.target.value}))} className="inp" autoComplete="off"/></div>
              <div><label className="label">Şifre</label><input type="password" value={netgsm.netgsm_password} onChange={e=>setNetgsm(p=>({...p,netgsm_password:e.target.value}))} className="inp" autoComplete="new-password"/></div>
              <div><label className="label">SMS Başlığı (max 11 karakter)</label><input value={netgsm.netgsm_header} onChange={e=>setNetgsm(p=>({...p,netgsm_header:e.target.value}))} className="inp" maxLength={11}/></div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="btn" onClick={()=>saveSettings(netgsm)} disabled={saving} style={{padding:'8px 18px'}}>{saving?'Kaydediliyor...':'Kaydet'}</button>
                <div style={{display:'flex',gap:6,flex:1,minWidth:200}}>
                  <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="Test: 05XX..." className="inp" style={{flex:1}}/>
                  <button className="btn-ghost" onClick={testNetgsm} disabled={testing||!netgsm.netgsm_username} style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                    <Send size={13}/>{testing?'Gönderiliyor...':'Test SMS'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab==='smtp'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{padding:'12px 14px',borderRadius:9,background:'var(--s2)',border:'1px solid var(--bdr)',fontSize:13,color:'var(--tx2)',lineHeight:1.7,marginBottom:4}}>
                📧 <strong>SMTP</strong> ayarlarını girin. Gmail: <code style={{background:'var(--s3)',padding:'1px 5px',borderRadius:4}}>smtp.gmail.com</code> / 587
              </div>
              <div className="modal-grid">
                <div><label className="label">Host</label><input value={smtp.smtp_host} onChange={e=>setSmtp(p=>({...p,smtp_host:e.target.value}))} className="inp" placeholder="smtp.gmail.com"/></div>
                <div><label className="label">Port</label><input value={smtp.smtp_port} onChange={e=>setSmtp(p=>({...p,smtp_port:e.target.value}))} className="inp"/></div>
                <div><label className="label">Kullanıcı</label><input value={smtp.smtp_user} onChange={e=>setSmtp(p=>({...p,smtp_user:e.target.value}))} className="inp"/></div>
                <div><label className="label">Şifre</label><input type="password" value={smtp.smtp_pass} onChange={e=>setSmtp(p=>({...p,smtp_pass:e.target.value}))} className="inp"/></div>
                <div><label className="label">Gönderen Adı</label><input value={smtp.smtp_from_name} onChange={e=>setSmtp(p=>({...p,smtp_from_name:e.target.value}))} className="inp"/></div>
                <div><label className="label">Gönderen Mail</label><input value={smtp.smtp_from_email} onChange={e=>setSmtp(p=>({...p,smtp_from_email:e.target.value}))} className="inp"/></div>
              </div>
              <button className="btn" onClick={()=>saveSettings(smtp)} disabled={saving} style={{alignSelf:'flex-start',padding:'8px 18px'}}>{saving?'Kaydediliyor...':'Kaydet'}</button>
            </div>
          )}

          {tab==='company'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div><label className="label">Şirket Adı</label><input value={company.company_name} onChange={e=>setCompany(p=>({...p,company_name:e.target.value}))} className="inp"/></div>
              <div className="modal-grid">
                <div><label className="label">E-posta</label><input value={company.company_email} onChange={e=>setCompany(p=>({...p,company_email:e.target.value}))} className="inp"/></div>
                <div><label className="label">Telefon</label><input value={company.company_phone} onChange={e=>setCompany(p=>({...p,company_phone:e.target.value}))} className="inp"/></div>
              </div>
              <div><label className="label">Adres</label><textarea value={company.company_address} onChange={e=>setCompany(p=>({...p,company_address:e.target.value}))} className="inp" rows={3}/></div>
              <button className="btn" onClick={()=>saveSettings(company)} disabled={saving} style={{alignSelf:'flex-start',padding:'8px 18px'}}>{saving?'Kaydediliyor...':'Kaydet'}</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
