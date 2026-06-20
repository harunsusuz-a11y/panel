'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { 
  CheckCircle2, Clock, AlertCircle, Send, ChevronRight,
  User, Building2, ArrowRight, RefreshCw, FileText,
  Zap, TrendingUp, Package
} from 'lucide-react'

// İş akışı aşamaları — Daydream hiyerarşisi
const PIPELINE = [
  { id: 'brief',    label: 'Brief Alındı',     owner: 'Aslı',   color: 'var(--tx3)'  },
  { id: 'konsept',  label: 'Konsept',          owner: 'Aslı',   color: 'var(--blue)' },
  { id: 'uretim',   label: 'Üretim',           owner: 'Gizem',  color: 'var(--ac)'   },
  { id: 'kontrol',  label: 'Kalite Kontrol',   owner: 'Gizem',  color: 'var(--amber)'},
  { id: 'uygulama', label: 'Uygulama/Export',  owner: 'Yasin',  color: 'var(--blue)' },
  { id: 'mert',     label: 'Gönderim Hazır',   owner: 'Mert',   color: 'var(--ac)'   },
  { id: 'final',    label: 'Emir Onayı',       owner: 'Emir',   color: 'var(--amber)'},
  { id: 'musteri',  label: 'Müşteriye Gitti',  owner: 'Müşteri',color: 'var(--green)'},
]

const STATUS_MAP: Record<string, string> = {
  todo: 'brief', in_progress: 'uretim', review: 'kontrol', done: 'musteri'
}

const PRI: Record<string,any> = {
  critical: { l:'Kritik', c:'var(--red)',   bg:'var(--red2)'   },
  high:     { l:'Yüksek', c:'var(--amber)', bg:'var(--amber2)' },
  normal:   { l:'Normal', c:'var(--blue)',  bg:'var(--blue2)'  },
  low:      { l:'Düşük',  c:'var(--tx3)',   bg:'var(--s3)'     },
}

export default function OperasyonPage() {
  const [tasks,       setTasks]       = useState<any[]>([])
  const [projects,    setProjects]    = useState<any[]>([])
  const [clients,     setClients]     = useState<any[]>([])
  const [profiles,    setProfiles]    = useState<any[]>([])
  const [contents,    setContents]    = useState<any[]>([])
  const [approvals,   setApprovals]   = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [now,         setNow]         = useState(new Date())
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [myRole,      setMyRole]      = useState('')
  const [myName,      setMyName]      = useState('')
  const [checklist,   setChecklist]   = useState<Record<string,boolean>>({})
  const channelsRef = useRef<any[]>([])

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])

  async function load() {
    const sb = createClient()
    const [{ data: me }] = await Promise.all([sb.auth.getUser()])
    if (me.user) {
      const { data: prof } = await sb.from('profiles').select('role,full_name').eq('id', me.user.id).single()
      setMyRole(prof?.role || '')
      setMyName(prof?.full_name?.split(' ')[0] || '')
    }

    const [t, p, c, pr, ct, ap] = await Promise.all([
      sb.from('tasks').select('*').order('created_at', { ascending: false }),
      sb.from('projects').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      sb.from('clients').select('*').eq('status', 'active').order('name'),
      sb.from('profiles').select('id,full_name,role,department').not('full_name', 'is', null),
      sb.from('contents').select('*').order('created_at', { ascending: false }),
      sb.from('approvals').select('*').order('created_at', { ascending: false }),
    ])

    // Profil + client map
    const pm: Record<string,any> = {}; (pr.data||[]).forEach((x:any) => { pm[x.id] = x })
    const cm: Record<string,any> = {}; (c.data||[]).forEach((x:any) => { cm[x.id] = x })
    const pjm: Record<string,any> = {}; (p.data||[]).forEach((x:any) => { pjm[x.id] = x })

    setTasks((t.data||[]).map((x:any) => ({
      ...x,
      assignee: pm[x.assigned_to],
      client: cm[x.client_id] || (x.project_id && pjm[x.project_id] ? cm[pjm[x.project_id]?.client_id] : null),
      project: pjm[x.project_id],
    })))
    setProjects((p.data||[]).map((x:any) => ({ ...x, client: cm[x.client_id] })))
    setClients(c.data||[])
    setProfiles(pr.data||[])
    setContents((ct.data||[]).map((x:any) => ({ ...x, client: cm[x.client_id], assignee: pm[x.assigned_to] })))
    setApprovals(ap.data||[])
    setLoading(false)
    setLastRefresh(new Date())
  }

  useEffect(() => {
    load()
    const sb = createClient()
    ;['tasks','projects','contents','approvals'].forEach(table => {
      const ch = sb.channel(`op-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, load)
        .subscribe()
      channelsRef.current.push(ch)
    })
    return () => { channelsRef.current.forEach(ch => sb.removeChannel(ch)); channelsRef.current = [] }
  }, [])

  const overdue       = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now)
  const today         = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date).toDateString() === now.toDateString())
  const inProgress    = tasks.filter(t => t.status === 'in_progress')
  const inReview      = tasks.filter(t => t.status === 'review')
  const pendingApproval = approvals.filter(a => a.status === 'pending')
  const toSendClient  = approvals.filter(a => a.status === 'approved' && (!a.client_status || a.client_status === 'not_sent'))
  const urgent        = [...overdue, ...today].filter(t => t.priority === 'critical' || t.priority === 'high')
    .sort((a,b) => { const o: Record<string,number> = {critical:0,high:1,normal:2,low:3}; return o[a.priority]-o[b.priority] })
    .slice(0, 3)

  // Kişi bazlı iş yükü
  const personLoad = profiles.map(p => ({
    ...p,
    active: tasks.filter(t => t.assigned_to === p.id && t.status !== 'done').length,
    overdue: tasks.filter(t => t.assigned_to === p.id && t.status !== 'done' && t.due_date && new Date(t.due_date) < now).length,
    review: tasks.filter(t => t.assigned_to === p.id && t.status === 'review').length,
  })).filter(p => p.full_name).sort((a,b) => b.active - a.active)

  // Müşteri bazlı pipeline
  const clientPipeline = clients.map(c => {
    const cTasks    = tasks.filter(t => t.client_id === c.id || (t.project && t.project.client_id === c.id))
    const cProjects = projects.filter(p => p.client_id === c.id)
    const cContents = contents.filter(ct => ct.client_id === c.id)
    const cOverdue  = cTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now)
    return {
      ...c,
      tasks: cTasks,
      projects: cProjects,
      contents: cContents,
      overdue: cOverdue,
      pending: cTasks.filter(t => t.status !== 'done').length,
      done: cTasks.filter(t => t.status === 'done').length,
    }
  }).filter(c => c.tasks.length > 0 || c.projects.length > 0)

  const timeSince = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)
  const refreshStr = timeSince < 5 ? 'Az önce' : `${timeSince}s önce`

  // Gün sonu checklist items
  const CHECKLIST_ITEMS = [
    'Trello güncellendi',
    'Bekleyen revizyonlar ilgili kişiye iletildi',
    'Müşteriye gönderilecek dosyalar hazır',
    'Yarınki çekim/teslim kontrol edildi',
    'Caner ile fatura/tahsilat senkron yapıldı',
    'Emir\'e günlük özet iletildi',
  ]

  const isManager = myRole === 'admin' || myRole === 'manager'

  return (
    <>
      <style>{`
        .op-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px}
        .op-grid2{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-bottom:14px}
        .op-pipe{display:flex;gap:4px;overflow-x:auto;padding:4px 0;margin-bottom:14px}
        .op-pipe::-webkit-scrollbar{height:0}
        .pipe-step{flex-shrink:0;background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:8px 12px;min-width:110px;text-align:center;transition:border-color .15s}
        .pipe-step.active{border-color:var(--ac);background:var(--ac2)}
        .person-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--bdr);transition:background .1s}
        .person-row:last-child{border-bottom:none}
        .person-row:hover{background:var(--s2)}
        .check-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .1s}
        .check-item:last-child{border-bottom:none}
        .check-item:hover{background:var(--s2)}
        @media(max-width:900px){.op-grid3{grid-template-columns:1fr 1fr}.op-grid2{grid-template-columns:1fr}}
        @media(max-width:600px){.op-grid3{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title={`Operasyon${myName ? ` — ${myName}` : ''}`}
          subtitle="Canlı Trafik Yönetimi"
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--green2)', border: '1px solid rgba(34,211,160,.2)', borderRadius: 7, padding: '4px 10px' }}>
                <span className="anim-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                <span style={{ fontSize: 10.5, color: 'var(--green)', fontWeight: 600 }}>Canlı · {refreshStr}</span>
              </div>
              <button onClick={load} style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <RefreshCw size={12} strokeWidth={2} />Yenile
              </button>
            </div>
          }
        />

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 10, color: 'var(--tx3)' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--ac)', animation: 'pulse 2s ease infinite' }} />
              Yükleniyor...
            </div>
          ) : (<>

            {/* ── ACİL 3 İŞ ── */}
            {urgent.length > 0 && (
              <div style={{ background: 'var(--red2)', border: '1px solid rgba(242,87,87,.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Zap size={14} style={{ color: 'var(--red)' }} strokeWidth={2.5} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>ACİL — Öncelikli {urgent.length} İş</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {urgent.map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,.2)', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--red)', minWidth: 16 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
                          {t.assignee?.full_name || '—'} · {t.client?.name || t.project?.name || '—'}
                        </p>
                      </div>
                      <span className="badge" style={{ background: PRI[t.priority]?.bg, color: PRI[t.priority]?.c, flexShrink: 0 }}>{PRI[t.priority]?.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ÖZET KPI ── */}
            <div className="op-grid3" style={{ marginBottom: 14 }}>
              {[
                { l: 'Devam Eden', v: inProgress.length, c: 'var(--blue)',  bg: 'var(--blue2)',  Icon: TrendingUp },
                { l: 'İncelemede', v: inReview.length,   c: 'var(--amber)', bg: 'var(--amber2)', Icon: Clock      },
                { l: 'Geciken',    v: overdue.length,     c: overdue.length > 0 ? 'var(--red)' : 'var(--green)', bg: overdue.length > 0 ? 'var(--red2)' : 'var(--green2)', Icon: AlertCircle },
                { l: 'Bugün Teslim', v: today.length,    c: 'var(--ac)',    bg: 'var(--ac2)',    Icon: CheckCircle2 },
                { l: 'İç Onay Bekliyor', v: pendingApproval.length, c: 'var(--amber)', bg: 'var(--amber2)', Icon: FileText },
                { l: 'Müşteriye Gidecek', v: toSendClient.length, c: 'var(--green)', bg: 'var(--green2)', Icon: Send },
              ].map(s => (
                <div key={s.l} style={{ background: 'var(--s1)', border: `1px solid var(--bdr)`, borderLeft: `3px solid ${s.c}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.Icon size={13} style={{ color: s.c }} strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--tx3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.l}</span>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: s.c, lineHeight: 1 }}>{s.v}</p>
                </div>
              ))}
            </div>

            {/* ── İŞ AKIŞI PİPELINE ── */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-h">
                <span className="card-title">İş Akışı Pipeline — Daydream Hiyerarşisi</span>
                <span className="card-meta">Emir → Aslı → Gizem → Yasin → Mert → Müşteri</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div className="op-pipe">
                  {PIPELINE.map((step, i) => {
                    const count = tasks.filter(t => {
                      const mapped = STATUS_MAP[t.status] || t.status
                      if (step.id === 'musteri') return t.status === 'done'
                      if (step.id === 'uretim')  return t.status === 'in_progress'
                      if (step.id === 'kontrol') return t.status === 'review'
                      if (step.id === 'brief')   return t.status === 'todo'
                      return false
                    }).length
                    return (
                      <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div className={`pipe-step${count > 0 ? ' active' : ''}`}>
                          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: count > 0 ? step.color : 'var(--tx3)', lineHeight: 1, marginBottom: 3 }}>{count}</div>
                          <div style={{ fontSize: 10.5, fontWeight: 600, color: count > 0 ? 'var(--tx)' : 'var(--tx3)' }}>{step.label}</div>
                          <div style={{ fontSize: 9.5, color: count > 0 ? step.color : 'var(--tx3)', marginTop: 2 }}>{step.owner}</div>
                        </div>
                        {i < PIPELINE.length - 1 && <ChevronRight size={14} style={{ color: 'var(--tx3)', flexShrink: 0 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="op-grid2">
              {/* ── KİŞİ BAZLI İŞ YÜKÜ ── */}
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Ekip İş Yükü</span>
                  <span className="card-meta">{profiles.length} kişi</span>
                </div>
                {personLoad.map(p => {
                  const roleColors: Record<string,string> = { admin: 'var(--ac)', manager: 'var(--blue)', member: 'var(--tx3)' }
                  const maxLoad = Math.max(...personLoad.map(x => x.active), 1)
                  return (
                    <div key={p.id} className="person-row">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ac2)', color: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {(p.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</span>
                          {p.overdue > 0 && <span className="badge badge-red" style={{ fontSize: 9.5 }}>+{p.overdue} gecikmiş</span>}
                          {p.review > 0 && <span className="badge badge-amber" style={{ fontSize: 9.5 }}>{p.review} kontrol</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--s4)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(p.active / maxLoad) * 100}%`, background: p.overdue > 0 ? 'var(--red)' : 'var(--ac)', borderRadius: 2, transition: 'width .6s ease' }} />
                          </div>
                          <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono,monospace', color: 'var(--tx2)', flexShrink: 0 }}>{p.active} iş</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── MÜŞTERİ PİPELINE ── */}
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Müşteri Durumu</span>
                  <span className="card-meta">{clients.length} aktif</span>
                </div>
                {clientPipeline.length === 0 ? (
                  <div style={{ padding: 28, textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Müşteri verisi yok</div>
                ) : clientPipeline.map(c => (
                  <div key={c.id} className="person-row">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.overdue.length > 0 ? 'var(--red)' : 'var(--green)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        {c.overdue.length > 0 && <span className="badge badge-red" style={{ fontSize: 9.5 }}>!{c.overdue.length}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 11.5, color: 'var(--tx3)' }}>
                        <span>{c.projects.length} proje</span>
                        <span>{c.pending} açık görev</span>
                        <span style={{ color: 'var(--green)' }}>{c.done} tamamlandı</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── GÜN SONU KAPANIŞ CHECKLİST (sadece manager/admin) ── */}
            {isManager && (
              <div className="card">
                <div className="card-h">
                  <span className="card-title">Gün Sonu Kapanış Checklist</span>
                  <span style={{ fontSize: 11.5, color: 'var(--tx3)', fontFamily: 'JetBrains Mono,monospace' }}>
                    {now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {CHECKLIST_ITEMS.map((item, i) => (
                    <div key={i} className="check-item" onClick={() => setChecklist(prev => ({ ...prev, [item]: !prev[item] }))}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checklist[item] ? 'var(--green)' : 'var(--bdr2)'}`, background: checklist[item] ? 'var(--green2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                        {checklist[item] && <CheckCircle2 size={12} style={{ color: 'var(--green)' }} strokeWidth={2.5} />}
                      </div>
                      <span style={{ fontSize: 13, color: checklist[item] ? 'var(--tx3)' : 'var(--tx)', textDecoration: checklist[item] ? 'line-through' : 'none' }}>{item}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: checklist[item] ? 'var(--green)' : 'var(--tx3)', fontWeight: 600 }}>
                        {checklist[item] ? '✓ Yapıldı' : 'Bekliyor'}
                      </span>
                    </div>
                  ))}
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
                      {Object.values(checklist).filter(Boolean).length} / {CHECKLIST_ITEMS.length} tamamlandı
                    </span>
                    <div style={{ width: 120, height: 4, background: 'var(--s4)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(Object.values(checklist).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%`, background: 'var(--green)', transition: 'width .3s ease' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </>)}
        </div>
      </div>
    </>
  )
}
