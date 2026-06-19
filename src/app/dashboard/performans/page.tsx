'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

function Ring({ value, color, size=52 }: { value:number; color:string; size?:number }) {
  const [m, setM] = useState(false)
  useEffect(()=>{ setTimeout(()=>setM(true),200) },[])
  const r=(size-7)/2, circ=2*Math.PI*r
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--s4)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ-(m?value/100:0)*circ}
        style={{transition:'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1) 0.3s'}}/>
    </svg>
  )
}

function Bar({ value, color }: { value:number; color:string }) {
  const [m, setM] = useState(false)
  useEffect(()=>{ setTimeout(()=>setM(true),300) },[])
  return (
    <div style={{height:5,background:'var(--s4)',borderRadius:3,overflow:'hidden'}}>
      <div style={{height:'100%',width:m?`${value}%`:'0%',background:color,borderRadius:3,transition:'width 0.9s cubic-bezier(0.22,1,0.36,1)'}}/>
    </div>
  )
}

export default function PerformansPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const sb = createClient()
    Promise.all([
      sb.from('profiles').select('*').neq('full_name',null),
      sb.from('tasks').select('*'),
    ]).then(([p,t])=>{ setProfiles(p.data||[]); setTasks(t.data||[]); setLoading(false) })
  },[])

  const teamData = profiles.map(p=>{
    const myTasks = tasks.filter(t=>t.assigned_to===p.id)
    const done = myTasks.filter(t=>t.status==='done').length
    const total = myTasks.length
    const overdue = myTasks.filter(t=>t.status!=='done' && t.due_date && new Date(t.due_date)<new Date()).length
    const score = total===0 ? 0 : Math.max(0, Math.min(100, Math.round((done/total)*100 - overdue*10 + 50)))
    const color = score>=80?'var(--green)':score>=60?'var(--gold)':'var(--amber)'
    return { ...p, myTasks, done, total, overdue, score, color }
  }).filter(p=>p.full_name).sort((a,b)=>b.score-a.score)

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t=>t.status==='done').length
  const inProgress = tasks.filter(t=>t.status==='in_progress').length
  const overallScore = totalTasks ? Math.round((doneTasks/totalTasks)*100) : 0

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <TopBar title="Performans" subtitle="Ekip & Proje Analizi"/>
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
        {loading ? <div style={{color:'var(--t3)',padding:20,fontSize:12}}>Yükleniyor...</div> : (<>

          {/* Genel metrikler */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
            {[
              {l:'Toplam Görev',v:totalTasks,c:'var(--blue)'},
              {l:'Tamamlanan',v:doneTasks,c:'var(--green)'},
              {l:'Devam Eden',v:inProgress,c:'var(--gold)'},
              {l:'Genel Başarı',v:`${overallScore}%`,c:overallScore>=70?'var(--green)':'var(--amber)'},
            ].map(s=>(
              <div key={s.l} style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:12,padding:'14px'}}>
                <div style={{fontSize:10,color:'var(--t3)',marginBottom:5}}>{s.l}</div>
                <div style={{fontSize:24,fontWeight:800,color:s.c,fontFamily:'JetBrains Mono'}}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Ekip sıralaması */}
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,overflow:'hidden',marginBottom:14}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--glass-border)',fontSize:13,fontWeight:700}}>Ekip Performans Sıralaması</div>
            {teamData.length===0 ? (
              <div style={{padding:40,textAlign:'center',color:'var(--t3)',fontSize:13}}>Görev ataması yapılmamış. Görev Yönetimi'nden atama yapın.</div>
            ) : teamData.map((m,i)=>(
              <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:i<teamData.length-1?'1px solid var(--glass-border)':'none'}}>
                <div style={{fontSize:14,fontWeight:800,color:'var(--t3)',width:20,flexShrink:0,textAlign:'center'}}>#{i+1}</div>
                <Ring value={m.score} color={m.color} size={48}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <div>
                      <span style={{fontSize:13,fontWeight:600}}>{m.full_name}</span>
                      <span style={{fontSize:10,color:'var(--t3)',marginLeft:8}}>{m.department||'—'}</span>
                    </div>
                    <span style={{fontSize:18,fontWeight:800,color:m.color,fontFamily:'JetBrains Mono'}}>{m.score}</span>
                  </div>
                  <Bar value={m.score} color={m.color}/>
                  <div style={{display:'flex',gap:12,marginTop:5}}>
                    <span style={{fontSize:10,color:'var(--green)'}}>✓ {m.done} tamamlandı</span>
                    <span style={{fontSize:10,color:'var(--t3)'}}>📋 {m.total} toplam</span>
                    {m.overdue>0 && <span style={{fontSize:10,color:'var(--red)'}}>⚠ {m.overdue} gecikmiş</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Görev durum özeti */}
          <div style={{background:'var(--s1)',border:'1px solid var(--glass-border)',borderRadius:14,padding:'14px 16px'}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Görev Durum Dağılımı</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                {l:'Bekliyor',k:'todo',c:'var(--t2)'},
                {l:'Devam Ediyor',k:'in_progress',c:'var(--blue)'},
                {l:'İncelemede',k:'review',c:'var(--amber)'},
                {l:'Tamamlandı',k:'done',c:'var(--green)'},
              ].map(s=>{
                const count = tasks.filter(t=>t.status===s.k).length
                const pct = totalTasks ? Math.round((count/totalTasks)*100) : 0
                return (
                  <div key={s.k}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:12,color:'var(--t2)'}}>{s.l}</span>
                      <span style={{fontSize:12,fontWeight:700,color:s.c,fontFamily:'JetBrains Mono'}}>{count} ({pct}%)</span>
                    </div>
                    <Bar value={pct} color={s.c}/>
                  </div>
                )
              })}
            </div>
          </div>
        </>)}
      </div>
    </div>
  )
}