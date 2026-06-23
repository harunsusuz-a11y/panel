'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import ConfirmModal from '@/components/ConfirmModal'
import { Plus, X, Trash2, Pencil, Eye, EyeOff, ExternalLink, Wrench, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

const CATEGORIES = ['AI', 'Tasarım', 'Depolama', 'İletişim', 'Muhasebe', 'Proje Yönetimi', 'Pazarlama', 'Diğer']
const CURRENCIES = ['USD', 'EUR', 'TRY']

const STATUS_MAP: Record<string, any> = {
  active:   { label: 'Aktif',        color: 'var(--green)',  bg: 'var(--green2)',  Icon: CheckCircle2 },
  inactive: { label: 'Pasif',        color: 'var(--tx3)',    bg: 'var(--s3)',      Icon: Clock },
  review:   { label: 'İncelenmeli',  color: 'var(--amber)',  bg: 'var(--amber2)',  Icon: AlertCircle },
}

const EMPTY = {
  name: '', category: 'AI', website: '', email: '', username: '',
  password: '', monthly_cost: '', currency: 'USD', status: 'active',
  notes: '', last_used_at: '', users: [] as string[],
}

export default function AraclarPage() {
  const [tools,     setTools]     = useState<any[]>([])
  const [profiles,  setProfiles]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [form,      setForm]      = useState({ ...EMPTY })
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showPw,    setShowPw]    = useState<Record<string, boolean>>({})
  const [myId,      setMyId]      = useState('')
  const [filter,    setFilter]    = useState('all')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  async function load() {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) setMyId(user.id)
    const [t, p] = await Promise.all([
      sb.from('tools').select('*').order('name'),
      sb.from('profiles').select('id,full_name').not('full_name','is',null).order('full_name'),
    ])
    setTools(t.data || [])
    setProfiles(p.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditId(null)
    setForm({ ...EMPTY })
    setModal(true)
  }

  function openEdit(t: any) {
    setEditId(t.id)
    setForm({
      name:         t.name        || '',
      category:     t.category    || 'AI',
      website:      t.website     || '',
      email:        t.email       || '',
      username:     t.username    || '',
      password:     t.password    || '',
      monthly_cost: t.monthly_cost?.toString() || '',
      currency:     t.currency    || 'USD',
      status:       t.status      || 'active',
      notes:        t.notes       || '',
      last_used_at: t.last_used_at || '',
      users:        t.users       || [],
    })
    setModal(true)
  }

  async function save() {
    if (!form.name.trim()) { showToast('Hata: İsim zorunlu'); return }
    setSaving(true)
    const sb = createClient()
    const payload = {
      name:         form.name.trim(),
      category:     form.category,
      website:      form.website  || null,
      email:        form.email    || null,
      username:     form.username || null,
      password:     form.password || null,
      monthly_cost: form.monthly_cost ? parseFloat(form.monthly_cost) : null,
      currency:     form.currency,
      status:       form.status,
      notes:        form.notes    || null,
      last_used_at: form.last_used_at || null,
      users:        form.users.length > 0 ? form.users : null,
    }
    if (editId) {
      const { error } = await sb.from('tools').update(payload).eq('id', editId)
      if (error) { showToast('Hata: ' + error.message); setSaving(false); return }
      showToast('Güncellendi!')
    } else {
      const { error } = await sb.from('tools').insert({ ...payload, created_by: myId })
      if (error) { showToast('Hata: ' + error.message); setSaving(false); return }
      showToast('Araç eklendi!')
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function deleteTool() {
    if (!confirmId) return
    await createClient().from('tools').delete().eq('id', confirmId)
    setConfirmId(null)
    showToast('Silindi')
    load()
  }

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]))

  const filtered = filter === 'all' ? tools : tools.filter(t => t.status === filter)

  // Toplam maliyet (USD bazlı göster)
  const totalCost = tools
    .filter(t => t.status === 'active' && t.monthly_cost)
    .reduce((acc, t) => acc + (parseFloat(t.monthly_cost) || 0), 0)

  return (
    <>
      <style>{`
        .tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;padding:20px}
        @media(max-width:768px){.tool-grid{grid-template-columns:1fr;padding:12px}}
        .pw-field{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.05em}
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
        <TopBar
          title="Araçlar & Hesaplar"
          subtitle="Abonelik ve hesap yönetimi"
          action={
            <button className="btn" onClick={openAdd}>
              <Plus size={14} strokeWidth={2} /> Araç Ekle
            </button>
          }
        />

        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        {/* Özet bar */}
        <div style={{ padding:'12px 20px 0', flexShrink:0 }}>
          <div style={{ background:'var(--s2)', border:'1px solid var(--bdr)', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            {[
              { label:'Toplam Araç',   val: tools.length,                               color:'var(--tx)'     },
              { label:'Aktif',         val: tools.filter(t=>t.status==='active').length,   color:'var(--green)'  },
              { label:'İncelenmeli',   val: tools.filter(t=>t.status==='review').length,   color:'var(--amber)'  },
              { label:'Aylık Maliyet', val: `~$${totalCost.toFixed(0)}`,                color:'var(--blue)'   },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:11.5, color:'var(--tx3)' }}>{s.label}:</span>
                <span style={{ fontSize:13, fontWeight:700, color:s.color }}>{s.val}</span>
              </div>
            ))}
            {/* Filtre */}
            <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
              {['all','active','review','inactive'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontSize:11.5, padding:'3px 10px', borderRadius:6, border:'1px solid var(--bdr)',
                    background: filter===f ? 'var(--ac)' : 'var(--s1)',
                    color: filter===f ? '#fff' : 'var(--tx3)', cursor:'pointer' }}>
                  {f==='all'?'Tümü':STATUS_MAP[f]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--tx3)', fontSize:13 }}>Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:12 }}>
              <Wrench size={36} strokeWidth={1.2} style={{ color:'var(--tx3)', opacity:.4 }} />
              <p style={{ color:'var(--tx3)', fontSize:13 }}>Araç bulunamadı</p>
              <button className="btn" onClick={openAdd}><Plus size={13}/>İlk Aracı Ekle</button>
            </div>
          ) : (
            <div className="tool-grid">
              {filtered.map(t => {
                const st = STATUS_MAP[t.status] || STATUS_MAP.active
                return (
                  <div key={t.id} style={{ background:'var(--s1)', border:'1px solid var(--bdr)', borderRadius:14, overflow:'hidden' }}>
                    {/* Başlık */}
                    <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--bdr)', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:'var(--s2)', border:'1px solid var(--bdr)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <p style={{ fontSize:14, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</p>
                          {t.website && (
                            <a href={t.website} target="_blank" rel="noreferrer" style={{ color:'var(--tx3)', display:'flex' }}>
                              <ExternalLink size={11} strokeWidth={2} />
                            </a>
                          )}
                        </div>
                        <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                          <span className="badge badge-muted">{t.category}</span>
                          <span className="badge" style={{ background:st.bg, color:st.color, display:'flex', alignItems:'center', gap:3 }}>
                            <st.Icon size={10} strokeWidth={2} />{st.label}
                          </span>
                          {t.monthly_cost && (
                            <span className="badge" style={{ background:'var(--blue2)', color:'var(--blue)' }}>
                              {t.monthly_cost} {t.currency}/ay
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detaylar */}
                    <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                      {t.email && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:11.5, color:'var(--tx3)' }}>E-posta</span>
                          <span style={{ fontSize:12, fontWeight:500, color:'var(--tx2)', fontFamily:'monospace' }}>{t.email}</span>
                        </div>
                      )}
                      {t.username && t.username !== t.email && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:11.5, color:'var(--tx3)' }}>Kullanıcı Adı</span>
                          <span style={{ fontSize:12, fontWeight:500, color:'var(--tx2)', fontFamily:'monospace' }}>{t.username}</span>
                        </div>
                      )}
                      {t.password && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:11.5, color:'var(--tx3)' }}>Şifre</span>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span className="pw-field" style={{ fontSize:12, color:'var(--tx2)' }}>
                              {showPw[t.id] ? t.password : '••••••••'}
                            </span>
                            <button onClick={() => setShowPw(p => ({ ...p, [t.id]: !p[t.id] }))}
                              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', display:'flex', padding:0 }}>
                              {showPw[t.id] ? <EyeOff size={12} strokeWidth={2}/> : <Eye size={12} strokeWidth={2}/>}
                            </button>
                          </div>
                        </div>
                      )}
                      {t.users && t.users.length > 0 && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                          <span style={{ fontSize:11.5, color:'var(--tx3)', flexShrink:0 }}>Kullananlar</span>
                          <span style={{ fontSize:12, fontWeight:500, color:'var(--tx2)', textAlign:'right' }}>
                            {t.users.map((id: string) => profileMap[id]).filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {t.last_used_at && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:11.5, color:'var(--tx3)' }}>Son Kullanım</span>
                          <span style={{ fontSize:12, color:'var(--tx2)' }}>{new Date(t.last_used_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      )}
                      {t.notes && (
                        <p style={{ fontSize:11.5, color:'var(--tx3)', lineHeight:1.5, marginTop:4, fontStyle:'italic', borderTop:'1px solid var(--bdr)', paddingTop:8 }}>{t.notes}</p>
                      )}
                    </div>

                    {/* Aksiyonlar */}
                    <div style={{ padding:'10px 16px', borderTop:'1px solid var(--bdr)', display:'flex', gap:8 }}>
                      <button onClick={() => openEdit(t)} className="btn-ghost" style={{ flex:1, justifyContent:'center', fontSize:12, color:'var(--blue)', gap:5 }}>
                        <Pencil size={12} strokeWidth={2}/> Düzenle
                      </button>
                      {t.status !== 'review' && (
                        <button onClick={async () => {
                          await createClient().from('tools').update({ status:'review' }).eq('id', t.id)
                          showToast('İncelenmeli olarak işaretlendi')
                          load()
                        }} className="btn-ghost" style={{ flex:1, justifyContent:'center', fontSize:12, color:'var(--amber)', gap:5 }}>
                          <AlertCircle size={12} strokeWidth={2}/> İncele
                        </button>
                      )}
                      <button onClick={() => setConfirmId(t.id)} className="btn-ghost" style={{ color:'var(--red)', padding:'6px 10px' }}>
                        <Trash2 size={13} strokeWidth={2}/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal" style={{ maxWidth:500, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <p className="modal-title" style={{ margin:0 }}>{editId ? 'Aracı Düzenle' : 'Yeni Araç'}</p>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'var(--tx3)', cursor:'pointer' }}><X size={15}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="modal-grid">
                <div>
                  <label className="label">Araç Adı *</label>
                  <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="inp" placeholder="ChatGPT" autoFocus />
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} className="inp">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Website</label>
                <input value={form.website} onChange={e => setForm(f=>({...f,website:e.target.value}))} className="inp" placeholder="https://chatgpt.com" />
              </div>
              <div>
                <label className="label">Kayıtlı E-posta</label>
                <input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} className="inp" placeholder="info@daydreamproduction.com.tr" />
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Kullanıcı Adı</label>
                  <input value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} className="inp" placeholder="Boşsa e-posta ile aynı" />
                </div>
                <div>
                  <label className="label">Şifre</label>
                  <input value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} className="inp" placeholder="••••••••" />
                </div>
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Aylık Maliyet</label>
                  <input type="number" value={form.monthly_cost} onChange={e => setForm(f=>({...f,monthly_cost:e.target.value}))} className="inp" placeholder="20" />
                </div>
                <div>
                  <label className="label">Para Birimi</label>
                  <select value={form.currency} onChange={e => setForm(f=>({...f,currency:e.target.value}))} className="inp">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Durum</label>
                  <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))} className="inp">
                    <option value="active">Aktif</option>
                    <option value="review">İncelenmeli</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
                <div>
                  <label className="label">Son Kullanım</label>
                  <input type="date" value={form.last_used_at} onChange={e => setForm(f=>({...f,last_used_at:e.target.value}))} className="inp" />
                </div>
              </div>
              <div>
                <label className="label">Kullanan Kişiler</label>
                <div style={{ display:'flex', flexDirection:'column', gap:6, padding:'8px 10px', background:'var(--s2)', borderRadius:8, border:'1px solid var(--bdr)' }}>
                  {profiles.map(p => (
                    <label key={p.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                      <input type="checkbox" checked={form.users.includes(p.id)}
                        onChange={e => setForm(f => ({
                          ...f, users: e.target.checked ? [...f.users,p.id] : f.users.filter(id=>id!==p.id)
                        }))} />
                      {p.full_name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Not</label>
                <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} className="inp" rows={2} placeholder="Plan bilgisi, kullanım amacı..." />
              </div>
              <button className="btn" onClick={save} disabled={saving||!form.name.trim()} style={{ width:'100%', justifyContent:'center', padding:'10px' }}>
                {saving ? 'Kaydediliyor...' : editId ? 'Değişiklikleri Kaydet' : 'Aracı Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmId}
        title="Aracı Sil"
        message="Bu aracı silmek istediğinize emin misiniz?"
        onConfirm={deleteTool}
        onCancel={() => setConfirmId(null)}
      />
    </>
  )
}
