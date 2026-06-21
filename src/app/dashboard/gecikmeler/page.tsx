'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import InfoBox from '@/components/InfoBox'
import { CheckCircle2 } from 'lucide-react'
import { fmtDeadline, fmtDateTime } from '@/lib/utils'

const PRI_C: Record<string,string> = { critical:'var(--red)', high:'var(--amber)', normal:'var(--blue)', low:'var(--tx3)' }
const PRI_L: Record<string,string> = { critical:'Kritik', high:'Yüksek', normal:'Normal', low:'Düşük' }

export default function GecikmelerPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const sb = createClient()
    const { data } = await sb.from('tasks')
      .select('id,title,status,priority,due_date,assigned_to,client_id,project_id')
      .neq('status','done').lt('due_date', new Date().toISOString()).order('due_date')

    const assigneeIds = [...new Set((data||[]).map((t:any)=>t.assigned_to).filter(Boolean))]
    const clientIds   = [...new Set((data||[]).map((t:any)=>t.client_id).filter(Boolean))]

    const profiles: Record<string,any> = {}
    const clientMap: Record<string,any> = {}

    await Promise.all([
      assigneeIds.length > 0
        ? sb.from('profiles').select('id,full_name,department').in('id', assigneeIds)
            .then(({data:pr}) => { (pr||[]).forEach((p:any)=>{profiles[p.id]=p}) })
        : Promise.resolve(),
      clientIds.length > 0
        ? sb.from('clients').select('id,name').in('id', clientIds)
            .then(({data:cl}) => { (cl||[]).forEach((c:any)=>{clientMap[c.id]=c}) })
        : Promise.resolve(),
    ])

    setTasks((data||[]).map((t:any)=>({
      ...t,
      assignee: profiles[t.assigned_to],
      client:   clientMap[t.client_id],
    })))
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function markDone(id:string) {
    // completed_at trigger tarafından set edilir
    const {error} = await createClient().from('tasks').update({status:'done'}).eq('id',id)
    if (!error) setTasks(ts=>ts.filter(t=>t.id!==id))
  }

  const critical = tasks.filter(t=>t.priority==='critical')
  const others = tasks.filter(t=>t.priority!=='critical')

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Gecikmeler" subtitle={`${tasks.length} geciken görev`} />
      <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
        {loading ? <p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
        : tasks.length===0 ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:'60px 0'}}>
            <CheckCircle2 size={40} style={{color:'var(--green)',opacity:.6}} strokeWidth={1.5} />
            <p style={{fontSize:15,fontWeight:600,color:'var(--green)'}}>Geciken görev yok!</p>
            <p style={{fontSize:13,color:'var(--tx3)'}}>Tüm görevler zamanında tamamlanmış.</p>
          </div>
        ) : (<>
          {critical.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'var(--red)'}}/>
                <span style={{fontSize:12,fontWeight:700,color:'var(--red)',textTransform:'uppercase',letterSpacing:'.06em'}}>Kritik ({critical.length})</span>
              </div>
              {critical.map(t=><TaskRow key={t.id} t={t} onDone={markDone}/>)}
            </div>
          )}
          {others.length>0&&(
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'var(--amber)'}}/>
                <span style={{fontSize:12,fontWeight:700,color:'var(--amber)',textTransform:'uppercase',letterSpacing:'.06em'}}>Diğer ({others.length})</span>
              </div>
              {others.map(t=><TaskRow key={t.id} t={t} onDone={markDone}/>)}
            </div>
          )}
        </>)}
      </div>
    </div>
  )
}

function TaskRow({t,onDone}:{t:any;onDone:(id:string)=>void}) {
  const days=Math.floor((Date.now()-new Date(t.due_date).getTime())/86400000)
  const c=PRI_C[t.priority]||'var(--tx3)'
  return (
    <div style={{background:'var(--s1)',border:`1px solid ${c}25`,borderLeft:`2.5px solid ${c}`,borderRadius:10,padding:'13px 16px',marginBottom:8,display:'flex',alignItems:'center',gap:12}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:600,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span className="badge" style={{background:`${c}18`,color:c}}>{PRI_L[t.priority]}</span>
          {t.client&&<span style={{fontSize:11.5,color:'var(--blue)'}}>🏢 {t.client.name}</span>}
          {t.assignee&&<span style={{fontSize:11.5,color:'var(--tx3)'}}>👤 {t.assignee.full_name}</span>}
          <span style={{fontSize:11.5,color:'var(--tx3)',fontFamily:'JetBrains Mono,monospace'}}>{fmtDeadline(t.due_date)}</span>
        </div>
      </div>
      <span style={{fontSize:13,fontWeight:700,color:c,fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>+{days}g</span>
      <button onClick={()=>onDone(t.id)} style={{background:'var(--green2)',border:'1px solid rgba(34,211,160,.2)',borderRadius:7,color:'var(--green)',fontSize:12,fontWeight:700,padding:'6px 11px',cursor:'pointer',flexShrink:0}}>✓ Tamamla</button>
    </div>
  )
}
