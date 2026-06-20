'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

function Ring({ value, color, size=52 }: { value:number; color:string; size?:number }) {
  const [m, setM] = useState(false)
  useEffect(()=>{ setTimeout(()=>setM(true),200) },[])
  const r=(size-8)/2, circ=2*Math.PI*r
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--s4)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ-(m?value/100:0)*circ}
        style={{transition:'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1) .3s'}}/>
    </svg>
  )
}

export default function PerformansPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [tasks,    setTasks]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(()=>{
    const sb = createClient()
    Promise.all([
      sb.from('profiles').select('*').not('full_name','is',null),
      sb.from('tasks').select('*'),
    ]).then(([p,t])=>{ setProfiles(p.data||[]); setTasks(t.data||[]); setLoading(false) })
  },[])

  const now = new Date()
  const teamData = profiles.map(p=>{
    const my    = tasks.filter(t=>t.assigned_to===p.id)
    const done  = my.filter(t=>t.status==='done').length
    const total = my.length
    const overdue = my.filter(t=>t.status!=='done'&&t.due_date&&new Date(t.due_date)<now).length
    const score = total===0 ? 50 : Math.max(0,Math.min(100,Math.round((done/total)*100-overdue*8+40)))
    const color = score>=80?'var(--green)':score>=60?'var(--ac)':'var(--amber)'
    return {...p,done,total,overdue,score,color}
  }).filter(p=>p.full_name).sort((a,b)=>b.score-a.score)

  const totalTasks = tasks.length
  const doneTasks  = tasks.filter(t=>t.status==='done').length

  return (
    <>
      <style>{`.pg-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}@media(max-width:768px){.pg-grid{grid-template-columns:repeat(2,1fr)}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Performans" subtitle="Ekip Analizi"/>
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
          {loading?<p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>:(<>
            <div className="pg-grid">
              {[
                {l:'Toplam Görev',  v:totalTasks, c:'var(--blue)'},
                {l:'Tamamlanan',    v:doneTasks,  c:'var(--green)'},
                {l:'Genel Başarı',  v:`${totalTasks?Math.round((doneTasks/totalTasks)*100):0}%`, c:'var(--ac)'},
                {l:'Ekip Üyesi',    v:teamData.length, c:'var(--amber)'},
              ].map(s=>(
                <div key={s.l} className="kpi" style={{borderLeft:`2.5px solid ${s.c}`}}>
                  <p className="kpi-label">{s.l}</p>
                  <p className="kpi-value" style={{color:s.c}}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-h"><span className="card-title">Ekip Sıralaması</span></div>
              {teamData.length===0
                ? <p style={{padding:28,textAlign:'center',color:'var(--tx3)',fontSize:13}}>Görev ataması yapılmamış.</p>
                : teamData.map((m,i)=>(
                  <div key={m.id} className="row" style={{borderBottom:i<teamData.length-1?'1px solid var(--bdr)':'none'}}>
                    <span style={{fontSize:13,fontWeight:700,color:'var(--tx3)',width:22,textAlign:'center',flexShrink:0}}>#{i+1}</span>
                    <Ring value={m.score} color={m.color} size={46}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                        <div>
                          <span style={{fontSize:13,fontWeight:600}}>{m.full_name}</span>
                          <span style={{fontSize:11,color:'var(--tx3)',marginLeft:8}}>{m.department||'—'}</span>
                        </div>
                        <span style={{fontSize:18,fontWeight:700,color:m.color,fontFamily:'JetBrains Mono,monospace'}}>{m.score}</span>
                      </div>
                      <div className="prog"><div className="prog-fill" style={{width:`${m.score}%`,background:m.color}}/></div>
                      <div style={{display:'flex',gap:12,marginTop:5}}>
                        <span style={{fontSize:11,color:'var(--green)'}}>✓ {m.done} tamamlandı</span>
                        <span style={{fontSize:11,color:'var(--tx3)'}}>{m.total} toplam</span>
                        {m.overdue>0&&<span style={{fontSize:11,color:'var(--red)'}}>⚠ {m.overdue} gecikmiş</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>)}
        </div>
      </div>
    </>
  )
}
