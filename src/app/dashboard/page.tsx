'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

/* ─── SVG Bar Chart ─── */
function BarChart({ bars, height=100 }: { bars:{label:string;value:number;color:string}[]; height?:number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: height + 28 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          {b.value > 0 && <div style={{ fontSize: 9, color: b.color, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
            {b.value >= 1000 ? `₺${Math.round(b.value/1000)}K` : `₺${b.value}`}
          </div>}
          <div style={{ width: '100%', height: mounted ? `${(b.value / max) * height}px` : '0px', background: b.color, borderRadius: '4px 4px 0 0', transition: `height 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 50}ms`, minHeight: b.value > 0 ? 4 : 0 }}/>
          <div style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 500, whiteSpace: 'nowrap' }}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── Mini Sparkline ─── */
function Spark({ data, color, w=80, h=28 }: { data:number[]; color:string; w?:number; h?:number }) {
  if (data.length < 2) return null
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`)
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id={`sp${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <path d={`M${pts.join(' L')} L${w},${h} L0,${h} Z`} fill={`url(#sp${color.replace(/[^a-z0-9]/gi,'')})`}/>
      <path d={`M${pts.join(' L')}`} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─── KPI Card ─── */
function KPI({ label, value, sub, color, spark }: { label:string; value:string; sub?:string; color:string; spark?:number[] }) {
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}88,transparent)` }}/>
      <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono', color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 5 }}>{sub}</div>}
      {spark && spark.length > 1 && <div style={{ marginTop: 10 }}><Spark data={spark} color={color}/></div>}
    </div>
  )
}

/* ─── Donut Chart ─── */
function Donut({ segments, size=120 }: { segments:{value:number;color:string;label:string}[]; size?:number }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 200) }, [])
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - 16) / 2, circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        {segments.map((s, i) => {
          const pct = s.value / total
          const dash = m ? pct * circ : 0
          const gap = circ - dash
          const thisOffset = offset
          offset += pct * circ
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth="12"
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-thisOffset}
            style={{ transition: `stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1) ${i*100}ms` }}/>
        })}
        {total === 0 && <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--s4)" strokeWidth="12"/>}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }}/>
            <span style={{ fontSize: 11, color: 'var(--t2)' }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono', marginLeft: 'auto' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function DashboardPage() {
  const [data, setData] = useState<any>({ tasks:[], projects:[], clients:[], transactions:[], profiles:[], contents:[] })
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const sb = createClient()
    Promise.all([
      sb.from('tasks').select('*'),
      sb.from('projects').select('*,client:clients(name)'),
      sb.from('clients').select('*'),
      sb.from('transactions').select('*').order('date'),
      sb.from('profiles').select('*'),
      sb.from('contents').select('*'),
    ]).then(([t,p,c,tr,pr,co]) => {
      setData({ tasks:t.data||[], projects:p.data||[], clients:c.data||[], transactions:tr.data||[], profiles:pr.data||[], contents:co.data||[] })
      setLoading(false)
    })
  }, [])

  const { tasks, projects, clients, transactions, profiles, contents } = data

  // Hesaplamalar
  const income = transactions.filter((t:any)=>t.type==='income').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const expense = transactions.filter((t:any)=>t.type==='expense').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const net = income - expense
  const pending_inv = transactions.filter((t:any)=>t.status==='pending'||t.status==='overdue').reduce((s:number,t:any)=>s+Number(t.amount),0)

  const now = new Date()
  const overdue_tasks = tasks.filter((t:any)=>t.status!=='done'&&t.due_date&&new Date(t.due_date)<now)
  const active_projects = projects.filter((p:any)=>p.status==='active')
  const active_clients = clients.filter((c:any)=>c.status==='active')
  const pending_approvals = contents.filter((c:any)=>c.status==='pending')

  // Aylık gelir (son 6 ay)
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const currentMonth = now.getMonth()
  const monthlyBars = Array.from({length:6},(_,i)=>{
    const m = (currentMonth - 5 + i + 12) % 12
    const monthIncome = transactions.filter((t:any)=>t.type==='income'&&t.date&&new Date(t.date).getMonth()===m).reduce((s:number,t:any)=>s+Number(t.amount),0)
    return { label: months[m], value: monthIncome, color: i===5?'var(--gold)':'rgba(107,140,255,0.55)' }
  })

  // Görev durum dağılımı
  const taskStatus = [
    {value:tasks.filter((t:any)=>t.status==='todo').length, color:'var(--t3)', label:'Bekliyor'},
    {value:tasks.filter((t:any)=>t.status==='in_progress').length, color:'var(--blue)', label:'Devam'},
    {value:tasks.filter((t:any)=>t.status==='review').length, color:'var(--amber)', label:'Kontrol'},
    {value:tasks.filter((t:any)=>t.status==='done').length, color:'var(--green)', label:'Tamam'},
  ]

  // Proje ilerleme bars
  const topProjects = active_projects.slice(0,5)

  // Son aktiviteler (son görevler)
  const recentTasks = [...tasks].sort((a:any,b:any)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,6)

  // Geciken görevler (kritik)
  const criticalDelays = overdue_tasks.filter((t:any)=>t.priority==='critical'||t.priority==='high').slice(0,4)

  return (
    <>
      <style>{`
        .db-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
        .db-r2{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:12px;margin-bottom:12px;}
        .db-r3{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        @media(max-width:768px){
          .db-kpi{grid-template-columns:repeat(2,1fr);}
          .db-r2{grid-template-columns:1fr;}
          .db-r3{grid-template-columns:1fr;}
        }
        .panel{background:var(--s1);border:1px solid var(--glass-border);border-radius:14px;overflow:hidden;}
        .ph{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--glass-border);}
        .ph-title{font-size:13px;font-weight:700;}
      `}</style>
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',background:'var(--bg)'}}>
        <TopBar title="Dashboard" action={
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:8,background:'var(--s2)',border:'1px solid var(--glass-border)'}}>
            <div className="pulse-dot" style={{width:5,height:5,borderRadius:'50%',background:'var(--green)'}}/>
            <span style={{fontSize:11,fontFamily:'JetBrains Mono',color:'var(--green)',fontWeight:600}}>{time}</span>
          </div>
        }/>

        <div style={{flex:1,overflowY:'auto',padding:'14px 16px 80px'}}>
          {loading ? <div style={{color:'var(--t3)',padding:20,fontSize:13}}>Yükleniyor...</div> : (<>

            {/* KPI Row */}
            <div className="db-kpi">
              <KPI label="Toplam Gelir" value={`₺${Math.round(income/1000)}K`} sub={`Gider: ₺${Math.round(expense/1000)}K`} color="var(--green)" spark={monthlyBars.map(b=>b.value)}/>
              <KPI label="Net Kar" value={`₺${Math.round(net/1000)}K`} sub={net>=0?'Kâr':'Zarar'} color={net>=0?'var(--gold)':'var(--red)'} spark={monthlyBars.map((b,i)=>i%2===0?b.value:b.value*0.6)}/>
              <KPI label="Aktif Proje" value={String(active_projects.length)} sub={`${active_clients.length} müşteri`} color="var(--blue)" spark={[12,14,13,15,16,active_projects.length]}/>
              <KPI label="Tahsilat Bekleyen" value={`₺${Math.round(pending_inv/1000)}K`} sub={`${overdue_tasks.length} geciken görev`} color={pending_inv>0?'var(--amber)':'var(--green)'}/>
            </div>

            {/* Row 2: Gelir Grafiği + Görev Durumu + Kritik */}
            <div className="db-r2">

              {/* Aylık Gelir Bar */}
              <div className="panel">
                <div className="ph">
                  <span className="ph-title">Aylık Gelir Trendi</span>
                  <span style={{fontSize:11,color:'var(--t3)'}}>Son 6 ay</span>
                </div>
                <div style={{padding:'14px 16px 10px'}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:16}}>
                    <span style={{fontSize:28,fontWeight:800,fontFamily:'JetBrains Mono',color:'var(--gold)',letterSpacing:'-1px'}}>₺{(income/1000).toFixed(0)}K</span>
                    <span style={{fontSize:12,color:'var(--green)',fontWeight:600}}>↑ Bu ay</span>
                  </div>
                  <BarChart bars={monthlyBars} height={110}/>
                </div>
              </div>

              {/* Görev Dağılımı Donut */}
              <div className="panel">
                <div className="ph"><span className="ph-title">Görev Durumu</span></div>
                <div style={{padding:'16px'}}>
                  <Donut segments={taskStatus} size={130}/>
                  <div style={{marginTop:14,padding:'10px 12px',background:'var(--s2)',borderRadius:8,display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:11,color:'var(--t3)'}}>Toplam görev</span>
                    <span style={{fontSize:14,fontWeight:800,fontFamily:'JetBrains Mono',color:'var(--text)'}}>{tasks.length}</span>
                  </div>
                </div>
              </div>

              {/* Kritik Gecikmeler */}
              <div className="panel">
                <div className="ph">
                  <span className="ph-title">⚠ Kritik</span>
                  <span style={{fontSize:10,fontWeight:700,padding:'1px 8px',borderRadius:20,background:'var(--red-d)',color:'var(--red)'}}>{overdue_tasks.length}</span>
                </div>
                <div style={{padding:'4px 14px'}}>
                  {criticalDelays.length === 0 ? (
                    <div style={{padding:'24px 0',textAlign:'center',color:'var(--green)',fontSize:12,fontWeight:600}}>✓ Kritik gecikme yok</div>
                  ) : criticalDelays.map((t:any,i:number)=>(
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:i<criticalDelays.length-1?'1px solid var(--glass-border)':'none'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:t.priority==='critical'?'var(--red)':'var(--amber)',flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:9,color:'var(--t3)',marginTop:2,fontFamily:'JetBrains Mono'}}>{t.due_date?.slice(0,10)}</div>
                      </div>
                      <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:20,background:t.priority==='critical'?'var(--red-d)':'var(--amber-d)',color:t.priority==='critical'?'var(--red)':'var(--amber)',flexShrink:0}}>
                        {t.priority==='critical'?'Kritik':'Yüksek'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Row 3: Proje Durumu + Son Aktivite */}
            <div className="db-r3">

              {/* Aktif Projeler ilerleme */}
              <div className="panel">
                <div className="ph"><span className="ph-title">Aktif Projeler</span>
                  <span style={{fontSize:10,color:'var(--t3)'}}>{active_projects.length} proje</span>
                </div>
                <div style={{padding:'6px 16px'}}>
                  {topProjects.length===0 ? <div style={{padding:'24px 0',textAlign:'center',color:'var(--t3)',fontSize:12}}>Aktif proje yok</div>
                  : topProjects.map((p:any,i:number)=>(
                    <div key={p.id} style={{padding:'10px 0',borderBottom:i<topProjects.length-1?'1px solid var(--glass-border)':'none'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <div style={{minWidth:0,flex:1}}>
                          <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                          <div style={{fontSize:10,color:'var(--t3)',marginTop:1}}>{p.client?.name||'—'} {p.deadline&&`· ${p.deadline}`}</div>
                        </div>
                        <span style={{fontSize:13,fontWeight:800,fontFamily:'JetBrains Mono',color:p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)',marginLeft:12,flexShrink:0}}>{p.progress}%</span>
                      </div>
                      <div style={{height:4,background:'var(--s4)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${p.progress}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)',borderRadius:2,transition:'width 1s ease'}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gelir vs Gider detay + Son işlemler */}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {/* Finans özet */}
                <div className="panel">
                  <div className="ph"><span className="ph-title">Finans Özeti</span></div>
                  <div style={{padding:'10px 16px'}}>
                    {[
                      {l:'Toplam Gelir',v:income,c:'var(--green)'},
                      {l:'Toplam Gider',v:expense,c:'var(--red)'},
                      {l:'Net Kar',v:net,c:net>=0?'var(--gold)':'var(--red)'},
                      {l:'Tahsilat Bekleyen',v:pending_inv,c:'var(--amber)'},
                    ].map(s=>(
                      <div key={s.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid var(--glass-border)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:3,height:14,background:s.c,borderRadius:2}}/>
                          <span style={{fontSize:12,color:'var(--t2)'}}>{s.l}</span>
                        </div>
                        <span style={{fontSize:13,fontWeight:800,color:s.c,fontFamily:'JetBrains Mono'}}>₺{Math.round(s.v).toLocaleString('tr-TR')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Son işlemler */}
                <div className="panel" style={{flex:1}}>
                  <div className="ph"><span className="ph-title">Son İşlemler</span></div>
                  <div style={{padding:'4px 14px'}}>
                    {recentTasks.slice(0,4).map((t:any,i:number)=>(
                      <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<3?'1px solid var(--glass-border)':'none'}}>
                        <div style={{width:28,height:28,borderRadius:7,background:`${t.status==='done'?'var(--green-d)':t.status==='in_progress'?'var(--blue-d)':'var(--s3)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>
                          {t.status==='done'?'✓':t.status==='in_progress'?'▶':'○'}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                          <div style={{fontSize:9,color:'var(--t3)',marginTop:1,fontFamily:'JetBrains Mono'}}>{new Date(t.created_at).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:20,background:t.priority==='critical'?'var(--red-d)':t.priority==='high'?'var(--amber-d)':'var(--s3)',color:t.priority==='critical'?'var(--red)':t.priority==='high'?'var(--amber)':'var(--t3)',flexShrink:0}}>
                          {t.priority==='critical'?'Kritik':t.priority==='high'?'Yüksek':'Normal'}
                        </span>
                      </div>
                    ))}
                    {recentTasks.length===0&&<div style={{padding:'20px 0',textAlign:'center',color:'var(--t3)',fontSize:12}}>Henüz görev yok</div>}
                  </div>
                </div>
              </div>
            </div>
          </>)}
        </div>
      </div>
    </>
  )
}