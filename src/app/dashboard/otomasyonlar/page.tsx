'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, Zap, MessageSquare, Clock, Trash2, Play, Pause, Send } from 'lucide-react'

interface Automation {
  id: string
  name: string
  trigger_event: string
  trigger_hours?: number   // kaç saat sonra tetiklenir
  action: string
  active: boolean
  run_count: number
  last_run_at?: string
}

const TRIGGERS = [
  { value:'task_overdue',    label:'Görev geciktiğinde',         icon:'⏰' },
  { value:'task_hours',      label:'Görev X saat geçince',       icon:'🕐' },
  { value:'approval_pending',label:'Onay 24 saat bekleyince',    icon:'📋' },
  { value:'project_complete',label:'Proje tamamlandığında',      icon:'✅' },
  { value:'weekly_report',   label:'Her Pazartesi 09:00',        icon:'📊' },
]

const ACTIONS = [
  { value:'sms',   label:'SMS Gönder (Netgsm)', icon:'📱' },
  { value:'email', label:'E-posta Gönder',      icon:'📧' },
  { value:'both',  label:'SMS + E-posta',       icon:'🔔' },
]

export default function OtomasyonlarPage() {
  const [rules,   setRules]   = useState<Automation[]>([])
  const [settings,setSettings]= useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [testPhone,setTestPhone]= useState('')
  const [testModal,setTestModal]= useState(false)
  const [testing, setTesting] = useState(false)
  const [toast,   setToast]   = useState('')
  const [form, setForm] = useState({
    name:'', trigger_event:'task_overdue', trigger_hours:24, action:'sms', phone_template:'', active:true
  })

  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),4000) }

  async function load() {
    const sb = createClient()
    const [a, s] = await Promise.all([
      sb.from('automations').select('*').order('created_at'),
      sb.from('system_settings').select('key,value').in('key',['netgsm_username','netgsm_password','netgsm_header']),
    ])
    setRules(a.data||[])
    const sMap: Record<string,string> = {}
    ;(s.data||[]).forEach((x:any) => { sMap[x.key] = x.value })
    setSettings(sMap)
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const netgsmOk = settings.netgsm_username && settings.netgsm_password

  async function toggle(id:string, active:boolean) {
    await createClient().from('automations').update({active}).eq('id',id)
    setRules(r => r.map(x => x.id===id ? {...x,active} : x))
  }

  async function add() {
    if (!form.name.trim() || !form.trigger_event || !form.action) return
    const {error} = await createClient().from('automations').insert({
      name: form.name.trim(),
      trigger_event: form.trigger_event,
      action: form.action,
      active: form.active,
      run_count: 0,
    })
    if (error) { showToast('Hata: '+error.message) }
    else { showToast('Otomasyon oluşturuldu!'); setModal(false); load() }
  }

  async function del(id:string) {
    if (!confirm('Bu otomasyonu silmek istediğinize emin misiniz?')) return
    await createClient().from('automations').delete().eq('id',id)
    setRules(r => r.filter(x => x.id!==id))
  }

  // Netgsm test SMS
  async function sendTestSms() {
    if (!testPhone.trim()) { showToast('Hata: Telefon numarası girin'); return }
    if (!netgsmOk) { showToast('Hata: Netgsm bilgileri Ayarlar > Entegrasyonlar\'dan girilmeli'); return }
    setTesting(true)
    try {
      const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${settings.netgsm_username}&password=${settings.netgsm_password}&gsmno=${testPhone.replace(/\s/g,'')}&message=Agency ERP test mesajı&msgheader=${settings.netgsm_header||'AJANSPANEL'}&dil=TR`
      const res = await fetch(url)
      const text = await res.text()
      if (text.startsWith('00') || text.startsWith('01')) {
        showToast('✓ Test SMS gönderildi!')
      } else {
        showToast('Netgsm hata kodu: '+text)
      }
    } catch (e:any) {
      showToast('Hata: '+e.message)
    }
    setTesting(false); setTestModal(false)
  }

  const activeCount = rules.filter(r=>r.active).length

  const getTriggerLabel = (val:string) => TRIGGERS.find(t=>t.value===val)?.label||val
  const getActionLabel  = (val:string) => ACTIONS.find(a=>a.value===val)?.label||val
  const getTriggerIcon  = (val:string) => TRIGGERS.find(t=>t.value===val)?.icon||'⚡'

  return (
    <>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Otomasyonlar" subtitle={`${activeCount} aktif kural`} action={
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setTestModal(true)} className="btn-ghost" style={{display:'flex',alignItems:'center',gap:5,fontSize:13}}>
              <Send size={13}/>SMS Test
            </button>
            <button onClick={()=>setModal(true)} className="btn"><Plus size={14} strokeWidth={2}/>Yeni Kural</button>
          </div>
        }/>
        {toast && <div className={`toast ${toast.startsWith('Hata')?'err':'ok'}`}>{toast}</div>}

        <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
          {/* Netgsm durum kartı */}
          <div style={{marginBottom:16,padding:'14px 16px',borderRadius:12,border:'1px solid var(--border)',background:'var(--surface)',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:netgsmOk?'var(--green-soft)':'var(--amber-soft)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <MessageSquare size={17} color={netgsmOk?'var(--green)':'var(--amber)'} strokeWidth={1.8}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>Netgsm SMS Entegrasyonu</div>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>
                {netgsmOk ? `Bağlı — Başlık: ${settings.netgsm_header||'AJANSPANEL'}` : 'Bağlı değil — Ayarlar > Entegrasyonlar\'dan API bilgilerini girin'}
              </div>
            </div>
            <span className={`badge ${netgsmOk?'badge-green':'badge-amber'}`}>{netgsmOk?'Aktif':'Kurulum Gerekli'}</span>
          </div>

          {loading ? <div style={{color:'var(--text-faint)',fontSize:13,padding:20}}>Yükleniyor...</div>
          : rules.length===0 ? (
            <div style={{padding:'48px 0',textAlign:'center',color:'var(--text-faint)',fontSize:13}}>
              <Zap size={32} strokeWidth={1.5} style={{opacity:.3,marginBottom:12,display:'block',margin:'0 auto 12px'}}/>
              Henüz otomasyon kuralı yok.<br/>+ Yeni Kural ile başlayın.
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {rules.map(r=>(
                <div key={r.id} style={{background:'var(--surface)',border:`1px solid ${r.active?'rgba(99,102,241,0.25)':'var(--border)'}`,borderRadius:12,padding:'16px 18px',transition:'border-color .15s'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{width:38,height:38,borderRadius:9,background:r.active?'var(--accent-soft)':'var(--surface-2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>
                      {getTriggerIcon(r.trigger_event)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <span style={{fontSize:14,fontWeight:600,flex:1}}>{r.name}</span>
                        <span className={`badge ${r.active?'badge-accent':'badge'}`} style={!r.active?{background:'var(--surface-2)',color:'var(--text-faint)'}:{}}>
                          {r.active?'Aktif':'Pasif'}
                        </span>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10}}>
                        <div style={{fontSize:12,color:'var(--text-dim)'}}>
                          <span style={{color:'var(--text-faint)',fontWeight:500}}>Tetikleyici:</span> {getTriggerLabel(r.trigger_event)}
                        </div>
                        <div style={{fontSize:12,color:'var(--text-dim)'}}>
                          <span style={{color:'var(--text-faint)',fontWeight:500}}>Aksiyon:</span> {getActionLabel(r.action)}
                        </div>
                        <div style={{fontSize:11,color:'var(--text-faint)'}}>
                          Çalışma sayısı: {r.run_count} {r.last_run_at&&`· Son: ${new Date(r.last_run_at).toLocaleDateString('tr-TR')}`}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:7}}>
                        <button onClick={()=>toggle(r.id,!r.active)}
                          className={r.active?'btn-ghost':'btn'}
                          style={{display:'flex',alignItems:'center',gap:5,fontSize:12,padding:'5px 12px'}}>
                          {r.active ? <><Pause size={12}/>Durdur</> : <><Play size={12}/>Başlat</>}
                        </button>
                        <button onClick={()=>del(r.id)} style={{background:'none',border:'none',color:'var(--text-faint)',cursor:'pointer',padding:'5px 8px',display:'flex',alignItems:'center',gap:4,fontSize:12,borderRadius:7,transition:'color .12s'}}
                          onMouseEnter={e=>(e.currentTarget.style.color='var(--red)')}
                          onMouseLeave={e=>(e.currentTarget.style.color='var(--text-faint)')}>
                          <Trash2 size={13}/>Sil
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

      {/* Yeni Kural Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal-content">
            <div className="modal-title">Yeni Otomasyon Kuralı</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label className="modal-label">Kural Adı *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Görev gecikme uyarısı..." autoFocus/>
              </div>
              <div>
                <label className="modal-label">Tetikleyici</label>
                <select value={form.trigger_event} onChange={e=>setForm(p=>({...p,trigger_event:e.target.value}))}>
                  {TRIGGERS.map(t=><option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              {form.trigger_event==='task_hours' && (
                <div>
                  <label className="modal-label">Kaç saat geçince tetiklensin?</label>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <input type="number" value={form.trigger_hours} min={1} max={720}
                      onChange={e=>setForm(p=>({...p,trigger_hours:Number(e.target.value)}))}
                      style={{maxWidth:100}}/>
                    <span style={{fontSize:13,color:'var(--text-dim)'}}>saat sonra SMS/bildirim gönder</span>
                  </div>
                </div>
              )}
              <div>
                <label className="modal-label">Aksiyon</label>
                <select value={form.action} onChange={e=>setForm(p=>({...p,action:e.target.value}))}>
                  {ACTIONS.map(a=><option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
                </select>
              </div>
              {!netgsmOk && (form.action==='sms'||form.action==='both') && (
                <div style={{padding:'10px 12px',borderRadius:8,background:'var(--amber-soft)',color:'var(--amber)',border:'1px solid rgba(251,191,36,.2)',fontSize:12}}>
                  ⚠ SMS gönderebilmek için Ayarlar &gt; Entegrasyonlar bölümünden Netgsm bilgilerini girmeniz gerekiyor.
                </div>
              )}
              <button onClick={add} className="btn" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14}}>
                Kural Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test SMS Modal */}
      {testModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setTestModal(false)}}>
          <div className="modal-content" style={{maxWidth:380}}>
            <div className="modal-title">Test SMS Gönder</div>
            {!netgsmOk ? (
              <div style={{padding:'16px',borderRadius:10,background:'var(--amber-soft)',color:'var(--amber)',border:'1px solid rgba(251,191,36,.2)',fontSize:13,lineHeight:1.6}}>
                Netgsm bilgileri girilmemiş.<br/>
                <strong>Ayarlar → Entegrasyonlar</strong> bölümünden API kullanıcı adı ve şifresini girin.
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label className="modal-label">Telefon Numarası</label>
                  <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="05XX XXX XX XX" autoFocus/>
                </div>
                <div style={{fontSize:12,color:'var(--text-faint)',background:'var(--surface-2)',borderRadius:8,padding:'10px 12px'}}>
                  Gönderilecek mesaj: <em>"Agency ERP test mesajı"</em><br/>
                  Başlık: <strong>{settings.netgsm_header||'AJANSPANEL'}</strong>
                </div>
                <button onClick={sendTestSms} disabled={testing} className="btn" style={{width:'100%',justifyContent:'center',padding:'10px'}}>
                  <Send size={14}/>{testing?'Gönderiliyor...':'Test SMS Gönder'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}