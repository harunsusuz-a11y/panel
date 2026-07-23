'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, X, Link2, Calendar, PlaySquare, Camera, Briefcase, AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'

const PLATFORMS = [
  { id: 'youtube',   label: 'YouTube',   Icon: PlaySquare, color: '#ff0000' },
  { id: 'instagram', label: 'Instagram', Icon: Camera,     color: '#e1306c' },
  { id: 'linkedin',  label: 'LinkedIn',  Icon: Briefcase,  color: '#0a66c2' },
]

const ST: Record<string, any> = {
  pending:   { l: 'Bekliyor',   cls: 'badge-amber', color: 'var(--amber)', Icon: Clock },
  published: { l: 'Yayınlandı', cls: 'badge-green', color: 'var(--green)', Icon: CheckCircle2 },
  failed:    { l: 'Hata',       cls: 'badge-red',    color: 'var(--red)',   Icon: AlertTriangle },
}

const emptyForm = {
  title: '', drive_link: '', client_id: '', scheduled_at: '',
  platforms: [] as string[],
  youtube_description: '', youtube_tags: '', youtube_category: '', youtube_privacy: 'public',
  instagram_caption: '', instagram_type: 'post',
  linkedin_text: '',
}

export default function PaylasimPage() {
  const [items,   setItems]   = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [filter,  setFilter]  = useState('all')
  const [modal,   setModal]   = useState(false)
  const [sel,     setSel]     = useState<any>(null)
  const [toast,   setToast]   = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  async function load() {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const [a, c] = await Promise.all([
      sb.from('shares').select('*').order('created_at', { ascending: false }),
      sb.from('clients').select('id,name').order('name'),
    ])
    const cm: Record<string, any> = {}; (c.data || []).forEach((x: any) => { cm[x.id] = x })
    setItems((a.data || []).map((x: any) => ({ ...x, client: cm[x.client_id] })))
    setClients(c.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function togglePlatform(id: string) {
    setForm(p => ({ ...p, platforms: p.platforms.includes(id) ? p.platforms.filter(x => x !== id) : [...p.platforms, id] }))
  }

  async function add() {
    if (!form.title.trim() || !form.drive_link.trim() || form.platforms.length === 0) return
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { error } = await sb.from('shares').insert({
      title: form.title, drive_link: form.drive_link,
      client_id: form.client_id || null,
      scheduled_at: form.scheduled_at || null,
      platforms: form.platforms,
      youtube_description: form.platforms.includes('youtube') ? form.youtube_description || null : null,
      youtube_tags: form.platforms.includes('youtube') ? form.youtube_tags || null : null,
      youtube_category: form.platforms.includes('youtube') ? form.youtube_category || null : null,
      youtube_privacy: form.platforms.includes('youtube') ? form.youtube_privacy : null,
      instagram_caption: form.platforms.includes('instagram') ? form.instagram_caption || null : null,
      instagram_type: form.platforms.includes('instagram') ? form.instagram_type : null,
      linkedin_text: form.platforms.includes('linkedin') ? form.linkedin_text || null : null,
      status: 'pending',
      created_by: user?.id,
    })
    if (error) showToast('Hata: ' + error.message)
    else { showToast('Paylaşım planlandı!'); setModal(false); load(); setForm(emptyForm) }
  }

  async function remove(id: string) {
    const { error } = await createClient().from('shares').delete().eq('id', id)
    if (error) { showToast('Hata: ' + error.message); return }
    showToast('Paylaşım silindi'); setSel(null); load()
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  const counts: Record<string, number> = { pending: 0, published: 0, failed: 0 }
  items.forEach(i => { counts[i.status] = (counts[i.status] || 0) + 1 })

  return (
    <>
      <style>{`
        .pl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .pl-wrap{flex:1;display:flex;overflow:hidden}
        .pl-list{flex:1;overflow-y:auto;padding:14px 16px 80px}
        .pl-detail{width:320px;border-left:1px solid var(--bdr);overflow-y:auto;padding:16px;flex-shrink:0}
        .pl-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:12px;cursor:pointer;transition:border-color .12s}
        .pl-card:hover{border-color:var(--bdr2)}
        .pl-card.sel{border-color:var(--ac);background:var(--ac2)}
        .pl-plat{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        @media(max-width:900px){.pl-grid{grid-template-columns:repeat(2,1fr)}.pl-detail{display:none}}
        @media(max-width:600px){.pl-grid{grid-template-columns:1fr}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Paylaşım Planlayıcı" subtitle={`${items.length} paylaşım — n8n otomatik yayınlar`} action={
          <button className="btn" onClick={() => setModal(true)}><Plus size={13} strokeWidth={2} />Paylaşım Ekle</button>
        } />
        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--bdr)', overflowX: 'auto', flexShrink: 0, background: 'var(--s1)' }}>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'btn' : 'btn-ghost'} style={{ fontSize: 11.5, padding: '4px 11px', flexShrink: 0 }}>
            Tümü ({items.length})
          </button>
          {Object.entries(ST).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)} className={filter === k ? 'btn' : 'btn-ghost'} style={{ fontSize: 11.5, padding: '4px 11px', flexShrink: 0 }}>
              {v.l} ({counts[k] || 0})
            </button>
          ))}
          <div style={{ width: 1, background: 'var(--bdr)', flexShrink: 0, margin: '0 4px' }} />
        </div>

        <div className="pl-wrap">
          <div className="pl-list">
            {loading ? <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</p>
            : filtered.length === 0 ? <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Paylaşım bulunamadı.</div>
            : <div className="pl-grid">
              {filtered.map(item => {
                const st = ST[item.status] || ST.pending
                const StIcon = st.Icon
                return (
                  <div key={item.id} className={`pl-card${sel?.id === item.id ? ' sel' : ''}`} onClick={() => setSel(item)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className={`badge ${st.cls}`} style={{ fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <StIcon size={9} strokeWidth={2.5} />{st.l}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(item.platforms || []).map((p: string) => {
                          const plat = PLATFORMS.find(x => x.id === p)
                          if (!plat) return null
                          return <div key={p} className="pl-plat" style={{ background: `${plat.color}18` }} title={plat.label}>
                            <plat.Icon size={12} strokeWidth={2} style={{ color: plat.color }} />
                          </div>
                        })}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.title}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {item.client && (
                        <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{item.client.name}</div>
                      )}
                      {item.scheduled_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--tx3)' }}>
                          <Calendar size={10} strokeWidth={2} />{fmtDateTime(item.scheduled_at)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>}
          </div>

          {sel && (
            <div className="pl-detail">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel.title}</p>
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
              </div>

              <span className={`badge ${(ST[sel.status] || ST.pending).cls}`} style={{ fontSize: 10.5, marginBottom: 14, display: 'inline-block' }}>{(ST[sel.status] || ST.pending).l}</span>

              {sel.status === 'failed' && sel.error_message && (
                <div style={{ background: 'var(--red2, rgba(239,68,68,.1))', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: 'var(--red)' }}>
                  {sel.error_message}
                </div>
              )}

              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Drive Linki</p>
              <a href={sel.drive_link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'var(--s2)', borderRadius: 7, fontSize: 12, color: 'var(--ac)', textDecoration: 'none', marginBottom: 16, wordBreak: 'break-all' }}>
                <Link2 size={12} strokeWidth={2} style={{ flexShrink: 0 }} />{sel.drive_link}
              </a>

              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Platformlar</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {(sel.platforms || []).map((p: string) => {
                  const plat = PLATFORMS.find(x => x.id === p)
                  if (!plat) return null
                  const url = sel.platform_post_urls?.[p]
                  const caption = p === 'youtube' ? sel.youtube_description : p === 'instagram' ? sel.instagram_caption : sel.linkedin_text
                  return (
                    <div key={p} style={{ background: 'var(--s2)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: caption ? 6 : 0 }}>
                        <plat.Icon size={13} strokeWidth={2} style={{ color: plat.color }} />
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{plat.label}</span>
                        {url && <a href={url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: 'var(--ac)' }}><ExternalLink size={12} /></a>}
                      </div>
                      {caption && <p style={{ fontSize: 11.5, color: 'var(--tx2)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{caption}</p>}
                    </div>
                  )
                })}
              </div>

              <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Detaylar</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {[
                  { l: 'Müşteri', v: sel.client?.name || '—' },
                  { l: 'Zamanlanan', v: sel.scheduled_at ? fmtDateTime(sel.scheduled_at) : '—' },
                  { l: 'Yayınlanma', v: sel.published_at ? fmtDateTime(sel.published_at) : '—' },
                  { l: 'Oluşturuldu', v: fmtDateTime(sel.created_at) },
                ].map(f => (
                  <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--s2)', borderRadius: 7 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{f.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{f.v}</span>
                  </div>
                ))}
              </div>

              {sel.status === 'pending' && (
                <button onClick={() => remove(sel.id)} style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid rgba(239,68,68,.25)', background: 'transparent', color: 'var(--red)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  Paylaşımı İptal Et
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="modal-title" style={{ margin: 0 }}>Paylaşım Ekle</p>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label className="label">Başlık *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="inp" autoFocus placeholder="Video / gönderi başlığı..." />
              </div>
              <div><label className="label">Drive Linki *</label>
                <input value={form.drive_link} onChange={e => setForm(p => ({ ...p, drive_link: e.target.value }))} className="inp" placeholder="https://drive.google.com/..." />
              </div>
              <div className="modal-grid">
                <div><label className="label">Müşteri</label>
                  <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} className="inp">
                    <option value="">— Seçin —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Yayın Zamanı</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="inp" />
                </div>
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

              {form.platforms.includes('youtube') && (
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#ff0000' }}><PlaySquare size={13} />YouTube</div>
                  <div><label className="label">Açıklama</label>
                    <textarea value={form.youtube_description} onChange={e => setForm(p => ({ ...p, youtube_description: e.target.value }))} className="inp" rows={2} placeholder="Video açıklaması..." />
                  </div>
                  <div className="modal-grid">
                    <div><label className="label">Etiketler</label>
                      <input value={form.youtube_tags} onChange={e => setForm(p => ({ ...p, youtube_tags: e.target.value }))} className="inp" placeholder="etiket1, etiket2..." />
                    </div>
                    <div><label className="label">Kategori</label>
                      <input value={form.youtube_category} onChange={e => setForm(p => ({ ...p, youtube_category: e.target.value }))} className="inp" placeholder="Örn: Eğlence" />
                    </div>
                  </div>
                  <div><label className="label">Gizlilik</label>
                    <select value={form.youtube_privacy} onChange={e => setForm(p => ({ ...p, youtube_privacy: e.target.value }))} className="inp">
                      <option value="public">Herkese Açık</option>
                      <option value="unlisted">Liste Dışı</option>
                      <option value="private">Gizli</option>
                    </select>
                  </div>
                </div>
              )}

              {form.platforms.includes('instagram') && (
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#e1306c' }}><Camera size={13} />Instagram</div>
                  <div><label className="label">Caption</label>
                    <textarea value={form.instagram_caption} onChange={e => setForm(p => ({ ...p, instagram_caption: e.target.value }))} className="inp" rows={2} placeholder="Caption + hashtag'ler..." />
                  </div>
                  <div><label className="label">Tür</label>
                    <select value={form.instagram_type} onChange={e => setForm(p => ({ ...p, instagram_type: e.target.value }))} className="inp">
                      <option value="post">Post</option>
                      <option value="reel">Reel</option>
                      <option value="story">Story</option>
                    </select>
                  </div>
                </div>
              )}

              {form.platforms.includes('linkedin') && (
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#0a66c2' }}><Briefcase size={13} />LinkedIn</div>
                  <div><label className="label">Gönderi Metni</label>
                    <textarea value={form.linkedin_text} onChange={e => setForm(p => ({ ...p, linkedin_text: e.target.value }))} className="inp" rows={3} placeholder="Gönderi metni..." />
                  </div>
                </div>
              )}

              <button className="btn" onClick={add} disabled={!form.title.trim() || !form.drive_link.trim() || form.platforms.length === 0} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                Paylaşımı Planla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
