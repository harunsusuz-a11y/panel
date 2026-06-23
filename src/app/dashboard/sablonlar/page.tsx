'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import ConfirmModal from '@/components/ConfirmModal'
import { Plus, X, Play, Trash2, CheckCircle2, AlertCircle, LayoutTemplate, Pencil } from 'lucide-react'

const PRI: Record<string, any> = {
  critical: { label: 'Kritik',  c: 'var(--red)',   bg: 'var(--red2)'   },
  high:     { label: 'Yüksek', c: 'var(--amber)', bg: 'var(--amber2)' },
  normal:   { label: 'Normal', c: 'var(--blue)',  bg: 'var(--blue2)'  },
  low:      { label: 'Düşük',  c: 'var(--tx3)',   bg: 'var(--s3)'     },
}

const OFFSET_LABELS: Record<number, string> = {
  0: 'Pazartesi',
  1: 'Salı',
  2: 'Çarşamba',
  3: 'Perşembe',
  4: 'Cuma',
  5: 'Cumartesi',
  6: 'Pazar',
}

function getThisMonday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function getThisWeekRange(): { start: Date; end: Date } {
  const start = getThisMonday()
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export default function SablonlarPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [profiles,  setProfiles]  = useState<any[]>([])
  const [clients,   setClients]   = useState<any[]>([])
  const [projects,  setProjects]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [creating,  setCreating]  = useState(false)
  const [modal,     setModal]     = useState(false)
  const [toast,     setToast]     = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [myId,      setMyId]      = useState('')
  const [running,   setRunning]   = useState(false)
  const [runResult, setRunResult] = useState<{ created: number; skipped: number } | null>(null)
  const [editModal,  setEditModal]  = useState(false)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [editForm,   setEditForm]   = useState({
    title: '',
    description: '',
    assigned_to: '',
    assigned_users: [] as string[],
    client_id: '',
    project_id: '',
    priority: 'normal',
    deadline_offset_days: 4,
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    assigned_users: [] as string[],
    client_id: '',
    project_id: '',
    priority: 'normal',
    deadline_offset_days: 4,
    is_active: true,
  })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 4000) }

  const filteredProjects = form.client_id
    ? projects.filter(p => p.client_id === form.client_id)
    : projects

  const editFilteredProjects = editForm.client_id
    ? projects.filter(p => p.client_id === editForm.client_id)
    : projects

  async function load() {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) setMyId(user.id)
    const [t, p, c, pr] = await Promise.all([
      sb.from('task_templates')
        .select('*, assigned_to, client_id, project_id')
        .order('created_at', { ascending: false }),
      sb.from('profiles').select('id,full_name').not('full_name', 'is', null).order('full_name'),
      sb.from('clients').select('id,name').order('name'),
      sb.from('projects').select('id,name,client_id').order('name'),
    ])
    // Join'ları manuel yap — FK adı sorununu bypass et
    const profileMap = Object.fromEntries((p.data || []).map((x: any) => [x.id, x.full_name]))
    const clientMap  = Object.fromEntries((c.data  || []).map((x: any) => [x.id, x.name]))
    const projectMap = Object.fromEntries((pr.data || []).map((x: any) => [x.id, x.name]))
    const enriched = (t.data || []).map((tpl: any) => ({
      ...tpl,
      assignee: { full_name: profileMap[tpl.assigned_to] || null },
      client:   { name: clientMap[tpl.client_id]         || null },
      project:  { name: projectMap[tpl.project_id]       || null },
    }))
    setTemplates(enriched)
    setProfiles(p.data || [])
    setClients(c.data || [])
    setProjects(pr.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.title.trim()) { showToast('Hata: Başlık zorunlu'); return }
    if (!form.assigned_to)  { showToast('Hata: Sorumlu seçilmeli'); return }
    setCreating(true)
    const sb = createClient()
    const { error } = await sb.from('task_templates').insert({
      title:                form.title.trim(),
      description:          form.description || null,
      assigned_to:          form.assigned_to || null,
      assigned_users:       form.assigned_users.length > 0 ? form.assigned_users : null,
      client_id:            form.client_id   || null,
      project_id:           form.project_id  || null,
      priority:             form.priority,
      deadline_offset_days: form.deadline_offset_days,
      is_active:            form.is_active,
      created_by:           myId,
    })
    setCreating(false)
    if (error) { showToast('Hata: ' + error.message); return }
    showToast('Şablon oluşturuldu!')
    setModal(false)
    setForm({ title: '', description: '', assigned_to: '', client_id: '', project_id: '', priority: 'normal', deadline_offset_days: 4, is_active: true })
    load()
  }

  async function toggleActive(id: string, current: boolean) {
    await createClient().from('task_templates').update({ is_active: !current }).eq('id', id)
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, is_active: !current } : t))
  }

  function openEdit(t: any) {
    setEditId(t.id)
    setEditForm({
      title:                t.title,
      description:          t.description || '',
      assigned_to:          t.assigned_to || '',
      assigned_users:       t.assigned_users || [],
      client_id:            t.client_id   || '',
      project_id:           t.project_id  || '',
      priority:             t.priority    || 'normal',
      deadline_offset_days: t.deadline_offset_days ?? 4,
      is_active:            t.is_active   ?? true,
    })
    setEditModal(true)
  }

  async function saveEdit() {
    if (!editForm.title.trim()) { showToast('Hata: Başlık zorunlu'); return }
    if (!editForm.assigned_to)  { showToast('Hata: Sorumlu seçilmeli'); return }
    setSaving(true)
    const { error } = await createClient().from('task_templates').update({
      title:                editForm.title.trim(),
      description:          editForm.description || null,
      assigned_to:          editForm.assigned_to || null,
      assigned_users:       editForm.assigned_users.length > 0 ? editForm.assigned_users : null,
      client_id:            editForm.client_id   || null,
      project_id:           editForm.project_id  || null,
      priority:             editForm.priority,
      deadline_offset_days: editForm.deadline_offset_days,
      is_active:            editForm.is_active,
    }).eq('id', editId!)
    setSaving(false)
    if (error) { showToast('Hata: ' + error.message); return }
    showToast('Şablon güncellendi!')
    setEditModal(false)
    setEditId(null)
    load()
  }

  async function confirmDelete() {
    if (!confirmId) return
    await createClient().from('task_templates').delete().eq('id', confirmId)
    setTemplates(ts => ts.filter(t => t.id !== confirmId))
    setConfirmId(null)
    showToast('Şablon silindi')
  }

  async function runThisWeek() {
    setRunning(true)
    setRunResult(null)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const active = templates.filter(t => t.is_active)
    if (active.length === 0) { showToast('Aktif şablon yok'); setRunning(false); return }
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]))

  const monday = getThisMonday()
    const { start, end } = getThisWeekRange()
    const activeIds = active.map(t => t.id)
    const { data: existing } = await sb
      .from('tasks')
      .select('template_id')
      .in('template_id', activeIds)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
    const alreadyCreated = new Set((existing || []).map((r: any) => r.template_id))
    let created = 0
    let skipped = 0
    for (const tpl of active) {
      if (alreadyCreated.has(tpl.id)) { skipped++; continue }
      const deadline = new Date(monday)
      deadline.setDate(deadline.getDate() + tpl.deadline_offset_days)
      const dueDateStr = deadline.toISOString().split('T')[0]
      const { error } = await sb.from('tasks').insert({
        title:       tpl.title,
        description: tpl.description || null,
        assigned_to: tpl.assigned_to,
        client_id:   tpl.client_id   || null,
        project_id:  tpl.project_id  || null,
        priority:    tpl.priority,
        status:      'todo',
        due_date:    dueDateStr,
        template_id: tpl.id,
        created_by:  user?.id,
      })
      if (!error) {
        created++
        if (tpl.assigned_to && tpl.assigned_to !== user?.id) {
          try {
            await fetch('/api/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: tpl.assigned_to,
                title:  '📋 Haftalık Görev Atandı',
                body:   `"${tpl.title}" görevi bu hafta için oluşturuldu. Deadline: ${OFFSET_LABELS[tpl.deadline_offset_days]}`,
                url:    '/dashboard/gorevler',
                type:   'task_assigned',
              }),
            })
          } catch {}
        }
      }
    }
    setRunning(false)
    setRunResult({ created, skipped })
    showToast(`${created} görev oluşturuldu, ${skipped} atlandı`)
    load()
  }

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]))

  const monday = getThisMonday()
  const mondayStr = monday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        .tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;padding:20px}
        @media(max-width:768px){.tpl-grid{grid-template-columns:1fr;padding:12px}}
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title="Görev Şablonları"
          subtitle="Haftalık rutin görev şablonları"
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={runThisWeek} disabled={running}
                style={{ background: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Play size={13} strokeWidth={2} />
                {running ? 'Oluşturuluyor...' : 'Bu Haftayı Oluştur'}
              </button>
              <button className="btn" onClick={() => setModal(true)}>
                <Plus size={14} strokeWidth={2} /> Yeni Şablon
              </button>
            </div>
          }
        />
        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Bu hafta başlangıcı:</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ac)', fontFamily: 'JetBrains Mono,monospace' }}>{mondayStr} (Pazartesi)</span>
            </div>
            {runResult && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', background: 'var(--green2)', padding: '3px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} strokeWidth={2} />{runResult.created} oluşturuldu
                </span>
                {runResult.skipped > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx3)', background: 'var(--s3)', padding: '3px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} strokeWidth={2} />{runResult.skipped} zaten vardı
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</div>
          ) : templates.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
              <LayoutTemplate size={36} strokeWidth={1.2} style={{ color: 'var(--tx3)', opacity: .4 }} />
              <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Henüz şablon yok</p>
              <button className="btn" onClick={() => setModal(true)}><Plus size={13} />İlk Şablonu Oluştur</button>
            </div>
          ) : (
            <div className="tpl-grid">
              {templates.map(t => {
                const p = PRI[t.priority] || PRI.normal
                return (
                  <div key={t.id} style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 14, overflow: 'hidden', opacity: t.is_active ? 1 : .55, transition: 'opacity .2s' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span className="badge" style={{ background: p.bg, color: p.c }}>{p.label}</span>
                          <span className="badge badge-muted">📅 {OFFSET_LABELS[t.deadline_offset_days] || `+${t.deadline_offset_days} gün`}</span>
                          <span className="badge" style={{ background: t.is_active ? 'var(--green2)' : 'var(--s3)', color: t.is_active ? 'var(--green)' : 'var(--tx3)' }}>
                            {t.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {[
                        { l: 'Sorumlu',  v: (t.assigned_users && t.assigned_users.length > 0)
                            ? t.assigned_users.map((id: string) => profileMap[id] || id).filter(Boolean).join(', ')
                            : (t.assignee?.full_name || '—') },
                        { l: 'Müşteri',  v: t.client?.name || '—' },
                        { l: 'Proje',    v: t.project?.name || '—' },
                        { l: 'Deadline', v: `Pazartesi + ${t.deadline_offset_days} gün → ${OFFSET_LABELS[t.deadline_offset_days] || '?'}` },
                      ].map(row => (
                        <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{row.l}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx2)' }}>{row.v}</span>
                        </div>
                      ))}
                      {t.description && (
                        <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>{t.description}</p>
                      )}
                    </div>
                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleActive(t.id, t.is_active)} className="btn-ghost"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 12, color: t.is_active ? 'var(--amber)' : 'var(--green)' }}>
                        {t.is_active ? 'Pasife Al' : 'Aktife Al'}
                      </button>
                      <button onClick={() => openEdit(t)} className="btn-ghost" style={{ color: 'var(--blue)', padding: '6px 10px' }}>
                        <Pencil size={13} strokeWidth={2} />
                      </button>
                      <button onClick={() => setConfirmId(t.id)} className="btn-ghost" style={{ color: 'var(--red)', padding: '6px 10px' }}>
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="modal-title" style={{ margin: 0 }}>Yeni Şablon</p>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Görev Başlığı *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="inp" placeholder="Haftalık Instagram Paylaşımı" autoFocus />
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="inp" rows={2} placeholder="Görev detayı..." />
              </div>
              <div>
                <label className="label">Sorumlu (tek kişi)</label>
                <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="inp">
                  <option value="">— Seçin —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ortak Sorumlular (birden fazla kişi)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bdr)' }}>
                  {profiles.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.assigned_users.includes(p.id)}
                        onChange={e => setForm(f => ({
                          ...f,
                          assigned_users: e.target.checked
                            ? [...f.assigned_users, p.id]
                            : f.assigned_users.filter(id => id !== p.id)
                        }))} />
                      {p.full_name}
                    </label>
                  ))}
                </div>
                {form.assigned_users.length > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}>
                    ✓ {form.assigned_users.length} kişi seçildi — her birine ayrı görev oluşturulur
                  </p>
                )}
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Müşteri</label>
                  <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))} className="inp">
                    <option value="">— Seçin —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Proje</label>
                  <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="inp">
                    <option value="">— Seçin —</option>
                    {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Öncelik</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="inp">
                    <option value="critical">Kritik</option>
                    <option value="high">Yüksek</option>
                    <option value="normal">Normal</option>
                    <option value="low">Düşük</option>
                  </select>
                </div>
                <div>
                  <label className="label">Deadline Günü</label>
                  <select value={form.deadline_offset_days} onChange={e => setForm(f => ({ ...f, deadline_offset_days: Number(e.target.value) }))} className="inp">
                    <option value={0}>Pazartesi</option>
                    <option value={1}>Salı</option>
                    <option value={2}>Çarşamba</option>
                    <option value={3}>Perşembe</option>
                    <option value={4}>Cuma</option>
                    <option value={5}>Cumartesi</option>
                    <option value={6}>Pazar</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--s2)', borderRadius: 8 }}>
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="is_active" style={{ fontSize: 13, cursor: 'pointer' }}>Bu şablon aktif</label>
              </div>
              <button className="btn" onClick={create} disabled={creating || !form.title.trim() || !form.assigned_to}
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                {creating ? 'Oluşturuluyor...' : 'Şablonu Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setEditModal(false) }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="modal-title" style={{ margin: 0 }}>Şablonu Düzenle</p>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Görev Başlığı *</label>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="inp" autoFocus />
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="inp" rows={2} />
              </div>
              <div>
                <label className="label">Sorumlu (tek kişi)</label>
                <select value={editForm.assigned_to} onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))} className="inp">
                  <option value="">— Seçin —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ortak Sorumlular (birden fazla kişi)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bdr)' }}>
                  {profiles.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={(editForm.assigned_users || []).includes(p.id)}
                        onChange={e => setEditForm(f => ({
                          ...f,
                          assigned_users: e.target.checked
                            ? [...(f.assigned_users || []), p.id]
                            : (f.assigned_users || []).filter(id => id !== p.id)
                        }))} />
                      {p.full_name}
                    </label>
                  ))}
                </div>
                {(editForm.assigned_users || []).length > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}>
                    ✓ {(editForm.assigned_users || []).length} kişi seçildi — her birine ayrı görev oluşturulur
                  </p>
                )}
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Müşteri</label>
                  <select value={editForm.client_id} onChange={e => setEditForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))} className="inp">
                    <option value="">— Seçin —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Proje</label>
                  <select value={editForm.project_id} onChange={e => setEditForm(f => ({ ...f, project_id: e.target.value }))} className="inp">
                    <option value="">— Seçin —</option>
                    {editFilteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Öncelik</label>
                  <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))} className="inp">
                    <option value="critical">Kritik</option>
                    <option value="high">Yüksek</option>
                    <option value="normal">Normal</option>
                    <option value="low">Düşük</option>
                  </select>
                </div>
                <div>
                  <label className="label">Deadline Günü</label>
                  <select value={editForm.deadline_offset_days} onChange={e => setEditForm(f => ({ ...f, deadline_offset_days: Number(e.target.value) }))} className="inp">
                    <option value={0}>Pazartesi</option>
                    <option value={1}>Salı</option>
                    <option value={2}>Çarşamba</option>
                    <option value={3}>Perşembe</option>
                    <option value={4}>Cuma</option>
                    <option value={5}>Cumartesi</option>
                    <option value={6}>Pazar</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--s2)', borderRadius: 8 }}>
                <input type="checkbox" id="edit_is_active" checked={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="edit_is_active" style={{ fontSize: 13, cursor: 'pointer' }}>Bu şablon aktif</label>
              </div>
              <button className="btn" onClick={saveEdit} disabled={saving || !editForm.title.trim() || !editForm.assigned_to}
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmId}
        title="Şablonu Sil"
        message="Bu şablonu silmek istediğinize emin misiniz? Daha önce oluşturulan görevler etkilenmez."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  )
}
