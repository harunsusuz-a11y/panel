'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

export default function OperasyonPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const sb = createClient()
    Promise.all([
      sb.from('tasks').select('*, assignee:profiles!tasks_assigned_to_fkey(full_name), project:projects(name,client:clients(name))').in('status',['in_progress','review']).order('due_date'),
      sb.from('projects').select('*,client:clients(name)').eq('status','active'),
      sb.from('profiles').select('id,full_name,department,role'),
    ]).then(([t,p,pr])=>{ setTasks(t.data||[]); setProjects(p.data||[]); setProfiles(pr.data||[]); setLoading(false) })
  },[])

  const PRI_C: Record<string,string> = { critical:'var(--red)', high:'var(--amber)', normal:'var(--blue)', low:'var(--t2)' }
  const PRI_L: Record<string,string> = { critical:'Kritik', high:'Yüksek', normal:'Normal', low:'Düşük' }

  return (
    <>
      <style>{`.op-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:14px;} @media(max-width:768px){.op-grid{grid-template-columns:1fr;}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Operasyon Merkezi" subtitle="Canlı takip"/>
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
          {loading ? <div style={{color:'var(--t3)',padding:20}}>Yükleniyor...</div> : (
            <div className="op-grid">
              {/* Aktif görevler */}
              <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',borderBottom:'1px solid var(--glass-border)'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',boxShadow:'0 0 6px var(--green)'}}/>
                  <span style={{fontSize:13,fontWeight:700}}>Aktif Görevler</span>
                  <span style={{fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:20,background:'var(--green-d)',color:'var(--green)',marginLeft:'auto'}}>{tasks.length}</span>
                </div>
                {tasks.length===0 ? <div style={{padding:30,textAlign:'center',color:'var(--t3)',fontSize:12}}>Devam eden görev yok</div>
                  : tasks.map((t,i)=>(
                  <div key={t.id} style={{padding:'12px 16px',borderBottom:i<tasks.length-1?'1px solid var(--glass-border)':'none'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{t.assignee?.full_name||'—'} · {t.project?.client?.name||'—'}</div>
                      </div>
                      <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20,background:`${PRI_C[t.priority]}18`,color:PRI_C[t.priority],flexShrink:0,marginLeft:8}}>{PRI_L[t.priority]}</span>
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{fontSize:9,padding:'2px 8px',borderRadius:20,background:'var(--blue-d)',color:'var(--blue)',fontWeight:600}}>
                        {t.status==='in_progress'?'Devam Ediyor':'İncelemede'}
                      </span>
                      {t.due_date && <span style={{fontSize:9,color:new Date(t.due_date)<new Date()?'var(--red)':'var(--t3)',fontFamily:'JetBrains Mono'}}>{t.due_date.slice(0,10)}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Aktif projeler */}
              <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--glass-border)',fontSize:13,fontWeight:700}}>Aktif Projeler</div>
                {projects.length===0 ? <div style={{padding:30,textAlign:'center',color:'var(--t3)',fontSize:12}}>Aktif proje yok</div>
                  : projects.map((p,i)=>(
                  <div key={p.id} style={{padding:'12px 16px',borderBottom:i<projects.length-1?'1px solid var(--glass-border)':'none'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600}}>{p.name}</div>
                        <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{p.client?.name||'—'}</div>
                      </div>
                      <span style={{fontSize:14,fontWeight:800,color:p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)',fontFamily:'JetBrains Mono'}}>{p.progress}%</span>
                    </div>
                    <div style={{height:4,background:'var(--s4)',borderRadius:2,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${p.progress}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)',borderRadius:2}}/>
                    </div>
                    {p.deadline && <div style={{fontSize:9,color:'var(--t3)',marginTop:4,fontFamily:'JetBrains Mono'}}>Son: {p.deadline}</div>}
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