'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, X, Link2, Camera, Briefcase, Music2, AlertTriangle, CheckCircle2, Clock, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', Icon: Camera,    color: '#e1306c', field: 'instagram_caption', limit: 2200 },
  { id: 'linkedin',  label: 'LinkedIn',  Icon: Briefcase, color: '#0a66c2', field: 'linkedin_text',     limit: 3000 },
  { id: 'tiktok',    label: 'TikTok',    Icon: Music2,    color: '#000000', field: 'tiktok_caption',    limit: 2200 },
]

const ST: Record<string, any> = {
  pending:   { l: 'Bekliyor',   cls: 'badge-amber', color: 'var(--amber)', Icon: Clock },
  published: { l: 'Yayınlandı', cls: 'badge-green', color: 'var(--green)', Icon: CheckCircle2 },
  failed:    { l: 'Hata',       cls: 'badge-red',    color: 'var(--red)',   Icon: AlertTriangle },
}

const emptyForm = {
  title: '', drive_link: '',
  platforms: [] as string[],
  instagram_caption: '', instagram_type: 'post',
  linkedin_text: '',
  tiktok_caption: '',
}

export default function PaylasimPage() {
  const [items,    setItems]    = useState<any[]>([])
  const [platFilt, setPlatFilt] = useState('all')
  const [statFilt, setStatFilt] = useState('all')
  const [modal,    setModal]    = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [toast,    setToast]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [form, setForm] = useState(emptyForm)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  async function load() {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const { data } = await sb.from('shares').select('*').order('created_at', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function togglePlatform(id: string) {
    setForm(p => ({ ...p, platforms: p.platforms.includes(id) ? p.platforms.filter(x => x !== id) : [...p.platforms, id] }))
  }

  function openAdd() {
    setEditId(null); setForm(emptyForm); setModal(true)
  }

  function openEdit(item: any) {
    setEditId(item.id)
    setForm({
      title: item.title || '', drive_link: item.drive_link || '',
      platforms: item.platforms || [],
      instagram_caption: item.instagram_caption || '', instagram_type: item.instagram_type || 'post',
      linkedin_text: item.linkedin_text || '',
      tiktok_caption: item.tiktok_caption || '',
    })
    setModal(true)
  }

  function overLimit() {
    return PLATFORMS.some(p => form.platforms.includes(p.id) && (form as any)[p.field].length > p.limit)
  }

  async function save() {
    if (!form.title.trim() || !form.drive_link.trim() || form.platforms.length === 0 || overLimit()) return
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const payload = {
      title: form.title, drive_link: form.drive_link,
      platforms: form.platforms,
      instagram_caption: form.platforms.includes('instagram') ? form.instagram_caption || null : null,
      instagram_type: form.platforms.includes('instagram') ? form.instagram_type : null,
      linkedin_text: form.platforms.includes('linkedin') ? form.linkedin_text || null : null,
      tiktok_caption: form.platforms.includes('tiktok') ? form.tiktok_caption || null : null,
    }
    if (editId) {
      const { error } = await sb.from('shares').update(payload).eq('id', editId)
      if (error) { showToast('Hata: ' + error.message); return }
      showToast('Paylaşım güncellendi!')
    } else {
      const { error } = await sb.from('shares').insert({ ...payload, status: 'pending', created_by: user?.id })
      if (error) { showToast('Hata: ' + error.message); return }
      showToast('Paylaşım eklendi!')
    }
    setModal(false); setEditId(null); setForm(emptyForm); load()
  }

  async function remove(id: string) {
    const { error } = await createClient().from('shares').delete().eq('id', id)
    if (error) { showToast('Hata: ' + error.message); return }
    showToast('Paylaşım silindi'); load()
  }

  // Platform filtresi + sıra numarası (o platform için bekleyenler arasında FIFO sıra)
  let filtered = items
  if (platFilt !== 'all') filtered = filtered.filter(i => (i.platforms || []).includes(platFilt))
  if (statFilt !== 'all') filtered = filtered.filter(i => i.status === statFilt)

  let queuePos = 0
  const rows = filtered.map(i => {
    let pos: number | null = null
    if (platFilt !== 'all' && i.status === 'pending') { queuePos += 1; pos = queuePos }
    return { ...i, _pos: pos }
  })

  const counts: Record<string, number> = { pending: 0, published: 0, failed: 0 }
  items.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 })
  const platCounts: Record<string, number> = {}
  PLATFORMS.forEach(p => { platCounts[p.id] = items.filter(i => (i.platforms || []).includes(p.id)).length })

  return (
    <>
      <style>{`
        .pt-wrap{margin:14px 16px 80px;background:var(--s1);border:1px solid var(--bdr);border-radius:12px;overflow:hidden}
        .pt-table{width:100%;border-collapse:collapse}
        .pt-table th{text-align:left;font-size:10.5px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;padding:12px 16px;background:var(--s2);border-bottom:1px solid var(--bdr)}
        .pt-table td{padding:14px 16px;border-bottom:1px solid var(--bdr);font-size:13px;vertical-align:middle}
        .pt-table tbody tr{transition:background .12s}
        .pt-table tbody tr:last-child td{border-bottom:none}
        .pt-table tbody tr:hover{background:var(--s2)}
        .pt-avatar{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--ac),#5b4de0);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}
        .pt-plat-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 9px 4px 6px;border-radius:20px;font-size:11px;font-weight:600}
        .pt-plat-ic{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .pt-pos{width:24px;height:24px;border-radius:50%;background:var(--ac2);color:var(--ac);font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .pt-act{background:none;border:none;cursor:pointer;color:var(--tx3);padding:6px;border-radius:7px;transition:all .12s;display:inline-flex}
        .pt-act:hover{background:var(--s3);color:var(--tx)}
        .pt-empty{padding:60px 20px;text-align:center;color:var(--tx3)}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Paylaşım Planlayıcı" subtitle={`${items.length} paylaşım — n8n sırayla otomatik yayınlar`} action={
          <button className="btn" onClick={openAdd}><Plus size={13} strokeWidth={2} />Paylaşım Ekle</button>
        } />
        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0', overflowX: 'auto', flexShrink: 0 }}>
          <button onClick={() => setPlatFilt('all')} className={platFilt === 'all' ? 'btn' : 'btn-ghost'} style={{ fontSize: 11.5, padding: '4px 11px', flexShrink: 0 }}>
            Tümü ({items.length})
          </button>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatFilt(p.id)} className={platFilt === p.id ? 'btn' : 'btn-ghost'} style={{ fontSize: 11.5, padding: '4px 11px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <p.Icon size={12} strokeWidth={2} />{p.label} ({platCounts[p.id] || 0})
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--bdr)', flexShrink: 0, margin: '0 4px' }} />
          {Object.entries(ST).map(([k, v]) => (
            <button key={k} onClick={() => setStatFilt(statFilt === k ? 'all' : k)} className={statFilt === k ? 'btn' : 'btn-ghost'} style={{ fontSize: 11.5, padding: '4px 11px', flexShrink: 0 }}>
              {v.l} ({counts[k] || 0})
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className="pt-wrap">
          {loading ? <p style={{ color: 'var(--tx3)', fontSize: 13, padding: '24px' }}>Yükleniyor...</p>
          : rows.length === 0 ? (
            <div className="pt-empty">
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Henüz paylaşım yok</p>
              <p style={{ fontSize: 12 }}>Yukarıdan "Paylaşım Ekle" ile ilk planı oluştur.</p>
            </div>
          ) : <table className="pt-table">
            <thead>
              <tr>
                {platFilt !== 'all' && <th style={{ width: 56 }}>Sıra</th>}
                <th>Başlık</th>
                <th>Platformlar</th>
                <th>Durum</th>
                <th>Drive</th>
                <th>Oluşturuldu</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(item => {
                const st = ST[item.status] || ST.pending
                const StIcon = st.Icon
                return (
                  <tr key={item.id}>
                    {platFilt !== 'all' && (
                      <td>{item._pos ? <div className="pt-pos">{item._pos}</div> : <span style={{ color: 'var(--tx3)' }}>—</span>}</td>
                    )}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="pt-avatar">{(item.title || '?').trim().slice(0, 2).toUpperCase()}</div>
                        <span style={{ fontWeight: 600, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(item.platforms || []).map((p: string) => {
                          const plat = PLATFORMS.find(x => x.id === p)
                          if (!plat) return null
                          return (
                            <span key={p} className="pt-plat-pill" style={{ background: `${plat.color}15`, color: plat.color }}>
                              <span className="pt-plat-ic" style={{ background: `${plat.color}22` }}><plat.Icon size={11} strokeWidth={2.2} /></span>
                              {plat.label}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${st.cls}`} style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px' }}>
                        <StIcon size={10} strokeWidth={2.5} />{st.l}
                      </span>
                      {item.status === 'failed' && item.error_message && (
                        <div style={{ fontSize: 10.5, color: 'var(--red)', marginTop: 4, maxWidth: 220 }}>{item.error_message}</div>
                      )}
                    </td>
                    <td>
                      <a href={item.drive_link} target="_blank" rel="noreferrer" style={{ color: 'var(--ac)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <Link2 size={12} strokeWidth={2} />Aç
                      </a>
                    </td>
                    <td style={{ color: 'var(--tx3)', fontSize: 11.5, whiteSpace: 'nowrap' }}>{fmtDateTime(item.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        {item.platform_post_urls && Object.keys(item.platform_post_urls).length > 0 && (
                          <a href={Object.values(item.platform_post_urls)[0] as string} target="_blank" rel="noreferrer" className="pt-act"><ExternalLink size={14} /></a>
                        )}
                        <button className="pt-act" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                        <button className="pt-act" onClick={() => remove(item.id)} style={{ color: 'var(--red)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>}
          </div>
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="modal-title" style={{ margin: 0 }}>{editId ? 'Paylaşımı Düzenle' : 'Paylaşım Ekle'}</p>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label className="label">Başlık *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="inp" autoFocus placeholder="Video / gönderi başlığı..." />
              </div>
              <div><label className="label">Drive Linki *</label>
                <input value={form.drive_link} onChange={e => setForm(p => ({ ...p, drive_link: e.target.value }))} className="inp" placeholder="https://drive.google.com/..." />
              </div>

              <div><label className="label">Platformlar *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PLATFORMS.map(p => {
                    const active = form.platforms.includes(p.id)
                    return (
                      <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, border: `1px solid ${active ? p.color : 'var(--bdr)'}`, background: active ? `${p.color}15` : 'var(--s2)', cursor: 'pointer', transition: 'all .12s' }}>
                        <p.Icon size={14} strokeWidth={2} style={{ color: active ? p.color : 'var(--tx3)' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: active ? p.color : 'var(--tx2)' }}>{p.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {PLATFORMS.filter(p => form.platforms.includes(p.id)).map(p => {
                const val = (form as any)[p.field] as string
                const over = val.length > p.limit
                return (
                  <div key={p.id} style={{ background: 'var(--s2)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: p.color }}><p.Icon size={13} />{p.label}</div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label className="label" style={{ margin: 0 }}>{p.id === 'linkedin' ? 'Gönderi Metni' : 'Caption'}</label>
                        <span style={{ fontSize: 10.5, color: over ? 'var(--red)' : 'var(--tx3)', fontWeight: over ? 700 : 400 }}>{val.length}/{p.limit}</span>
                      </div>
                      <textarea value={val} maxLength={p.limit + 50}
                        onChange={e => setForm(prev => ({ ...prev, [p.field]: e.target.value }))}
                        className="inp" rows={p.id === 'linkedin' ? 3 : 2}
                        style={over ? { borderColor: 'var(--red)' } : undefined}
                        placeholder={p.id === 'linkedin' ? 'Gönderi metni...' : "Caption + hashtag'ler..."} />
                      {over && <p style={{ fontSize: 10.5, color: 'var(--red)', marginTop: 3 }}>⚠ {p.label} sınırı {p.limit} karakter — {val.length - p.limit} karakter fazla</p>}
                    </div>
                    {p.id === 'instagram' && (
                      <div><label className="label">Tür</label>
                        <select value={form.instagram_type} onChange={e => setForm(prev => ({ ...prev, instagram_type: e.target.value }))} className="inp">
                          <option value="post">Post</option>
                          <option value="reel">Reel</option>
                          <option value="story">Story</option>
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}

              <button className="btn" onClick={save} disabled={!form.title.trim() || !form.drive_link.trim() || form.platforms.length === 0 || overLimit()} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                {editId ? 'Değişiklikleri Kaydet' : 'Paylaşımı Planla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
