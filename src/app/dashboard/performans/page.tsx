'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { fmtRelative, fmtDateTime } from '@/lib/utils'
import {
  TrendingUp, Users, FolderOpen, CheckCircle2, AlertCircle,
  Clock, ArrowUpRight, Building2, ChevronRight, Activity
} from 'lucide-react'

function Ring({ value, color, size = 56 }: { value: number; color: string; size?: number }) {
  const [m, setM] = useState(false)
  useEffect(() => { setTimeout(() => setM(true), 200) }, [])
  const r = (size - 8) / 2, circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--s4)" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (m ? value / 100 : 0) * circ}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1) .3s' }} />
    </svg>
  )
}

// Daydream hiyerarşisi — sabit
const TEAM_ROLES: Record<string, { title: string; color: string }> = {
  'Emir':    { title: 'Founder & Executive Producer', color: 'var(--ac)'    },
  'Aslı':    { title: 'Creative Lead',                color: 'var(--blue)'  },
  'Gizem':   { title: 'Social Media Lead / Design',   color: 'var(--green)' },
  'Yasin':   { title: 'Junior Operator',              color: 'var(--amber)' },
  'Mert':    { title: 'Operations Manager',           color: 'var(--tx2)'   },
  'Caner':   { title: 'Accounting',                   color: 'var(--tx3)'   },
}

export default function PerformansPage() {
  const [profiles,  setProfiles]  = useState<any[]>([])
  const [tasks,     setTasks]     = useState<any[]>([])
  const [projects,  setProjects]  = useState<any[]>([])
  const [clients,   setClients]   = useState<any[]>([])
  const [contents,  setContents]  = useState<any[]>([])
  const [activities,setActivities]= useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selClient, setSelClient] = useState<string>('all')
  const [myRole,    setMyRole]    = useState('')
  const channelsRef = useRef<any[]>([])

  async function load() {
    const sb = createClient()
    const { data: me } = await sb.auth.getUser()
    if (me.user) {
      const { data: p } = await sb.from('profiles').select('role').eq('id', me.user.id).single()
      setMyRole(p?.role || '')
    }
    const [pr, t, p, c, ct, ac] = await Promise.all([
      sb.from('profiles').select('*').not('full_name', 'is', null),
      sb.from('tasks').select('*'),
      sb.from('projects').select('*').order('created_at', { ascending: false }),
      sb.from('clients').select('*').order('name'),
      sb.from('contents').select('*').order('created_at', { ascending: false }),
      sb.from('activities').select('*, user:profiles!activities_user_id_fkey(full_name,role)')
        .order('created_at', { ascending: false }).limit(50),
    ])
    setProfiles(pr.data || [])
    setTasks(t.data || [])
    setProjects(p.data || [])
    setClients(c.data || [])
    setContents(ct.data || [])
    setActivities(ac.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const sb = createClient()
    ;['tasks', 'projects', 'contents', 'activities'].forEach(table => {
      const ch = sb.channel(`perf-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, load)
        .subscribe()
      channelsRef.current.push(ch)
    })
    return () => { channelsRef.current.forEach(ch => sb.removeChannel(ch)); channelsRef.current = [] }
  }, [])

  const now = new Date()

  // Ekip performans skoru
  const teamData = profiles.map(p => {
    const my     = tasks.filter(t => t.assigned_to === p.id)
    const done   = my.filter(t => t.status === 'done').length
    const total  = my.length
    const overdue= my.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now).length
    const inProg = my.filter(t => t.status === 'in_progress').length
    const score  = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((done / total) * 100 - overdue * 10)))
    const color  = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--ac)' : score >= 40 ? 'var(--amber)' : 'var(--red)'
    const fn     = p.full_name || ''
    const firstName = fn.split(' ')[0]
    const roleInfo = TEAM_ROLES[firstName] || { title: p.department || 'Ekip', color: 'var(--tx3)' }
    return { ...p, done, total, overdue, inProg, score, color, roleInfo }
  }).filter(p => p.full_name).sort((a, b) => b.score - a.score)

  // Müşteri bazlı içerik timeline
  const clientMap: Record<string, any> = {}
  clients.forEach(c => { clientMap[c.id] = c })
  const projMap: Record<string, any> = {}
  projects.forEach(p => { projMap[p.id] = p })

  const clientContentData = clients.map(c => {
    const cContents = contents.filter(ct => ct.client_id === c.id)
    const cProjects = projects.filter(p => p.client_id === c.id)
    const cTasks    = tasks.filter(t => {
      if (t.client_id === c.id) return true
      if (t.project_id && projMap[t.project_id]?.client_id === c.id) return true
      return false
    })
    return {
      ...c,
      contents: cContents,
      projects: cProjects,
      tasks: cTasks,
      draft:     cContents.filter(ct => ct.status === 'draft').length,
      pending:   cContents.filter(ct => ct.status === 'pending').length,
      approved:  cContents.filter(ct => ct.status === 'approved').length,
      published: cContents.filter(ct => ct.status === 'published').length,
      revision:  cContents.filter(ct => ct.status === 'revision').length,
      tasksDone: cTasks.filter(t => t.status === 'done').length,
      tasksOpen: cTasks.filter(t => t.status !== 'done').length,
      overdue:   cTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now).length,
    }
  }).filter(c => c.contents.length > 0 || c.projects.length > 0 || c.tasks.length > 0)

  // Seçili müşteri içerik detayı
  const selClientData = selClient === 'all' ? null : clientContentData.find(c => c.id === selClient)
  const selContents   = selClient === 'all' ? contents : contents.filter(ct => ct.client_id === selClient)

  // Genel özet
  const totalDone     = tasks.filter(t => t.status === 'done').length
  const totalOverdue  = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now).length
  const activeProjects= projects.filter(p => p.status === 'active').length
  const publishedCont = contents.filter(ct => ct.status === 'published').length

  // Activity log formatla
  const ACTION_LABELS: Record<string, string> = {
    created: 'oluşturdu',
    updated: 'güncelledi',
    deleted: 'sildi',
    approval_approved: 'onayladı',
    approval_rejected: 'reddetti',
  }
  function formatAction(action: string, entity: string): string {
    if (action.startsWith('status_changed:')) {
      const parts = action.replace('status_changed:', '').split('->')
      return `durumu değiştirdi: ${parts[0]} → ${parts[1]}`
    }
    if (action.startsWith('progress_updated:')) {
      return `ilerlemeyi güncelledi: ${action.replace('progress_updated:', '')}`
    }
    return ACTION_LABELS[action] || action
  }

  const ENTITY_L: Record<string, string> = {
    tasks: 'görev', projects: 'proje', clients: 'müşteri',
    contents: 'içerik', approvals: 'onay', transactions: 'işlem'
  }

  const fmt = (v: number) => v >= 1000000 ? `₺${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `₺${Math.round(v / 1000)}K` : `₺${v}`

  if (myRole === 'member') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Performans" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 13 }}>
          Bu sayfaya erişim yetkiniz yok.
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .pf-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
        .pf-grid2{display:grid;grid-template-columns:1.2fr 1fr;gap:14px;margin-bottom:14px}
        .pf-team{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
        .act-row{display:flex;align-items:flex-start;gap:10px;padding:9px 16px;border-bottom:1px solid var(--bdr)}
        .act-row:last-child{border-bottom:none}
        .cl-tab{padding:7px 13px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--tx2);border-bottom:2px solid transparent;white-space:nowrap;transition:color .12s}
        .cl-tab.on{color:var(--ac);border-bottom-color:var(--ac);font-weight:700}
        @media(max-width:1000px){.pf-grid4{grid-template-columns:repeat(2,1fr)}.pf-team{grid-template-columns:repeat(2,1fr)}.pf-grid2{grid-template-columns:1fr}}
        @media(max-width:600px){.pf-grid4{grid-template-columns:1fr}.pf-team{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Yönetici Özeti" subtitle="Emir — Genel Bakış" />

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--tx3)', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--ac)', animation: 'pulse 2s ease infinite' }} />
              Yükleniyor...
            </div>
          ) : (<>

            {/* ── GENEL KPI ── */}
            <div className="pf-grid4">
              {[
                { l: 'Tamamlanan Görev', v: totalDone,       c: 'var(--green)',  Icon: CheckCircle2 },
                { l: 'Geciken',          v: totalOverdue,     c: totalOverdue > 0 ? 'var(--red)' : 'var(--green)', Icon: AlertCircle },
                { l: 'Aktif Proje',      v: activeProjects,   c: 'var(--blue)',   Icon: FolderOpen   },
                { l: 'Yayınlanan İçerik',v: publishedCont,   c: 'var(--ac)',     Icon: TrendingUp   },
              ].map(s => (
                <div key={s.l} style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderLeft: `3px solid ${s.c}`, borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right,${s.c}15,transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <s.Icon size={14} style={{ color: s.c }} strokeWidth={2} />
                  </div>
                  <p style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{s.l}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: s.c, lineHeight: 1 }}>{s.v}</p>
                </div>
              ))}
            </div>

            {/* ── EKİP PERFORMANSI ── */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-h">
                <span className="card-title">Ekip Performansı — Daydream</span>
                <span className="card-meta">{teamData.length} kişi</span>
              </div>
              <div className="pf-team" style={{ padding: '14px' }}>
                {teamData.map(p => (
                  <div key={p.id} style={{ background: 'var(--s2)', borderRadius: 10, padding: '14px', border: '1px solid var(--bdr)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Ring value={p.score} color={p.color} size={48} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</p>
                        <p style={{ fontSize: 10, color: p.roleInfo.color, marginTop: 2, fontWeight: 600 }}>{p.roleInfo.title}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
                      {[
                        { l: 'Tamamlanan', v: p.done,   c: 'var(--green)' },
                        { l: 'Devam',      v: p.inProg, c: 'var(--ac)'    },
                        { l: 'Geciken',    v: p.overdue,c: p.overdue > 0 ? 'var(--red)' : 'var(--tx3)' },
                      ].map(s => (
                        <div key={s.l} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', background: 'var(--s3)', borderRadius: 6, margin: '0 2px' }}>
                          <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: s.c, lineHeight: 1 }}>{s.v}</p>
                          <p style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── MÜŞTERİ BAZLI İÇERİK TİMELINE ── */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-h">
                <span className="card-title">Müşteri Bazlı İçerik Durumu</span>
                <span className="card-meta">{clientContentData.length} müşteri</span>
              </div>
              {/* Müşteri sekmeleri */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--bdr)', overflowX: 'auto', flexShrink: 0, background: 'var(--s1)' }}>
                <button className={`cl-tab${selClient === 'all' ? ' on' : ''}`} onClick={() => setSelClient('all')}>Tümü</button>
                {clientContentData.map(c => (
                  <button key={c.id} className={`cl-tab${selClient === c.id ? ' on' : ''}`} onClick={() => setSelClient(c.id)}>
                    {c.name}
                    {c.overdue > 0 && <span style={{ marginLeft: 5, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>{c.overdue}</span>}
                  </button>
                ))}
              </div>

              {/* Seçili müşteri özet */}
              {selClientData && (
                <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--bdr)', flexWrap: 'wrap' }}>
                  {[
                    { l: 'Taslak',     v: selClientData.draft,     c: 'var(--tx3)'  },
                    { l: 'Onay Bekl.', v: selClientData.pending,   c: 'var(--amber)'},
                    { l: 'Onaylandı',  v: selClientData.approved,  c: 'var(--green)'},
                    { l: 'Revizyon',   v: selClientData.revision,  c: 'var(--red)'  },
                    { l: 'Yayında',    v: selClientData.published, c: 'var(--ac)'   },
                  ].map(s => (
                    <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s2)', borderRadius: 7, padding: '6px 10px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.c }} />
                      <span style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{s.l}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.c, fontFamily: 'JetBrains Mono,monospace' }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* İçerik listesi */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {selContents.length === 0 ? (
                  <div style={{ padding: 28, textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>İçerik yok</div>
                ) : selContents.slice(0, 20).map(ct => {
                  const ST: Record<string,any> = {
                    draft:    { l:'Taslak',        c:'var(--tx3)',   bg:'var(--s3)'    },
                    pending:  { l:'Onay Bekliyor', c:'var(--amber)', bg:'var(--amber2)'},
                    approved: { l:'Onaylandı',     c:'var(--green)', bg:'var(--green2)'},
                    revision: { l:'Revizyon',      c:'var(--red)',   bg:'var(--red2)'  },
                    published:{ l:'Yayında',       c:'var(--ac)',    bg:'var(--ac2)'   },
                  }
                  const st = ST[ct.status] || ST.draft
                  const cli = clientMap[ct.client_id]
                  return (
                    <div key={ct.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--bdr)', transition: 'background .1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.c, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ct.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
                          {cli?.name || '—'} · {ct.type} · {ct.publish_date || 'Tarih yok'}
                        </p>
                      </div>
                      <span className="badge" style={{ background: st.bg, color: st.c, flexShrink: 0 }}>{st.l}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── KİM NE ZAMAN NE YAPTI — ACTİVİTY LOG ── */}
            <div className="card">
              <div className="card-h">
                <span className="card-title">Kim Ne Zaman Ne Yaptı</span>
                <span className="card-meta">Son 50 işlem · Anlık</span>
              </div>
              {activities.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Henüz kayıt yok</div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {activities.map(a => {
                    const timeStr = fmtRelative(a.created_at)
                    const fullTime = fmtDateTime(a.created_at)
                    const init = (a.user?.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <div key={a.id} className="act-row">
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ac2)', color: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, flexShrink: 0 }}>
                          {init}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                            <strong style={{ color: 'var(--tx)' }}>{a.user?.full_name || 'Bilinmeyen'}</strong>
                            {' '}
                            <span style={{ color: 'var(--tx2)' }}>
                              {ENTITY_L[a.entity_type] || a.entity_type} {formatAction(a.action, a.entity_type)}
                            </span>
                            {a.entity_title && (
                              <span style={{ color: 'var(--tx3)' }}>{' — '}{a.entity_title}</span>
                            )}
                          </p>
                        </div>
                        <span title={fullTime} style={{ fontSize: 10.5, color: 'var(--tx3)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0, whiteSpace: 'nowrap', cursor: 'default' }}>{timeStr}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </>)}
        </div>
      </div>
    </>
  )
}
