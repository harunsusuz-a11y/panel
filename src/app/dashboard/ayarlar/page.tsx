'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { User, Lock, MessageSquare, Mail, Building2, Send, CheckCircle2 } from 'lucide-react'

const TABS = [
  { k:'profile',  l:'Profil',     Icon:User          },
  { k:'security', l:'Güvenlik',   Icon:Lock          },
  { k:'netgsm',   l:'Netgsm SMS', Icon:MessageSquare },
  { k:'smtp',     l:'E-posta',    Icon:Mail          },
  { k:'company',  l:'Şirket',     Icon:Building2     },
] as const
type Tab = typeof TABS[number]['k']

export default function AyarlarPage() {
  const [user,    setUser]    = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tab,     setTab]     = useState<Tab>('profile')
  const [saving,  setSaving]  = useState(false)
  const [testing, setTesting] = useState(false)
  const [toast,   setToast]   = useState('')

  const [pf, setPf] = useState({ full_name:'', phone:'', department:'' })
  const [pw, setPw] = useState({ new_pw:'', confirm_pw:'' })
  const [ng, setNg] = useState({ netgsm_username:'', netgsm_password:'', netgsm_header:'AJANSPANEL' })
  const [sm, setSm] = useState({ smtp_host:'', smtp_port:'587', smtp_user:'', smtp_pass:'', smtp_from_name:'Agency ERP', smtp_from_email:'' })
  const [co, setCo] = useState({ company_name:'', company_email:'', company_phone:'', company_address:'' })
  const [testPhone, setTestPhone] = useState('')

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),4000) }

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(async({data:{user}})=>{
      if (!user) return
      setUser(user)
      const {data:p} = await sb.from('profiles').select('*').eq('id',user.id).single()
      setProfile(p)
      setPf({full_name:p?.full_name||'',phone:p?.phone||'',department:p?.department||''})
    })
    sb.from('system_settings').select('key,value').then(({data})=>{
      const m:Record<string,string>={}
      ;(data||[]).forEach((x:any)=>{m[x.key]=x.value||''})
      setNg({netgsm_username:m.netgsm_username||'',netgsm_password:m.netgsm_password||'',netgsm_header:m.netgsm_header||'AJANSPANEL'})
      setSm({smtp_host:m.smtp_host||'',smtp_port:m.smtp_port||'587',smtp_user:m.smtp_user||'',smtp_pass:m.smtp_pass||'',smtp_from_name:m.smtp_from_name||'Agency ERP',smtp_from_email:m.smtp_from_email||''})
      setCo({company_name:m.company_name||'',company_email:m.company_email||'',company_phone:m.company_phone||'',company_address:m.company_address||''})
    })
  },[])

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    const {error} = await createClient().from('profiles').update(pf).eq('id',user.id)
    setSaving(false)
    showToast(error?'Hata: '+error.message:'✓ Profil güncellendi!')
  }

  async function changePassword() {
    if (pw.new_pw!==pw.confirm_pw){showToast('Hata: Şifreler eşleşmiyor');return}
    if (pw.new_pw.length<6){showToast('Hata: En az 6 karakter');return}
    setSaving(true)
    const {error} = await createClient().auth.updateUser({password:pw.new_pw})
    setSaving(false)
    if (error) showToast('Hata: '+error.message)
    else {showToast('✓ Şifre değiştirildi!');setPw({new_pw:'',confirm_pw:''})}
  }

  async function saveSettings(keys:Record<string,string>) {
    setSaving(true)
    await Promise.all(Object.entries(keys).map(([k,v])=>
      createClient().from('system_settings').upsert({key:k,value:v},{onConflict:'key'})
    ))
    setSaving(false)
    showToast('✓ Ayarlar kaydedildi!')
  }

  async function testNetgsm() {
    if (!testPhone.trim()){showToast('Hata: Telefon numarası girin');return}
    if (!ng.netgsm_username){showToast('Hata: Önce bilgileri kaydedin');return}
    setTesting(true)
    try {
      const url=`https://api.netgsm.com.tr/sms/send/get/?usercode=${ng.netgsm_username}&password=${ng.netgsm_password}&gsmno=${testPhone.replace(/\s/g,'')}&message=Agency ERP - baglanti testi basarili!&msgheader=${ng.netgsm_header||'AJANSPANEL'}&dil=TR`
      const res=await fetch(url); const txt=await res.text()
      if(txt.startsWith('00')||txt.startsWith('01')) showToast('✓ Test SMS gönderildi!')
      else showToast('Netgsm yanıtı: '+txt)
    } catch(e:any){showToast('Hata: '+e.message)}
    setTesting(false)
  }

  const RL:Record<string,string>={admin:'Admin',manager:'Yönetici',member:'Üye'}
  const netgsmOk = ng.netgsm_username && ng.netgsm_password
  const smtpOk   = sm.smtp_host && sm.smtp_user

  return (
    <>
      <style>{`
        .st{display:flex;border-bottom:1px solid var(--bdr);background:var(--s1);flex-shrink:0;overflow-x:auto}
        .st::-webkit-scrollbar{height:0}
        .sta{padding:10px 16px;font-size:12.5px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--tx2);border-bottom:2px solid transparent;display:flex;align-items:center;gap:6px;white-space:nowrap;transition:color .12s}
        .sta:hover{color:var(--tx)}
        .sta.on{color:var(--ac);border-bottom-color:var(--ac);font-weight:600}
        .sta.on .si{color:var(--ac)}
        .si{color:var(--tx3)}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Ayarlar"/>
        {toast && (
          <div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>
        )}

        {/* Tab bar */}
        <div className="st">
          {TABS.map(({k,l,Icon})=>(
            <button key={k} className={`sta${tab===k?' on':''}`} onClick={()=>setTab(k)}>
              <Icon size={13} className="si" strokeWidth={1.8}/>{l}
              {k==='netgsm'&&(
                <span style={{width:7,height:7,borderRadius:'50%',background:netgsmOk?'var(--green)':'var(--s5)',marginLeft:2,display:'inline-block'}}/>
              )}
              {k==='smtp'&&(
                <span style={{width:7,height:7,borderRadius:'50%',background:smtpOk?'var(--green)':'var(--s5)',marginLeft:2,display:'inline-block'}}/>
              )}
            </button>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'22px 22px 80px',maxWidth:600}}>

          {/* ── Profil ── */}
          {tab==='profile' && profile && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Avatar kartı */}
              <div style={{display:'flex',alignItems:'center',gap:14,padding:'16px 18px',borderRadius:12,border:'1px solid var(--bdr)',background:'var(--s1)',marginBottom:4}}>
                <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,var(--ac),#5b4de0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>
                  {(pf.full_name||profile.full_name||'?').split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div>
                  <p style={{fontSize:15,fontWeight:700}}>{pf.full_name||'—'}</p>
                  <p style={{fontSize:12.5,color:'var(--tx2)',marginTop:2}}>{user?.email}</p>
                  <span className={`badge ${profile.role==='admin'?'badge-ac':profile.role==='manager'?'badge-blue':'badge-muted'}`} style={{marginTop:5,display:'inline-flex'}}>
                    {RL[profile.role]||profile.role}
                  </span>
                </div>
              </div>

              <div className="modal-grid">
                <div><label className="label">Ad Soyad</label>
                  <input value={pf.full_name} onChange={e=>setPf(p=>({...p,full_name:e.target.value}))} className="inp"/>
                </div>
                <div><label className="label">Telefon</label>
                  <input value={pf.phone} onChange={e=>setPf(p=>({...p,phone:e.target.value}))} placeholder="05XX XXX XX XX" className="inp"/>
                </div>
                <div><label className="label">Departman</label>
                  <input value={pf.department} onChange={e=>setPf(p=>({...p,department:e.target.value}))} className="inp"/>
                </div>
                <div><label className="label">E-posta</label>
                  <input value={user?.email||''} disabled className="inp" style={{opacity:.5,cursor:'not-allowed'}}/>
                </div>
              </div>
              <button className="btn" onClick={saveProfile} disabled={saving} style={{alignSelf:'flex-start',padding:'8px 20px'}}>
                {saving?'Kaydediliyor...':'Kaydet'}
              </button>
            </div>
          )}

          {/* ── Güvenlik ── */}
          {tab==='security' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <p style={{fontSize:14,fontWeight:600,marginBottom:2}}>Şifre Değiştir</p>
              <div><label className="label">Yeni Şifre</label>
                <input type="password" value={pw.new_pw} onChange={e=>setPw(p=>({...p,new_pw:e.target.value}))} placeholder="En az 6 karakter" className="inp"/>
              </div>
              <div><label className="label">Şifre Tekrar</label>
                <input type="password" value={pw.confirm_pw} onChange={e=>setPw(p=>({...p,confirm_pw:e.target.value}))} placeholder="Şifreyi tekrar girin" className="inp"/>
              </div>
              <button className="btn" onClick={changePassword} disabled={saving||!pw.new_pw} style={{alignSelf:'flex-start',padding:'8px 20px',opacity:(!pw.new_pw||saving)?.5:1}}>
                {saving?'Değiştiriliyor...':'Şifreyi Değiştir'}
              </button>
            </div>
          )}

          {/* ── Netgsm SMS ── */}
          {tab==='netgsm' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* Durum banner */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderRadius:10,border:`1px solid ${netgsmOk?'rgba(34,211,160,.25)':'var(--bdr)'}`,background:'var(--s1)'}}>
                <div style={{width:36,height:36,borderRadius:8,background:netgsmOk?'var(--green2)':'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <MessageSquare size={16} style={{color:netgsmOk?'var(--green)':'var(--tx3)'}} strokeWidth={1.8}/>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:600}}>Netgsm SMS API</p>
                  <p style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>
                    {netgsmOk?`Bağlı · Başlık: ${ng.netgsm_header||'AJANSPANEL'}`:'API bilgileri girilmemiş. Aşağıdan doldurun.'}
                  </p>
                </div>
                {netgsmOk && <CheckCircle2 size={18} style={{color:'var(--green)',flexShrink:0}} strokeWidth={2}/>}
              </div>

              <div style={{background:'var(--s2)',borderRadius:9,padding:'12px 14px',border:'1px solid var(--bdr)',fontSize:13,color:'var(--tx2)',lineHeight:1.7}}>
                📱 <strong style={{color:'var(--tx)'}}>netgsm.com.tr</strong> panelinden API kullanıcı adı ve şifrenizi alın.<br/>
                SMS başlığı (msgheader) Netgsm panelinde tanımladığınız başlık — maks. 11 karakter.
              </div>

              <div><label className="label">Kullanıcı Adı (API)</label>
                <input value={ng.netgsm_username} onChange={e=>setNg(p=>({...p,netgsm_username:e.target.value}))} placeholder="Netgsm kullanıcı adı" className="inp" autoComplete="off"/>
              </div>
              <div><label className="label">Şifre (API)</label>
                <input type="password" value={ng.netgsm_password} onChange={e=>setNg(p=>({...p,netgsm_password:e.target.value}))} placeholder="Netgsm API şifresi" className="inp" autoComplete="new-password"/>
              </div>
              <div><label className="label">SMS Başlığı (maks. 11 karakter)</label>
                <input value={ng.netgsm_header} onChange={e=>setNg(p=>({...p,netgsm_header:e.target.value}))} placeholder="AJANSPANEL" className="inp" maxLength={11}/>
              </div>

              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <button className="btn" onClick={()=>saveSettings(ng)} disabled={saving} style={{padding:'8px 20px'}}>
                  {saving?'Kaydediliyor...':'Kaydet'}
                </button>
                <div style={{display:'flex',gap:8,flex:1,minWidth:200,alignItems:'center'}}>
                  <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="Test: 05XX XXX XX XX" className="inp" style={{flex:1}}/>
                  <button className="btn-ghost" onClick={testNetgsm} disabled={testing||!ng.netgsm_username} style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                    <Send size={13}/>{testing?'Gönderiliyor...':'Test SMS'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SMTP E-posta ── */}
          {tab==='smtp' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* Durum banner */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderRadius:10,border:`1px solid ${smtpOk?'rgba(34,211,160,.25)':'var(--bdr)'}`,background:'var(--s1)'}}>
                <div style={{width:36,height:36,borderRadius:8,background:smtpOk?'var(--green2)':'var(--s3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Mail size={16} style={{color:smtpOk?'var(--green)':'var(--tx3)'}} strokeWidth={1.8}/>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:600}}>SMTP E-posta</p>
                  <p style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>
                    {smtpOk?`Bağlı · ${sm.smtp_host}:${sm.smtp_port}`:'SMTP bilgileri girilmemiş.'}
                  </p>
                </div>
                {smtpOk && <CheckCircle2 size={18} style={{color:'var(--green)',flexShrink:0}} strokeWidth={2}/>}
              </div>

              <div style={{background:'var(--s2)',borderRadius:9,padding:'12px 14px',border:'1px solid var(--bdr)',fontSize:13,color:'var(--tx2)',lineHeight:1.7}}>
                📧 Otomatik e-posta bildirimleri için SMTP ayarlarını girin.<br/>
                Gmail: <code style={{background:'var(--s3)',padding:'1px 6px',borderRadius:4,fontSize:12}}>smtp.gmail.com</code> / Port: <code style={{background:'var(--s3)',padding:'1px 6px',borderRadius:4,fontSize:12}}>587</code> (TLS)
              </div>

              <div className="modal-grid">
                <div><label className="label">SMTP Host</label>
                  <input value={sm.smtp_host} onChange={e=>setSm(p=>({...p,smtp_host:e.target.value}))} placeholder="smtp.gmail.com" className="inp"/>
                </div>
                <div><label className="label">Port</label>
                  <input value={sm.smtp_port} onChange={e=>setSm(p=>({...p,smtp_port:e.target.value}))} placeholder="587" className="inp"/>
                </div>
                <div><label className="label">Kullanıcı Adı</label>
                  <input value={sm.smtp_user} onChange={e=>setSm(p=>({...p,smtp_user:e.target.value}))} placeholder="mail@sirket.com" className="inp"/>
                </div>
                <div><label className="label">Şifre</label>
                  <input type="password" value={sm.smtp_pass} onChange={e=>setSm(p=>({...p,smtp_pass:e.target.value}))} className="inp" autoComplete="new-password"/>
                </div>
                <div><label className="label">Gönderen Adı</label>
                  <input value={sm.smtp_from_name} onChange={e=>setSm(p=>({...p,smtp_from_name:e.target.value}))} placeholder="Agency ERP" className="inp"/>
                </div>
                <div><label className="label">Gönderen E-posta</label>
                  <input value={sm.smtp_from_email} onChange={e=>setSm(p=>({...p,smtp_from_email:e.target.value}))} placeholder="noreply@sirket.com" className="inp"/>
                </div>
              </div>
              <button className="btn" onClick={()=>saveSettings(sm)} disabled={saving} style={{alignSelf:'flex-start',padding:'8px 20px'}}>
                {saving?'Kaydediliyor...':'Kaydet'}
              </button>
            </div>
          )}

          {/* ── Şirket ── */}
          {tab==='company' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div><label className="label">Şirket Adı</label>
                <input value={co.company_name} onChange={e=>setCo(p=>({...p,company_name:e.target.value}))} className="inp"/>
              </div>
              <div className="modal-grid">
                <div><label className="label">E-posta</label>
                  <input value={co.company_email} onChange={e=>setCo(p=>({...p,company_email:e.target.value}))} className="inp"/>
                </div>
                <div><label className="label">Telefon</label>
                  <input value={co.company_phone} onChange={e=>setCo(p=>({...p,company_phone:e.target.value}))} className="inp"/>
                </div>
              </div>
              <div><label className="label">Adres</label>
                <textarea value={co.company_address} onChange={e=>setCo(p=>({...p,company_address:e.target.value}))} className="inp" rows={3}/>
              </div>
              <button className="btn" onClick={()=>saveSettings(co)} disabled={saving} style={{alignSelf:'flex-start',padding:'8px 20px'}}>
                {saving?'Kaydediliyor...':'Kaydet'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
