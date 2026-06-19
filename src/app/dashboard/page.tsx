'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import {
  TrendingUp, Wallet, FolderKanban, Clock,
  AlertTriangle, Users, ClipboardCheck, CheckSquare,
  ArrowUpRight, ArrowRight
} from 'lucide-react'

/* ── Mini bar chart ── */
function BarChart({ bars }: { bars: { label: string; value: number; hi: boolean }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), 120); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%',
            height: m ? `${Math.max((b.value / max) * 64, b.value > 0 ? 4 : 0)}px` : '0px',
            background: b.hi ? 'var(--gold)' : 'var(--s5)',
            borderRadius: '4px 4px 0 0',
            transition: `height .55s cubic-bezier(.22,1,.36,1) ${i * 40}ms`,
          }}/>
          <div style={{ fontSize: 9, color: b.hi ? 'var(--gold)' : 'var(--t3)', fontWeight: b.hi ? 600 : 400, whiteSpace: 'nowrap' }}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Donut ── */
function Donut({ segs }: { segs: { value: number; color: string; label: string }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 200) }, [])
  const total = segs.reduce((s, x) => s + x.value, 0) || 1
  const sz = 96, r = (sz - 14) / 2, circ = 2 * Math.PI * r
  let off = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--s4)" strokeWidth="11"/>
        {segs.map((s, i) => {
          const pct = s.value / total, dash = m ? pct * circ : 0
          const o = off; off += pct * circ
          return <circle key={i} cx={sz/2} cy={sz/2} r={r} fill="none" stroke={s.color} strokeWidth="11"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-o}
            style={{ transition: `stroke-dasharray .85s cubic-bezier(.22,1,.36,1) ${i * 80}ms` }}/>
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }}/>
            <span style={{ fontSize: 11, color: 'var(--t2)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono', marginLeft: 8 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── KPI Card ── */
function KPI({ label, value, sub, accent, accentD, Icon, trend }: {
  label: string; value: string; sub?: string
  accent: string; accentD: string; Icon: any; trend?: string
}) {
  return (
    <div className="kpi-card fade-up" style={{ '--accent': accent, '--accent-d': accentD } as any}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="kpi-icon" style={{ '--accent-d': accentD } as any}>
          <Icon size={17} color={accent} strokeWidth={1.9}/>
        </div>
        {trend && (
          <span style={{ fontSize: 10, fontWeight: 700, color: trend.startsWith('+') ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <ArrowUpRight size={11} strokeWidth={2}/>{trend}
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

/* ── Main ── */
export default function DashboardPage() {
  const [d, setD] = useState<any>({ tasks: [], projects: [], clients: [], transactions: [], contents: [], approvals: [] })
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
      if (user) {
        sb.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
          setUserName(data?.full_name?.split(' ')[0] || user.email?.split('@')[0] || '')
        })
      }
    })
    Promise.all([
      sb.from('tasks').select('*'),
      sb.from('projects').select('*,client:clients(name)'),
      sb.from('clients').select('*'),
      sb.from('transactions').select('*').order('date'),
      sb.from('contents').select('*'),
      sb.from('approvals').select('*'),
    ]).then(([t, p, c, tr, co, ap]) => {
      setD({ tasks: t.data||[], projects: p.data||[], clients: c.data||[], transactions: tr.data||[], contents: co.data||[], approvals: ap.data||[] })
      setLoading(false)
    })
  }, [])

  const { tasks, projects, clients, transactions, contents, approvals } = d
  const today = now

  // Hesaplamalar
  const income  = transactions.filter((t:any) => t.type === 'income').reduce((s:number,t:any) => s + Number(t.amount), 0)
  const expense = transactions.filter((t:any) => t.type === 'expense').reduce((s:number,t:any) => s + Number(t.amount), 0)
  const net = income - expense
  const overdue  = tasks.filter((t:any) => t.status !== 'done' && t.due_date && new Date(t.due_date) < today)
  const doneTasks = tasks.filter((t:any) => t.status === 'done')
  const pendingApprovals = approvals.filter((a:any) => a.status === 'pending')
  const activeProjects = projects.filter((p:any) => p.status === 'active')
  const activeClients = clients.filter((c:any) => c.status === 'active')

  // Son 6 ay gelir
  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const cm = today.getMonth()
  const monthBars = Array.from({ length: 6 }, (_, i) => {
    const m = (cm - 5 + i + 12) % 12
    const v = transactions.filter((t:any) => t.type === 'income' && t.date && new Date(t.date).getMonth() === m).reduce((s:number,t:any) => s + Number(t.amount), 0)
    return { label: MONTHS[m], value: v, hi: i === 5 }
  })

  // Görev durum dağılımı
  const taskSegs = [
    { value: tasks.filter((t:any) => t.status === 'todo').length,        color: 'var(--t3)',    label: 'Bekliyor' },
    { value: tasks.filter((t:any) => t.status === 'in_progress').length, color: 'var(--blue)',  label: 'Devam' },
    { value: tasks.filter((t:any) => t.status === 'review').length,      color: 'var(--amber)', label: 'Kontrol' },
    { value: doneTasks.length,                                            color: 'var(--green)', label: 'Tamamlandı' },
  ]

  // Aktif projeler (top 5)
  const topProjects = activeProjects.slice(0, 5)

  // Son gecikmiş
  const criticalOverdue = overdue.sort((a:any,b:any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 5)

  // Yaklaşan teslimler (bugünden itibaren 7 gün)
  const upcoming = tasks.filter((t:any) => {
    if (!t.due_date || t.status === 'done') return false
    const dd = new Date(t.due_date)
    const diff = (dd.getTime() - today.getTime()) / 86400000
    return diff >= 0 && diff <= 7
  }).sort((a:any,b:any) => a.due_date.localeCompare(b.due_date)).slice(0, 5)

  const dateStr = today.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = today.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const fmtMoney = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M ₺` : v >= 1000 ? `${Math.round(v/1000)}K ₺` : `${v} ₺`

  return (
    <>
      <style>{`
        .db-kpi { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .db-mid  { display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; }
        .db-bot  { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 12px; }
        @media(max-width:900px){ .db-mid{grid-template-columns:1fr} .db-bot{grid-template-columns:1fr} }
        @media(max-width:600px){ .db-kpi{grid-template-columns:repeat(2,1fr)} }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
        <TopBar
          title={`Merhaba${userName ? ', '+userName : ''} 👋`}
          subtitle={dateStr}
          action={
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--s2)', border:'1px solid var(--glass-border)', borderRadius:8, padding:'5px 12px' }}>
              <div className="pulse-dot" style={{ width:5, height:5, borderRadius:'50%', background:'var(--green)', flexShrink:0 }}/>
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono', color:'var(--green)', fontWeight:600, letterSpacing:'.02em' }}>{timeStr}</span>
            </div>
          }
        />

        <div style={{ flex:1, overflowY:'auto', padding:'16px 18px 80px', display:'flex', flexDirection:'column', gap:14 }}>
          {loading ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:13 }}>
              Yükleniyor...
            </div>
          ) : (<>

            {/* ── KPI Kartları ── */}
            <div className="db-kpi">
              <KPI label="Toplam Gelir"    value={fmtMoney(income)}  sub={`Gider: ${fmtMoney(expense)}`} accent="var(--green)"  accentD="var(--green-d)"  Icon={TrendingUp}    trend="+12%" />
              <KPI label="Net Kar"          value={fmtMoney(net)}     sub={net>=0?'Bu ay':'Zarar'}        accent={net>=0?'var(--gold)':'var(--red)'} accentD={net>=0?'var(--gold-d)':'var(--red-d)'} Icon={Wallet} />
              <KPI label="Aktif Proje"      value={String(activeProjects.length)} sub={`${activeClients.length} aktif müşteri`} accent="var(--blue)"   accentD="var(--blue-d)"   Icon={FolderKanban} />
              <KPI label="Onay Bekleyen"    value={String(pendingApprovals.length)} sub={`${overdue.length} geciken görev`}    accent="var(--amber)"  accentD="var(--amber-d)"  Icon={ClipboardCheck} />
            </div>

            {/* ── Orta: Gelir Grafiği + Görev Dağılımı ── */}
            <div className="db-mid">
              {/* Gelir Bar Chart */}
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Aylık Gelir Trendi</span>
                  <span className="card-meta">Son 6 ay</span>
                </div>
                <div style={{ padding:'16px 16px 12px' }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:30, fontWeight:800, fontFamily:'JetBrains Mono', color:'var(--gold)', letterSpacing:'-1.5px', lineHeight:1 }}>{fmtMoney(income)}</span>
                    <span style={{ fontSize:11, color:'var(--green)', fontWeight:700 }}>↑ Bu ay</span>
                  </div>
                  <BarChart bars={monthBars}/>
                </div>
              </div>

              {/* Görev Donut */}
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Görev Durumu</span>
                  <span className="card-meta">{tasks.length} toplam</span>
                </div>
                <div style={{ padding:'16px' }}>
                  <Donut segs={taskSegs}/>
                  <div style={{ marginTop:14, display:'flex', gap:8 }}>
                    <div style={{ flex:1, background:'var(--s2)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:800, fontFamily:'JetBrains Mono', color:'var(--green)' }}>{doneTasks.length}</div>
                      <div style={{ fontSize:9.5, color:'var(--t3)', marginTop:2 }}>Tamamlanan</div>
                    </div>
                    <div style={{ flex:1, background:'var(--s2)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:800, fontFamily:'JetBrains Mono', color:'var(--red)' }}>{overdue.length}</div>
                      <div style={{ fontSize:9.5, color:'var(--t3)', marginTop:2 }}>Geciken</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Alt: Projeler + Gecikmeler + Yaklaşan ── */}
            <div className="db-bot">

              {/* Aktif Projeler */}
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Aktif Projeler</span>
                  <a href="/dashboard/projeler" style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--t3)', transition:'color .15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.color='var(--gold)')}
                    onMouseLeave={e=>(e.currentTarget.style.color='var(--t3)')}>
                    Tümü <ArrowRight size={11}/>
                  </a>
                </div>
                <div style={{ padding:'4px 0' }}>
                  {topProjects.length === 0 ? (
                    <div style={{ padding:'24px 14px', textAlign:'center', color:'var(--t3)', fontSize:12 }}>Aktif proje yok</div>
                  ) : topProjects.map((p:any, i:number) => (
                    <div key={p.id} className="erp-row">
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>{p.name}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div className="prog-track" style={{ flex:1 }}>
                            <div className="prog-fill" style={{ width:`${p.progress||0}%`, background: p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)' }}/>
                          </div>
                          <span style={{ fontSize:10, fontWeight:700, color:'var(--t2)', fontFamily:'JetBrains Mono', flexShrink:0 }}>{p.progress||0}%</span>
                        </div>
                        <div style={{ fontSize:10, color:'var(--t3)', marginTop:3 }}>{p.client?.name||'—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gecikmeler */}
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Gecikmeler</span>
                  {overdue.length > 0 && <span className="badge" style={{ background:'var(--red-d)', color:'var(--red)' }}>{overdue.length}</span>}
                </div>
                <div style={{ padding:'4px 0' }}>
                  {criticalOverdue.length === 0 ? (
                    <div style={{ padding:'24px 14px', textAlign:'center', color:'var(--green)', fontSize:12, fontWeight:600 }}>
                      ✓ Geciken görev yok
                    </div>
                  ) : criticalOverdue.map((t:any, i:number) => {
                    const daysLate = Math.floor((today.getTime() - new Date(t.due_date).getTime()) / 86400000)
                    const c = t.priority === 'critical' ? 'var(--red)' : t.priority === 'high' ? 'var(--amber)' : 'var(--t2)'
                    return (
                      <div key={t.id} className="erp-row">
                        <div style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11.5, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                          <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{t.due_date?.slice(0,10)}</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, color:c, fontFamily:'JetBrains Mono', flexShrink:0, whiteSpace:'nowrap' }}>
                          +{daysLate}g
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Yaklaşan Teslimler */}
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Bu Hafta Teslim</span>
                  <span className="card-meta">{upcoming.length} görev</span>
                </div>
                <div style={{ padding:'4px 0' }}>
                  {upcoming.length === 0 ? (
                    <div style={{ padding:'24px 14px', textAlign:'center', color:'var(--t3)', fontSize:12 }}>Bu hafta teslim yok</div>
                  ) : upcoming.map((t:any, i:number) => {
                    const dd = new Date(t.due_date)
                    const diff = Math.ceil((dd.getTime() - today.getTime()) / 86400000)
                    const urgent = diff <= 1
                    return (
                      <div key={t.id} className="erp-row">
                        <div style={{ width:6, height:6, borderRadius:'50%', background:urgent?'var(--red)':'var(--t3)', boxShadow:urgent?'0 0 5px var(--red)':'none', flexShrink:0 }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11.5, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                          <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>
                            {diff === 0 ? 'Bugün' : diff === 1 ? 'Yarın' : `${diff} gün sonra`}
                          </div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:600, color:urgent?'var(--red)':'var(--t2)', fontFamily:'JetBrains Mono', flexShrink:0 }}>
                          {t.due_date?.slice(5,10)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

          </>)}
        </div>
      </div>
    </>
  )
}