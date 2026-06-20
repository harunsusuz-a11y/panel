'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { UserCog, Plus, X, Shield, Trash2, Mail, Phone, Building2, Check } from 'lucide-react'

const ROLES = [
  { v: 'admin',   l: 'Admin',    desc: 'Tüm yetkiler', color: 'var(--ac)', bg: 'var(--ac2)', pages: 'Tüm sayfalar' },
  { v: 'manager', l: 'Yönetici', desc: 'Çoğu sayfa',  color: 'var(--blue)', bg: 'var(--blue2)', pages: 'Dashboard, Projeler, Görevler, Müşteriler, Finans, Raporlar' },
  { v: 'member',  l: 'Üye',      desc: 'Temel erişim', color: 'var(--tx2)', bg: 'var(--s3)',    pages: 'Dashboard, Görevler, Takvim, Profil' },
]

const PAGE_ACCESS: Record<string, string[]> = {
  admin:   ['dashboard','musteriler','projeler','gorevler','takvim','icerik','operasyon','gecikmeler','onay','muhasebe','finans','performans','kullanicilar','otomasyonlar','ayarlar'],
  manager: ['dashboard','musteriler','projeler','gorevler','takvim','icerik','operasyon','gecikmeler','onay','muhasebe','finans','performans'],
  member:  ['dashboard','gorevler','takvim'],
}

const PAGE_LABELS: Record<string,string> = {
  dashboard:'Dashboard', musteriler:'Müşteriler', projeler:'Projeler', gorevler:'Görevler',
  takvim:'Takvim', icerik:'İçerik', operasyon:'Operasyon', gecikmeler:'Gecikmeler',
  onay:'Onay', muhasebe:'Muhasebe', finans:'Finans', performans:'Performans',
  kullanicilar:'Kullanıcılar', otomasyonlar:'Otomasyonlar', ayarlar:'Ayarlar',
}

const DEPTS = ['Yönetim','Tasarım','İçerik','SEO','Sosyal Medya','Müşteri İlişkileri','Operasyon','Muhasebe']

export default function KullanicilarPage() {
  const [users,    setUsers]    = useState<any[]>([])
  const [sel,      setSel]      = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [modal,    setModal]    = useState(false)
  const [view,     setView]     = useState<'edit'|'access'>('edit')
  const [myRole,   setMyRole]   = useState('')
  const [myId,     setMyId]     = useState('')

  const [form, setForm] = useState({ full_name:'', role:'member', department:'', phone:'' })
  const [inv,  setInv]  = useState({ email:'', full_name:'', role:'member', department:'' })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  const load = useCallback(async () => {
    const sb = createClient()
    const [{ data: me }, { data }] = await Promise.all([
      sb.auth.getUser(),
      sb.from('profiles').select('*').order('created_at'),
    ])
    setUsers(data || [])
    setLoading(false)
    if (me.user) {
      setMyId(me.user.id)
      const myProfile = (data || []).find((u: any) => u.id === me.user!.id)
      setMyRole(myProfile?.role || '')
    }
  }, [])

  useEffect(() => { load() }, [load])

  function select(u: any) {
    setSel(u)
    setForm({ full_name: u.full_name || '', role: u.role || 'member', department: u.department || '', phone: u.phone || '' })
    setView('edit')
  }

  async function save() {
    if (!sel) return
    setSaving(true)
    const { error } = await createClient().from('profiles').update(form).eq('id', sel.id)
    setSaving(false)
    if (error) showToast('Hata: ' + error.message)
    else {
      showToast('✓ Kullanıcı güncellendi!')
      setUsers(us => us.map(u => u.id === sel.id ? { ...u, ...form } : u))
      setSel((s: any) => s ? { ...s, ...form } : null)
    }
  }

  async function invite() {
    if (!inv.email.trim()) { showToast('Hata: E-posta zorunlu'); return }
    setSaving(true)
    const sb = createClient()
    // Create user via admin invite (requires service role in real setup)
    // For now: upsert profile with email note
    try {
      await sb.from('pending_invites').upsert({
        email: inv.email.trim(),
        full_name: inv.full_name,
        role: inv.role,
        department: inv.department,
        invited_at: new Date().toISOString(),
      }, { onConflict: 'email' })
    } catch {}
    setSaving(false)
    showToast(`✓ Davet kaydedildi: ${inv.email}`)
    setModal(false)
    setInv({ email: '', full_name: '', role: 'member', department: '' })
  }

  const isAdmin = myRole === 'admin'

  return (
    <>
      <style>{`
        .ul-wrap{flex:1;display:flex;overflow:hidden}
        .ul-l{width:240px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
        .ul-d{flex:1;overflow-y:auto;padding:18px 18px 80px}
        .ul-ucard{padding:10px 12px;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .1s;border-left:2.5px solid transparent}
        .ul-ucard:hover:not(.sel){background:var(--s2)}
        .ul-ucard.sel{background:var(--ac2);border-left-color:var(--ac)}
        .perm-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bdr)}
        .perm-row:last-child{border-bottom:none}
        @media(max-width:768px){
          .ul-wrap{flex-direction:column}
          .ul-l{width:100%;border-right:none;border-bottom:1px solid var(--bdr);max-height:200px}
          .ul-d{padding:14px 14px 80px}
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title="Kullanıcılar"
          subtitle={`${users.length} kişi`}
          action={isAdmin ? (
            <button className="btn" onClick={() => setModal(true)}>
              <Plus size={14} strokeWidth={2} />Kullanıcı Ekle
            </button>
          ) : undefined}
        />
        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        <div className="ul-wrap">
          {/* Liste */}
          <div className="ul-l">
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <p style={{ padding: 16, color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</p>
              ) : users.map(u => {
                const r = ROLES.find(r => r.v === u.role) || ROLES[2]
                return (
                  <div
                    key={u.id}
                    className={`ul-ucard${sel?.id === u.id ? ' sel' : ''}`}
                    onClick={() => select(u)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, flexShrink: 0 }}>
                        {(u.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: sel?.id === u.id ? 'var(--ac)' : 'var(--tx)' }}>
                          {u.full_name || 'İsimsiz'}
                          {u.id === myId && <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 400 }}> (Ben)</span>}
                        </p>
                        <p style={{ fontSize: 10.5, color: 'var(--tx3)', marginTop: 1 }}>
                          {u.department || r.l}
                        </p>
                      </div>
                      <span className="badge" style={{ background: r.bg, color: r.color, fontSize: 9.5 }}>{r.l}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detay */}
          {sel ? (
            <div className="ul-d">
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: (ROLES.find(r => r.v === sel.role) || ROLES[2]).bg, color: (ROLES.find(r => r.v === sel.role) || ROLES[2]).color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                  {(sel.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{sel.full_name || '—'}</p>
                  <p style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>{sel.email || sel.id}</p>
                </div>
                <button onClick={() => setSel(null)} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}>✕</button>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--bdr)', marginBottom: 16 }}>
                {[
                  { k: 'edit', l: 'Profil', Icon: UserCog },
                  { k: 'access', l: 'Sayfa Erişimi', Icon: Shield },
                ].map(({ k, l, Icon }) => (
                  <button
                    key={k}
                    onClick={() => setView(k as any)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: view === k ? 600 : 400, color: view === k ? 'var(--ac)' : 'var(--tx2)', borderBottom: `2px solid ${view === k ? 'var(--ac)' : 'transparent'}`, transition: 'color .12s' }}
                  >
                    <Icon size={13} strokeWidth={1.8} />{l}
                  </button>
                ))}
              </div>

              {view === 'edit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="modal-grid">
                    <div>
                      <label className="label">Ad Soyad</label>
                      <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="inp" disabled={!isAdmin && sel.id !== myId} />
                    </div>
                    <div>
                      <label className="label">Telefon</label>
                      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="inp" placeholder="05XX XXX XX XX" />
                    </div>
                  </div>
                  <div className="modal-grid">
                    <div>
                      <label className="label">Rol</label>
                      <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="inp" disabled={!isAdmin || sel.id === myId}>
                        <option value="admin">Admin</option>
                        <option value="manager">Yönetici</option>
                        <option value="member">Üye</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Departman</label>
                      <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="inp">
                        <option value="">— Seçin —</option>
                        {DEPTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Rol açıklaması */}
                  {(() => {
                    const r = ROLES.find(r => r.v === form.role)
                    return r ? (
                      <div style={{ background: r.bg, borderRadius: 9, padding: '10px 14px', border: `1px solid ${r.color}22` }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: r.color, marginBottom: 3 }}>{r.l} — {r.desc}</p>
                        <p style={{ fontSize: 11.5, color: 'var(--tx2)', lineHeight: 1.5 }}>Erişilen sayfalar: {r.pages}</p>
                      </div>
                    ) : null
                  })()}

                  <button className="btn" onClick={save} disabled={saving} style={{ alignSelf: 'flex-start', padding: '8px 20px' }}>
                    {saving ? 'Kaydediliyor...' : '✓ Kaydet'}
                  </button>
                </div>
              )}

              {view === 'access' && (
                <div>
                  <div style={{ background: 'var(--s2)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, border: '1px solid var(--bdr)', fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--tx)' }}>Not:</strong> Sayfa erişimi otomatik olarak role göre belirlenir. Değiştirmek için rolü güncelleyin.
                  </div>
                  <div style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 10, overflow: 'hidden' }}>
                    {Object.entries(PAGE_LABELS).map(([key, label]) => {
                      const hasAccess = (PAGE_ACCESS[sel.role] || []).includes(key)
                      return (
                        <div key={key} className="perm-row" style={{ padding: '9px 14px' }}>
                          <span style={{ fontSize: 13, color: hasAccess ? 'var(--tx)' : 'var(--tx3)' }}>{label}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: hasAccess ? 'var(--green)' : 'var(--tx3)' }}>
                            {hasAccess
                              ? <><Check size={12} strokeWidth={2.5} />Erişim Var</>
                              : <>✕ Erişim Yok</>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)', fontSize: 13, flexDirection: 'column', gap: 8 }}>
              <UserCog size={28} strokeWidth={1.5} style={{ opacity: .3 }} />
              Kullanıcı seçin
            </div>
          )}
        </div>
      </div>

      {/* Kullanıcı Ekle Modal */}
      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p className="modal-title" style={{ margin: 0 }}>Kullanıcı Davet Et</p>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ background: 'var(--blue2)', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: 'var(--blue)', lineHeight: 1.6, border: '1px solid rgba(78,168,240,.15)' }}>
              <strong>Not:</strong> Kullanıcı kendi e-postası ile /login adresinden kayıt olmalı. Bu form davet kaydı oluşturur.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label"><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />E-posta *</label>
                <input value={inv.email} onChange={e => setInv(p => ({ ...p, email: e.target.value }))} placeholder="kullanici@mail.com" className="inp" autoFocus />
              </div>
              <div>
                <label className="label">Ad Soyad</label>
                <input value={inv.full_name} onChange={e => setInv(p => ({ ...p, full_name: e.target.value }))} placeholder="Ad Soyad" className="inp" />
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Rol</label>
                  <select value={inv.role} onChange={e => setInv(p => ({ ...p, role: e.target.value }))} className="inp">
                    <option value="admin">Admin</option>
                    <option value="manager">Yönetici</option>
                    <option value="member">Üye</option>
                  </select>
                </div>
                <div>
                  <label className="label">Departman</label>
                  <select value={inv.department} onChange={e => setInv(p => ({ ...p, department: e.target.value }))} className="inp">
                    <option value="">— Seçin —</option>
                    {DEPTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn" onClick={invite} disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                {saving ? 'Kaydediliyor...' : 'Davet Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
