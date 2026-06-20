'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
const PRI_C: Record<string,string> = {critical:'var(--red)',high:'var(--amber)',normal:'var(--ac)',low:'var(--tx3)'}

export default function TakvimPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [tasks, setTasks] = useState<any[]>([])
  const [sel, setSel] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().from('tasks').select('id,title,status,priority,due_date').not('due_date','is',null).then(({data}) => { setTasks(data||[]); setLoading(false) })
  }, [])

  const daysInMonth = (y:number,m:number) => new Date(y,m+1,0).getDate()
  const firstDay = (y:number,m:number) => { let d=new Date(y,m,1).getDay(); return d===0?6:d-1 }
  const totalDays = daysInMonth(year,month)
  const startDay = firstDay(year,month)
  const cells: (number|null)[] = [...Array(startDay).fill(null), ...Array.from({length:totalDays},(_,i)=>i+1)]
  while(cells.length%7!==0) cells.push(null)

  const tasksOnDay = (d:number) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return tasks.filter(t => t.due_date?.startsWith(ds))
  }

  const prevM = () => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const nextM = () => { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  const selTasks = sel ? tasks.filter(t=>t.due_date?.startsWith(sel)) : []
  const upcoming = tasks.filter(t=>t.due_date&&t.status!=='done'&&new Date(t.due_date)>=today).sort((a,b)=>a.due_date.localeCompare(b.due_date)).slice(0,8)

  return (
    <>
      <style>{`.cal-grid{display:grid;grid-template-columns:1fr 260px;gap:14px}@media(max-width:900px){.cal-grid{grid-template-columns:1fr}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Takvim" subtitle={`${MONTHS[month]} ${year}`}/>
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px 80px'}}>
          <div className="cal-grid">
            <div className="card">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--bdr)'}}>
                <button onClick={prevM} className="btn-ghost" style={{fontSize:16,padding:'4px 10px'}}>‹</button>
                <span style={{fontSize:14,fontWeight:700}}>{MONTHS[month]} {year}</span>
                <button onClick={nextM} className="btn-ghost" style={{fontSize:16,padding:'4px 10px'}}>›</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid var(--bdr)'}}>
                {DAYS.map(d=><div key={d} style={{padding:'8px 0',textAlign:'center',fontSize:10,fontWeight:700,color:'var(--tx3)'}}>{d}</div>)}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                {cells.map((d,i)=>{
                  const isToday = d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()
                  const ds = d?`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null
                  const dt = d?tasksOnDay(d):[]
                  const isSel = ds===sel
                  return (
                    <div key={i} onClick={()=>d&&ds&&setSel(isSel?null:ds)}
                      style={{minHeight:52,padding:'5px',borderBottom:Math.floor(i/7)<Math.floor(cells.length/7)-1?'1px solid var(--bdr)':'none',borderRight:i%7<6?'1px solid var(--bdr)':'none',cursor:d?'pointer':'default',background:isSel?'var(--ac2)':d?'transparent':'var(--bg)',transition:'background .1s'}}>
                      {d&&(
                        <>
                          <div style={{width:22,height:22,borderRadius:'50%',background:isToday?'var(--ac)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11.5,fontWeight:isToday?700:400,color:isToday?'#fff':isSel?'var(--ac)':'var(--tx)',marginBottom:2}}>{d}</div>
                          {dt.slice(0,2).map(t=>(
                            <div key={t.id} style={{fontSize:9,padding:'1px 4px',borderRadius:3,background:`${PRI_C[t.priority]||'var(--ac)'}22`,color:PRI_C[t.priority]||'var(--ac)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:1}}>{t.title}</div>
                          ))}
                          {dt.length>2&&<div style={{fontSize:9,color:'var(--tx3)',fontWeight:600}}>+{dt.length-2}</div>}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="card" style={{alignSelf:'flex-start'}}>
              <div className="card-h"><span className="card-title">{sel?new Date(sel+'T00:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'}):'Yaklaşan'}</span></div>
              <div style={{padding:'4px 0'}}>
                {sel?selTasks.length===0?<p style={{padding:'20px',textAlign:'center',color:'var(--tx3)',fontSize:12}}>Bu günde görev yok</p>:selTasks.map((t,i)=>(
                  <div key={t.id} className="row" style={{borderBottom:i<selTasks.length-1?'1px solid var(--bdr)':'none'}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:PRI_C[t.priority]||'var(--ac)',flexShrink:0}}/>
                    <p style={{fontSize:12.5,flex:1}}>{t.title}</p>
                  </div>
                ))
                : loading?<p style={{padding:16,color:'var(--tx3)',fontSize:12}}>Yükleniyor...</p>:upcoming.map((t,i)=>(
                  <div key={t.id} className="row" style={{borderBottom:i<upcoming.length-1?'1px solid var(--bdr)':'none'}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:PRI_C[t.priority]||'var(--ac)',flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                      <p style={{fontSize:10.5,color:'var(--tx3)',marginTop:1,fontFamily:'JetBrains Mono,monospace'}}>{t.due_date?.slice(0,10)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
