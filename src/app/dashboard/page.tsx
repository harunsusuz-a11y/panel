'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { TrendingUp, Wallet, FolderKanban, Clock, AlertTriangle, Users, ClipboardCheck, BarChart2 } from 'lucide-react'

/* ── Sparkline ── */
function Spark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const w = 64, h = 22
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const step = w / (data.length - 1)
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`)
  return (
    <svg width={w} height={h} style={{ display: 'block', flexShrink: 0 }}>
      <path d={`M${pts.join(' L')} L${w},${h} L0,${h} Z`} fill={color} fillOpacity="0.15"/>
      <path d={`M${pts.join(' L')}`} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ── Bar Chart ── */
function BarChart({ bars }: { bars: { label: string; value: number; highlight: boolean }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), 100); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 96, width: '100%' }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', height: m ? `${(b.value / max) * 80}px` : '0px', background: b.highlight ? 'var(--gold)' : 'var(--s5)', borderRadius: '3px 3px 0 0', transition: `height 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 35}ms`, minHeight: b.value > 0 ? 3 : 0 }}/>
          <div style={{ fontSize: 9, color: b.highlight ? 'var(--gold)' : 'var(--t3)', fontWeight: b.highlight ? 600 : 400 }}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Donut ── */
function Donut({ segs }: { segs: { value: number; color: string; label: string }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 250) }, [])
  const total = segs.reduce((s, x) => s + x.value, 0) || 1
  const size = 88, r = (size - 12) / 2, circ = 2 * Math.PI * r
  let off = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        {segs.map((s, i) => {
          const pct = s.value / total, dash = m ? pct * circ : 0, gap = circ - dash
          const thisOff = off; off += pct * circ
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth="9"
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-thisOff}
            style={{ transition: `stroke-dasharray 0.85s cubic-bezier(0.22,1,0.36,1) ${i*70}ms` }}/>
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 1.5, background: s.color, flexShrink: 0 }}/>
            <span style={{ fontSize: 10.5, color: 'var(--t2)' }}>{s.label}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono', marginLeft: 'auto', paddingLeft: 8 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── KPI ── */
function KPI({ label, value, sub, color, spark, Icon }: any) {
  return (
    <div className="stat-card erp-card" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10.5, color: 'var(--t2)', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={12} color={color} strokeWidth={1.9}/>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 }}>
        <div>
          <div style={{ fontSize: 21, fontWeight: 700, fontFamily: 'JetBrains Mono', color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 4 }}>{sub}</div>}
        </div>
        {spark && <Spark data={spark} color={color}/>}
      </div>
    </div>
  )
}

/* ── Priority Badge ── */
function PBadge({ p }: { p: string }) {
  const m: any = { critical: ['Kritik','var(--red)','var(--red-d)'], high: ['Yüksek','var(--amber)','var(--amber-d)'], medium: ['Normal','var(--t2)','var(--s4)'], low: ['Düşük','var(--t3)','var(--s3)'] }
  const [label, color, bg] = m[p] || m.medium
  return <span className="erp-badge" style={{ color, background: bg }}>{label}</span>
}

/* ── Main ── */
export default function DashboardPage() {
  const [data, setData] = useState<any>({ tasks: [], projects: [], clients: [], transactions: [], profiles: [], contents: [] })
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
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
    ]).then(([t, p, c, tr, pr, co]) => {
      setData({ tasks: t.data||[], projects: p.data||[], clients: c.data||[], transactions: tr.data||[], profiles: pr.data||[], contents: co.data||[] })
      setLoading(false)
    })
  }, [])

  const { tasks, projects, clients, transactions, profiles, contents } = data
  const now = new Date()

  const income      = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const expense     = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const net         = income - expense
  const pending_inv = transactions.filter((t: any) => t.status === 'pending' || t.status === 'overdue').reduce((s: number, t: any) => s + Number(t.amount), 0)

  const overdue_tasks     = tasks.filter((t: any) => t.status !== 'done' && t.due_date && new Date(t.due_date) < now)
  const active_projects   = projects.filter((p: any) => p.status === 'active')
  const active_clients    = clients.filter((c: any) => c.status === 'active')
  const pending_approvals = contents.filter((c: any) => c.status === 'pending')

  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const cm = now.getMonth()
  const monthlyBars = Array.from({ length: 6 }, (_, i) => {
    const m = (cm - 5 + i + 12) % 12
    const val = transactions.filter((t: any) => t.type === 'income' && t.date && new Date(t.date).getMonth() === m).reduce((s: number, t: any) => s + Number(t.amount), 0)
    return { label: months[m], value: val, highlight: i === 5 }
  })

  const taskSegs = [
    { value: tasks.filter((t: any) => t.status === 'todo').length,        color: 'var(--t3)',   label: 'Bekliyor' },
    { value: tasks.filter((t: any) => t.status === 'in_progress').length, color: 'var(--blue)', label: 'Devam' },
    { value: tasks.filter((t: any) => t.status === 'review').length,      color: 'var(--amber)',label: 'İnceleme' },
    { value: tasks.filter((t: any) => t.status === 'done').length,        color: 'var(--green)',label: 'Tamamlandı' },
  ]

  const topProjects   = active_projects.slice(0, 5)
  const recentTasks   = [...tasks].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
  const criticalTasks = overdue_tasks.filter((t: any) => t.priority === 'critical' || t.priority === 'high').slice(0, 4)

  return (
    <>
      <style>{`
        .db-wrap{flex:1;overflow-y:auto;padding:12px 14px 60px;display:flex;flex-direction:column;gap:10px}
        .db-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        .db-row2{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:8px}
        .db-row3{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .db-row4{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .task-row{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid var(--glass-border)}
        .task-row:last-child{border-bottom:none}
        .proj-row{padding:8px 12px;border-bottom:1px solid var(--glass-border)}
        .proj-row:last-child{border-bottom:none}
        .fin-row{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid var(--glass-border)}
        .fin-row:last-child{border-bottom:none}
        @media(max-width:1100px){.db-row2{grid-template-columns:1fr 1fr}}
        @media(max-width:768px){
          .db-kpi{grid-template-columns:repeat(2,1fr)}
          .db-row2,.db-row3,.db-row4{grid-template-columns:1fr}
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title="Dashboard"
          subtitle={new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: 'var(--s2)', border: '1px solid var(--glass-border)' }}>
              <div className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }}/>
              <span style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono', color: 'var(--t2)' }}>{time}</span>
            </div>
          }
        />

        <div className="db-wrap">
          {loading ? (
            <div style={{ color: 'var(--t3)', padding: '40px 0', textAlign: 'center', fontSize: 12 }}>Yükleniyor...</div>
          ) : (<>

            {/* KPI */}
            <div className="db-kpi">
              <KPI label="Toplam Gelir"       value={`₺${Math.round(income/1000)}K`}      sub={`Gider: ₺${Math.round(expense/1000)}K`}  color="var(--green)"  spark={monthlyBars.map(b=>b.value)}  Icon={TrendingUp}/>
              <KPI label="Net Kâr"            value={`₺${Math.round(net/1000)}K`}         sub={net>=0?'Kâr':'Zarar'}                     color={net>=0?'var(--gold)':'var(--red)'} Icon={Wallet}/>
              <KPI label="Aktif Proje"        value={String(active_projects.length)}       sub={`${active_clients.length} aktif müşteri`} color="var(--blue)"   Icon={FolderKanban}/>
              <KPI label="Tahsilat Bekleyen"  value={`₺${Math.round(pending_inv/1000)}K`} sub={`${overdue_tasks.length} geciken görev`}  color={pending_inv>0?'var(--amber)':'var(--green)'} Icon={Clock}/>
            </div>

            {/* Row 2 */}
            <div className="db-row2">
              {/* Gelir Grafiği */}
              <div className="erp-card panel">
                <div className="erp-card-h">
                  <span className="erp-card-title">Aylık Gelir Trendi</span>
                  <span className="erp-meta">Son 6 ay</span>
                </div>
                <div style={{ padding: '11px 13px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--gold)', letterSpacing: '-0.5px' }}>₺{(income/1000).toFixed(0)}K</span>
                    <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>toplam gelir</span>
                  </div>
                  <BarChart bars={monthlyBars}/>
                </div>
              </div>

              {/* Görev Durumu */}
              <div className="erp-card panel">
                <div className="erp-card-h">
                  <span className="erp-card-title">Görev Durumu</span>
                  <span className="erp-meta" style={{ fontFamily: 'JetBrains Mono' }}>{tasks.length}</span>
                </div>
                <div style={{ padding: '13px' }}>
                  <Donut segs={taskSegs}/>
                  <div style={{ marginTop: 11, padding: '7px 10px', background: 'var(--s2)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>Tamamlanma</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>
                      {tasks.length ? Math.round((tasks.filter((t:any)=>t.status==='done').length/tasks.length)*100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Kritik */}
              <div className="erp-card panel">
                <div className="erp-card-h">
                  <span className="erp-card-title" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle size={11} color="var(--red)" strokeWidth={2}/>
                    Kritik Gecikmeler
                  </span>
                  <span className="erp-badge" style={{ color: 'var(--red)', background: 'var(--red-d)' }}>{overdue_tasks.length}</span>
                </div>
                <div>
                  {criticalTasks.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--green)', fontSize: 11, fontWeight: 500 }}>Kritik gecikme yok</div>
                  ) : criticalTasks.map((t: any, i: number) => (
                    <div key={t.id} className="task-row">
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.priority==='critical'?'var(--red)':'var(--amber)', flexShrink: 0 }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 1, fontFamily: 'JetBrains Mono' }}>{t.due_date?.slice(0,10)}</div>
                      </div>
                      <PBadge p={t.priority}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="db-row3">
              {/* Aktif Projeler */}
              <div className="erp-card panel">
                <div className="erp-card-h">
                  <span className="erp-card-title">Aktif Projeler</span>
                  <span className="erp-meta">{active_projects.length} proje</span>
                </div>
                <div>
                  {topProjects.length===0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)', fontSize: 11 }}>Aktif proje yok</div>
                  ) : topProjects.map((p: any, i: number) => {
                    const pc = p.progress>70?'var(--green)':p.progress>40?'var(--gold)':'var(--red)'
                    return (
                      <div key={p.id} className="proj-row">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 1 }}>{p.client?.name||'—'}</div>
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: 'JetBrains Mono', color: pc, marginLeft: 10, flexShrink: 0 }}>{p.progress}%</span>
                        </div>
                        <div className="prog-track"><div className="prog-fill" style={{ width: `${p.progress}%`, background: pc }}/></div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Finans + Son Görevler */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="erp-card panel">
                  <div className="erp-card-h"><span className="erp-card-title">Finans Özeti</span></div>
                  {[
                    { l: 'Toplam Gelir',      v: income,      c: 'var(--green)' },
                    { l: 'Toplam Gider',      v: expense,     c: 'var(--red)' },
                    { l: 'Net Kâr',           v: net,         c: net>=0?'var(--gold)':'var(--red)' },
                    { l: 'Tahsilat Bekleyen', v: pending_inv, c: 'var(--amber)' },
                  ].map(s => (
                    <div key={s.l} className="fin-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 2, height: 11, background: s.c, borderRadius: 2 }}/>
                        <span style={{ fontSize: 11, color: 'var(--t2)' }}>{s.l}</span>
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: s.c, fontFamily: 'JetBrains Mono' }}>₺{Math.round(s.v).toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>

                <div className="erp-card panel" style={{ flex: 1 }}>
                  <div className="erp-card-h">
                    <span className="erp-card-title">Son Görevler</span>
                    <span className="erp-meta">{tasks.length} toplam</span>
                  </div>
                  <div>
                    {recentTasks.map((t: any, i: number) => {
                      const done = t.status==='done'
                      return (
                        <div key={t.id} className="task-row">
                          <div style={{ width: 5, height: 5, borderRadius: 1.5, flexShrink: 0, background: done?'var(--green)':t.status==='in_progress'?'var(--blue)':'var(--s5)' }}/>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: done?'line-through':'none', opacity: done?0.45:1 }}>{t.title}</div>
                            <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 1, fontFamily: 'JetBrains Mono' }}>{new Date(t.created_at).toLocaleDateString('tr-TR')}</div>
                          </div>
                          <PBadge p={t.priority}/>
                        </div>
                      )
                    })}
                    {recentTasks.length===0 && <div style={{ padding: '18px', textAlign: 'center', color: 'var(--t3)', fontSize: 11 }}>Henüz görev yok</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4 */}
            <div className="db-row4">
              {[
                { label: 'Ekip Üyesi',    value: profiles.length,           Icon: Users,          color: 'var(--purple)' },
                { label: 'Onay Bekleyen', value: pending_approvals.length,  Icon: ClipboardCheck, color: 'var(--amber)' },
                { label: 'Toplam Müşteri',value: clients.length,            Icon: BarChart2,      color: 'var(--blue)' },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} className="erp-card" style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={color} strokeWidth={1.8}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 700, fontFamily: 'JetBrains Mono', color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--t2)', marginTop: 3 }}>{label}</div>
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
