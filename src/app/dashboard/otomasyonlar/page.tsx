'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const inp: React.CSSProperties = { background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif', width:'100%' }

export default function OtomasyonlarPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ name:'', trigger_event:'', action:'' })

  async function load() {
    const {data} = await createClient().from('automations').select('*').order('created_at')
    setRules(data||[]); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function toggle(id:string, active:boolean) {
    await createClient().from('automations').update({active}).eq('id',id)
    setRules(r=>r.map(x=>x.id===id?{...x,active}:x))
  }

  async function add() {
    if (!form.name||!form.trigger_event||!form.action) return
    const {error} = await createClient().from('automations').insert({...form,active:true,run_count:0})
    if (error) { setToast('Hata: '+error.message) }
    else { setToast('Otomasyon eklendi!'); setModal(false); load(); setForm({name:'',trigger_event:'',action:''}) }
    setTimeout(()=>setToast(''),3000)
  }

  async function del(id:string) {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await createClient().from('automations').delete().eq('id',id)
    setRules(r=>r.filter(x=>x.id!==id))
  }

  const active = rules.filter(r=>r.active).length

  return (
    <>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Otomasyonlar" subtitle={`${active} aktif`} action={
          <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer'}}>+ Otomasyon</button>
        }/>
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
          {toast && <div style={{marginBottom:12,padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600}}>{toast}</div>}
          {loading ? <div style={{color:'var(--t3)',padding:20}}>Yükleniyor...</div> : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {rules.map(r=>(
                <div key={r.id} style={{background:'var(--s1)',border:`1px solid ${r.active?'rgba(34,214,110,0.2)':'var(--glass-border)'}`,borderRadius:12,padding:'16px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:r.active?'var(--green)':'var(--t3)',boxShadow:r.active?'0 0 6px var(--green)':'none',flexShrink:0}}/>
                        <span style={{fontSize:13,fontWeight:700}}>{r.name}</span>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:4,paddingLeft:16}}>
                        <div style={{fontSize:11,color:'var(--t3)'}}>⚡ <span style={{color:'var(--t2)'}}>{r.trigger_event}</span></div>
                        <div style={{fontSize:11,color:'var(--t3)'}}>→ <span style={{color:'var(--t2)'}}>{r.action}</span></div>
                      </div>
                      <div style={{display:'flex',gap:10,marginTop:8,paddingLeft:16}}>
                        <span style={{fontSize:10,color:'var(--t3)'}}>Çalışma: <strong style={{color:'var(--t2)'}}>{r.run_count}</strong></span>
                        {r.last_run_at && <span style={{fontSize:10,color:'var(--t3)'}}>Son: <strong style={{color:'var(--t2)'}}>{new Date(r.last_run_at).toLocaleDateString('tr-TR')}</strong></span>}
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                      <button onClick={()=>toggle(r.id,!r.active)}
                        style={{padding:'5px 10px',borderRadius:7,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,
                          background:r.active?'var(--red-d)':'var(--green-d)',color:r.active?'var(--red)':'var(--green)'}}>
                        {r.active?'Durdur':'Başlat'}
                      </button>
                      <button onClick={()=>del(r.id)} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--glass-border)',cursor:'pointer',fontSize:11,background:'var(--s2)',color:'var(--t3)'}}>Sil</button>
                    </div>
                  </div>
                </div>
              ))}
              {rules.length===0 && <div style={{padding:40,textAlign:'center',color:'var(--t3)',fontSize:13}}>Otomasyon kuralı yok. + Otomasyon ile ekleyin.</div>}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:'18px 18px 0 0',padding:24,width:'100%',maxWidth:480}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <span style={{fontSize:15,fontWeight:700}}>Yeni Otomasyon</span>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Kural Adı</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Gecikme uyarısı..." style={inp}/></div>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Tetikleyici</label><input value={form.trigger_event} onChange={e=>setForm(p=>({...p,trigger_event:e.target.value}))} placeholder="Görev süresi doldu..." style={inp}/></div>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Aksiyon</label><input value={form.action} onChange={e=>setForm(p=>({...p,action:e.target.value}))} placeholder="SMS + Mail gönder..." style={inp}/></div>
              <button onClick={add} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:12,borderRadius:9,border:'none',cursor:'pointer',marginTop:4}}>Otomasyon Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}