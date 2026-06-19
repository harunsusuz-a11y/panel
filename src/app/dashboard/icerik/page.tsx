'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const STATUS_MAP: Record<string,any> = {
  draft:    {l:'Taslak',    c:'var(--t2)',   bg:'var(--s3)'},
  pending:  {l:'Onay Bekliyor', c:'var(--amber)', bg:'var(--amber-d)'},
  approved: {l:'Onaylandı', c:'var(--green)', bg:'var(--green-d)'},
  revision: {l:'Revizyon',  c:'var(--red)',   bg:'var(--red-d)'},
  published:{l:'Yayında',   c:'var(--blue)',  bg:'var(--blue-d)'},
}
const TYPE_MAP: Record<string,string> = { post:'Post', story:'Story', blog:'Blog', ad:'Reklam', other:'Diğer' }
const inp: React.CSSProperties = { background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif', width:'100%' }

export default function IcerikPage() {
  const [items, setItems] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ title:'', client_id:'', type:'post', status:'draft', assigned_to:'', publish_date:'' })

  async function load() {
    const sb = createClient()
    const [a,b,c] = await Promise.all([
      sb.from('contents').select('*, client:clients(name), assignee:profiles!contents_assigned_to_fkey(full_name)').order('created_at',{ascending:false}),
      sb.from('clients').select('id,name').eq('status','active'),
      sb.from('profiles').select('id,full_name'),
    ])
    setItems(a.data||[]); setClients(b.data||[]); setProfiles(c.data||[]); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function add() {
    if (!form.title) return
    const sb = createClient()
    const { error } = await sb.from('contents').insert({ ...form, client_id:form.client_id||null, assigned_to:form.assigned_to||null, publish_date:form.publish_date||null })
    if (error) { setToast('Hata: '+error.message) }
    else { setToast('İçerik eklendi!'); setModal(false); load(); setForm({title:'',client_id:'',type:'post',status:'draft',assigned_to:'',publish_date:''}) }
    setTimeout(()=>setToast(''),3000)
  }

  async function changeStatus(id:string, status:string) {
    await createClient().from('contents').update({status}).eq('id',id)
    load()
  }

  const filtered = filter==='all' ? items : items.filter(i=>i.status===filter)

  return (
    <>
      <style>{`.ic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;} @media(max-width:768px){.ic-grid{grid-template-columns:1fr;}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="İçerik Merkezi" action={
          <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'7px 14px',borderRadius:8,border:'none',cursor:'pointer'}}>+ İçerik</button>
        }/>
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
          {toast && <div style={{marginBottom:12,padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600}}>{toast}</div>}
          
          <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
            {['all',...Object.keys(STATUS_MAP)].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} style={{padding:'5px 12px',borderRadius:8,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,
                background:filter===s?'var(--gold)':'var(--s2)',color:filter===s?'#000':'var(--t2)'}}>
                {s==='all'?`Tümü (${items.length})`:STATUS_MAP[s]?.l}
              </button>
            ))}
          </div>

          {loading ? <div style={{color:'var(--t3)',fontSize:12,padding:20}}>Yükleniyor...</div> : filtered.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'var(--t3)',fontSize:13}}>İçerik bulunamadı. + İçerik ile ekleyin.</div>
          ) : (
            <div className="ic-grid">
              {filtered.map(item=>{
                const st = STATUS_MAP[item.status]||STATUS_MAP.draft
                return (
                  <div key={item.id} style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:12,padding:'14px',position:'relative'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:`${TYPE_MAP[item.type]?'var(--blue-d)':'var(--s3)'}`,color:'var(--blue)'}}>{TYPE_MAP[item.type]||item.type}</span>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:st.bg,color:st.c}}>{st.l}</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:6,lineHeight:1.4}}>{item.title}</div>
                    <div style={{fontSize:10,color:'var(--t3)',marginBottom:10}}>
                      {item.client?.name||'Müşteri yok'} · {item.assignee?.full_name||'Atanmadı'}
                    </div>
                    {item.publish_date && <div style={{fontSize:10,color:'var(--amber)',fontFamily:'JetBrains Mono',marginBottom:10}}>📅 {item.publish_date}</div>}
                    <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                      {Object.keys(STATUS_MAP).filter(s=>s!==item.status).map(s=>(
                        <button key={s} onClick={()=>changeStatus(item.id,s)} style={{fontSize:9,padding:'3px 8px',borderRadius:6,border:'1px solid var(--glass-border)',background:'var(--s2)',color:STATUS_MAP[s].c,cursor:'pointer'}}>
                          → {STATUS_MAP[s].l}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:'18px 18px 0 0',padding:24,width:'100%',maxWidth:480}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <span style={{fontSize:15,fontWeight:700}}>Yeni İçerik</span>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Başlık</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="İçerik başlığı..." style={inp}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Tür</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                    {Object.entries(TYPE_MAP).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Durum</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                    {Object.entries(STATUS_MAP).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Müşteri</label>
                  <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                    <option value="">Seçin</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Sorumlu</label>
                  <select value={form.assigned_to} onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                    <option value="">Seçin</option>
                    {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5}}>Yayın Tarihi</label><input type="date" value={form.publish_date} onChange={e=>setForm(p=>({...p,publish_date:e.target.value}))} style={inp}/></div>
              <button onClick={add} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:12,borderRadius:9,border:'none',cursor:'pointer',marginTop:4}}>İçerik Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}