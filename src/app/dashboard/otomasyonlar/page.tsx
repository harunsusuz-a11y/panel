'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, Play, Pause, Trash2, Send, MessageSquare, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const TRIGGERS = [
  { value:'task_overdue',    label:'Görev geciktiğinde',    desc:'Deadline geçince tetiklenir', ph:'{{gorev}} - {{sorumlu}} - {{tarih}}' },
  { value:'approval_pending',label:'Onay 24 saat bekleyince',desc:'Onay talebi yanıtsız kalırsa', ph:'{{onay}}' },
  { value:'project_complete',label:'Proje tamamlandığında',  desc:'Proje "Tamamlandı" olunca', ph:'{{proje}}' },
]
const ACTIONS = [
  { value:'sms',   label:'SMS Gönder (Netgsm)' },
  { value:'email', label:'E-posta Gönder'       },
  { value:'both',  label:'SMS + E-posta'        },
]
const PLACEHOLDERS: Record<string,string[]> = {
  task_overdue:    ['{{gorev}}','{{sorumlu}}','{{musteri}}','{{tarih}}'],
  approval_pending:['{{onay}}'],
  project_complete:['{{proje}}'],
}
const DEFAULT_MSGS: Record<string,string> = {
  task_overdue:    'Daydream: "{{gorev}}" görevi gecikti. Sorumlu: {{sorumlu}}. Lütfen tamamlayın.',
  approval_pending:'Daydream: "{{onay}}" onay bekliyor. Lütfen inceleyiniz.',
  project_complete:'Daydream: "{{proje}}" projesi tamamlandı! 🎉',
}

export default function OtomasyonlarPage() {
  const [rules,    setRules]    = useState<any[]>([])
  const [logs,     setLogs]     = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string,string>>({})
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [testModal,setTestModal]= useState(false)
  const [testing,  setTesting]  = useState(false)
  const [toast,    setToast]    = useState('')
  const [testPhone,setTestPhone]= useState('')
  const [testMsg,  setTestMsg]  = useState('Daydream Agency ERP test mesajı!')
  const [form, setForm] = useState({
    name:'', trigger_event:'task_overdue', action:'sms',
    message_template:'', trigger_hours:24
  })

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),4000) }

  async function load() {
    const sb = createClient()
    const [a, s, l] = await Promise.all([
      sb.from('automations').select('*').order('created_at'),
      sb.from('system_settings').select('key,value').in('key',['netgsm_username','netgsm_password','netgsm_header']),
      sb.from('automation_logs').select('*').order('created_at',{ascending:false}).limit(20),
    ])
    setRules(a.data||[])
    const m:Record<string,string>={}
    ;(s.data||[]).forEach((x:any)=>{m[x.key]=x.value})
    setSettings(m)
    setLogs(l.data||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  // Trigger değişince mesaj şablonunu güncelle
  function handleTriggerChange(v:string) {
    setForm(f => ({ ...f, trigger_event:v, message_template: DEFAULT_MSGS[v]||'' }))
  }

  async function toggle(id:string, active:boolean) {
    await createClient().from('automations').update({active}).eq('id',id)
    setRules(r=>r.map(x=>x.id===id?{...x,active}:x))
  }

  async function add() {
    if (!form.name.trim()) { showToast('Hata: Kural adı zorunlu'); return }
    const {error} = await createClient().from('automations').insert({
      name: form.name.trim(),
      trigger_event: form.trigger_event,
      action: form.action,

      message_template: form.message_template || DEFAULT_MSGS[form.trigger_event],
      trigger_hours: form.trigger_hours,
      active: true, run_count: 0
    })
    if (error) showToast('Hata: '+error.message)
    else {
      showToast('✓ Otomasyon oluşturuldu!')
      setModal(false)
      load()
      setForm({name:'',trigger_event:'task_overdue',action:'sms',message_template:'',trigger_hours:24})
    }
  }

  async function del(id:string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await createClient().from('automations').delete().eq('id',id)
    setRules(r=>r.filter(x=>x.id!==id))
  }

  async function testSms() {
    if (!testPhone.trim()) { showToast('Hata: Telefon girin'); return }
    if (!netgsmOk) { showToast('Hata: Netgsm bilgileri eksik'); return }
    setTesting(true)
    try {
      const res = await fetch('/api/sms/send', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ phone: testPhone, message: testMsg })
      })
      const data = await res.json()
      showToast(data.success ? '✓ Test SMS gönderildi!' : 'Hata: '+data.response)
    } catch(e:any) { showToast('Hata: '+e.message) }
    setTesting(false); setTestModal(false)
  }

  const netgsmOk = !!(settings.netgsm_username && settings.netgsm_password)
  const tl = (v:string) => TRIGGERS.find(t=>t.value===v)?.label||v
  const al = (v:string) => ACTIONS.find(a=>a.value===v)?.label||v
  const ST: Record<string,any> = {
    queued:  { l:'Bekliyor', c:'var(--amber)', Icon:Clock        },
    success: { l:'Gönderildi',c:'var(--green)',Icon:CheckCircle2 },
    failed:  { l:'Hata',     c:'var(--red)',   Icon:AlertCircle  },
  }

  return (
    <>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Otomasyonlar" subtitle={`${rules.filter(r=>r.active).length} aktif`} action={
          <div style={{display:'flex',gap:8}}>
            <button className="btn-ghost" onClick={()=>setTestModal(true)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
              <Send size={12}/>SMS Test
            </button>
            <button className="btn" onClick={()=>{setForm(f=>({...f,message_template:DEFAULT_MSGS[f.trigger_event]}));setModal(true)}}>
              <Plus size={13} strokeWidth={2}/>Yeni Kural
            </button>
          </div>
        }/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}

        <div style={{flex:1,overflowY:'auto',padding:'16px 18px 80px'}}>
          {/* Netgsm durum */}
          <div style={{padding:'13px 16px',borderRadius:10,border:`1px solid ${netgsmOk?'rgba(34,211,160,.2)':'rgba(240,168,67,.2)'}`,background:'var(--s1)',display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
            <div style={{width:36,height:36,borderRadius:8,background:netgsmOk?'var(--green2)':'var(--amber2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <MessageSquare size={16} style={{color:netgsmOk?'var(--green)':'var(--amber)'}} strokeWidth={1.8}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:600,marginBottom:2}}>Netgsm SMS</p>
              <p style={{fontSize:12,color:'var(--tx2)'}}>{netgsmOk?`Bağlı — ${settings.netgsm_header||'DAYDREAM'}  · SMS gönderimleri aktif`:'Bağlı değil — Ayarlar → Netgsm SMS bölümünden API bilgilerini girin'}</p>
            </div>
            <span className={`badge ${netgsmOk?'badge-green':'badge-amber'}`}>{netgsmOk?'Aktif':'Kurulum Gerekli'}</span>
          </div>

          {/* Nasıl çalışır */}
          <div style={{background:'var(--blue2)',borderRadius:10,padding:'11px 14px',marginBottom:14,border:'1px solid rgba(78,168,240,.15)',fontSize:12,color:'var(--blue)',lineHeight:1.6}}>
            <strong>Nasıl çalışır?</strong> Kural oluşturursun → tetikleyici koşul oluşunca (görev gecikmesi, onay bekleme vb.) sistem otomatik SMS gönderir.
            Mesaj şablonunda <code style={{background:'rgba(78,168,240,.15)',padding:'0 4px',borderRadius:3}}>{'{{gorev}}'}</code> gibi değişkenler otomatik doldurulur.
          </div>

          {loading ? <p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
          : rules.length===0 ? <div style={{padding:'40px 0',textAlign:'center',color:'var(--tx3)',fontSize:13}}>
              <MessageSquare size={28} strokeWidth={1.5} style={{opacity:.3,display:'block',margin:'0 auto 8px'}}/>
              Kural yok. "+ Yeni Kural" ile başlayın.
            </div>
          : <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {rules.map(r => (
                <div key={r.id} style={{background:'var(--s1)',border:`1px solid ${r.active?'rgba(124,106,247,.22)':'var(--bdr)'}`,borderLeft:`2.5px solid ${r.active?'var(--ac)':'var(--s5)'}`,borderRadius:10,padding:'14px 16px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                        <div style={{width:7,height:7,borderRadius:'50%',background:r.active?'var(--ac)':'var(--s5)',flexShrink:0,boxShadow:r.active?'0 0 6px rgba(124,106,247,.5)':'none'}}/>
                        <span style={{fontSize:13.5,fontWeight:600}}>{r.name}</span>
                        <span className={`badge ${r.active?'badge-ac':'badge-muted'}`}>{r.active?'Aktif':'Pasif'}</span>
                        <span style={{fontSize:11,color:'var(--tx3)',fontFamily:'JetBrains Mono,monospace',marginLeft:'auto'}}>{r.run_count} çalışma</span>
                      </div>
                      <div style={{paddingLeft:15,display:'flex',flexDirection:'column',gap:4,marginBottom:10}}>
                        <p style={{fontSize:12,color:'var(--tx2)'}}>⚡ {tl(r.trigger_event)}</p>
                        <p style={{fontSize:12,color:'var(--tx2)'}}>→ {al(r.action)}</p>
                        {r.message_template&&<p style={{fontSize:11.5,color:'var(--tx3)',fontStyle:'italic',background:'var(--s2)',padding:'5px 8px',borderRadius:6,marginTop:2}}>"{r.message_template.slice(0,60)}{r.message_template.length>60?'...':''}"</p>}
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
            </div>}

          {/* Son log kayıtları */}
          {logs.length>0&&(
            <div style={{marginTop:20}}>
              <p style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>Son Çalışma Logları</p>
              <div className="card">
                {logs.map((l,i)=>{
                  const s=ST[l.status]||ST.queued
                  return (
                    <div key={l.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',borderBottom:i<logs.length-1?'1px solid var(--bdr)':'none'}}>
                      <s.Icon size={13} style={{color:s.c,flexShrink:0}} strokeWidth={2}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(l.payload as any)?.message||'—'}</p>
                        <p style={{fontSize:10.5,color:'var(--tx3)',marginTop:1}}>{(l.payload as any)?.phone||''}</p>
                      </div>
                      <span className="badge" style={{background:`${s.c}18`,color:s.c,fontSize:10,flexShrink:0}}>{s.l}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yeni Kural Modal */}
      {modal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>Yeni Otomasyon</p>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:18}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Kural Adı *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Örn: Geciken görev SMS'i" className="inp" autoFocus/>
              </div>
              <div><label className="label">Tetikleyici</label>
                <select value={form.trigger_event} onChange={e=>handleTriggerChange(e.target.value)} className="inp">
                  {TRIGGERS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <p style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>{TRIGGERS.find(t=>t.value===form.trigger_event)?.desc}</p>
              </div>
              <div><label className="label">Aksiyon</label>
                <select value={form.action} onChange={e=>setForm(f=>({...f,action:e.target.value}))} className="inp">
                  {ACTIONS.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              {(form.action==='sms'||form.action==='both')&&(
                <div style={{background:'var(--blue2)',borderRadius:8,padding:'10px 12px',border:'1px solid rgba(78,168,240,.15)',fontSize:12,color:'var(--blue)',lineHeight:1.6}}>
                  📱 SMS, sorumlu kişinin profilindeki telefon numarasına otomatik gönderilir. Ayarlar → Profil bölümünden telefon numaraları girilmelidir.
                </div>
              )}
              <div>
                <label className="label">Mesaj Şablonu</label>
                <textarea value={form.message_template} onChange={e=>setForm(f=>({...f,message_template:e.target.value}))} className="inp" rows={3} placeholder={DEFAULT_MSGS[form.trigger_event]}/>
                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:5}}>
                  <span style={{fontSize:10.5,color:'var(--tx3)'}}>Değişkenler:</span>
                  {(PLACEHOLDERS[form.trigger_event]||[]).map(p=>(
                    <button key={p} onClick={()=>setForm(f=>({...f,message_template:(f.message_template||'')+p}))}
                      style={{fontSize:10,color:'var(--blue)',background:'var(--blue2)',border:'none',borderRadius:4,padding:'2px 7px',cursor:'pointer',fontFamily:'JetBrains Mono,monospace'}}>
                      {p}
                    </button>
                  ))}
                </div>
                <p style={{fontSize:11,color:'var(--tx3)',marginTop:5}}>Boş bırakırsan varsayılan mesaj kullanılır.</p>
              </div>
              {!netgsmOk&&(form.action==='sms'||form.action==='both')&&(
                <div style={{padding:'10px 12px',borderRadius:8,background:'var(--amber2)',color:'var(--amber)',border:'1px solid rgba(240,168,67,.2)',fontSize:12}}>
                  ⚠ SMS için Ayarlar → Netgsm SMS bölümünden bilgileri girin.
                </div>
              )}
              <button className="btn" onClick={add} style={{width:'100%',justifyContent:'center',padding:'10px',marginTop:4}}>Kural Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Test SMS Modal */}
      {testModal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setTestModal(false)}}>
          <div className="modal" style={{maxWidth:380}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>Test SMS Gönder</p>
              <button onClick={()=>setTestModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:18}}>✕</button>
            </div>
            {!netgsmOk
              ? <div style={{background:'var(--amber2)',borderRadius:9,padding:'12px 14px',color:'var(--amber)',fontSize:13,lineHeight:1.6}}>
                  ⚠ Netgsm bilgileri girilmemiş.<br/><strong>Ayarlar → Netgsm SMS</strong> bölümünden API bilgilerini girin.
                </div>
              : <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div><label className="label">Telefon Numarası</label>
                    <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="05XX XXX XX XX" className="inp" autoFocus/>
                  </div>
                  <div><label className="label">Mesaj</label>
                    <textarea value={testMsg} onChange={e=>setTestMsg(e.target.value)} className="inp" rows={3}/>
                    <p style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>Gönderen: {settings.netgsm_header||'DAYDREAM'}</p>
                  </div>
                  <button className="btn" onClick={testSms} disabled={testing} style={{width:'100%',justifyContent:'center',padding:'10px'}}>
                    <Send size={13}/>{testing?'Gönderiliyor...':'Test SMS Gönder'}
                  </button>
                </div>
            }
          </div>
        </div>
      )}
    </>
  )
}
