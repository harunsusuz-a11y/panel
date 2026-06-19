'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

const PRI_C: Record<string,string> = { critical:'var(--red)', high:'var(--amber)', normal:'var(--blue)', low:'var(--t2)' }

export default function TakvimPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [tasks, setTasks] = useState<any[]>([])
  const [selected, setSelected] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    createClient()
      .from('tasks')
      .select('*')
      .not('due_date','is',null)
      .then(({data})=>{ setTasks(data||[]); setLoading(false) })
  },[])

  function daysInMonth(y:number,m:number){ return new Date(y,m+1,0).getDate() }
  function firstDay(y:number,m:number){ let d=new Date(y,m,1).getDay(); return d===0?6:d-1 }

  const totalDays = daysInMonth(year,month)
  const startDay = firstDay(year,month)
  const cells: (number|null)[] = [...Array(startDay).fill(null), ...Array.from({length:totalDays},(_,i)=>i+1)]
  while(cells.length%7!==0) cells.push(null)

  function tasksOnDay(d:number){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return tasks.filter(t=>t.due_date?.startsWith(dateStr))
  }

  function prevMonth(){ if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  function nextMonth(){ if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  const selectedTasks = selected ? tasks.filter(t=>t.due_date?.startsWith(selected)) : []

  return (
    <>
      <style>{`
        .cal-grid{display:grid;grid-template-columns:1fr;gap:12px;}
        .cal-main{background:var(--s1);border:1px solid var(--glass-border);border-radius:14px;overflow:hidden;}
        .cal-side{background:var(--s1);border:1px solid var(--glass-border);border-radius:14px;padding:16px;}
        @media(min-width:769px){.cal-grid{grid-template-columns:1fr 280px;}}
      `}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Takvim" subtitle={`${MONTHS[month]} ${year}`}/>
        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
          <div className="cal-grid">
            <div className="cal-main">
              {/* Header */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--glass-border)'}}>
                <button onClick={prevMonth} style={{background:'var(--s2)',border:'1px solid var(--glass-border)',borderRadius:8,color:'var(--t2)',fontSize:16,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                <span style={{fontSize:14,fontWeight:700}}>{MONTHS[month]} {year}</span>
                <button onClick={nextMonth} style={{background:'var(--s2)',border:'1px solid var(--glass-border)',borderRadius:8,color:'var(--t2)',fontSize:16,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
              </div>
              {/* Gün başlıkları */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid var(--glass-border)'}}>
                {DAYS.map(d=><div key={d} style={{padding:'8px 0',textAlign:'center',fontSize:10,fontWeight:700,color:'var(--t3)'}}>{d}</div>)}
              </div>
              {/* Hücreler */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                {cells.map((d,i)=>{
                  const isToday = d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()
                  const dateStr = d?`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null
                  const dayTasks = d?tasksOnDay(d):[]
                  const isSelected = dateStr===selected
                  return (
                    <div key={i} onClick={()=>d&&dateStr&&setSelected(isSelected?null:dateStr)}
                      style={{minHeight:56,padding:'6px',borderBottom:Math.floor(i/7)<Math.floor(cells.length/7)-1?'1px solid var(--glass-border)':'none',borderRight:i%7<6?'1px solid var(--glass-border)':'none',cursor:d?'pointer':'default',background:isSelected?'var(--gold-d)':d?'transparent':'var(--bg)',transition:'background 0.15s'}}>
                      {d && (
                        <>
                          <div style={{width:22,height:22,borderRadius:'50%',background:isToday?'var(--gold)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:isToday?700:400,color:isToday?'#000':isSelected?'var(--gold)':'var(--text)',marginBottom:2}}>
                            {d}
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:2}}>
                            {dayTasks.slice(0,2).map(t=>(
                              <div key={t.id} style={{fontSize:9,fontWeight:600,padding:'1px 4px',borderRadius:3,background:`${PRI_C[t.priority]||'var(--blue)'}22`,color:PRI_C[t.priority]||'var(--blue)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                            ))}
                            {dayTasks.length>2 && <div style={{fontSize:9,color:'var(--t3)',fontWeight:600}}>+{dayTasks.length-2} daha</div>}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Yan panel */}
            <div className="cal-side">
              {selected ? (<>
                <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:'var(--gold)'}}>
                  {new Date(selected+'T00:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}
                </div>
                {selectedTasks.length===0 ? (
                  <div style={{color:'var(--t3)',fontSize:12,textAlign:'center',padding:'20px 0'}}>Bu günde görev yok</div>
                ) : selectedTasks.map(t=>(
                  <div key={t.id} style={{padding:'10px',background:'var(--s2)',borderRadius:8,marginBottom:8,border:`1px solid ${PRI_C[t.priority]||'var(--blue)'}22`}}>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{t.title}</div>
                    <div style={{display:'flex',gap:6}}>
                      <span style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20,background:`${PRI_C[t.priority]}22`,color:PRI_C[t.priority]}}>{t.priority}</span>
                      <span style={{fontSize:10,padding:'1px 7px',borderRadius:20,background:'var(--s3)',color:'var(--t2)'}}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </>) : (<>
                <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Yaklaşan Görevler</div>
                {loading ? <div style={{color:'var(--t3)',fontSize:12}}>Yükleniyor...</div> :
                  tasks.filter(t=>t.due_date&&new Date(t.due_date)>=today).sort((a,b)=>a.due_date.localeCompare(b.due_date)).slice(0,8).map(t=>(
                    <div key={t.id} style={{display:'flex',gap:10,marginBottom:10,padding:'10px',background:'var(--s2)',borderRadius:8}}>
                      <div style={{width:3,background:PRI_C[t.priority]||'var(--blue)',borderRadius:2,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:10,color:'var(--t3)',marginTop:2,fontFamily:'JetBrains Mono'}}>{t.due_date?.slice(0,10)}</div>
                      </div>
                    </div>
                  ))
                }
              </>)}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}