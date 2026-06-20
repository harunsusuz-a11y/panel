'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import InfoBox from '@/components/InfoBox'
import { Eye, EyeOff, User, Building2, FileText } from 'lucide-react'

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
const PRI_C: Record<string,string> = { critical:'var(--red)', high:'var(--amber)', normal:'var(--ac)', low:'var(--tx3)' }
const PRI_L: Record<string,string> = { critical:'Kritik', high:'Yüksek', normal:'Normal', low:'Düşük' }
const ST_L:  Record<string,string> = { todo:'Bekliyor', in_progress:'Devam', review:'Kontrol', done:'Tamamlandı' }

export default function TakvimPage() {
  const today = new Date()
  const [year,    setYear]    = useState(today.getFullYear())
  const [month,   setMonth]   = useState(today.getMonth())
  const [tasks,   setTasks]   = useState<any[]>([])
  const [sel,     setSel]     = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [myId,    setMyId]    = useState('')
  const [myRole,  setMyRole]  = useState('')
  const [myName,  setMyName]  = useState('')
  const [filterMe, setFilterMe] = useState(false)
  const [contents, setContents] = useState<any[]>([])
  const [showContents, setShowContents] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setMyId(user.id)
      const { data: prof } = await sb.from('profiles').select('role,full_name').eq('id', user.id).single()
      setMyRole(prof?.role || 'member')
      setMyName(prof?.full_name?.split(' ')[0] || '')

      // İçerikleri çek (publish_date olanlar)
      const { data: ctData } = await sb.from('contents').select('id,title,publish_date,status,client_id').not('publish_date','is',null)
      const { data: ctClients } = await sb.from('clients').select('id,name')
      const ctcm: Record<string,any> = {}; (ctClients||[]).forEach((x:any) => { ctcm[x.id] = x })
      setContents((ctData||[]).map((x:any) => ({...x, client: ctcm[x.client_id]})))

      // Görevleri çek
      let q = sb.from('tasks')
        .select('id,title,status,priority,due_date,assigned_to,client_id,project_id')
        .not('due_date', 'is', null)

      // member → sadece kendi görevleri
      if (prof?.role === 'member') {
        q = q.eq('assigned_to', user.id)
      }

      const { data: t } = await q.order('due_date')

      // assignee + client isimlerini çek
      const assigneeIds = [...new Set((t||[]).map((x:any) => x.assigned_to).filter(Boolean))]
      const clientIds   = [...new Set((t||[]).map((x:any) => x.client_id).filter(Boolean))]
      const pm: Record<string,any> = {}
      const cm: Record<string,any> = {}

      if (assigneeIds.length > 0) {
        const { data: pr } = await sb.from('profiles').select('id,full_name').in('id', assigneeIds)
        ;(pr||[]).forEach((x:any) => { pm[x.id] = x })
      }
      if (clientIds.length > 0) {
        const { data: cl } = await sb.from('clients').select('id,name').in('id', clientIds)
        ;(cl||[]).forEach((x:any) => { cm[x.id] = x })
      }

      setTasks((t||[]).map((x:any) => ({
        ...x,
        assignee: pm[x.assigned_to],
        client:   cm[x.client_id],
      })))
      setLoading(false)
    })
  }, [])

  const isManagerPlus = myRole === 'admin' || myRole === 'manager'

  // Görev filtresi: manager/admin filterMe açıksa sadece kendi, kapalıysa hepsi
  const visibleTasks = isManagerPlus && filterMe
    ? tasks.filter(t => t.assigned_to === myId)
    : tasks

  const daysInMonth = (y:number,m:number) => new Date(y,m+1,0).getDate()
  const firstDay    = (y:number,m:number) => { let d=new Date(y,m,1).getDay(); return d===0?6:d-1 }
  const totalDays   = daysInMonth(year,month)
  const startDay    = firstDay(year,month)
  const cells: (number|null)[] = [...Array(startDay).fill(null), ...Array.from({length:totalDays},(_,i)=>i+1)]
  while(cells.length%7!==0) cells.push(null)

  const tasksOnDay = (d:number) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return visibleTasks.filter(t => t.due_date?.startsWith(ds))
  }
  const contentsOnDay = (d:number) => {
    if (!showContents) return []
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return contents.filter(ct => ct.publish_date?.startsWith(ds))
  }

  const prevM = () => { if(month===0){setYear(y=>y-1);setMonth(11)}else setMonth(m=>m-1) }
  const nextM = () => { if(month===11){setYear(y=>y+1);setMonth(0)}else setMonth(m=>m+1) }

  const selTasks = sel ? visibleTasks.filter(t=>t.due_date?.startsWith(sel)) : []
  const upcoming = visibleTasks
    .filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) >= today)
    .sort((a,b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 10)

  const overdueCount = visibleTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < today).length

  return (
    <>
      <style>{`.cal-grid{display:grid;grid-template-columns:1fr 270px;gap:14px}@media(max-width:900px){.cal-grid{grid-template-columns:1fr}}`}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar
          title="Takvim"
          subtitle={`${MONTHS[month]} ${year}${!isManagerPlus ? ` — ${myName}` : ''}`}
          action={
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {overdueCount > 0 && (
                <span className="badge badge-red">{overdueCount} gecikmiş</span>
              )}
              <button onClick={() => setShowContents(f => !f)}
                style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:7,border:`1px solid ${showContents?'var(--amber)':'var(--bdr)'}`,background:showContents?'var(--amber2)':'var(--s2)',cursor:'pointer',fontSize:11,color:showContents?'var(--amber)':'var(--tx3)',fontWeight:600}}>
                <FileText size={11} strokeWidth={2}/>İçerik
              </button>
              {/* Manager/admin: kendi görevlerini toggle edebilir */}
              {isManagerPlus && (
                <button
                  onClick={() => setFilterMe(f => !f)}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'5px 11px',borderRadius:8,border:`1px solid ${filterMe?'var(--ac)':'var(--bdr)'}`,background:filterMe?'var(--ac2)':'var(--s2)',cursor:'pointer',fontSize:11.5,color:filterMe?'var(--ac)':'var(--tx2)',fontWeight:600,transition:'all .15s'}}>
                  {filterMe ? <EyeOff size={12} strokeWidth={2}/> : <Eye size={12} strokeWidth={2}/>}
                  {filterMe ? 'Sadece Benim' : 'Tüm Ekip'}
                </button>
              )}
            </div>
          }
        />

        {/* Sadece kendi görevi bilgi banner (member) */}
        {!isManagerPlus && (
          <div style={{padding:'7px 20px',background:'var(--blue2)',borderBottom:'1px solid rgba(78,168,240,.15)',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <User size={12} style={{color:'var(--blue)'}} strokeWidth={2}/>
            <span style={{fontSize:12,color:'var(--blue)',fontWeight:500}}>Takvimde sadece sana atanmış görevler görünüyor</span>
          </div>
        )}

        <div style={{flex:1,overflowY:'auto',padding:'16px 18px 80px'}}>
          {loading ? <p style={{color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p> : (
            <div className="cal-grid">

              {/* TAKVİM */}
              <div className="card">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--bdr)'}}>
                  <button onClick={prevM} className="btn-ghost" style={{fontSize:18,padding:'3px 10px',lineHeight:1}}>‹</button>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontSize:15,fontWeight:700}}>{MONTHS[month]} {year}</p>
                    <p style={{fontSize:10.5,color:'var(--tx3)',marginTop:2}}>
                      {visibleTasks.filter(t=>!t.due_date?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)?false:true).length} görev bu ayda
                    </p>
                  </div>
                  <button onClick={nextM} className="btn-ghost" style={{fontSize:18,padding:'3px 10px',lineHeight:1}}>›</button>
                </div>

                {/* Gün başlıkları */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid var(--bdr)'}}>
                  {DAYS.map(d=><div key={d} style={{padding:'8px 0',textAlign:'center',fontSize:10,fontWeight:700,color:'var(--tx3)'}}>{d}</div>)}
                </div>

                {/* Hücreler */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                  {cells.map((d,i)=>{
                    const isToday = d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()
                    const ds = d?`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null
                    const dt = d?tasksOnDay(d):[]
                    const isSel = ds===sel
                    const hasOverdue = dt.some(t=>t.status!=='done'&&ds&&new Date(ds)<today)
                    return (
                      <div key={i} onClick={()=>d&&ds&&setSel(isSel?null:ds)}
                        style={{
                          minHeight:60,padding:'5px',
                          borderBottom: Math.floor(i/7)<Math.floor(cells.length/7)-1?'1px solid var(--bdr)':'none',
                          borderRight: i%7<6?'1px solid var(--bdr)':'none',
                          cursor:d?'pointer':'default',
                          background: isSel?'var(--ac2)': hasOverdue?'rgba(242,87,87,.04)' : d?'transparent':'var(--bg)',
                          transition:'background .1s'
                        }}>
                        {d&&(<>
                          <div style={{
                            width:22,height:22,borderRadius:'50%',
                            background:isToday?'var(--ac)':'transparent',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:11.5,fontWeight:isToday?700:400,
                            color:isToday?'#fff':isSel?'var(--ac)':hasOverdue?'var(--red)':'var(--tx)',
                            marginBottom:2
                          }}>{d}</div>
                          {contentsOnDay(d!).slice(0,1).map(ct=>(
                            <div key={ct.id} style={{fontSize:9,padding:'2px 4px',borderRadius:3,background:'rgba(240,168,67,.2)',color:'var(--amber)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:1}}>
                              📅 {ct.title}
                            </div>
                          ))}
                          {dt.slice(0,2).map(t=>(
                            <div key={t.id} style={{
                              fontSize:9,padding:'2px 4px',borderRadius:3,
                              background:`${PRI_C[t.priority]||'var(--ac)'}22`,
                              color:PRI_C[t.priority]||'var(--ac)',
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                              marginBottom:1
                            }}>
                              {isManagerPlus && t.assignee ? `${t.assignee.full_name.split(' ')[0]}: ` : ''}{t.title}
                            </div>
                          ))}
                          {dt.length>2&&<div style={{fontSize:9,color:'var(--tx3)',fontWeight:600}}>+{dt.length-2} daha</div>}
                        </>)}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SAĞ PANEL */}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>

                {/* Seçili gün görevleri */}
                <div className="card">
                  <div className="card-h">
                    <span className="card-title">
                      {sel ? new Date(sel+'T00:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'}) : 'Yaklaşan Görevler'}
                    </span>
                    {sel&&<button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer',fontSize:14}}>✕</button>}
                  </div>
                  <div>
                    {sel ? (
                      selTasks.length===0
                        ? <p style={{padding:'20px',textAlign:'center',color:'var(--tx3)',fontSize:12}}>Bu günde görev yok</p>
                        : selTasks.map(t=>(
                          <div key={t.id} className="row">
                            <div style={{width:8,height:8,borderRadius:'50%',background:PRI_C[t.priority]||'var(--ac)',flexShrink:0}}/>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontSize:12.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                              <div style={{display:'flex',gap:8,marginTop:3,flexWrap:'wrap'}}>
                                {t.client&&<span style={{fontSize:10.5,color:'var(--tx3)',display:'flex',alignItems:'center',gap:3}}><Building2 size={9} strokeWidth={2}/>{t.client.name}</span>}
                                {isManagerPlus&&t.assignee&&<span style={{fontSize:10.5,color:'var(--tx3)',display:'flex',alignItems:'center',gap:3}}><User size={9} strokeWidth={2}/>{t.assignee.full_name}</span>}
                              </div>
                            </div>
                            <span className="badge" style={{background:`${PRI_C[t.priority]||'var(--ac)'}18`,color:PRI_C[t.priority]||'var(--ac)',fontSize:9.5,flexShrink:0}}>{ST_L[t.status]}</span>
                          </div>
                        ))
                    ) : (
                      upcoming.length===0
                        ? <p style={{padding:'20px',textAlign:'center',color:'var(--tx3)',fontSize:12}}>Yaklaşan görev yok</p>
                        : upcoming.map(t=>{
                          const diff = Math.ceil((new Date(t.due_date).getTime()-today.getTime())/86400000)
                          const urgent = diff<=1
                          return (
                            <div key={t.id} className="row" style={{cursor:'pointer'}} onClick={()=>setSel(t.due_date?.slice(0,10))}>
                              <div style={{width:8,height:8,borderRadius:'50%',background:urgent?'var(--red)':PRI_C[t.priority]||'var(--ac)',flexShrink:0}}/>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontSize:12.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</p>
                                <div style={{display:'flex',gap:8,marginTop:3}}>
                                  {t.client&&<span style={{fontSize:10,color:'var(--tx3)',display:'flex',alignItems:'center',gap:3}}><Building2 size={9} strokeWidth={2}/>{t.client.name}</span>}
                                  {isManagerPlus&&t.assignee&&<span style={{fontSize:10,color:'var(--tx3)',display:'flex',alignItems:'center',gap:3}}><User size={9} strokeWidth={2}/>{t.assignee.full_name.split(' ')[0]}</span>}
                                </div>
                              </div>
                              <span style={{fontSize:11,fontWeight:600,color:urgent?'var(--red)':'var(--tx3)',fontFamily:'JetBrains Mono,monospace',flexShrink:0,whiteSpace:'nowrap'}}>
                                {diff===0?'Bugün':diff===1?'Yarın':`${diff}g`}
                              </span>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>

                {/* Bu haftanın özeti */}
                <div className="card">
                  <div className="card-h"><span className="card-title">Bu Hafta</span></div>
                  <div style={{padding:'12px 14px'}}>
                    {(() => {
                      const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay()+1)
                      const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6)
                      const weekTasks = visibleTasks.filter(t=>t.due_date&&new Date(t.due_date)>=weekStart&&new Date(t.due_date)<=weekEnd)
                      const done      = weekTasks.filter(t=>t.status==='done').length
                      const total     = weekTasks.length
                      const pct       = total===0?0:Math.round((done/total)*100)
                      return (
                        <>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                            <span style={{fontSize:12,color:'var(--tx3)'}}>Haftalık tamamlanma</span>
                            <span style={{fontSize:12.5,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:pct>=70?'var(--green)':pct>=40?'var(--ac)':'var(--amber)'}}>{done}/{total}</span>
                          </div>
                          <div className="prog"><div className="prog-fill" style={{width:`${pct}%`,background:pct>=70?'var(--green)':pct>=40?'var(--ac)':'var(--amber)'}}/></div>
                          <div style={{display:'flex',gap:10,marginTop:10}}>
                            {[
                              {l:'Tamamlandı',v:done,         c:'var(--green)'},
                              {l:'Devam',     v:weekTasks.filter(t=>t.status==='in_progress').length,c:'var(--ac)'},
                              {l:'Bekliyor',  v:weekTasks.filter(t=>t.status==='todo').length,       c:'var(--tx3)'},
                            ].map(s=>(
                              <div key={s.l} style={{flex:1,textAlign:'center',background:'var(--s2)',borderRadius:7,padding:'7px 4px'}}>
                                <p style={{fontSize:17,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:s.c,lineHeight:1}}>{s.v}</p>
                                <p style={{fontSize:9.5,color:'var(--tx3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.04em'}}>{s.l}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
