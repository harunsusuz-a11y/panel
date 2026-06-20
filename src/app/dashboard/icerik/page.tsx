'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, X, Building2, Calendar, User, ChevronRight } from 'lucide-react'

const ST: Record<string,any> = {
  draft:    { l:'Taslak',        cls:'badge-muted',  color:'var(--tx3)',   owner:'Aslı/Gizem' },
  pending:  { l:'Onay Bekliyor', cls:'badge-amber',  color:'var(--amber)', owner:'İç Onay'    },
  approved: { l:'Onaylandı',     cls:'badge-green',  color:'var(--green)', owner:'Müşteri'    },
  revision: { l:'Revizyon',      cls:'badge-red',    color:'var(--red)',   owner:'Gizem/Yasin'},
  published:{ l:'Yayında',       cls:'badge-ac',     color:'var(--ac)',    owner:'—'          },
}
const TYPE: Record<string,string> = { post:'Post', story:'Story', blog:'Blog', ad:'Reklam', other:'Diğer' }

// Daydream içerik üretim akışı
const WORKFLOW = [
  { id:'draft',    l:'Taslak',        sub:'Aslı konsept kurar',           c:'var(--tx3)'   },
  { id:'pending',  l:'İç Onay',       sub:'Gizem kalite kontrol',         c:'var(--amber)' },
  { id:'approved', l:'Müşteri Onayı', sub:'Emir / portal üzerinden',      c:'var(--blue)'  },
  { id:'revision', l:'Revizyon',      sub:'Gizem & Yasin düzenler',       c:'var(--red)'   },
  { id:'published',l:'Yayında',       sub:'Gizem yayınlar',               c:'var(--green)' },
]

export default function IcerikPage() {
  const [items,    setItems]    = useState<any[]>([])
  const [clients,  setClients]  = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [filter,   setFilter]   = useState('all')
  const [clientF,  setClientF]  = useState('all')
  const [modal,    setModal]    = useState(false)
  const [sel,      setSel]      = useState<any>(null)
  const [toast,    setToast]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [form, setForm] = useState({ title:'', client_id:'', type:'post', status:'draft', assigned_to:'', publish_date:'', notes:'' })

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3500) }

  async function load() {
    const sb = createClient()
    const [a, b, c] = await Promise.all([
      sb.from('contents').select('*').order('created_at',{ascending:false}),
      sb.from('clients').select('id,name').order('name'),
      sb.from('profiles').select('id,full_name').not('full_name','is',null),
    ])
    const cm: Record<string,any> = {}; (b.data||[]).forEach((x:any) => { cm[x.id] = x })
    const pm: Record<string,any> = {}; (c.data||[]).forEach((x:any) => { pm[x.id] = x })
    setItems((a.data||[]).map((x:any) => ({ ...x, client: cm[x.client_id], assignee: pm[x.assigned_to] })))
    setClients(b.data||[])
    setProfiles(c.data||[])
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function add() {
    if (!form.title.trim()) return
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { error } = await sb.from('contents').insert({
      ...form, client_id: form.client_id||null, assigned_to: form.assigned_to||null,
      publish_date: form.publish_date||null, created_by: user?.id
    })
    if (error) showToast('Hata: '+error.message)
    else { showToast('İçerik eklendi!'); setModal(false); load(); setForm({title:'',client_id:'',type:'post',status:'draft',assigned_to:'',publish_date:'',notes:''}) }
  }

  async function changeStatus(id:string, status:string) {
    await createClient().from('contents').update({status}).eq('id',id)
    setItems(prev => prev.map(x => x.id===id ? {...x,status} : x))
    if (sel?.id===id) setSel((s:any) => s ? {...s,status} : null)
    showToast(`Durum → ${ST[status]?.l}`)
  }

  // Filtrele
  let filtered = filter==='all' ? items : items.filter(i=>i.status===filter)
  if (clientF !== 'all') filtered = filtered.filter(i=>i.client_id===clientF)

  // Workflow sayıları
  const wfCounts: Record<string,number> = {}
  WORKFLOW.forEach(s => { wfCounts[s.id] = items.filter(i=>i.status===s.id && (clientF==='all'||i.client_id===clientF)).length })

  return (
    <>
      <style>{`
        .ic-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .ic-wrap{flex:1;display:flex;overflow:hidden}
        .ic-list{flex:1;overflow-y:auto;padding:14px 16px 80px}
        .ic-detail{width:300px;border-left:1px solid var(--bdr);overflow-y:auto;padding:16px;flex-shrink:0}
        .wf-flow{display:flex;align-items:center;gap:4px;overflow-x:auto;padding:12px 16px;border-bottom:1px solid var(--bdr)}
        .wf-flow::-webkit-scrollbar{height:0}
        .wf-step{flex-shrink:0;padding:8px 12px;border-radius:8px;background:var(--s2);border:1px solid var(--bdr);min-width:100px;text-align:center}
        .wf-step.has{background:var(--s3);border-color:var(--bdr2)}
        .ic-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:12px;cursor:pointer;transition:border-color .12s}
        .ic-card:hover{border-color:var(--bdr2)}
        .ic-card.sel{border-color:var(--ac);background:var(--ac2)}
        @media(max-width:900px){.ic-grid{grid-template-columns:repeat(2,1fr)}.ic-detail{display:none}}
        @media(max-width:600px){.ic-grid{grid-template-columns:1fr}}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="İçerik Merkezi" subtitle={`${items.length} içerik`} action={
          <button className="btn" onClick={()=>setModal(true)}><Plus size={13} strokeWidth={2}/>İçerik Ekle</button>
        }/>
        {toast&&<div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}

        {/* Workflow akış göstergesi */}
        <div className="wf-flow">
          {WORKFLOW.map((s, i) => (
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
              <div className={`wf-step${wfCounts[s.id]>0?' has':''}`} onClick={()=>setFilter(s.id)} style={{cursor:'pointer',borderColor:filter===s.id?s.c:'',borderWidth:filter===s.id?1.5:1}}>
                <div style={{fontSize:16,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:wfCounts[s.id]>0?s.c:'var(--tx3)',lineHeight:1,marginBottom:2}}>{wfCounts[s.id]}</div>
                <div style={{fontSize:10.5,fontWeight:600,color:wfCounts[s.id]>0?'var(--tx)':'var(--tx3)'}}>{s.l}</div>
                <div style={{fontSize:9,color:'var(--tx3)',marginTop:1}}>{s.sub}</div>
              </div>
              {i<WORKFLOW.length-1&&<ChevronRight size={13} style={{color:'var(--tx3)'}}/>}
            </div>
          ))}
        </div>

        {/* Filtreler */}
        <div style={{display:'flex',gap:6,padding:'10px 16px',borderBottom:'1px solid var(--bdr)',overflowX:'auto',flexShrink:0,background:'var(--s1)'}}>
          <button onClick={()=>setFilter('all')} className={filter==='all'?'btn':'btn-ghost'} style={{fontSize:11.5,padding:'4px 11px',flexShrink:0}}>
            Tümü ({items.length})
          </button>
          {Object.entries(ST).map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)} className={filter===k?'btn':'btn-ghost'} style={{fontSize:11.5,padding:'4px 11px',flexShrink:0}}>
              {v.l} ({items.filter(i=>i.status===k).length})
            </button>
          ))}
          <div style={{width:1,background:'var(--bdr)',flexShrink:0,margin:'0 4px'}}/>
          <select value={clientF} onChange={e=>setClientF(e.target.value)} className="inp" style={{fontSize:11.5,padding:'4px 10px',height:'auto',minWidth:130,flexShrink:0}}>
            <option value="all">Tüm Müşteriler</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="ic-wrap">
          <div className="ic-list">
            {loading ? <p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
            : filtered.length===0 ? <div style={{padding:'40px 0',textAlign:'center',color:'var(--tx3)',fontSize:13}}>İçerik bulunamadı.</div>
            : <div className="ic-grid">
              {filtered.map(item=>{
                const st = ST[item.status]||ST.draft
                const overdue = item.publish_date && new Date(item.publish_date) < new Date() && item.status !== 'published'
                return (
                  <div key={item.id} className={`ic-card${sel?.id===item.id?' sel':''}`} onClick={()=>setSel(item)}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                      <span className={`badge ${st.cls}`} style={{fontSize:9.5}}>{st.l}</span>
                      <span className="badge badge-muted" style={{fontSize:9.5}}>{TYPE[item.type]||item.type}</span>
                    </div>
                    <p style={{fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:8,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{item.title}</p>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {item.client&&(
                        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11.5,color:'var(--tx3)'}}>
                          <Building2 size={10} strokeWidth={2}/>{item.client.name}
                        </div>
                      )}
                      {item.assignee&&(
                        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11.5,color:'var(--tx3)'}}>
                          <User size={10} strokeWidth={2}/>{item.assignee.full_name}
                        </div>
                      )}
                      {item.publish_date&&(
                        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11.5,color:overdue?'var(--red)':'var(--tx3)'}}>
                          <Calendar size={10} strokeWidth={2}/>{item.publish_date}{overdue?' ⚠':''}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>}
          </div>

          {/* Detay paneli */}
          {sel && (
            <div className="ic-detail">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <p style={{fontSize:13.5,fontWeight:700,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sel.title}</p>
                <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:16,flexShrink:0}}>✕</button>
              </div>

              {/* Durum değiştir */}
              <p style={{fontSize:10.5,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Durum Değiştir</p>
              <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:16}}>
                {Object.entries(ST).map(([k,v])=>(
                  <button key={k} onClick={()=>changeStatus(sel.id,k)}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:8,border:`1px solid ${sel.status===k?v.color:'var(--bdr)'}`,background:sel.status===k?`${v.color}15`:'var(--s2)',cursor:'pointer',transition:'all .12s'}}>
                    <span style={{fontSize:12.5,fontWeight:sel.status===k?700:400,color:sel.status===k?v.color:'var(--tx2)'}}>{v.l}</span>
                    {sel.status===k&&<span style={{fontSize:10,color:v.color,fontWeight:700}}>✓ Mevcut</span>}
                  </button>
                ))}
              </div>

              {/* Detaylar */}
              <p style={{fontSize:10.5,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Detaylar</p>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {[
                  {l:'Müşteri',   v:sel.client?.name||'—'},
                  {l:'Tür',       v:TYPE[sel.type]||sel.type},
                  {l:'Sorumlu',   v:sel.assignee?.full_name||'—'},
                  {l:'Yayın Tar.',v:sel.publish_date||'—'},
                  {l:'Akış Adımı',v:ST[sel.status]?.owner||'—'},
                ].map(f=>(
                  <div key={f.l} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:'var(--s2)',borderRadius:7}}>
                    <span style={{fontSize:11.5,color:'var(--tx3)'}}>{f.l}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{f.v}</span>
                  </div>
                ))}
              </div>

              {sel.notes&&(
                <div style={{marginTop:12,background:'var(--s2)',borderRadius:8,padding:'10px 12px',fontSize:12.5,color:'var(--tx2)',lineHeight:1.6}}>
                  {sel.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modal&&(
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p className="modal-title" style={{margin:0}}>İçerik Ekle</p>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={15}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><label className="label">Başlık *</label>
                <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="inp" autoFocus placeholder="İçerik başlığı..."/>
              </div>
              <div><label className="label">Müşteri</label>
                <select value={form.client_id} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))} className="inp">
                  <option value="">— Seçin —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="modal-grid">
                <div><label className="label">Tür</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="inp">
                    {Object.entries(TYPE).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className="label">Durum</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="inp">
                    {Object.entries(ST).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
                  </select>
                </div>
                <div><label className="label">Sorumlu</label>
                  <select value={form.assigned_to} onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))} className="inp">
                    <option value="">— Seçin —</option>
                    {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div><label className="label">Yayın Tarihi</label>
                  <input type="date" value={form.publish_date} onChange={e=>setForm(p=>({...p,publish_date:e.target.value}))} className="inp"/>
                </div>
              </div>
              <div><label className="label">Not</label>
                <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} className="inp" rows={2} placeholder="Brief, açıklama..."/>
              </div>
              <button className="btn" onClick={add} disabled={!form.title.trim()} style={{width:'100%',justifyContent:'center',padding:'10px'}}>
                İçerik Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
