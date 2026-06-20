'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const PRI_C: Record<string,string> = {critical:'var(--red)',high:'var(--amber)',normal:'var(--ac)',low:'var(--tx3)'}

export default function OperasyonPage() {
  const [tasks, setTasks]       = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('tasks').select('id,title,status,priority,due_date,assigned_to,project_id').in('status',['in_progress','review']).order('due_date'),
      sb.from('projects').select('id,name,status,progress,deadline').eq('status','active'),
    ]).then(async ([t, p]) => {
      const tdata = t.data || []
      const ids = tdata.map((x:any)=>x.assigned_to).filter(Boolean)
      const prids = tdata.map((x:any)=>x.project_id).filter(Boolean)
      const profiles:Record<string,any>={}
      const projs:Record<string,any>={}
      if (ids.length>0) { const{data:pr}=await sb.from('profiles').select('id,full_name').in('id',ids);(pr||[]).forEach((x:any)=>{profiles[x.id]=x}) }
      if (prids.length>0) { const{data:pj}=await sb.from('projects').select('id,name').in('id',prids);(pj||[]).forEach((x:any)=>{projs[x.id]=x}) }
      setTasks(tdata.map((x:any)=>({...x,assignee:profiles[x.assigned_to],project:projs[x.project_id]})))
      setProjects(p.data||[])
      setLoading(false)
    })
  }, [])

  return (
    <>
      <style>{`.op-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:14px}@media(max-width:768px){.op-grid{grid-template-columns:1fr}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Operasyon" subtitle="Canlı Takip"/>
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
          {loading ? <p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p> : (
            <div className="op-grid">
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Devam Eden Görevler</span>
                  <span className="badge badge-ac">{tasks.length}</span>
                </div>
                {tasks.length===0
                  ? <p style={{padding:28,textAlign:'center',color:'var(--tx3)',fontSize:13}}>Aktif görev yok</p>
                  : tasks.map((t,i) => (
                    <div key={t.id} className="row" style={{borderBottom:i<tasks.length-1?'1px solid var(--bdr)':'none'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:5}}>{t.title}</p>
                        <div style={{display:'flex',gap:7,alignItems:'center'}}>
                          <span className="badge" style={{background:`${PRI_C[t.priority]||'var(--ac)'}18`,color:PRI_C[t.priority]||'var(--ac)'}}>{t.priority}</span>
                          {t.assignee&&<span style={{fontSize:11.5,color:'var(--tx3)'}}>{t.assignee.full_name}</span>}
                          {t.project&&<span style={{fontSize:11.5,color:'var(--tx3)'}}>· {t.project.name}</span>}
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                        <span className={`badge ${t.status==='in_progress'?'badge-ac':'badge-amber'}`}>
                          {t.status==='in_progress'?'Devam':'İnceleme'}
                        </span>
                        {t.due_date&&<span style={{fontSize:10.5,color:new Date(t.due_date)<new Date()?'var(--red)':'var(--tx3)',fontFamily:'JetBrains Mono,monospace'}}>{t.due_date.slice(0,10)}</span>}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="card">
                <div className="card-h"><span className="card-title">Aktif Projeler</span></div>
                {projects.length===0
                  ? <p style={{padding:28,textAlign:'center',color:'var(--tx3)',fontSize:13}}>Aktif proje yok</p>
                  : projects.map((p,i) => (
                    <div key={p.id} className="row" style={{borderBottom:i<projects.length-1?'1px solid var(--bdr)':'none'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:6}}>{p.name}</p>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div className="prog" style={{flex:1}}>
                            <div className="prog-fill" style={{width:`${p.progress||0}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--ac)':'var(--red)'}}/>
                          </div>
                          <span style={{fontSize:11.5,color:'var(--tx2)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{p.progress||0}%</span>
                        </div>
                        {p.deadline&&<p style={{fontSize:11,color:'var(--tx3)',marginTop:3}}>Bitiş: {p.deadline}</p>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
