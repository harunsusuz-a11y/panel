'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { TrendingUp, Wallet, FolderOpen, Clock, ClipboardCheck, ArrowUpRight, ArrowDownRight, ArrowRight, CheckCircle2 } from 'lucide-react'

function BarChart({ bars }: { bars: { label: string; v: number; hi?: boolean }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), 80); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.v), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%',
            height: m ? `${Math.max((b.v / max) * 64, b.v > 0 ? 3 : 0)}px` : '0',
            background: b.hi ? 'linear-gradient(180deg,var(--ac) 0%,rgba(124,106,247,.4) 100%)' : 'var(--s4)',
            borderRadius: '4px 4px 0 0',
            boxShadow: b.hi ? '0 0 12px rgba(124,106,247,.35)' : 'none',
            transition: `height .55s cubic-bezier(.22,1,.36,1) ${i * 30}ms`,
          }} />
          <span style={{ fontSize: 9.5, color: b.hi ? 'var(--ac)' : 'var(--tx3)', fontWeight: b.hi ? 600 : 400 }}>{b.label}</span>
        </div>
      ))}
    </div>
  )
}

function Donut({ segs }: { segs: { v: number; color: string; label: string }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 150) }, [])
  const total = segs.reduce((s, x) => s + x.v, 0) || 1
  const sz = 90, r = (sz - 14) / 2, circ = 2 * Math.PI * r
  let off = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="var(--s4)" strokeWidth={10} />
        {segs.map((s, i) => {
          const pct = s.v / total, dash = m ? pct * circ : 0, o = off; off += pct * circ
          return <circle key={i} cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={s.color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-o}
            style={{ transition: `stroke-dasharray .75s ease ${i * 70}ms` }} />
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: 'var(--tx2)' }}>{s.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx)', fontFamily: 'JetBrains Mono,monospace', minWidth: 20, textAlign: 'right' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KPI({ label, value, sub, color, iconBg, Icon, trend, delay = 0 }: any) {
  return (
    <div className="kpi" style={{ borderLeft: `2.5px solid ${color}`, animationDelay: `${delay}ms` }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right,${color}18,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={15} style={{ color }} strokeWidth={1.9} />
        </div>
        {trend && (
          <span className="kpi-trend" style={{ color: trend.up ? 'var(--green)' : 'var(--red)', background: trend.up ? 'var(--green2)' : 'var(--red2)' }}>
            {trend.up ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}{trend.v}
          </span>
        )}
      </div>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>({ tasks: [], projects: [], clients: [], transactions: [], approvals: [] })
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [userName, setUserName] = useState('')

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => setUserName(data?.full_name?.split(' ')[0] || ''))
    })
    Promise.all([
      sb.from('tasks').select('id,title,status,priority,due_date'),
      sb.from('projects').select('id,name,status,progress,deadline,client_id'),
      sb.from('clients').select('id,name,status'),
      sb.from('transactions').select('type,amount,date'),
      sb.from('approvals').select('id,status'),
    ]).then(([t, p, c, tr, ap]) => {
      setData({ tasks: t.data || [], projects: p.data || [], clients: c.data || [], transactions: tr.data || [], approvals: ap.data || [] })
      setLoading(false)
    })
  }, [])

  const { tasks, projects, clients, transactions, approvals } = data
  const income  = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const expense = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const net     = income - expense
  const done    = tasks.filter((t: any) => t.status === 'done')
  const overdue = tasks.filter((t: any) => t.status !== 'done' && t.due_date && new Date(t.due_date) < now)
  const pending = approvals.filter((a: any) => a.status === 'pending')
  const activeP = projects.filter((p: any) => p.status === 'active')

  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const cm = now.getMonth()
  const bars = Array.from({ length: 6 }, (_, i) => {
    const m = (cm - 5 + i + 12) % 12
    const v = transactions.filter((t: any) => t.type === 'income' && t.date && new Date(t.date).getMonth() === m).reduce((s: number, t: any) => s + Number(t.amount), 0)
    return { label: MONTHS[m], v: Math.round(v / 1000), hi: i === 5 }
  })

  const donutSegs = [
    { v: tasks.filter((t: any) => t.status === 'todo').length,        color: 'var(--s5)',   label: 'Bekliyor' },
    { v: tasks.filter((t: any) => t.status === 'in_progress').length, color: 'var(--blue)', label: 'Devam' },
    { v: tasks.filter((t: any) => t.status === 'review').length,      color: 'var(--amber)',label: 'İnceleme' },
    { v: done.length,                                                  color: 'var(--green)',label: 'Tamamlandı' },
  ]

  const fmt = (v: number) => v >= 1000000 ? `₺${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `₺${Math.round(v / 1000)}K` : `₺${v}`
  const PRI: Record<string, string> = { critical: 'var(--red)', high: 'var(--amber)', normal: 'var(--blue)', low: 'var(--tx3)' }

  const overdueTop = [...overdue].sort((a: any, b: any) => {
    const o: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 }
    return (o[a.priority] ?? 2) - (o[b.priority] ?? 2)
  }).slice(0, 5)

  const weekEnd = new Date(now.getTime() + 7 * 86400000)
  const weekTasks = tasks.filter((t: any) => t.due_date && t.status !== 'done' && new Date(t.due_date) >= now && new Date(t.due_date) <= weekEnd)
    .sort((a: any, b: any) => String(a.due_date).localeCompare(String(b.due_date))).slice(0, 5)

  return (
    <>
      <style>{`
        .db-kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px}
        .db-mid{display:grid;grid-template-columns:1.6fr 1fr;gap:14px;margin-bottom:14px}
        .db-bot{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:14px}
        @media(max-width:1100px){.db-kpi{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:768px){.db-kpi{grid-template-columns:repeat(2,1fr)}.db-mid{grid-template-columns:1fr}.db-bot{grid-template-columns:1fr}}
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title={userName ? `Merhaba, ${userName}` : 'Dashboard'}
          subtitle={now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '5px 11px' }}>
              <span className="anim-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono,monospace', color: 'var(--green)', fontWeight: 500 }}>
                {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          }
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--tx3)', fontSize: 14 }}>Yükleniyor...</div>
          ) : (<>
            {/* KPI */}
            <div className="db-kpi">
              <KPI label="Toplam Gelir"  value={fmt(income)}          sub={`Gider: ${fmt(expense)}`}    color="var(--green)"  iconBg="var(--green2)" Icon={TrendingUp}    trend={{ v: '+12%', up: true }}  delay={0} />
              <KPI label="Net Kar"       value={fmt(net)}             sub={net >= 0 ? 'Kârlı' : 'Zarar'} color={net >= 0 ? 'var(--ac)' : 'var(--red)'} iconBg={net >= 0 ? 'var(--ac3)' : 'var(--red2)'} Icon={Wallet} delay={40} />
              <KPI label="Aktif Proje"   value={String(activeP.length)} sub={`${clients.filter((c: any) => c.status === 'active').length} müşteri`} color="var(--blue)"  iconBg="var(--blue2)" Icon={FolderOpen} delay={80} />
              <KPI label="Geciken Görev" value={String(overdue.length)} sub={overdue.length > 0 ? 'Kontrol!' : 'Temiz'} color={overdue.length > 0 ? 'var(--red)' : 'var(--green)'} iconBg={overdue.length > 0 ? 'var(--red2)' : 'var(--green2)'} Icon={Clock} delay={120} />
              <KPI label="Onay Bekliyor" value={String(pending.length)} sub={`${tasks.length} toplam görev`} color="var(--amber)" iconBg="var(--amber2)" Icon={ClipboardCheck} delay={160} />
            </div>

            {/* Orta */}
            <div className="db-mid">
              <div className="card anim-fade">
                <div className="card-h"><span className="card-title">Aylık Gelir Trendi</span><span className="card-meta">Son 6 ay</span></div>
                <div style={{ padding: '16px 18px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--tx)', letterSpacing: '-1px', lineHeight: 1 }}>{fmt(income)}</span>
                    <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ArrowUpRight size={13} strokeWidth={2.5} />12% artış
                    </span>
                  </div>
                  <BarChart bars={bars} />
                  <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--bdr)' }}>
                    {[{ l: 'Gelir', v: income, c: 'var(--green)' }, { l: 'Gider', v: expense, c: 'var(--red)' }, { l: 'Net', v: net, c: 'var(--ac)' }].map(s => (
                      <div key={s.l}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{s.l}</p>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: s.c, fontFamily: 'JetBrains Mono,monospace' }}>{fmt(s.v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card anim-fade">
                <div className="card-h"><span className="card-title">Görev Durumu</span><span className="card-meta">{tasks.length} toplam</span></div>
                <div style={{ padding: '18px' }}>
                  <Donut segs={donutSegs} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <div style={{ flex: 1, background: 'var(--green2)', borderRadius: 8, padding: '9px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--green)', lineHeight: 1 }}>{done.length}</p>
                      <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tamamlandı</p>
                    </div>
                    <div style={{ flex: 1, background: 'var(--red2)', borderRadius: 8, padding: '9px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--red)', lineHeight: 1 }}>{overdue.length}</p>
                      <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>Geciken</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alt */}
            <div className="db-bot">
              <div className="card anim-fade">
                <div className="card-h">
                  <span className="card-title">Aktif Projeler</span>
                  <a href="/dashboard/projeler" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--tx3)', transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--ac)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx3)')}>
                    Tümü <ArrowRight size={11} />
                  </a>
                </div>
                {activeP.length === 0
                  ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Aktif proje yok</div>
                  : activeP.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{p.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="prog" style={{ flex: 1 }}>
                            <div className="prog-fill" style={{ width: `${p.progress || 0}%`, background: p.progress > 70 ? 'var(--green)' : p.progress > 40 ? 'var(--ac)' : 'var(--red)' }} />
                          </div>
                          <span style={{ fontSize: 11.5, color: 'var(--tx2)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>{p.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="card anim-fade">
                <div className="card-h">
                  <span className="card-title">Gecikmeler</span>
                  {overdue.length > 0 && <span className="badge badge-red">{overdue.length}</span>}
                </div>
                {overdueTop.length === 0
                  ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 28, color: 'var(--green)', fontSize: 13, fontWeight: 500 }}>
                      <CheckCircle2 size={15} strokeWidth={2} /> Geciken görev yok
                    </div>
                  : overdueTop.map((t: any) => {
                    const days = Math.floor((now.getTime() - new Date(t.due_date).getTime()) / 86400000)
                    const c = PRI[t.priority] || 'var(--tx3)'
                    return (
                      <div key={t.id} className="row">
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title || 'Görev'}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>{t.due_date}</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: c, fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>+{days}g</span>
                      </div>
                    )
                  })}
              </div>

              <div className="card anim-fade">
                <div className="card-h"><span className="card-title">Bu Hafta Teslim</span><span className="card-meta">{weekTasks.length} görev</span></div>
                {weekTasks.length === 0
                  ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Bu hafta teslim yok</div>
                  : weekTasks.map((t: any) => {
                    const diff = Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / 86400000)
                    const urgent = diff <= 1
                    return (
                      <div key={t.id} className="row">
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: urgent ? 'var(--red)' : 'var(--s5)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title || 'Görev'}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>
                            {diff === 0 ? 'Bugün' : diff === 1 ? 'Yarın' : `${diff} gün sonra`}
                          </p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: urgent ? 'var(--red)' : 'var(--tx2)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>
                          {String(t.due_date).slice(5, 10)}
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
