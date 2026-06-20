'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, Play, Pause, Trash2, Send, MessageSquare } from 'lucide-react'

const TRIGGERS = [
  {value:'task_overdue',    label:'Görev geciktiğinde'},
  {value:'task_hours',      label:'Görev X saat geçince'},
  {value:'approval_pending',label:'Onay 24 saat bekleyince'},
  {value:'project_complete',label:'Proje tamamlandığında'},
  {value:'weekly_report',   label:'Her Pazartesi 09:00'},
]
const ACTIONS = [
  {value:'sms',  label:'SMS Gönder (Netgsm)'},
  {value:'email',label:'E-posta Gönder'},
  {value:'both', label:'SMS + E-posta'},
]

export default function OtomasyonlarPage() {
  const [rules,    setRules]    = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string,string>>({})
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [testModal,setTestModal]= useState(false)
  const [testing,  setTesting]  = useState(false)
  const [toast,    setToast]    = useState('')
  const [testPhone,setTestPhone]= useState('')
  const [form, setForm] = useState({name:'',trigger_event:'task_overdue',trigger_hours:24,action:'sms'})

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),4000) }

  async function load() {
    const sb = createClient()
    const [a, s] = await Promise.all([
      sb.from('automations').select('*').order('created_at'),
      sb.from('system_settings').select('key,value').in('key',['netgsm_username','netgsm_password','netgsm_header']),
    ])
    setRules(a.data||[])
    const m:Record<string,string>={}
    ;(s.data||[]).forEach((x:any)=>{m[x.key]=x.value})
    setSettings(m)
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function toggle(id:string, active:boolean) {
    await createClient().from('automations').update({active}).eq('id',id)
    setRules(r=>r.map(x=>x.id===id?{...x,active}:x))
  }

  async function add() {
    if (!form.name.trim()) return
    const {error} = await createClient().from('automations').insert({name:form.name.trim(),trigger_event:form.trigger_event,action:form.action,active:true,run_count:0})
    if (error) showToast('Hata: '+error.message)
    else { showToast('Otomasyon oluşturuldu!'); setModal(false); load(); setForm({name:'',trigger_event:'task_overdue',trigger_hours:24,action:'sms'}) }
  }

  async function del(id:string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await createClient().from('automations').delete().eq('id',id)
    setRules(r=>r.filter(x=>x.id!==id))
  }

  async function testSms() {
    if (!testPhone.trim()) { showToast('Hata: Telefon girin'); return }
    if (!settings.netgsm_username) { showToast('Hata: Ayarlar > Netgsm bölümünden bilgileri girin'); return }
    setTesting(true)
    try {
      const url=`https://api.netgsm.com.tr/sms/send/get/?usercode=${settings.netgsm_username}&password=${settings.netgsm_password}&gsmno=${testPhone.replace(/\s/g,'')}&message=Agency ERP test!&msgheader=${settings.netgsm_header||'AJANSPANEL'}&dil=TR`
      const res=await fetch(url); const text=await res.text()
      showToast(text.startsWith('00')||text.startsWith('01')?'✓ SMS gönderildi!':'Netgsm yanıtı: '+text)
    } catch(e:any) { showToast('Hata: '+e.message) }
    setTesting(false); setTestModal(false)
  }

  const netgsmOk = settings.netgsm_username && settings.netgsm_password
  const tl = (v:string) => TRIGGERS.find(t=>t.value===v)?.label||v
  const al = (v:string) => ACTIONS.find(a=>a.value===v)?.label||v

  return (
    <>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Otomasyonlar" subtitle={`${rules.filter(r=>r.active).length} aktif`} action={
          <div style={{display:'flex',gap:8}}>
            <button className="btn-ghost" onClick={()=>setTestModal(true)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
              <Send size={12}/>SMS Test
            </button>
            <button className="btn" onClick={()=>setModal(true)}><Plus size={13} strokeWidth={2}/>Yeni Kural</button>
          </div>
        }/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
          {/* Netgsm durum */}
          <div style={{padding:'13px 16px',borderRadius:10,border:`1px solid ${netgsmOk?'rgba(34,211,160,.2)':'var(--bdr)'}`,background:'var(--s1)',display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
            <div style={{width:36,height:36,borderRadius:8,background:netgsmOk?'var(--green2)':'var(--amber2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <MessageSquare size={16} style={{color:netgsmOk?'var(--green)':'var(--amber)'}} strokeWidth={1.8}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:600,marginBottom:2}}>Netgsm SMS</p>
              <p style={{fontSize:12,color:'var(--tx2)'}}>{netgsmOk?`Bağlı — ${settings.netgsm_header||'AJANSPANEL'}`:'Bağlı değil — Ayarlar > Netgsm SMS bölümünden API bilgilerini girin'}</p>
            </div>
            <span className={`badge ${netgsmOk?'badge-green':'badge-amber'}`}>{netgsmOk?'Aktif':'Kurulum Gerekli'}</span>
          </div>

          {loading ? <p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
          : rules.length===0 ? <p style={{padding:'40px 0',textAlign:'center',color:'var(--tx3)',fontSize:13}}>Kural yok. + Yeni Kural ile başlayın.</p>
          : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {rules.map(r => (
                <div key={r.id} style={{background:'var(--s1)',border:`1px solid ${r.active?'rgba(124,106,247,.22)':'var(--bdr)'}`,borderLeft:`2.5px solid ${r.active?'var(--ac)':'var(--s5)'}`,borderRadius:10,padding:'14px 16px',transition:'border-color .15s'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <div style={{width:7,height:7,borderRadius:'50%',background:r.active?'var(--ac)':'var(--s5)',flexShrink:0,boxShadow:r.active?'0 0 6px rgba(124,106,247,.5)':'none'}}/>
                        <span style={{fontSize:13.5,fontWeight:600}}>{r.name}</span>
                        <span className={`badge ${r.active?'badge-ac':'badge-muted'}`}>{r.active?'Aktif':'Pasif'}</span>
                      </div>
                      <div style={{paddingLeft:15,display:'flex',flexDirection:'column',gap:3,marginBottom:8}}>
                        <p style={{fontSize:12,color:'var(--tx2)'}}>⚡ {tl(r.trigger_event)}</p>
                        <p style={{fontSize:12,color:'var(--tx2)'}}>→ {al(r.action)}</p>
                        <p style={{fontSize:11,color:'var(--tx3)'}}>Çalışma: {r.run_count}</p>
                      </div>
                      <div style={{display:'flex',gap:7}}>
                        <button onClick={()=>toggle(r.id,!r.active)} className={r.active?'btn-ghost':'btn'} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,padding:'5px 11px'}}>
                          {r.active?<><Pause size={11}/>Durdur</>:<><Play size={11}/>Başlat</>}
                        </button>
                        <button onClick={()=>del(r.id)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,padding:'5px 8px',borderRadius:7}} onMouseEnter={e=>(e.currentTarget.style.color='var(--red)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--tx3)')}>
                          <Trash2 size={12}/>Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <p className="modal-title">Yeni Otomasyon</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Kural Adı *</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="inp" autoFocus/></div>
              <div><label className="label">Tetikleyici</label>
                <select value={form.trigger_event} onChange={e=>setForm(p=>({...p,trigger_event:e.target.value}))} className="inp">
                  {TRIGGERS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.trigger_event==='task_hours'&&(
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <input type="number" value={form.trigger_hours} min={1} onChange={e=>setForm(p=>({...p,trigger_hours:Number(e.target.value)}))} className="inp" style={{maxWidth:100}}/>
                  <span style={{fontSize:13,color:'var(--tx2)'}}>saat sonra bildirim gönder</span>
                </div>
              )}
              <div><label className="label">Aksiyon</label>
                <select value={form.action} onChange={e=>setForm(p=>({...p,action:e.target.value}))} className="inp">
                  {ACTIONS.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              {!netgsmOk&&(form.action==='sms'||form.action==='both')&&(
                <div style={{padding:'10px 12px',borderRadius:8,background:'var(--amber2)',color:'var(--amber)',border:'1px solid rgba(240,168,67,.2)',fontSize:12}}>
                  ⚠ SMS için Ayarlar > Netgsm SMS bölümünden bilgileri girin.
                </div>
              )}
              <button className="btn" onClick={add} style={{width:'100%',justifyContent:'center',padding:'10px',marginTop:4}}>Kural Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {testModal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setTestModal(false)}}>
          <div className="modal" style={{maxWidth:360}}>
            <p className="modal-title">Test SMS Gönder</p>
            {!netgsmOk
              ? <p style={{fontSize:13,color:'var(--amber)',lineHeight:1.7}}>Netgsm bilgileri girilmemiş.<br/><strong>Ayarlar → Netgsm SMS</strong> bölümünden girin.</p>
              : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div><label className="label">Telefon Numarası</label><input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="05XX XXX XX XX" className="inp" autoFocus/></div>
                  <button className="btn" onClick={testSms} disabled={testing} style={{width:'100%',justifyContent:'center',padding:'10px'}}>
                    <Send size={13}/>{testing?'Gönderiliyor...':'Test SMS Gönder'}
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </>
  )
}
