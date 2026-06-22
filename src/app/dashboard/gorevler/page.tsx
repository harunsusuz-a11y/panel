'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import InfoBox from '@/components/InfoBox'
import { Plus, X, Building2, Clock, MessageSquare, Send, Zap } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { fmtDeadline, fmtDateTime, fmtRelative } from '@/lib/utils'

const COLS = [
  { id: 'todo',        label: 'Bekliyor',  color: 'var(--tx3)'  },
  { id: 'in_progress', label: 'Devam',     color: 'var(--blue)' },
  { id: 'review',      label: 'Kontrol',   color: 'var(--amber)'},
  { id: 'done',        label: 'Tamam',     color: 'var(--green)'},
]
const PRI: Record<string, any> = {
  critical: { label: 'Kritik',  c: 'var(--red)',   bg: 'var(--red2)'   },
  high:     { label: 'Yüksek', c: 'var(--amber)', bg: 'var(--amber2)' },
  normal:   { label: 'Normal', c: 'var(--blue)',  bg: 'var(--blue2)'  },
  low:      { label: 'Düşük',  c: 'var(--tx3)',   bg: 'var(--s3)'     },
}

export default function GorevlerPage() {
  const [tasks,    setTasks]    = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [clients,  setClients]  = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [detail,   setDetail]   = useState<any>(null)
  const [adding,   setAdding]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [myId,     setMyId]     = useState('')
  const [myRole,   setMyRole]   = useState('')
  const [confirmId, setConfirmId] = useState<string|null>(null)
  const [detailTab,setDetailTab]= useState<'info'|'comments'|'time'>('info')
  const [comments, setComments] = useState<any[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')

  const [form, setForm] = useState({ title: '', client_id: '', project_id: '', assigned_to: '', priority: 'normal', due_date: '', description: '' })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }
  const filteredProjects = form.client_id ? projects.filter(p => p.client_id === form.client_id) : projects

  async function load() {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    setMyId(user.id)

    // Rolü çek
    const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
    const role = prof?.role || 'member'
    setMyRole(role)

    const [p, c, pr] = await Promise.all([
      sb.from('projects').select('id,name,client_id').order('name'),
      sb.from('clients').select('id,name').order('name'),
      sb.from('profiles').select('id,full_name,department').not('full_name', 'is', null),
    ])

    // Member → sadece kendine atanmış görevler
    let taskQuery = sb.from('tasks').select('id,title,status,priority,due_date,assigned_to,project_id,client_id,completed_at,description,created_at').order('created_at', { ascending: false })
    if (role === 'member') {
      taskQuery = taskQuery.eq('assigned_to', user.id)
    }
    const { data: t } = await taskQuery

    const pm: Record<string, any> = {}; (p.data || []).forEach((x: any) => { pm[x.id] = x })
    const cm: Record<string, any> = {}; (c.data || []).forEach((x: any) => { cm[x.id] = x })
    const prm: Record<string, any> = {}; (pr.data || []).forEach((x: any) => { prm[x.id] = x })
    setTasks((t || []).map((x: any) => ({
      ...x,
      project: pm[x.project_id],
      client: cm[x.client_id] || (x.project_id && pm[x.project_id] ? cm[pm[x.project_id]?.client_id] : null),
      assignee: prm[x.assigned_to]
    })))
    setProjects(p.data || [])
    setClients(c.data || [])
    setProfiles((pr.data || []).filter((p: any) => p.full_name))
    setLoading(false)
  }
  const loadRef = useRef(load)
  useEffect(() => { loadRef.current = load })

  useEffect(() => {
    loadRef.current()

    // Realtime — başka sayfadan görev eklenince otomatik güncelle
    const sb = createClient()
    const ch = sb.channel('gorevler-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadRef.current()
      })
      .subscribe()

    return () => { sb.removeChannel(ch) }
  }, [])

  async function loadDetail(task: any) {
    setDetail(task); setDetailTab('info'); setComments([]); setTimeLogs([])
    const sb = createClient()
    const [{ data: comms }, { data: logs }] = await Promise.all([
      sb.from('task_comments').select('*, user:profiles!task_comments_user_id_fkey(full_name)').eq('task_id', task.id).order('created_at'),
      sb.from('time_logs').select('*, user:profiles!time_logs_user_id_fkey(full_name)').eq('task_id', task.id).order('started_at', { ascending: false }),
    ])
    setComments(comms || [])
    setTimeLogs(logs || [])
  }

  function handleProjectChange(pid: string) {
    const proj = projects.find(p => p.id === pid)
    setForm(f => ({ ...f, project_id: pid, client_id: proj?.client_id || f.client_id }))
  }
  function handleClientChange(cid: string) {
    setForm(f => {
      const ok = projects.find(p => p.id === f.project_id && p.client_id === cid)
      return { ...f, client_id: cid, project_id: ok ? f.project_id : '' }
    })
  }

  async function add() {
    if (!form.title.trim()) { showToast('Hata: Başlık zorunlu'); return }
    setAdding(true)
    const sb = createClient(); const { data: { user } } = await sb.auth.getUser()
    const { error } = await sb.from('tasks').insert({ title: form.title.trim(), status: 'todo', priority: form.priority, created_by: user?.id, project_id: form.project_id || null, client_id: form.client_id || null, assigned_to: form.assigned_to || null, due_date: form.due_date || null, description: form.description || null })
    setAdding(false)
    if (error) { showToast('Hata: ' + error.message); return }
    showToast('Görev oluşturuldu!')
    setModal(false)
    setForm({ title: '', client_id: '', project_id: '', assigned_to: '', priority: 'normal', due_date: '', description: '' })
    load()
    // Atanan kişiye push bildirimi gönder (kendine atanmadıysa)
    if (form.assigned_to && form.assigned_to !== user?.id) {
      try {
        await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: form.assigned_to,
            title: '📋 Yeni Görev Atandı',
            body: `"${form.title.trim()}" görevi sana atandı.${form.due_date ? ' Deadline: ' + form.due_date : ''}`,
            url: '/dashboard/gorevler',
            type: 'task_assigned',
          }),
        })
      } catch {}
    }
  }

  async function moveTask(id: string, status: string) {
    // Member: sadece kendi görevi, sadece todo→in_progress veya in_progress→review
    if (myRole === 'member') {
      const task = tasks.find(t => t.id === id)
      if (!task || task.assigned_to !== myId) { showToast('Hata: Bu görevi taşıyamazsınız'); return }
      const allowed = (task.status === 'todo' && status === 'in_progress') ||
                      (task.status === 'in_progress' && status === 'review')
      if (!allowed) { showToast('Hata: Bu geçişe yetkiniz yok'); return }
    }
    const upd: any = { status }
    const { error } = await createClient().from('tasks').update(upd).eq('id', id)
    if (error) { showToast('Hata: ' + error.message); return }
    // DB trigger completed_at'i set ediyor — güncel veriyi çek
    const { data: fresh } = await createClient().from('tasks').select('completed_at').eq('id', id).single()
    const updWithTime = { ...upd, completed_at: fresh?.completed_at || null }
    setTasks(ts => ts.map(t => t.id === id ? { ...t, ...updWithTime } : t))
    setDetail((d: any) => d ? { ...d, ...updWithTime } : null)
  }

  async function deleteTask(id: string) {
    if (myRole === 'member') { showToast('Hata: Görev silme yetkiniz yok'); return }
    setConfirmId(id)
  }

  async function confirmDelete() {
    if (!confirmId) return
    await createClient().from('tasks').delete().eq('id', confirmId)
    setTasks(ts => ts.filter(t => t.id !== confirmId))
    setDetail(null)
    setConfirmId(null)
  }

  async function addComment() {
    if (!newComment.trim() || !detail) return
    const sb = createClient(); const { data: { user } } = await sb.auth.getUser()
    const { data } = await sb.from('task_comments').insert({ task_id: detail.id, user_id: user?.id, content: newComment.trim() }).select('*, user:profiles!task_comments_user_id_fkey(full_name)').single()
    if (data) { setComments(cs => [...cs, data]); setNewComment('') }
  }

  const totalMinutes = timeLogs.reduce((s, l) => s + (l.duration_min || 0), 0)
  const fmtMin = (m: number) => m < 60 ? `${m}dk` : `${Math.floor(m / 60)}sa ${m % 60}dk`
  const isOverdue = (t: any) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()

  return (
    <>
      <style>{`
        .kb-wrap{flex:1;overflow-x:auto;overflow-y:hidden;padding:14px;display:flex;gap:10px}
        .kb-col{width:230px;flex-shrink:0;display:flex;flex-direction:column;gap:7px}
        .dt-wrap{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:9999;display:flex;justify-content:flex-end}
        .dt-panel{width:380px;height:100%;background:var(--s1);border-left:1px solid var(--bdr2);display:flex;flex-direction:column;overflow:hidden;animation:mmSlideRight .22s cubic-bezier(.22,1,.36,1) both}
        @keyframes mmSlideRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @media(max-width:768px){.kb-col{width:190px}.dt-panel{width:100%}}
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Görev Yönetimi" subtitle="Kanban" action={
          <button className="btn" onClick={() => setModal(true)}><Plus size={14} strokeWidth={2} />Yeni Görev</button>
        } />
        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        {loading ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</div> : (
          <div className="kb-wrap">
            {COLS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id)
              return (
                <div key={col.id} className="kb-col">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bdr)', flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: col.color, flex: 1 }}>{col.label}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--tx3)', background: 'var(--s3)', padding: '1px 7px', borderRadius: 5 }}>{colTasks.length}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {colTasks.map(t => {
                      const p = PRI[t.priority] || PRI.normal
                      const overdue = isOverdue(t)
                      return (
                        <div key={t.id} onClick={() => loadDetail(t)}
                          style={{ background: 'var(--s1)', border: `1px solid ${overdue ? 'rgba(242,87,87,.3)' : 'var(--bdr)'}`, borderRadius: 10, padding: '12px', cursor: 'pointer', transition: 'border-color .12s' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = overdue ? 'var(--red)' : 'var(--bdr2)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = overdue ? 'rgba(242,87,87,.3)' : 'var(--bdr)')}>
                          <p style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.4, marginBottom: 8 }}>{t.title}</p>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                            <span className="badge" style={{ background: p.bg, color: p.c }}>{p.label}</span>
                            {t.client && <span className="badge badge-muted" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}><Building2 size={9} strokeWidth={2} />{t.client.name}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--ac2)', color: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 800 }}>
                              {t.assignee ? t.assignee.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '—'}
                            </div>
                            {t.due_date && <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono,monospace', color: overdue ? 'var(--red)' : 'var(--tx3)' }}>{overdue ? '⚠ ' : ''}{fmtDeadline(t.due_date)}</span>}
                          </div>
                        </div>
                      )
                    })}
                    {colTasks.length === 0 && <div style={{ padding: '18px 0', textAlign: 'center', color: 'var(--tx3)', fontSize: 12, border: '1px dashed var(--bdr)', borderRadius: 8 }}>Görev yok</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Yeni Görev Modal */}
      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="modal-title" style={{ margin: 0 }}>Yeni Görev</p>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label className="label">Başlık *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="inp" autoFocus /></div>
              <div><label className="label">Firma</label>
                <select value={form.client_id} onChange={e => handleClientChange(e.target.value)} className="inp">
                  <option value="">— Firma Seçin —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="modal-grid">
                <div><label className="label">Proje</label>
                  <select value={form.project_id} onChange={e => handleProjectChange(e.target.value)} className="inp">
                    <option value="">— Seçin —</option>
                    {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Sorumlu</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="inp">
                    <option value="">— Seçin —</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div><label className="label">Öncelik</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="inp">
                    <option value="critical">Kritik</option><option value="high">Yüksek</option><option value="normal">Normal</option><option value="low">Düşük</option>
                  </select>
                </div>
                <div><label className="label">Deadline</label><input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="inp" /></div>
              </div>
              <div><label className="label">Açıklama</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="inp" rows={2} /></div>
              <button className="btn" onClick={add} disabled={adding || !form.title.trim()} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                {adding ? 'Oluşturuluyor...' : 'Görev Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Görev Detay — Sağdan açılan panel */}
      {detail && (
        <div className="dt-wrap" onClick={e => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className="dt-panel">
            {/* Panel header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>{detail.title}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: PRI[detail.priority]?.bg, color: PRI[detail.priority]?.c }}>{PRI[detail.priority]?.label}</span>
                  {detail.client && <span className="badge badge-muted">{detail.client.name}</span>}
                </div>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', flexShrink: 0, fontSize: 18 }}>✕</button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--bdr)', background: 'var(--s1)', flexShrink: 0 }}>
              {[
                { k: 'info',     l: 'Detay',    Icon: null },
                { k: 'comments', l: `Yorumlar (${comments.length})`, Icon: MessageSquare },
                { k: 'time',     l: `Süre (${fmtMin(totalMinutes)})`, Icon: Clock },
              ].map(({ k, l, Icon }) => (
                <button key={k} onClick={() => setDetailTab(k as any)}
                  style={{ flex: 1, padding: '9px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: detailTab === k ? 600 : 400, color: detailTab === k ? 'var(--ac)' : 'var(--tx3)', borderBottom: `2px solid ${detailTab === k ? 'var(--ac)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'color .12s' }}>
                  {Icon && <Icon size={11} strokeWidth={2} />}{l}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              {/* ── Detay ── */}
              {detailTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { l: 'Firma',      v: detail.client?.name || '—' },
                    { l: 'Proje',      v: detail.project?.name || '—' },
                    { l: 'Sorumlu',    v: detail.assignee?.full_name || '—' },
                    { l: 'Öncelik',    v: PRI[detail.priority]?.label || detail.priority },
                    { l: 'Durum',      v: COLS.find(c => c.id === detail.status)?.label || detail.status },
                    { l: 'Deadline',    v: fmtDeadline(detail.due_date) },
                    { l: 'Oluşturuldu', v: detail.created_at ? fmtDateTime(detail.created_at) : '—' },
                    { l: 'Tamamlandı',  v: detail.completed_at ? fmtDateTime(detail.completed_at) : '—' },
                    { l: 'Harcanan Süre', v: totalMinutes > 0 ? fmtMin(totalMinutes) : '—' },
                  ].map(f => (
                    <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 11px', background: 'var(--s2)', borderRadius: 7 }}>
                      <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{f.l}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{f.v}</span>
                    </div>
                  ))}
                  {detail.description && (
                    <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
                      <p style={{ fontSize: 11, color: 'var(--tx3)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Açıklama</p>
                      <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.6 }}>{detail.description}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Taşı</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {COLS.filter(c => {
                        if (c.id === detail.status) return false
                        if (myRole === 'member') {
                          // Member: sadece todo→in_progress ve in_progress→review
                          if (detail.status === 'todo' && c.id === 'in_progress') return true
                          if (detail.status === 'in_progress' && c.id === 'review') return true
                          return false
                        }
                        return true
                      }).map(c => (
                        <button key={c.id} onClick={() => moveTask(detail.id, c.id)} className="btn-ghost" style={{ fontSize: 12, color: c.color, borderColor: `${c.color}44` }}>→ {c.label}</button>
                      ))}
                    </div>
                    {myRole !== 'member' && (
                      <button className="btn-danger" onClick={() => deleteTask(detail.id)} style={{ width: '100%', justifyContent: 'center', padding: 9 }}>Görevi Sil</button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Yorumlar ── */}
              {detailTab === 'comments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {comments.length === 0 && <p style={{ color: 'var(--tx3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Henüz yorum yok</p>}
                  {comments.map(c => (
                    <div key={c.id} style={{ background: 'var(--s2)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ac2)', color: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>
                          {(c.user?.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{c.user?.full_name || '—'}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--tx3)', marginLeft: 'auto' }}>{fmtRelative(c.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5 }}>{c.content}</p>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Yorum yaz..." className="inp" style={{ flex: 1 }}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addComment()} />
                    <button onClick={addComment} className="btn" style={{ padding: '8px 12px', flexShrink: 0 }}><Send size={14} /></button>
                  </div>
                </div>
              )}

              {/* ── Süre Takibi — Otomatik ── */}
              {detailTab === 'time' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Özet */}
                  <div style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Zap size={14} style={{ color: 'var(--ac)' }} strokeWidth={2} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Otomatik Süre Takibi</span>
                      <span style={{ fontSize: 10, color: 'var(--blue)', background: 'var(--blue2)', padding: '2px 7px', borderRadius: 5, fontWeight: 600, marginLeft: 'auto' }}>Otomatik</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--tx3)', lineHeight: 1.6, marginBottom: 12 }}>
                      Görev <strong style={{ color: 'var(--blue)' }}>"Devam"</strong>a alındığında süre otomatik başlar,
                      başka statüye geçince durur.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1, background: 'var(--s3)', borderRadius: 9, padding: '10px', textAlign: 'center' }}>
                        <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--ac)', lineHeight: 1 }}>{fmtMin(totalMinutes)}</p>
                        <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Toplam Süre</p>
                      </div>
                      <div style={{ flex: 1, background: 'var(--s3)', borderRadius: 9, padding: '10px', textAlign: 'center' }}>
                        <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: timeLogs.some(l => !l.ended_at) ? 'var(--green)' : 'var(--tx3)', lineHeight: 1 }}>{timeLogs.length}</p>
                        <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Oturum</p>
                      </div>
                    </div>
                    {timeLogs.some(l => !l.ended_at) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '7px 10px', background: 'var(--green2)', borderRadius: 8, border: '1px solid rgba(34,211,160,.2)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
                        <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Şu an aktif — devam ediyor</span>
                      </div>
                    )}
                  </div>

                  {/* Log listesi */}
                  {timeLogs.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>
                      <Clock size={22} strokeWidth={1.5} style={{ opacity: .3, display: 'block', margin: '0 auto 8px' }} />
                      Görev henüz "Devam"a alınmadı
                    </div>
                  ) : timeLogs.map(log => {
                    const isActive = !log.ended_at
                    return (
                      <div key={log.id} style={{ background: isActive ? 'var(--green2)' : 'var(--s2)', border: `1px solid ${isActive ? 'rgba(34,211,160,.2)' : 'var(--bdr)'}`, borderRadius: 9, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: isActive ? 'rgba(34,211,160,.2)' : 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Clock size={13} style={{ color: isActive ? 'var(--green)' : 'var(--blue)' }} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 600 }}>{log.user?.full_name || 'Otomatik'}</p>
                          <p style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>
                            {fmtDateTime(log.started_at)}
                            {log.ended_at && <span> → {fmtDateTime(log.ended_at)}</span>}
                          </p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: isActive ? 'var(--green)' : 'var(--blue)', flexShrink: 0 }}>
                          {isActive ? '▶ Devam' : fmtMin(log.duration_min || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={!!confirmId}
        title="Görevi Sil"
        message="Bu görevi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  )
}
