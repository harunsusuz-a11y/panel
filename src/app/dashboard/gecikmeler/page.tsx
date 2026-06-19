'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const PRI: Record<string,any> = {
  critical:{l:'Kritik',c:'var(--red)',bg:'var(--red-d)'},
  high:{l:'Yüksek',c:'var(--amber)',bg:'var(--amber-d)'},
  normal:{l:'Normal',c:'var(--blue)',bg:'var(--blue-d)'},
  low:{l:'Düşük',c:'var(--t2)',bg:'var(--s3)'},
}

function hoursLate(dueDate: string) {
  const diff = Date.now() - new Date(dueDate).getTime()
  const h = Math.floor(diff / 3600000)
  return h >= 24 ? `+${Math.floor(h/24)} gün` : `+${h} sa`
}

export default function GecikmelerPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    createClient()
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name,department), project:projects(name,client:clients(name))')
      .neq('status','done')
      .lt('due_date', new Date().toISOString())
      .order('due_date')
      .then(({data})=>{ setTasks(data||[]); setLoading(false) })
  },[])

  async function markDone(id: string) {
    await createClient().from('tasks').update({status:'done',completed_at:new Date().toISOString()}).eq('id',id)
    setTasks(t=>t.filter(x=>x.id!==id))
  }

  const critical = tasks.filter(t=>t.priority==='critical')
  const others = tasks.filter(t=>t.priority!=='critical')

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Gecikmeler" subtitle={`${tasks.length} geciken görev`}/>
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
        {loading ? <div style={{color:'var(--t3)',padding:20,fontSize:12}}>Yükleniyor...</div> : tasks.length===0 ? (
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontSize:14,fontWeight:600,color:'var(--green)'}}>Geciken görev yok!</div>
            <div style={{fontSize:12,color:'var(--t3)',marginTop:6}}>Tüm görevler zamanında tamamlanmış.</div>
          </div>
        ) : (<>
          {critical.length>0 && (
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'var(--red)',boxShadow:'0 0 8px var(--red)'}}/>
                <span style={{fontSize:12,fontWeight:700,color:'var(--red)'}}>KRİTİK GECİKMELER ({critical.length})</span>
              </div>
              {critical.map((t,i)=><TaskRow key={t.id} t={t} onDone={markDone} last={i===critical.length-1}/>)}
            </div>
          )}
          {others.length>0 && (
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'var(--amber)'}}/>
                <span style={{fontSize:12,fontWeight:700,color:'var(--amber)'}}>DİĞER GECİKMELER ({others.length})</span>
              </div>
              {others.map((t,i)=><TaskRow key={t.id} t={t} onDone={markDone} last={i===others.length-1}/>)}
            </div>
          )}
        </>)}
      </div>
    </div>
  )
}

function TaskRow({t,onDone,last}:{t:any;onDone:(id:string)=>void;last:boolean}) {
  const p = PRI[t.priority]||PRI.normal
  const late = t.due_date ? hoursLate(t.due_date) : '—'
  return (
    <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:12,padding:'14px 16px',marginBottom:last?0:8}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:`${p.c}18`,color:p.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0,border:`1px solid ${p.c}30`}}>
          {(t.assignee?.full_name||'?').split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{t.title}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:6}}>
            <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:p.bg,color:p.c}}>{p.l}</span>
            {t.project?.name && <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'var(--s3)',color:'var(--t2)'}}>{t.project.name}</span>}
            {t.project?.client?.name && <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'var(--s3)',color:'var(--t2)'}}>{t.project.client.name}</span>}
          </div>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--t3)'}}>{t.assignee?.full_name||'Atanmadı'} · {t.assignee?.department||'—'}</span>
            <span style={{fontSize:12,fontWeight:800,color:p.c,fontFamily:'JetBrains Mono'}}>{late}</span>
          </div>
        </div>
        <button onClick={()=>onDone(t.id)} style={{background:'var(--green-d)',border:'1px solid rgba(34,214,110,0.2)',borderRadius:8,color:'var(--green)',fontSize:11,fontWeight:700,padding:'6px 10px',cursor:'pointer',flexShrink:0}}>
          ✓ Tamamla
        </button>
      </div>
    </div>
  )
}