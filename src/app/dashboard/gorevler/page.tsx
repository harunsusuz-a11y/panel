'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const COLS = [
  { id:'todo',        label:'Bekliyor',   color:'var(--t3)' },
  { id:'in_progress', label:'Devam',      color:'var(--blue)' },
  { id:'review',      label:'Kontrol',    color:'var(--amber)' },
  { id:'done',        label:'Tamam',      color:'var(--green)' },
]

const PRI: Record<string,any> = {
  critical:{label:'Kritik',c:'var(--red)',bg:'var(--red-d)'},
  high:{label:'Yüksek',c:'var(--amber)',bg:'var(--amber-d)'},
  normal:{label:'Normal',c:'var(--blue)',bg:'var(--blue-d)'},
  low:{label:'Düşük',c:'var(--t2)',bg:'var(--s3)'},
}

const inp: React.CSSProperties = { width:'100%', background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'9px 10px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif' }

export default function GorevlerPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ title:'', project_id:'', assigned_to:'', priority:'normal', status:'todo', due_date:'' })

  async function load() {
    const sb = createClient()
    const [t,p,pr] = await Promise.all([
      sb.from('tasks').select('*, assignee:profiles!tasks_assigned_to_fkey(full_name), project:projects(name)').order('created_at',{ascending:false}),
      sb.from('projects').select('id,name').eq('status','active'),
      sb.from('profiles').select('id,full_name'),
    ])
    setTasks(t.data||[]); setProjects(p.data||[]); setProfiles(pr.data||[]); setLoading(false)
  }

  useEffect(()=>{ load() },[])

  async function add() {
    if (!form.title) return
    const sb = createClient()
    const {data:{user}} = await sb.auth.getUser()
    const {error} = await sb.from('tasks').insert({
      ...form,
      project_id:form.project_id||null, assigned_to:form.assigned_to||null,
      due_date:form.due_date||null, created_by:user?.id,
    })
    if (error) { setToast('Hata: '+error.message) }
    else { setToast('Görev oluşturuldu!'); setModal(false); load(); setForm({title:'',project_id:'',assigned_to:'',priority:'normal',status:'todo',due_date:''}) }
    setTimeout(()=>setToast(''),3000)
  }

  async function moveTask(id:string, status:string) {
    const updates: any = { status }
    if (status==='done') updates.completed_at = new Date().toISOString()
    await createClient().from('tasks').update(updates).eq('id',id)
    setTasks(t=>t.map(x=>x.id===id?{...x,...updates}:x))
    setDetail(null)
  }

  async function deleteTask(id:string) {
    if (!confirm('Görevi silmek istediğinize emin misiniz?')) return
    await createClient().from('tasks').delete().eq('id',id)
    setTasks(t=>t.filter(x=>x.id!==id)); setDetail(null)
  }

  return (
    <>
      <style>{`
        .kanban-wrap{flex:1;overflow-x:auto;overflow-y:hidden;padding:12px;display:flex;gap:10px;}
        .kanban-col{width:220px;flex-shrink:0;display:flex;flex-direction:column;}
        .modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .modal-box{background:var(--s1);border:1px solid var(--glass-border);border-radius:14px;padding:24px;width:420px;max-width:calc(100vw - 32px);max-height:90vh;overflow-y:auto;}
        @media(max-width:768px){
          .kanban-col{width:175px;}
          .modal-grid{grid-template-columns:1fr;}
          .modal-box{width:100%;border-radius:18px 18px 0 0;position:fixed;bottom:0;left:0;right:0;max-height:85vh;padding:20px;}
          .modal-overlay{align-items:flex-end !important;}
        }
      `}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Görev Yönetimi" subtitle="Kanban" action={
          <button onClick={()=>setModal(true)} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:12,padding:'6px 14px',borderRadius:7,border:'none',cursor:'pointer'}}>+ Yeni</button>
        }/>
        {toast && <div style={{margin:'8px 14px',padding:'10px 14px',borderRadius:8,background:toast.startsWith('Hata')?'var(--red-d)':'var(--green-d)',color:toast.startsWith('Hata')?'var(--red)':'var(--green)',fontSize:12,fontWeight:600,flexShrink:0}}>{toast}</div>}

        {loading ? <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:13}}>Yükleniyor...</div> : (
          <div className="kanban-wrap">
            {COLS.map(col=>{
              const colTasks = tasks.filter(t=>t.status===col.id)
              return (
                <div key={col.id} className="kanban-col">
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8,padding:'6px 8px',background:'var(--s2)',borderRadius:8,border:'1px solid var(--glass-border)'}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:col.color}}/>
                    <span style={{fontSize:12,fontWeight:700,color:col.color,flex:1}}>{col.label}</span>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--t3)'}}>{colTasks.length}</span>
                  </div>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:7,overflowY:'auto'}}>
                    {colTasks.map(t=>{
                      const p = PRI[t.priority]||PRI.normal
                      return (
                        <div key={t.id} onClick={()=>setDetail(t)}
                          style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:10,padding:'11px',cursor:'pointer'}}
                          onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--border2)')}
                          onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--glass-border)')}>
                          <div style={{fontSize:12,fontWeight:500,marginBottom:7,lineHeight:1.4}}>{t.title}</div>
                          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:7}}>
                            <span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:p.bg,color:p.c,fontWeight:700}}>{p.label}</span>
                            {t.project?.name && <span style={{fontSize:9,padding:'2px 6px',borderRadius:20,background:'var(--s3)',color:'var(--t2)',fontWeight:600}}>{t.project.name}</span>}
                          </div>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <div style={{width:20,height:20,borderRadius:'50%',background:'var(--gold-d)',color:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800}}>
                              {(t.assignee?.full_name||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                            {t.due_date && <span style={{fontSize:9,color:new Date(t.due_date)<new Date()&&t.status!=='done'?'var(--red)':'var(--t3)',fontWeight:600,fontFamily:'JetBrains Mono'}}>{t.due_date.slice(0,10)}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Yeni Görev Modal */}
        {modal && (
          <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
            <div className="modal-box">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <span style={{fontSize:15,fontWeight:700}}>Yeni Görev</span>
                <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer',lineHeight:1}}>✕</button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div><label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Görev Başlığı</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Görev açıklaması..." style={inp}/></div>
                <div className="modal-grid">
                  <div><label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Proje</label>
                    <select value={form.project_id} onChange={e=>setForm(f=>({...f,project_id:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      <option value="">Seçin</option>
                      {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div><label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Sorumlu</label>
                    <select value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      <option value="">Seçin</option>
                      {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
                    </select>
                  </div>
                  <div><label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Öncelik</label>
                    <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                      <option value="critical">Kritik</option><option value="high">Yüksek</option><option value="normal">Normal</option><option value="low">Düşük</option>
                    </select>
                  </div>
                  <div><label style={{fontSize:11,color:'var(--t2)',display:'block',marginBottom:5}}>Deadline</label><input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} style={inp}/></div>
                </div>
                <button onClick={add} style={{background:'var(--gold)',color:'#000',fontWeight:700,fontSize:13,padding:'11px',borderRadius:9,border:'none',cursor:'pointer',marginTop:4}}>Görev Oluştur</button>
              </div>
            </div>
          </div>
        )}

        {/* Detay Modal */}
        {detail && (
          <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
            <div className="modal-box">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <span style={{fontSize:15,fontWeight:700}}>Görev Detayı</span>
                <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',color:'var(--t3)',fontSize:20,cursor:'pointer',lineHeight:1}}>✕</button>
              </div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:14,lineHeight:1.4}}>{detail.title}</div>
              <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:16}}>
                {[
                  {l:'Proje',v:detail.project?.name||'—'},
                  {l:'Sorumlu',v:detail.assignee?.full_name||'—'},
                  {l:'Öncelik',v:PRI[detail.priority]?.label||detail.priority},
                  {l:'Durum',v:COLS.find(c=>c.id===detail.status)?.label||detail.status},
                  {l:'Deadline',v:detail.due_date?.slice(0,10)||'—'},
                ].map(f=>(
                  <div key={f.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:'var(--s2)',borderRadius:8}}>
                    <span style={{fontSize:11,color:'var(--t3)'}}>{f.l}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{f.v}</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:'var(--t2)',marginBottom:8}}>Sütunu Değiştir:</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
                {COLS.filter(c=>c.id!==detail.status).map(c=>(
                  <button key={c.id} onClick={()=>moveTask(detail.id,c.id)} style={{fontSize:11,fontWeight:600,padding:'6px 12px',borderRadius:7,border:'1px solid var(--glass-border)',background:'var(--s2)',color:c.color,cursor:'pointer'}}>→ {c.label}</button>
                ))}
              </div>
              <button onClick={()=>deleteTask(detail.id)} style={{width:'100%',padding:'9px',borderRadius:8,border:'none',background:'var(--red-d)',color:'var(--red)',fontWeight:700,fontSize:12,cursor:'pointer'}}>Görevi Sil</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}