'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react'

/* ──────────────────────────────────────
   Bar Chart — thin, professional
────────────────────────────────────── */
function BarChart({ bars }: { bars: { label: string; v: number; hi?: boolean }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), 80); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.v), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:72, paddingBottom:2 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
          <div style={{
            width:'100%',
            height: m ? `${Math.max((b.v / max) * 60, b.v > 0 ? 3 : 0)}px` : '0',
            background: b.hi ? 'var(--gold)' : 'var(--c4)',
            borderRadius:'2px 2px 0 0',
            transition: `height .5s cubic-bezier(.22,1,.36,1) ${i*30}ms`,
          }}/>
          <span style={{ fontSize:9, color: b.hi ? 'var(--gold)' : 'var(--t3)', fontWeight: b.hi ? 600 : 400 }}>
            {b.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────
   Donut — compact
────────────────────────────────────── */
function Donut({ segs, size = 80 }: { segs: { v:number; color:string; label:string }[]; size?: number }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 150) }, [])
  const total = segs.reduce((s, x) => s + x.v, 0) || 1
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  let off = 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--c3)" strokeWidth={8}/>
        {segs.map((s, i) => {
          const pct = s.v / total
          const dash = m ? pct * circ : 0
          const o = off; off += pct * circ
          return (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={s.color} strokeWidth={8}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-o}
              style={{ transition:`stroke-dasharray .7s ease ${i*60}ms` }}
            />
          )
        })}
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:6, height:6, borderRadius:1, background:s.color, flexShrink:0 }}/>
            <span style={{ fontSize:10.5, color:'var(--t2)', flex:1 }}>{s.label}</span>
            <span style={{ fontSize:11, fontWeight:600, color:'var(--text)', fontFamily:'JetBrains Mono', minWidth:18, textAlign:'right' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────
   Stat Card — compact, left accent bar
────────────────────────────────────── */
function Stat({ label, value, sub, accent, trend }: {
  label:string; value:string; sub?:string; accent:string; trend?: { v:string; up:boolean }
}) {
  return (
    <div className="stat-item" style={{ '--accent': accent } as any}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      {trend && (
        <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
          {trend.up
            ? <ArrowUpRight size={11} color="var(--green)" strokeWidth={2}/>
            : <ArrowDownRight size={11} color="var(--red)" strokeWidth={2}/>}
          <span style={{ fontSize:10, color: trend.up ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>{trend.v}</span>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────
   Main
────────────────────────────────────── */
export default function DashboardPage() {
  const [data, setData] = useState<any>({ tasks:[], projects:[], clients:[], transactions:[], approvals:[] })
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
      sb.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => setUserName(data?.full_name?.split(' ')[0] || ''))
    })
    Promise.all([
      sb.from('tasks').select('id,status,priority,due_date'),
      sb.from('projects').select('id,name,status,progress,deadline,client_id'),
      sb.from('clients').select('id,name,status'),
      sb.from('transactions').select('type,amount,date,status'),
      sb.from('approvals').select('id,status'),
    ]).then(([t,p,c,tr,ap]) => {
      setData({ tasks:t.data||[], projects:p.data||[], clients:c.data||[], transactions:tr.data||[], approvals:ap.data||[] })
      setLoading(false)
    })
  }, [])

  const { tasks, projects, clients, transactions, approvals } = data

  const income  = transactions.filter((t:any) => t.type==='income').reduce((s:number,t:any) => s+Number(t.amount),0)
  const expense = transactions.filter((t:any) => t.type==='expense').reduce((s:number,t:any) => s+Number(t.amount),0)
  const net     = income - expense

  const activeProj    = projects.filter((p:any) => p.status==='active')
  const activeClients = clients.filter((c:any) => c.status==='active')
  const overdueList   = tasks.filter((t:any) => t.status!=='done' && t.due_date && new Date(t.due_date)<now)
  const pendingAp     = approvals.filter((a:any) => a.status==='pending')
  const doneTasks     = tasks.filter((t:any) => t.status==='done')

  // Aylık gelir - son 6 ay
  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const cm = now.getMonth()
  const monthBars = Array.from({length:6}, (_,i) => {
    const m = (cm-5+i+12)%12
    const v = transactions.filter((t:any) => t.type==='income' && t.date && new Date(t.date).getMonth()===m)
                          .reduce((s:number,t:any) => s+Number(t.amount),0)
    return { label:MONTHS[m], v:Math.round(v/1000), hi: i===5 }
  })

  // Görev dağılımı
  const taskSegs = [
    { v:tasks.filter((t:any)=>t.status==='todo').length,        color:'var(--c5)',    label:'Bekliyor'    },
    { v:tasks.filter((t:any)=>t.status==='in_progress').length, color:'var(--blue)',  label:'Devam'       },
    { v:tasks.filter((t:any)=>t.status==='review').length,      color:'var(--amber)', label:'İncelemede'  },
    { v:doneTasks.length,                                        color:'var(--green)', label:'Tamamlandı'  },
  ]

  // Gecikmiş (öncelik sırasıyla)
  const overdueTop = [...overdueList]
    .sort((a:any,b:any) => {
      const po: Record<string,number> = { critical:0, high:1, normal:2, low:3 }
      return (po[a.priority]||2) - (po[b.priority]||2)
    }).slice(0,6)

  // Bu hafta teslimler
  const weekEnd = new Date(now.getTime() + 7*86400000)
  const weekTasks = tasks.filter((t:any) =>
    t.due_date && t.status!=='done' &&
    new Date(t.due_date)>=now && new Date(t.due_date)<=weekEnd
  ).sort((a:any,b:any) => String(a.due_date).localeCompare(String(b.due_date))).slice(0,5)

  const fmt = (v:number) =>
    v>=1000000 ? `${(v/1000000).toFixed(1)}M ₺` :
    v>=1000    ? `${Math.round(v/1000)}K ₺`     : `${v} ₺`

  const PRI_COLOR: Record<string,string> = { critical:'var(--red)', high:'var(--amber)', normal:'var(--blue)', low:'var(--t3)' }

  return (
    <>
      <style>{`
        .db-grid   { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:10px }
        .db-mid    { display:grid; grid-template-columns:1.6fr 1fr; gap:8px; margin-bottom:10px }
        .db-bot    { display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:8px }
        @media(max-width:900px){ .db-mid{grid-template-columns:1fr}; .db-bot{grid-template-columns:1fr} }
        @media(max-width:640px){ .db-grid{grid-template-columns:repeat(2,1fr)} }
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar
          title={userName ? `Merhaba, ${userName}` : 'Dashboard'}
          subtitle={now.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric',weekday:'long'})}
          action={
            <div style={{display:'flex',alignItems:'center',gap:5,background:'var(--c2)',border:'1px solid var(--bdr)',borderRadius:5,padding:'4px 10px'}}>
              <div className="pulse" style={{width:5,height:5,borderRadius:'50%',background:'var(--green)',flexShrink:0}}/>
              <span style={{fontSize:10.5,fontFamily:'JetBrains Mono',color:'var(--green)',fontWeight:500,letterSpacing:'.02em'}}>
                {now.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
              </span>
            </div>
          }
        />

        <div style={{flex:1,overflowY:'auto',padding:'12px 14px 80px'}}>
          {loading ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:12,padding:'60px 0'}}>Yükleniyor...</div>
          ) : (<>

            {/* ── 5 Stat Kartı ── */}
            <div className="db-grid">
              <Stat label="TOPLAM GELİR"    value={fmt(income)}  sub={`Gider: ${fmt(expense)}`}      accent="var(--green)"  trend={{v:'+12%',up:true}}/>
              <Stat label="NET KAR"          value={fmt(net)}     sub={net>=0?'Kârlı dönem':'Zarar'}  accent={net>=0?'var(--gold)':'var(--red)'}/>
              <Stat label="AKTİF PROJE"      value={String(activeProj.length)} sub={`${activeClients.length} müşteri`}      accent="var(--blue)"/>
              <Stat label="GECİKEN GÖREV"    value={String(overdueList.length)} sub={overdueList.length>0?'Acil kontrol':'Temiz'} accent={overdueList.length>0?'var(--red)':'var(--green)'}/>
              <Stat label="ONAY BEKLİYOR"    value={String(pendingAp.length)}   sub={`${tasks.length} toplam görev`}         accent="var(--amber)"/>
            </div>

            {/* ── Orta: Gelir Grafiği + Görev Dağılımı ── */}
            <div className="db-mid">
              {/* Gelir */}
              <div className="card fade-in">
                <div className="ch">
                  <span className="ch-title">Aylık Gelir</span>
                  <span className="ch-meta">Son 6 ay</span>
                </div>
                <div style={{padding:'12px 14px 10px'}}>
                  <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:12}}>
                    <span style={{fontSize:24,fontWeight:700,fontFamily:'JetBrains Mono',color:'var(--gold)',letterSpacing:'-1px',lineHeight:1}}>{fmt(income)}</span>
                    <span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,color:'var(--green)',fontWeight:600}}>
                      <ArrowUpRight size={11} strokeWidth={2.5}/>12%
                    </span>
                  </div>
                  <BarChart bars={monthBars}/>
                  <div style={{display:'flex',gap:12,marginTop:10}}>
                    {[{l:'Gelir',v:income,c:'var(--green)'},{l:'Gider',v:expense,c:'var(--red)'},{l:'Net',v:net,c:'var(--gold)'}].map(s=>(
                      <div key={s.l}>
                        <div style={{fontSize:9,color:'var(--t3)',fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',marginBottom:2}}>{s.l}</div>
                        <div style={{fontSize:11.5,fontWeight:600,color:s.c,fontFamily:'JetBrains Mono'}}>{fmt(s.v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Görev Dağılımı */}
              <div className="card fade-in">
                <div className="ch">
                  <span className="ch-title">Görev Durumu</span>
                  <span className="ch-meta">{tasks.length} toplam</span>
                </div>
                <div style={{padding:'14px'}}>
                  <Donut segs={taskSegs}/>
                  <div style={{display:'flex',gap:6,marginTop:12}}>
                    <div style={{flex:1,background:'var(--c2)',borderRadius:5,padding:'7px 10px',textAlign:'center'}}>
                      <div style={{fontSize:16,fontWeight:700,fontFamily:'JetBrains Mono',color:'var(--green)',lineHeight:1}}>{doneTasks.length}</div>
                      <div style={{fontSize:9,color:'var(--t3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.05em'}}>Tamamlanan</div>
                    </div>
                    <div style={{flex:1,background:'var(--c2)',borderRadius:5,padding:'7px 10px',textAlign:'center'}}>
                      <div style={{fontSize:16,fontWeight:700,fontFamily:'JetBrains Mono',color:'var(--red)',lineHeight:1}}>{overdueList.length}</div>
                      <div style={{fontSize:9,color:'var(--t3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.05em'}}>Geciken</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Alt: Projeler + Gecikmeler + Bu Hafta ── */}
            <div className="db-bot">

              {/* Aktif Projeler */}
              <div className="card fade-in">
                <div className="ch">
                  <span className="ch-title">Aktif Projeler</span>
                  <a href="/dashboard/projeler" style={{display:'flex',alignItems:'center',gap:2,fontSize:10,color:'var(--t3)'}}>
                    Tümü<ArrowRight size={10} strokeWidth={2}/>
                  </a>
                </div>
                {activeProj.length===0
                  ? <div style={{padding:'24px 13px',textAlign:'center',color:'var(--t3)',fontSize:11}}>Aktif proje yok</div>
                  : activeProj.slice(0,5).map((p:any,i:number) => (
                    <div key={p.id} className="tr">
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11.5,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:5}}>
                          {p.name}
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div className="pb-track" style={{flex:1}}>
                            <div className="pb-fill" style={{
                              width:`${p.progress||0}%`,
                              background: p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)'
                            }}/>
                          </div>
                          <span style={{fontSize:10,color:'var(--t2)',fontFamily:'JetBrains Mono',flexShrink:0,fontWeight:500}}>
                            {p.progress||0}%
                          </span>
                        </div>
                        {p.deadline && <div style={{fontSize:9,color:'var(--t3)',marginTop:3}}>Bitiş: {p.deadline}</div>}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Gecikmeler */}
              <div className="card fade-in">
                <div className="ch">
                  <span className="ch-title">Gecikmeler</span>
                  {overdueList.length>0 && (
                    <span className="badge" style={{background:'var(--red-d)',color:'var(--red)'}}>{overdueList.length}</span>
                  )}
                </div>
                {overdueTop.length===0
                  ? <div style={{padding:'24px 13px',textAlign:'center',color:'var(--green)',fontSize:11,fontWeight:500}}>Geciken görev yok</div>
                  : overdueTop.map((t:any,i:number) => {
                    const daysLate = Math.floor((now.getTime()-new Date(t.due_date).getTime())/86400000)
                    const c = PRI_COLOR[t.priority]||'var(--t3)'
                    return (
                      <div key={t.id} className="tr">
                        <div style={{width:5,height:5,borderRadius:'50%',background:c,flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text)'}}>
                            {t.title||'Görev'}
                          </div>
                          <div style={{fontSize:9.5,color:'var(--t3)',marginTop:1}}>{t.due_date}</div>
                        </div>
                        <span style={{fontSize:10,fontWeight:600,color:c,fontFamily:'JetBrains Mono',flexShrink:0}}>
                          +{daysLate}g
                        </span>
                      </div>
                    )
                  })}
              </div>

              {/* Bu Hafta Teslim */}
              <div className="card fade-in">
                <div className="ch">
                  <span className="ch-title">Bu Hafta Teslim</span>
                  <span className="ch-meta">{weekTasks.length} görev</span>
                </div>
                {weekTasks.length===0
                  ? <div style={{padding:'24px 13px',textAlign:'center',color:'var(--t3)',fontSize:11}}>Bu hafta teslim yok</div>
                  : weekTasks.map((t:any,i:number) => {
                    const diff = Math.ceil((new Date(t.due_date).getTime()-now.getTime())/86400000)
                    const urgent = diff<=1
                    return (
                      <div key={t.id} className="tr">
                        <div style={{width:5,height:5,borderRadius:'50%',background:urgent?'var(--red)':'var(--t3)',flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text)'}}>
                            {t.title||'Görev'}
                          </div>
                          <div style={{fontSize:9.5,color:'var(--t3)',marginTop:1}}>
                            {diff===0?'Bugün':diff===1?'Yarın':`${diff} gün sonra`}
                          </div>
                        </div>
                        <span style={{fontSize:10,fontWeight:500,color:urgent?'var(--red)':'var(--t2)',fontFamily:'JetBrains Mono',flexShrink:0}}>
                          {String(t.due_date).slice(5,10)}
                        </span>
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