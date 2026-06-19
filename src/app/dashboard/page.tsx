'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'

/* ── Tiny sparkline ── */
function Spark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const w = 56, h = 20
  const max = Math.max(...data), min = Math.min(...data), r = max - min || 1
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / r) * (h - 3) - 1.5}`)
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible', opacity: 0.9 }}>
      <path d={`M${pts.join('L')} L${w},${h} L0,${h}Z`} fill={color} fillOpacity=".12" />
      <path d={`M${pts.join('L')}`} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Bar chart ── */
function Bars({ data }: { data: { label: string; v: number; hi: boolean }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), 80); return () => clearTimeout(t) }, [])
  const max = Math.max(...data.map(d => d.v), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72, width: '100%' }}>
      {data.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%',
            height: m ? `${Math.max((b.v / max) * 58, b.v > 0 ? 3 : 0)}px` : '0',
            background: b.hi ? 'var(--gold)' : 'var(--s4)',
            borderRadius: '3px 3px 0 0',
            transition: `height .5s cubic-bezier(.22,1,.36,1) ${i * 38}ms`,
          }} />
          <div style={{ fontSize: 8.5, color: b.hi ? 'var(--gold)' : 'var(--t3)', fontWeight: b.hi ? 600 : 400 }}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Donut ── */
function Donut({ segs }: { segs: { v: number; color: string; label: string }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 180) }, [])
  const total = segs.reduce((s, x) => s + x.v, 0) || 1
  const sz = 80, r = (sz - 12) / 2, circ = 2 * Math.PI * r
  let off = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--s3)" strokeWidth="10" />
        {segs.map((s, i) => {
          const pct = s.v / total, dash = m ? pct * circ : 0
          const o = off; off += pct * circ
          return <circle key={i} cx={sz/2} cy={sz/2} r={r} fill="none" stroke={s.color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-o}
            style={{ transition: `stroke-dasharray .7s cubic-bezier(.22,1,.36,1) ${i * 60}ms` }} />
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--t2)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono', marginLeft: 8 }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── KPI — NO icon box, just data ── */
function KPI({ label, value, sub, color, spark, trend }: {
  label: string; value: string; sub?: string; color: string; spark?: number[]; trend?: string
}) {
  return (
    <div style={{
      background: 'var(--s1)', borderRadius: 8,
      border: '1px solid var(--glass-border)',
      padding: '14px 16px', position: 'relative', overflow: 'hidden',
      transition: 'border-color .15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
    >
      {/* 2px top accent — signature element */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.7, borderRadius: '8px 8px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono', color: 'var(--text)', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 10.5, color: 'var(--t2)', marginTop: 5 }}>{sub}</div>}
          {trend && (
            <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: trend.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>
              {trend.startsWith('+') ? '↑' : '↓'} {trend} geçen aya göre
            </div>
          )}
        </div>
        {spark && spark.length > 1 && (
          <div style={{ flexShrink: 0, paddingTop: 18 }}>
            <Spark data={spark} color={color} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Row divider ── */
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
    </div>
  )
}

/* ── Main ── */
export default function DashboardPage() {
  const [d, setD] = useState<any>({ tasks: [], projects: [], clients: [], transactions: [], approvals: [] })
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        setUserName(data?.full_name?.split(' ')[0] || user.email?.split('@')[0] || '')
      })
    })
    Promise.all([
      sb.from('tasks').select('*'),
      sb.from('projects').select('*,client:clients(name)'),
      sb.from('clients').select('*'),
      sb.from('transactions').select('*').order('date'),
      sb.from('approvals').select('*'),
    ]).then(([t, p, c, tr, ap]) => {
      setD({ tasks: t.data||[], projects: p.data||[], clients: c.data||[], transactions: tr.data||[], approvals: ap.data||[] })
      setLoading(false)
    })
  }, [])

  const { tasks, projects, clients, transactions, approvals } = d
  const income  = transactions.filter((t:any) => t.type==='income').reduce((s:number,t:any) => s+Number(t.amount), 0)
  const expense = transactions.filter((t:any) => t.type==='expense').reduce((s:number,t:any) => s+Number(t.amount), 0)
  const net = income - expense
  const overdue  = tasks.filter((t:any) => t.status!=='done' && t.due_date && new Date(t.due_date)<now)
  const done     = tasks.filter((t:any) => t.status==='done')
  const pending  = approvals.filter((a:any) => a.status==='pending')
  const activeP  = projects.filter((p:any) => p.status==='active')
  const activeC  = clients.filter((c:any) => c.status==='active')

  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const cm = now.getMonth()
  const monthBars = Array.from({length:6},(_,i)=>{
    const m = (cm-5+i+12)%12
    const v = transactions.filter((t:any)=>t.type==='income'&&t.date&&new Date(t.date).getMonth()===m).reduce((s:number,t:any)=>s+Number(t.amount),0)
    return {label:MONTHS[m],v,hi:i===5}
  })
  const sparkIncome = monthBars.map(b=>b.v)

  const taskSegs = [
    {v:tasks.filter((t:any)=>t.status==='todo').length,        color:'var(--s5)',    label:'Bekliyor'},
    {v:tasks.filter((t:any)=>t.status==='in_progress').length, color:'var(--blue)',  label:'Devam Ediyor'},
    {v:tasks.filter((t:any)=>t.status==='review').length,      color:'var(--amber)', label:'İncelemede'},
    {v:done.length,                                             color:'var(--green)', label:'Tamamlandı'},
  ]

  const topProjects = activeP.slice(0,5)
  const topOverdue  = overdue.sort((a:any,b:any)=>a.due_date.localeCompare(b.due_date)).slice(0,5)
  const upcoming    = tasks.filter((t:any)=>{
    if (!t.due_date||t.status==='done') return false
    const diff=(new Date(t.due_date).getTime()-now.getTime())/86400000
    return diff>=0&&diff<=7
  }).sort((a:any,b:any)=>a.due_date.localeCompare(b.due_date)).slice(0,5)

  const fmt = (v:number) => v>=1000000?`${(v/1000000).toFixed(1)}M ₺`:v>=1000?`${Math.round(v/1000)}K ₺`:`${v} ₺`
  const dateStr = now.toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
  const timeStr = now.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})

  return (
    <>
      <style>{`
        .db-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        .db-mid{display:grid;grid-template-columns:1.4fr 1fr;gap:10px}
        .db-bot{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:10px}
        @media(max-width:900px){.db-mid,.db-bot{grid-template-columns:1fr}}
        @media(max-width:600px){.db-kpi{grid-template-columns:repeat(2,1fr)}}
        .row-item{display:flex;align-items:center;padding:9px 14px;border-bottom:1px solid var(--glass-border);gap:10px}
        .row-item:last-child{border-bottom:none}
        .row-item:hover{background:var(--s2)}
        .panel{background:var(--s1);border:1px solid var(--glass-border);border-radius:8px;overflow:hidden}
        .panel-h{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--glass-border)}
        .panel-title{font-size:12px;font-weight:600;letter-spacing:-.1px}
        .panel-meta{font-size:10px;color:var(--t3)}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar
          title={userName ? `Merhaba, ${userName}` : 'Dashboard'}
          subtitle={dateStr}
          action={
            <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--s2)',border:'1px solid var(--glass-border)',borderRadius:7,padding:'5px 11px'}}>
              <div className="pulse-dot" style={{width:5,height:5,borderRadius:'50%',background:'var(--green)',flexShrink:0}}/>
              <span style={{fontSize:11,fontFamily:'JetBrains Mono',color:'var(--green)',fontWeight:500,letterSpacing:'.01em'}}>{timeStr}</span>
            </div>
          }
        />

        <div style={{flex:1,overflowY:'auto',padding:'14px 18px 80px',display:'flex',flexDirection:'column',gap:12}}>
          {loading?(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:12}}>Yükleniyor...</div>
          ):(<>

            {/* KPI */}
            <div className="db-kpi">
              <KPI label="Toplam Gelir"     value={fmt(income)}                sub={`Gider: ${fmt(expense)}`}             color="var(--green)"  spark={sparkIncome} trend="+12%" />
              <KPI label="Net Kar"           value={fmt(net)}                   sub={net>=0?'Kârlı ay':'Zarar'}            color={net>=0?'var(--gold)':'var(--red)'} />
              <KPI label="Aktif Proje"       value={String(activeP.length)}     sub={`${activeC.length} aktif müşteri`}    color="var(--blue)"   spark={[10,12,11,14,13,activeP.length]} />
              <KPI label="Onay Bekleyen"     value={String(pending.length)}     sub={`${overdue.length} geciken görev`}    color="var(--amber)" />
            </div>

            {/* Mid */}
            <div className="db-mid">
              {/* Gelir */}
              <div className="panel">
                <div className="panel-h">
                  <span className="panel-title">Aylık Gelir</span>
                  <span className="panel-meta">Son 6 ay</span>
                </div>
                <div style={{padding:'14px 16px 10px'}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:14}}>
                    <span style={{fontSize:28,fontWeight:800,fontFamily:'JetBrains Mono',color:'var(--gold)',letterSpacing:'-1.5px',lineHeight:1}}>{fmt(income)}</span>
                    <span style={{fontSize:11,color:'var(--green)',fontWeight:600}}>↑ Bu ay</span>
                  </div>
                  <Bars data={monthBars}/>
                </div>
              </div>

              {/* Görev durumu */}
              <div className="panel">
                <div className="panel-h">
                  <span className="panel-title">Görev Dağılımı</span>
                  <span className="panel-meta">{tasks.length} toplam</span>
                </div>
                <div style={{padding:'14px 16px'}}>
                  <Donut segs={taskSegs}/>
                  <div style={{display:'flex',gap:6,marginTop:14}}>
                    <div style={{flex:1,background:'var(--s2)',borderRadius:6,padding:'8px',textAlign:'center',border:'1px solid var(--glass-border)'}}>
                      <div style={{fontSize:18,fontWeight:800,fontFamily:'JetBrains Mono',color:'var(--green)',lineHeight:1}}>{done.length}</div>
                      <div style={{fontSize:9.5,color:'var(--t3)',marginTop:3}}>Tamamlanan</div>
                    </div>
                    <div style={{flex:1,background:'var(--s2)',borderRadius:6,padding:'8px',textAlign:'center',border:'1px solid var(--glass-border)'}}>
                      <div style={{fontSize:18,fontWeight:800,fontFamily:'JetBrains Mono',color:'var(--red)',lineHeight:1}}>{overdue.length}</div>
                      <div style={{fontSize:9.5,color:'var(--t3)',marginTop:3}}>Geciken</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bot */}
            <div className="db-bot">

              {/* Projeler */}
              <div className="panel">
                <div className="panel-h">
                  <span className="panel-title">Aktif Projeler</span>
                  <a href="/dashboard/projeler" style={{fontSize:10,color:'var(--t3)',transition:'color .1s'}}
                    onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')}
                    onMouseLeave={e=>(e.currentTarget.style.color='var(--t3)')}>Tümü →</a>
                </div>
                {topProjects.length===0?(
                  <div style={{padding:'28px 14px',textAlign:'center',color:'var(--t3)',fontSize:11}}>Aktif proje yok</div>
                ):topProjects.map((p:any)=>(
                  <div key={p.id} className="row-item">
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:5}}>{p.name}</div>
                      <div style={{height:3,background:'var(--s4)',borderRadius:99,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${p.progress||0}%`,background:p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)',borderRadius:99,transition:'width 1s ease'}}/>
                      </div>
                      <div style={{fontSize:10,color:'var(--t3)',marginTop:3}}>{p.client?.name||'—'}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--t2)',fontFamily:'JetBrains Mono',flexShrink:0}}>{p.progress||0}%</span>
                  </div>
                ))}
              </div>

              {/* Gecikmeler */}
              <div className="panel">
                <div className="panel-h">
                  <span className="panel-title">Gecikmeler</span>
                  {overdue.length>0&&<span style={{fontSize:9.5,fontWeight:700,padding:'1px 7px',borderRadius:4,background:'var(--red-d)',color:'var(--red)'}}>{overdue.length}</span>}
                </div>
                {topOverdue.length===0?(
                  <div style={{padding:'28px 14px',textAlign:'center',color:'var(--green)',fontSize:11,fontWeight:600}}>Geciken görev yok</div>
                ):topOverdue.map((t:any)=>{
                  const daysLate=Math.floor((now.getTime()-new Date(t.due_date).getTime())/86400000)
                  const c=t.priority==='critical'?'var(--red)':t.priority==='high'?'var(--amber)':'var(--t2)'
                  return (
                    <div key={t.id} className="row-item">
                      <div style={{width:3,alignSelf:'stretch',background:c,borderRadius:99,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{t.due_date?.slice(0,10)}</div>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:c,fontFamily:'JetBrains Mono',flexShrink:0}}>+{daysLate}g</span>
                    </div>
                  )
                })}
              </div>

              {/* Bu hafta */}
              <div className="panel">
                <div className="panel-h">
                  <span className="panel-title">Bu Hafta Teslim</span>
                  <span className="panel-meta">{upcoming.length} görev</span>
                </div>
                {upcoming.length===0?(
                  <div style={{padding:'28px 14px',textAlign:'center',color:'var(--t3)',fontSize:11}}>Bu hafta teslim yok</div>
                ):upcoming.map((t:any)=>{
                  const diff=Math.ceil((new Date(t.due_date).getTime()-now.getTime())/86400000)
                  const urgent=diff<=1
                  return (
                    <div key={t.id} className="row-item">
                      <div style={{width:3,alignSelf:'stretch',background:urgent?'var(--red)':'var(--s5)',borderRadius:99,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:10,color:urgent?'var(--red)':'var(--t3)',marginTop:2,fontWeight:urgent?600:400}}>
                          {diff===0?'Bugün':diff===1?'Yarın':`${diff} gün`}
                        </div>
                      </div>
                      <span style={{fontSize:10,fontWeight:500,color:'var(--t3)',fontFamily:'JetBrains Mono',flexShrink:0}}>{t.due_date?.slice(5,10)}</span>
                    </div>
                  )
                })}
              </div>

            </div>
          </>)}
        </div>
      </div>
    </>
  )
}