'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import {
  TrendingUp, Wallet, FolderOpen, Clock, ClipboardCheck,
  ArrowUpRight, ArrowDownRight, ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react'

/* ─── Types ─── */
interface KpiProps {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  trend?: { v: string; up: boolean }
  delay?: number
}

interface BarDatum  { label: string; v: number; hi?: boolean }
interface DonutSeg  { v: number; color: string; label: string }

/* ─── KPI Card ─── */
function KpiCard({ label, value, sub, icon: Icon, iconColor, iconBg, trend, delay = 0 }: KpiProps) {
  return (
    <div
      className="erp-stat animate-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* subtle left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2.5px] rounded-l-[10px]"
        style={{ background: iconColor, opacity: 0.7 }}
      />

      <div className="flex items-start justify-between mb-3 pl-1">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 34, height: 34, background: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} strokeWidth={1.9} />
        </div>
        {trend && (
          <span
            className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: trend.up ? 'var(--green)' : 'var(--red)' }}
          >
            {trend.up
              ? <ArrowUpRight size={13} strokeWidth={2.5} />
              : <ArrowDownRight size={13} strokeWidth={2.5} />}
            {trend.v}
          </span>
        )}
      </div>

      <p className="text-xs font-semibold uppercase tracking-[.06em] mb-1 pl-1" style={{ color: 'var(--text-3)' }}>
        {label}
      </p>
      <p className="font-mono font-bold tracking-tight pl-1" style={{ fontSize: 24, lineHeight: 1, color: 'var(--text)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1.5 pl-1" style={{ color: 'var(--text-3)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

/* ─── Bar Chart ─── */
function BarChart({ bars }: { bars: BarDatum[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.v), 1)

  return (
    <div className="flex items-end gap-1.5" style={{ height: 88 }}>
      {bars.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-1" style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
          <div
            style={{
              width: '100%',
              height: mounted ? `${Math.max((b.v / max) * 72, b.v > 0 ? 3 : 0)}px` : '0',
              background: b.hi ? 'var(--accent)' : 'var(--surface-4)',
              borderRadius: '4px 4px 0 0',
              transition: `height .55s cubic-bezier(.22,1,.36,1) ${i * 30}ms`,
            }}
          />
          <span
            className="font-medium"
            style={{
              fontSize: 10,
              color: b.hi ? 'var(--accent)' : 'var(--text-3)',
              lineHeight: 1,
            }}
          >
            {b.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Donut ─── */
function Donut({ segs }: { segs: DonutSeg[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 150) }, [])
  const total = segs.reduce((s, x) => s + x.v, 0) || 1
  const sz = 100, r = (sz - 14) / 2, circ = 2 * Math.PI * r
  let off = 0

  return (
    <div className="flex items-center gap-5">
      <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--surface-4)" strokeWidth={11} />
        {segs.map((s, i) => {
          const pct = s.v / total
          const dash = mounted ? pct * circ : 0
          const o = off; off += pct * circ
          return (
            <circle key={i}
              cx={sz/2} cy={sz/2} r={r} fill="none"
              stroke={s.color} strokeWidth={11}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-o}
              style={{ transition: `stroke-dasharray .75s ease ${i * 70}ms` }}
            />
          )
        })}
      </svg>

      <div className="flex flex-col gap-2 flex-1">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-shrink-0 rounded-sm" style={{ width: 8, height: 8, background: s.color }} />
            <span className="flex-1 text-sm" style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{s.label}</span>
            <span className="font-mono font-semibold" style={{ fontSize: 13, color: 'var(--text)', minWidth: 22, textAlign: 'right' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function DashboardPage() {
  const [d, setD] = useState<any>({ tasks: [], projects: [], clients: [], transactions: [], approvals: [] })
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const [user, setUser] = useState('')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => setUser(data?.full_name?.split(' ')[0] || ''))
    })
    Promise.all([
      sb.from('tasks').select('id,title,status,priority,due_date'),
      sb.from('projects').select('id,name,status,progress,deadline,client_id'),
      sb.from('clients').select('id,name,status'),
      sb.from('transactions').select('type,amount,date'),
      sb.from('approvals').select('id,status'),
    ]).then(([t, p, c, tr, ap]) => {
      setD({ tasks: t.data || [], projects: p.data || [], clients: c.data || [], transactions: tr.data || [], approvals: ap.data || [] })
      setLoading(false)
    })
  }, [])

  const { tasks, projects, clients, transactions, approvals } = d

  // Finans
  const income  = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const expense = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const net     = income - expense

  // Görevler
  const done    = tasks.filter((t: any) => t.status === 'done')
  const overdue = tasks.filter((t: any) => t.status !== 'done' && t.due_date && new Date(t.due_date) < now)
  const pending = approvals.filter((a: any) => a.status === 'pending')

  const activeProjects = projects.filter((p: any) => p.status === 'active')
  const activeClients  = clients.filter((c: any) => c.status === 'active')

  // Aylık gelir — son 6 ay
  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  const cm = now.getMonth()
  const bars: BarDatum[] = Array.from({ length: 6 }, (_, i) => {
    const m = (cm - 5 + i + 12) % 12
    const v = transactions
      .filter((t: any) => t.type === 'income' && t.date && new Date(t.date).getMonth() === m)
      .reduce((s: number, t: any) => s + Number(t.amount), 0)
    return { label: MONTHS[m], v: Math.round(v / 1000), hi: i === 5 }
  })

  // Donut segmentleri
  const donutSegs: DonutSeg[] = [
    { v: tasks.filter((t: any) => t.status === 'todo').length,        color: 'var(--surface-4)', label: 'Bekliyor'    },
    { v: tasks.filter((t: any) => t.status === 'in_progress').length, color: '#3b82f6',          label: 'Devam'       },
    { v: tasks.filter((t: any) => t.status === 'review').length,      color: '#f59e0b',          label: 'İnceleme'    },
    { v: done.length,                                                  color: '#22c55e',          label: 'Tamamlandı'  },
  ]

  const fmt = (v: number) => v >= 1000000
    ? `₺${(v / 1000000).toFixed(1)}M`
    : v >= 1000 ? `₺${Math.round(v / 1000)}K`
    : `₺${v}`

  const PRI_COLOR: Record<string, string> = {
    critical: '#ef4444', high: '#f59e0b', normal: '#3b82f6', low: '#52525b',
  }

  const overdueTop = [...overdue]
    .sort((a: any, b: any) => {
      const o: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 }
      return (o[a.priority] ?? 2) - (o[b.priority] ?? 2)
    })
    .slice(0, 6)

  const weekEnd   = new Date(now.getTime() + 7 * 86400000)
  const weekTasks = tasks
    .filter((t: any) => t.due_date && t.status !== 'done' && new Date(t.due_date) >= now && new Date(t.due_date) <= weekEnd)
    .sort((a: any, b: any) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 5)

  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <TopBar title="Dashboard" subtitle={dateStr} />
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-3)', fontSize: 14 }}>
          Yükleniyor...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={user ? `Merhaba, ${user}` : 'Dashboard'}
        subtitle={dateStr}
        action={
          <div
            className="flex items-center gap-2 font-mono text-xs font-medium"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '5px 11px',
              color: 'var(--green)',
            }}
          >
            <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, display: 'inline-block' }} />
            {timeStr}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto" style={{ padding: '18px 20px 80px' }}>

        {/* ── KPI Satırı ── */}
        <div
          className="grid gap-3 mb-4"
          style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
        >
          <KpiCard
            label="Toplam Gelir"  value={fmt(income)}
            sub={`Gider: ${fmt(expense)}`}
            icon={TrendingUp}  iconColor="#22c55e" iconBg="rgba(34,197,94,.12)"
            trend={{ v: '+12%', up: true }}  delay={0}
          />
          <KpiCard
            label="Net Kar"  value={fmt(net)}
            sub={net >= 0 ? 'Kârlı dönem' : 'Zarar'}
            icon={Wallet}
            iconColor={net >= 0 ? '#6366f1' : '#ef4444'}
            iconBg={net >= 0 ? 'rgba(99,102,241,.12)' : 'rgba(239,68,68,.12)'}
            delay={40}
          />
          <KpiCard
            label="Aktif Proje"  value={String(activeProjects.length)}
            sub={`${activeClients.length} aktif müşteri`}
            icon={FolderOpen}  iconColor="#3b82f6" iconBg="rgba(59,130,246,.12)"
            delay={80}
          />
          <KpiCard
            label="Geciken Görev"  value={String(overdue.length)}
            sub={overdue.length > 0 ? 'Kontrol gerekli' : 'Temiz'}
            icon={Clock}
            iconColor={overdue.length > 0 ? '#ef4444' : '#22c55e'}
            iconBg={overdue.length > 0 ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.12)'}
            delay={120}
          />
          <KpiCard
            label="Onay Bekliyor"  value={String(pending.length)}
            sub={`${tasks.length} toplam görev`}
            icon={ClipboardCheck}  iconColor="#f59e0b" iconBg="rgba(245,158,11,.12)"
            delay={160}
          />
        </div>

        {/* ── Orta Satır: Gelir Grafiği + Görev Dağılımı ── */}
        <div
          className="grid gap-3 mb-3"
          style={{ gridTemplateColumns: '1.55fr 1fr' }}
        >
          {/* Gelir Trendi */}
          <div className="erp-card animate-fade">
            <div className="erp-card-header">
              <span className="erp-card-title">Aylık Gelir Trendi</span>
              <span className="erp-card-meta">Son 6 ay</span>
            </div>
            <div style={{ padding: '16px 18px 14px' }}>
              {/* Büyük sayı */}
              <div className="flex items-baseline gap-2.5 mb-4">
                <span
                  className="font-mono font-bold tracking-tight"
                  style={{ fontSize: 26, lineHeight: 1, color: 'var(--text)' }}
                >
                  {fmt(income)}
                </span>
                <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--green)' }}>
                  <ArrowUpRight size={13} strokeWidth={2.5} />12% artış
                </span>
              </div>

              <BarChart bars={bars} />

              {/* Alt özet */}
              <div
                className="flex gap-5 mt-3.5 pt-3.5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                {[
                  { l: 'Gelir', v: income, c: 'var(--green)' },
                  { l: 'Gider', v: expense, c: 'var(--red)' },
                  { l: 'Net',   v: net,    c: 'var(--accent)' },
                ].map(s => (
                  <div key={s.l}>
                    <p className="text-xs font-semibold uppercase tracking-[.06em] mb-1" style={{ color: 'var(--text-3)' }}>{s.l}</p>
                    <p className="font-mono font-semibold" style={{ fontSize: 13, color: s.c }}>{fmt(s.v)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Görev Durumu */}
          <div className="erp-card animate-fade">
            <div className="erp-card-header">
              <span className="erp-card-title">Görev Durumu</span>
              <span className="erp-card-meta">{tasks.length} toplam</span>
            </div>
            <div style={{ padding: '18px 18px 14px' }}>
              <Donut segs={donutSegs} />

              <div className="flex gap-2 mt-4">
                <div
                  className="flex-1 text-center rounded-lg"
                  style={{ background: 'rgba(34,197,94,.1)', padding: '9px 10px' }}
                >
                  <p className="font-mono font-bold" style={{ fontSize: 20, color: 'var(--green)', lineHeight: 1 }}>{done.length}</p>
                  <p className="text-xs uppercase tracking-[.05em] mt-1" style={{ color: 'var(--text-3)' }}>Tamamlandı</p>
                </div>
                <div
                  className="flex-1 text-center rounded-lg"
                  style={{ background: 'rgba(239,68,68,.08)', padding: '9px 10px' }}
                >
                  <p className="font-mono font-bold" style={{ fontSize: 20, color: 'var(--red)', lineHeight: 1 }}>{overdue.length}</p>
                  <p className="text-xs uppercase tracking-[.05em] mt-1" style={{ color: 'var(--text-3)' }}>Geciken</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Alt Satır: Projeler + Gecikmeler + Bu Hafta ── */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: '1.15fr 1fr 1fr' }}
        >
          {/* Aktif Projeler */}
          <div className="erp-card animate-fade">
            <div className="erp-card-header">
              <span className="erp-card-title">Aktif Projeler</span>
              <a
                href="/dashboard/projeler"
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
              >
                Tümü <ArrowRight size={11} />
              </a>
            </div>
            {activeProjects.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>Aktif proje yok</div>
            ) : (
              activeProjects.slice(0, 5).map((p: any) => (
                <div key={p.id} className="erp-row">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate mb-1.5">{p.name}</p>
                    <div className="flex items-center gap-2.5">
                      <div className="erp-progress flex-1">
                        <div
                          className="erp-progress-fill"
                          style={{
                            width: `${p.progress || 0}%`,
                            background: p.progress > 70 ? 'var(--green)' : p.progress > 40 ? 'var(--accent)' : 'var(--red)',
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-2)' }}>
                        {p.progress || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gecikmeler */}
          <div className="erp-card animate-fade">
            <div className="erp-card-header">
              <span className="erp-card-title">Gecikmeler</span>
              {overdue.length > 0 && (
                <span className="erp-badge erp-badge-red">{overdue.length}</span>
              )}
            </div>
            {overdueTop.length === 0 ? (
              <div className="flex items-center justify-center gap-1.5 py-8 text-sm font-medium" style={{ color: 'var(--green)' }}>
                <CheckCircle2 size={15} strokeWidth={2} /> Geciken görev yok
              </div>
            ) : (
              overdueTop.map((t: any) => {
                const days  = Math.floor((now.getTime() - new Date(t.due_date).getTime()) / 86400000)
                const color = PRI_COLOR[t.priority] || '#52525b'
                return (
                  <div key={t.id} className="erp-row">
                    <div className="flex-shrink-0 rounded-full" style={{ width: 6, height: 6, background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{t.title || 'Görev'}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t.due_date}</p>
                    </div>
                    <span className="font-mono text-xs font-semibold flex-shrink-0" style={{ color }}>
                      +{days}g
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* Bu Hafta Teslim */}
          <div className="erp-card animate-fade">
            <div className="erp-card-header">
              <span className="erp-card-title">Bu Hafta Teslim</span>
              <span className="erp-card-meta">{weekTasks.length} görev</span>
            </div>
            {weekTasks.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>Bu hafta teslim yok</div>
            ) : (
              weekTasks.map((t: any) => {
                const diff   = Math.ceil((new Date(t.due_date).getTime() - now.getTime()) / 86400000)
                const urgent = diff <= 1
                return (
                  <div key={t.id} className="erp-row">
                    <div
                      className="flex-shrink-0 rounded-full"
                      style={{ width: 6, height: 6, background: urgent ? 'var(--red)' : 'var(--surface-4)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{t.title || 'Görev'}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {diff === 0 ? 'Bugün' : diff === 1 ? 'Yarın' : `${diff} gün sonra`}
                      </p>
                    </div>
                    <span
                      className="font-mono text-xs font-medium flex-shrink-0"
                      style={{ color: urgent ? 'var(--red)' : 'var(--text-2)' }}
                    >
                      {String(t.due_date).slice(5, 10)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Mobile responsive override */}
      <style>{`
        @media (max-width: 900px) {
          .db-mid-grid  { grid-template-columns: 1fr !important; }
          .db-bot-grid  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .db-kpi-grid  { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  )
}