'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, X, ChevronRight, Send, Instagram, Youtube, Linkedin, MoreHorizontal, Calendar, User, Building2, Image, FileText, Film, Megaphone, BookOpen, GripVertical } from 'lucide-react'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'tiktok',    label: 'TikTok',    emoji: '🎵' },
  { value: 'linkedin',  label: 'LinkedIn',  emoji: '💼' },
  { value: 'youtube',   label: 'YouTube',   emoji: '▶️' },
  { value: 'all',       label: 'Genel',     emoji: '🌐' },
]

const TYPES = [
  { value: 'post',    label: 'Post',    icon: '🖼' },
  { value: 'story',   label: 'Story',   icon: '⭕' },
  { value: 'reels',   label: 'Reels',   icon: '🎬' },
  { value: 'blog',    label: 'Blog',    icon: '📝' },
  { value: 'ad',      label: 'Reklam',  icon: '📣' },
  { value: 'other',   label: 'Diğer',   icon: '📌' },
]

const COLUMNS = [
  { id: 'draft',     label: 'Taslak',         color: '#6b7280', bg: 'rgba(107,114,128,.08)' },
  { id: 'pending',   label: 'İç Onay',         color: '#f59e0b', bg: 'rgba(245,158,11,.08)'  },
  { id: 'approved',  label: 'Müşteri Onayı',   color: '#3b82f6', bg: 'rgba(59,130,246,.08)'  },
  { id: 'revision',  label: 'Revizyon',        color: '#ef4444', bg: 'rgba(239,68,68,.08)'   },
  { id: 'published', label: 'Yayında',         color: '#22c55e', bg: 'rgba(34,197,94,.08)'   },
]

const emptyForm = () => ({
  title: '', caption: '', client_id: '', platform: 'instagram',
  type: 'post', assigned_to: '', publish_date: '', notes: '', media_url: ''
})

function fmtDate(s: string | null) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function platformEmoji(p: string) {
  return PLATFORMS.find(x => x.value === p)?.emoji || '🌐'
}

function typeLabel(t: string) {
  return TYPES.find(x => x.value === t)?.label || t
}

export default function IcerikPage() {
  const [items,    setItems]    = useState<any[]>([])
  const [clients,  setClients]  = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [myId,     setMyId]     = useState('')
  const [myRole,   setMyRole]   = useState('')
  const [modal,    setModal]    = useState(false)
  const [sel,      setSel]      = useState<any>(null)
  const [toast,    setToast]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState<any>(emptyForm())
  const [saving,   setSaving]   = useState(false)
  const [filterClient,   setFilterClient]   = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  const load = useCallback(async () => {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
    const role = prof?.role || 'member'
    setMyId(user.id); setMyRole(role)
    const [{ data: cl }, { data: pr }] = await Promise.all([
      sb.from('clients').select('id,name,brand_name').order('name'),
      sb.from('profiles').select('id,full_name').not('full_name','is',null),
    ])
    let q = sb.from('contents').select('*').order('created_at', { ascending: false })
    if (role === 'member') q = q.eq('assigned_to', user.id)
    const { data: ct } = await q
    const cm: Record<string,any> = {}; (cl||[]).forEach((x:any) => cm[x.id] = x)
    const pm: Record<string,any> = {}; (pr||[]).forEach((x:any) => pm[x.id] = x)
    setItems((ct||[]).map((x:any) => ({ ...x, client: cm[x.client_id], assignee: pm[x.assigned_to] })))
    setClients(cl||[])
    setProfiles(pr||[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!form.title.trim()) { showToast('Başlık zorunlu'); return }
    if (!form.client_id) { showToast('Marka zorunlu'); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { error } = await sb.from('contents').insert({
      title: form.title, caption: form.caption, client_id: form.client_id,
      platform: form.platform, type: form.type, status: 'draft',
      assigned_to: form.assigned_to || null, publish_date: form.publish_date || null,
      notes: form.notes, media_url: form.media_url || null, created_by: user?.id
    })
    if (error) showToast('Hata: ' + error.message)
    else { showToast('İçerik oluşturuldu ✓'); setModal(false); setForm(emptyForm()); load() }
    setSaving(false)
  }

  async function changeStatus(id: string, status: string) {
    const item = items.find(x => x.id === id) || sel
    if (myRole === 'member' && item?.assigned_to !== myId) { showToast('Yetki yok'); return }
    const sb = createClient()
    if (status === 'pending') {
      const { data: existing } = await sb.from('approvals').select('id,status')
        .eq('content_id', id).order('created_at', { ascending: false }).limit(1)
      if (!existing?.length || existing[0].status !== 'pending') {
        const { data: { user } } = await sb.auth.getUser()
        await sb.from('approvals').insert({
          title: item?.title || 'İçerik', type: 'content', status: 'pending',
          client_id: item?.client_id || null, content_id: id,
          requested_by: user?.id, notes: item?.notes || null,
        })
      }
    }
    const { error } = await sb.from('contents').update({ status }).eq('id', id)
    if (error) { showToast('Hata: ' + error.message); return }
    setItems(prev => prev.map(x => x.id === id ? { ...x, status } : x))
    if (sel?.id === id) setSel((s: any) => s ? { ...s, status } : null)
    showToast(COLUMNS.find(c => c.id === status)?.label + ' ✓')
  }

  async function deleteContent(id: string) {
    if (!confirm('Bu içeriği silmek istediğinize emin misiniz?')) return
    const sb = createClient()
    await sb.from('contents').delete().eq('id', id)
    setItems(prev => prev.filter(x => x.id !== id))
    if (sel?.id === id) setSel(null)
    showToast('Silindi')
  }

  // Drag & drop
  function onDragStart(id: string) { setDragging(id) }
  function onDragOver(e: React.DragEvent, col: string) { e.preventDefault(); setDragOver(col) }
  function onDrop(col: string) {
    if (dragging && dragging !== col) changeStatus(dragging, col)
    setDragging(null); setDragOver(null)
  }

  // Filtrele
  const filtered = items.filter(i => {
    if (filterClient !== 'all' && i.client_id !== filterClient) return false
    if (filterPlatform !== 'all' && i.platform !== filterPlatform) return false
    return true
  })

  const colItems = (colId: string) => filtered.filter(i => i.status === colId)

  return (
    <>
      <style>{`
        .kb-wrap{display:flex;gap:12px;overflow-x:auto;padding:16px;height:100%;align-items:flex-start}
        .kb-wrap::-webkit-scrollbar{height:6px}.kb-wrap::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}
        .kb-col{flex-shrink:0;width:260px;display:flex;flex-direction:column;gap:8px;min-height:200px;border-radius:12px;padding:10px;transition:background .15s}
        .kb-col.drag-over{background:rgba(124,106,247,.08);outline:2px dashed var(--ac)}
        .kb-col-header{display:flex;align-items:center;justify-content:space-between;padding:4px 2px 8px}
        .kb-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:12px;cursor:pointer;transition:all .12s;user-select:none}
        .kb-card:hover{border-color:var(--bdr2);transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.12)}
        .kb-card.sel{border-color:var(--ac);background:var(--ac2)}
        .kb-card.dragging{opacity:.4}
        .ic-detail{width:320px;flex-shrink:0;border-left:1px solid var(--bdr);overflow-y:auto;background:var(--s1)}
        .ic-detail-inner{padding:20px;display:flex;flex-direction:column;gap:14px}
        .plat-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid var(--bdr);color:var(--tx3)}
        .filter-bar{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid var(--bdr);overflow-x:auto;flex-shrink:0}
        .filter-bar::-webkit-scrollbar{height:0}
        .fb-btn{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--tx3);white-space:nowrap}
        .fb-btn.active{background:var(--ac);color:#fff;border-color:var(--ac)}
        .inp{background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:9px 12px;color:var(--tx);font-size:13px;width:100%;outline:none}
        .inp:focus{border-color:var(--ac)}
        .lbl{font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:14px}
        .status-btn{flex:1;padding:8px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--tx3);transition:all .12s}
        .status-btn:hover{border-color:var(--bdr2);color:var(--tx)}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:768px){.ic-detail{display:none}.kb-col{width:220px}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="İçerik Merkezi" subtitle={`${items.length} içerik`} action={
          <button className="btn" style={{ background: 'var(--ac)', color: '#fff', border: 'none' }}
            onClick={() => { setForm(emptyForm()); setModal(true) }}>
            <Plus size={13} strokeWidth={2} /> Yeni İçerik
          </button>
        } />

        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        {/* Filtre */}
        <div className="filter-bar">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', alignSelf: 'center', marginRight: 4 }}>MARKA</span>
          <button className={`fb-btn${filterClient === 'all' ? ' active' : ''}`} onClick={() => setFilterClient('all')}>Tümü</button>
          {clients.map(c => (
            <button key={c.id} className={`fb-btn${filterClient === c.id ? ' active' : ''}`} onClick={() => setFilterClient(c.id)}>
              {c.brand_name || c.name}
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--bdr)', margin: '0 4px' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', alignSelf: 'center', marginRight: 4 }}>PLATFORM</span>
          <button className={`fb-btn${filterPlatform === 'all' ? ' active' : ''}`} onClick={() => setFilterPlatform('all')}>Tümü</button>
          {PLATFORMS.filter(p => p.value !== 'all').map(p => (
            <button key={p.value} className={`fb-btn${filterPlatform === p.value ? ' active' : ''}`} onClick={() => setFilterPlatform(p.value)}>
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {/* Kanban + Detay */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Kanban */}
          <div className="kb-wrap">
            {loading ? (
              <div style={{ color: 'var(--tx3)', padding: 40 }}>Yükleniyor...</div>
            ) : (
              COLUMNS.map(col => (
                <div key={col.id}
                  className={`kb-col${dragOver === col.id ? ' drag-over' : ''}`}
                  onDragOver={e => onDragOver(e, col.id)}
                  onDrop={() => onDrop(col.id)}
                  onDragLeave={() => setDragOver(null)}
                >
                  <div className="kb-col-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)' }}>{col.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: col.bg, color: col.color, padding: '2px 7px', borderRadius: 20 }}>
                      {colItems(col.id).length}
                    </span>
                  </div>

                  {colItems(col.id).length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, padding: '20px 0', opacity: .5 }}>Boş</div>
                  )}

                  {colItems(col.id).map(item => (
                    <div
                      key={item.id}
                      className={`kb-card${sel?.id === item.id ? ' sel' : ''}${dragging === item.id ? ' dragging' : ''}`}
                      draggable
                      onDragStart={() => onDragStart(item.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null) }}
                      onClick={() => setSel(sel?.id === item.id ? null : item)}
                    >
                      {/* Platform + Tür */}
                      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                        <span className="plat-chip">{platformEmoji(item.platform)} {PLATFORMS.find(p => p.value === item.platform)?.label}</span>
                        <span className="plat-chip">{TYPES.find(t => t.value === item.type)?.icon} {typeLabel(item.type)}</span>
                      </div>

                      {/* Başlık */}
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 6, lineHeight: 1.4 }}>{item.title}</p>

                      {/* Caption önizleme */}
                      {item.caption && (
                        <p style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.caption}
                        </p>
                      )}

                      {/* Alt bilgi */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        {item.client && (
                          <span style={{ fontSize: 11, color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            🏷 {item.client.brand_name || item.client.name}
                          </span>
                        )}
                        {item.publish_date && (
                          <span style={{ fontSize: 11, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>
                            📅 {fmtDate(item.publish_date)}
                          </span>
                        )}
                      </div>

                      {/* Sorumlu */}
                      {item.assignee && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                            {item.assignee.full_name?.[0] || '?'}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{item.assignee.full_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Detay paneli */}
          {sel && (
            <div className="ic-detail">
              <div className="ic-detail-inner">
                {/* Başlık */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 4 }}>
                      {platformEmoji(sel.platform)} {PLATFORMS.find(p => p.value === sel.platform)?.label} · {typeLabel(sel.type)}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{sel.title}</div>
                  </div>
                  <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', padding: 4 }}><X size={16} /></button>
                </div>

                {/* Marka */}
                {sel.client && (
                  <div>
                    <span className="lbl">Marka</span>
                    <div style={{ fontSize: 13, color: 'var(--tx)' }}>{sel.client.brand_name || sel.client.name}</div>
                  </div>
                )}

                {/* Yayın tarihi */}
                {sel.publish_date && (
                  <div>
                    <span className="lbl">Yayın Tarihi</span>
                    <div style={{ fontSize: 13 }}>{fmtDate(sel.publish_date)}</div>
                  </div>
                )}

                {/* Sorumlu */}
                {sel.assignee && (
                  <div>
                    <span className="lbl">Sorumlu</span>
                    <div style={{ fontSize: 13 }}>{sel.assignee.full_name}</div>
                  </div>
                )}

                {/* Caption */}
                {sel.caption && (
                  <div>
                    <span className="lbl">Caption</span>
                    <div style={{ fontSize: 12, color: 'var(--tx)', lineHeight: 1.6, background: 'var(--s2)', borderRadius: 8, padding: '10px 12px', whiteSpace: 'pre-wrap' }}>{sel.caption}</div>
                  </div>
                )}

                {/* Medya */}
                {sel.media_url && (
                  <div>
                    <span className="lbl">Medya</span>
                    <a href={sel.media_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--ac)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Image size={13} /> Dosyayı Aç
                    </a>
                  </div>
                )}

                {/* Notlar */}
                {sel.notes && (
                  <div>
                    <span className="lbl">Notlar</span>
                    <div style={{ fontSize: 12, color: 'var(--tx3)', lineHeight: 1.6 }}>{sel.notes}</div>
                  </div>
                )}

                {/* Durum değiştirme */}
                <div>
                  <span className="lbl">Durumu Değiştir</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {COLUMNS.filter(c => c.id !== sel.status).map(c => (
                      <button key={c.id} className="status-btn"
                        style={{ textAlign: 'left', borderLeft: `3px solid ${c.color}`, paddingLeft: 12 }}
                        onClick={() => changeStatus(sel.id, c.id)}>
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Onaya gönder */}
                {sel.status === 'draft' && (myRole === 'admin' || myRole === 'manager' || sel.assigned_to === myId) && (
                  <button className="btn" style={{ background: 'var(--ac)', color: '#fff', border: 'none', width: '100%', justifyContent: 'center', padding: '10px' }}
                    onClick={() => changeStatus(sel.id, 'pending')}>
                    <Send size={13} /> İç Onaya Gönder
                  </button>
                )}

                {/* Sil */}
                {(myRole === 'admin' || myRole === 'manager') && (
                  <button style={{ background: 'none', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}
                    onClick={() => deleteContent(sel.id)}>
                    Sil
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yeni İçerik Modalı */}
      {modal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Yeni İçerik</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)' }}><X size={18} /></button>
            </div>

            <div>
              <span className="lbl">Başlık *</span>
              <input className="inp" value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="İçerik başlığı..." />
            </div>

            <div className="grid2">
              <div>
                <span className="lbl">Marka *</span>
                <select className="inp" value={form.client_id} onChange={e => setForm((p: any) => ({ ...p, client_id: e.target.value }))}>
                  <option value="">— Seçin —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>)}
                </select>
              </div>
              <div>
                <span className="lbl">Sorumlu</span>
                <select className="inp" value={form.assigned_to} onChange={e => setForm((p: any) => ({ ...p, assigned_to: e.target.value }))}>
                  <option value="">— Seçin —</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid2">
              <div>
                <span className="lbl">Platform</span>
                <select className="inp" value={form.platform} onChange={e => setForm((p: any) => ({ ...p, platform: e.target.value }))}>
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.emoji} {p.label}</option>)}
                </select>
              </div>
              <div>
                <span className="lbl">Tür</span>
                <select className="inp" value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <span className="lbl">Yayın Tarihi</span>
              <input type="date" className="inp" value={form.publish_date} onChange={e => setForm((p: any) => ({ ...p, publish_date: e.target.value }))} />
            </div>

            <div>
              <span className="lbl">Caption / Metin</span>
              <textarea className="inp" rows={4} value={form.caption}
                onChange={e => setForm((p: any) => ({ ...p, caption: e.target.value }))}
                placeholder="Paylaşım metni, hashtag'ler..." style={{ resize: 'vertical' }} />
            </div>

            <div>
              <span className="lbl">Medya URL (Drive, Dropbox vb.)</span>
              <input className="inp" value={form.media_url} onChange={e => setForm((p: any) => ({ ...p, media_url: e.target.value }))} placeholder="https://..." />
            </div>

            <div>
              <span className="lbl">Notlar</span>
              <textarea className="inp" rows={2} value={form.notes}
                onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))}
                placeholder="Ekip içi notlar..." style={{ resize: 'vertical' }} />
            </div>

            <button className="btn" onClick={add} disabled={saving}
              style={{ background: 'var(--ac)', color: '#fff', border: 'none', width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}>
              {saving ? 'Oluşturuluyor...' : 'İçerik Oluştur'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
