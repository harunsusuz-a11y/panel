'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'

export default function MusterilerPage() {
  const [clients, setClients]   = useState<any[]>([])
  const [sel, setSel]           = useState<any>(null)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState('')
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', phone: '', company: '', status: 'active', notes: '' })
  const [editForm, setEditForm] = useState<any>({})

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  async function load() {
    const { data } = await createClient().from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!form.name.trim()) return
    const sb = createClient(); const { data: { user } } = await sb.auth.getUser()
    const { error } = await sb.from('clients').insert({ ...form, created_by: user?.id })
    if (error) showToast('Hata: ' + error.message)
    else { showToast('Müşteri eklendi!'); setModal(false); load(); setForm({ name: '', email: '', phone: '', company: '', status: 'active', notes: '' }) }
  }

  async function update() {
    if (!sel) return
    const { error } = await createClient().from('clients').update(editForm).eq('id', sel.id)
    if (error) showToast('Hata: ' + error.message)
    else { showToast('Güncellendi!'); setEditing(false); setSel({ ...sel, ...editForm }); load() }
  }

  async function del(id: string) {
    if (!confirm('Müşteriyi silmek istediğinize emin misiniz?')) return
    await createClient().from('clients').delete().eq('id', id)
    setSel(null); load()
  }

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <style>{`
        .ml-wrap{flex:1;display:flex;overflow:hidden}
        .ml-list{width:270px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
        .ml-detail{flex:1;overflow-y:auto;padding:20px}
        @media(max-width:768px){.ml-wrap{flex-direction:column}.ml-list{width:100%;border-right:none;max-height:240px}.ml-detail{position:fixed;inset:0;z-index:200;background:var(--bg);padding:0;display:flex;flex-direction:column}}
        .ml-dh{height:50px;display:flex;align-items:center;gap:12px;padding:0 16px;border-bottom:1px solid var(--bdr);background:var(--s1);flex-shrink:0}
        .ml-di{flex:1;overflow-y:auto;padding:16px}
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Müşteriler" subtitle={`${clients.length} kayıt`} action={
          <button className="btn" onClick={() => setModal(true)}><Plus size={14} strokeWidth={2} />Yeni Müşteri</button>
        } />
        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        <div className="ml-wrap">
          <div className="ml-list">
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--bdr)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri ara..."
                  className="inp" style={{ paddingLeft: 30 }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? <p style={{ padding: 20, color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</p>
              : filtered.length === 0 ? <p style={{ padding: 20, color: 'var(--tx3)', fontSize: 13, textAlign: 'center' }}>Müşteri bulunamadı</p>
              : filtered.map(c => (
                <div key={c.id} onClick={() => { setSel(c); setEditing(false); setEditForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', status: c.status, notes: c.notes || '' }) }}
                  style={{ padding: '11px 14px', borderBottom: '1px solid var(--bdr)', cursor: 'pointer', background: sel?.id === c.id ? 'var(--ac2)' : 'transparent', borderLeft: `2.5px solid ${sel?.id === c.id ? 'var(--ac)' : 'transparent'}`, transition: 'background .1s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: sel?.id === c.id ? 'var(--ac)' : 'var(--tx)' }}>{c.name}</span>
                    <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-muted'}`}>{c.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{c.company || c.email || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {sel ? (
            <div className="ml-detail" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="ml-dh">
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                  <X size={14} /> Kapat
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{sel.name}</span>
                <button className="btn-ghost" onClick={() => setEditing(!editing)} style={{ fontSize: 12 }}>
                  <Pencil size={12} />{editing ? 'İptal' : 'Düzenle'}
                </button>
              </div>
              <div className="ml-di">
                {!editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[{ l: 'Firma', v: sel.company || '—' }, { l: 'E-posta', v: sel.email || '—' }, { l: 'Telefon', v: sel.phone || '—' }, { l: 'Durum', v: sel.status === 'active' ? 'Aktif' : 'Pasif' }].map(f => (
                        <div key={f.l} style={{ background: 'var(--s2)', borderRadius: 9, padding: '11px 13px', border: '1px solid var(--bdr)' }}>
                          <p style={{ fontSize: 10.5, color: 'var(--tx3)', marginBottom: 4 }}>{f.l}</p>
                          <p style={{ fontSize: 13.5, fontWeight: 500 }}>{f.v}</p>
                        </div>
                      ))}
                    </div>
                    {sel.notes && (
                      <div style={{ background: 'var(--s2)', borderRadius: 9, padding: '12px 13px', border: '1px solid var(--bdr)' }}>
                        <p style={{ fontSize: 10.5, color: 'var(--tx3)', marginBottom: 5 }}>Notlar</p>
                        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--tx2)' }}>{sel.notes}</p>
                      </div>
                    )}
                    <button className="btn-danger" onClick={() => del(sel.id)} style={{ alignSelf: 'flex-start' }}>
                      <Trash2 size={13} /> Müşteriyi Sil
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[{ l: 'Firma Adı', k: 'name' }, { l: 'Şirket', k: 'company' }, { l: 'E-posta', k: 'email' }, { l: 'Telefon', k: 'phone' }].map(f => (
                      <div key={f.k}><label className="label">{f.l}</label>
                        <input value={editForm[f.k] || ''} onChange={e => setEditForm((p: any) => ({ ...p, [f.k]: e.target.value }))} className="inp" />
                      </div>
                    ))}
                    <div><label className="label">Durum</label>
                      <select value={editForm.status} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))} className="inp">
                        <option value="active">Aktif</option><option value="passive">Pasif</option>
                      </select>
                    </div>
                    <div><label className="label">Notlar</label>
                      <textarea value={editForm.notes || ''} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} className="inp" rows={3} />
                    </div>
                    <button className="btn" onClick={update} style={{ alignSelf: 'flex-start' }}>Kaydet</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 13 }}>
              Müşteri seçin
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal">
            <p className="modal-title">Yeni Müşteri</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ l: 'Müşteri Adı *', k: 'name' }, { l: 'Şirket', k: 'company' }, { l: 'E-posta', k: 'email' }, { l: 'Telefon', k: 'phone' }].map(f => (
                <div key={f.k}><label className="label">{f.l}</label>
                  <input value={(form as any)[f.k]} onChange={e => setForm((p: any) => ({ ...p, [f.k]: e.target.value }))} className="inp" autoFocus={f.k === 'name'} />
                </div>
              ))}
              <div><label className="label">Notlar</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="inp" rows={2} />
              </div>
              <button className="btn" onClick={add} style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 4 }}>Müşteri Ekle</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
