'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { UserCog, Plus, X, Shield, Check, Clock, Activity, LogIn, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react'
import PhoneInput from '@/components/PhoneInput'
import { fmtDateTime, fmtRelative } from '@/lib/utils'

const ROLES = [
  { v: 'admin',   l: 'Admin',    desc: 'Tüm yetkiler',  color: 'var(--ac)',   bg: 'var(--ac2)',   pages: 'Tüm sayfalar' },
  { v: 'manager', l: 'Yönetici', desc: 'Çoğu sayfa',   color: 'var(--blue)', bg: 'var(--blue2)', pages: 'Dashboard, Projeler, Görevler, Müşteriler, Finans, Operasyon' },
  { v: 'member',  l: 'Üye',      desc: 'Temel erişim', color: 'var(--tx2)',  bg: 'var(--s3)',    pages: 'Dashboard, Görevler, Takvim, İçerik, Onay, Profil' },
]

const PAGE_ACCESS: Record<string, string[]> = {
  admin:   ['dashboard','musteriler','gorevler','takvim','icerik','operasyon','gecikmeler','onay','muhasebe','finans','performans','kullanicilar','otomasyonlar','destek','ayarlar','dokumantasyon'],
  manager: ['dashboard','musteriler','gorevler','takvim','icerik','operasyon','gecikmeler','onay','performans','otomasyonlar','destek','ayarlar','dokumantasyon'],
  member:  ['dashboard','gorevler','takvim','icerik','onay','ayarlar','dokumantasyon'],
}

const PAGE_LABELS: Record<string,string> = {
  dashboard:'Dashboard', musteriler:'Müşteriler', gorevler:'Görevler', destek:'Destek',
  takvim:'Takvim', icerik:'İçerik', operasyon:'Operasyon', gecikmeler:'Gecikmeler',
  onay:'Onay', muhasebe:'Muhasebe', finans:'Finans', performans:'Performans',
  kullanicilar:'Kullanıcılar', otomasyonlar:'Otomasyonlar', ayarlar:'Ayarlar', dokumantasyon:'Kılavuz',
}

const DEPTS = ['Yönetim','Tasarım','İçerik','SEO','Sosyal Medya','Müşteri İlişkileri','Operasyon','Muhasebe']

const SESSION_BADGE: Record<string, { l: string; c: string; bg: string }> = {
  online:    { l: 'Online',      c: 'var(--green)', bg: 'var(--green2)' },
  today:     { l: 'Bugün',       c: 'var(--blue)',  bg: 'var(--blue2)'  },
  this_week: { l: 'Bu Hafta',    c: 'var(--amber)', bg: 'var(--amber2)' },
  inactive:  { l: 'Pasif',       c: 'var(--tx3)',   bg: 'var(--s3)'     },
  never:     { l: 'Giriş Yok',   c: 'var(--red)',   bg: 'var(--red2)'   },
}

export default function KullanicilarPage() {
  const [users,    setUsers]    = useState<any[]>([])
  const [sel,      setSel]      = useState<any>(null)
  const [loginLogs,setLoginLogs]= useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [modal,    setModal]    = useState(false)
  const [view,     setView]     = useState<'edit'|'access'|'logs'>('edit')
  const [myRole,   setMyRole]   = useState('')
  const [myId,     setMyId]     = useState('')
  const [pwdModal, setPwdModal] = useState(false)
  const [pwdForm,  setPwdForm]  = useState({ pw1: '', pw2: '' })
  const [pwdShow,  setPwdShow]  = useState(false)
  const [pwdSaving,setPwdSaving]= useState(false)

  const [form, setForm] = useState({ full_name:'', role:'member', department:'', phone:'' })
  const [inv,  setInv]  = useState({ email:'', full_name:'', role:'member', department:'' })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  const load = useCallback(async () => {
    const sb = createClient()
    const [{ data: me }] = await Promise.all([sb.auth.getUser()])
    if (me.user) {
      setMyId(me.user.id)
      const { data: mp } = await sb.from('profiles').select('role').eq('id', me.user.id).single()
      setMyRole(mp?.role || '')
    }
    // user_sessions view'dan çek (auth bilgisi + profile birleşik)
    const { data } = await sb.from('user_sessions').select('*')
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadLogs(userId: string) {
    const sb = createClient()
    const { data } = await sb.from('user_login_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setLoginLogs(data || [])
  }

  function select(u: any) {
    setSel(u)
    setForm({ full_name: u.full_name || '', role: u.role || 'member', department: u.department || '', phone: '' })
    setView('edit')
    loadLogs(u.id)
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
    try {
      await createClient().from('pending_invites').upsert({
        email: inv.email.trim(), full_name: inv.full_name,
        role: inv.role, department: inv.department,
        invited_at: new Date().toISOString(),
      }, { onConflict: 'email' })
    } catch {}
    setSaving(false)
    showToast(`✓ Davet kaydedildi: ${inv.email}`)
    setModal(false)
    setInv({ email: '', full_name: '', role: 'member', department: '' })
  }

  async function resetPassword() {
    if (!sel) return
    if (pwdForm.pw1.length < 6) { showToast('Hata: En az 6 karakter'); return }
    if (pwdForm.pw1 !== pwdForm.pw2) { showToast('Hata: Şifreler eşleşmiyor'); return }
    setPwdSaving(true)
    const res = await fetch('/api/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: sel.id, password: pwdForm.pw1 }) })
    const json = await res.json()
    setPwdSaving(false)
    if (json.error) { showToast('Hata: ' + json.error); return }
    showToast('2713 Şifre değiştirildi!')
    setPwdModal(false)
    setPwdForm({ pw1: '', pw2: '' })
  }

  const isAdmin = myRole === 'admin'

  return (
    <>
      <style>{`
        .ul-wrap{flex:1;display:flex;overflow:hidden}
        .ul-l{width:240px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
        .ul-d{flex:1;overflow-y:auto;padding:16px 16px 80px}
        .ul-ucard{padding:10px 12px;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .1s;border-left:2.5px solid transparent}
        .ul-ucard:hover:not(.sel){background:var(--s2)}
        .ul-ucard.sel{background:var(--ac2);border-left-color:var(--ac)}
        .log-row{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--bdr)}
        .log-row:last-child{border-bottom:none}
        .subtab{padding:8px 14px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--tx2);border-bottom:2px solid transparent;transition:color .12s;display:flex;align-items:center;gap:5px;white-space:nowrap}
        .subtab:hover{color:var(--tx)}
        .subtab.on{color:var(--ac);border-bottom-color:var(--ac);font-weight:600}
        @media(max-width:768px){.ul-wrap{flex-direction:column}.ul-l{width:100%;border-right:none;border-bottom:1px solid var(--bdr);max-height:200px}.ul-d{padding:12px 12px 80px}}
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
                const ss = SESSION_BADGE[u.session_status || 'never']
                return (
                  <div key={u.id} className={`ul-ucard${sel?.id === u.id ? ' sel' : ''}`} onClick={() => select(u)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800 }}>
                          {(u.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        {/* Online dot */}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: ss.c, border: '1.5px solid var(--s1)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: sel?.id === u.id ? 'var(--ac)' : 'var(--tx)' }}>
                          {u.full_name || 'İsimsiz'}
                          {u.id === myId && <span style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 400 }}> (Ben)</span>}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 1 }}>{u.email}</p>
                      </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: (ROLES.find(r => r.v === sel.role) || ROLES[2]).bg, color: (ROLES.find(r => r.v === sel.role) || ROLES[2]).color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                  {(sel.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{sel.full_name || '—'}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>{sel.email}</p>
                </div>
                {/* Session badge */}
                {(() => {
                  const ss = SESSION_BADGE[sel.session_status || 'never']
                  return <span className="badge" style={{ background: ss.bg, color: ss.c, fontSize: 10.5 }}>{ss.l}</span>
                })()}
                <button onClick={() => setSel(null)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>✕</button>
              </div>

              {/* Hızlı istatistik */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { l: 'Kayıt', v: fmtDateTime(sel.registered_at), Icon: UserCog },
                  { l: 'Son Giriş', v: sel.last_sign_in_at ? fmtRelative(sel.last_sign_in_at) : 'Hiç giriş yapmadı', Icon: LogIn },
                  { l: 'Toplam Giriş', v: `${loginLogs.length} kez`, Icon: Activity },
                ].map(s => (
                  <div key={s.l} style={{ background: 'var(--s2)', borderRadius: 9, padding: '10px 12px', border: '1px solid var(--bdr)' }}>
                    <p style={{ fontSize: 9.5, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <s.Icon size={10} strokeWidth={2} />{s.l}
                    </p>
                    <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--tx)', lineHeight: 1.3 }}>{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--bdr)', marginBottom: 14 }}>
                {[
                  { k: 'edit',   l: 'Profil',        Icon: UserCog  },
                  { k: 'access', l: 'Sayfa Erişimi',  Icon: Shield   },
                  { k: 'logs',   l: `Giriş Logları (${loginLogs.length})`, Icon: Activity },
                ].map(({ k, l, Icon }) => (
                  <button key={k} className={`subtab${view === k ? ' on' : ''}`} onClick={() => setView(k as any)}>
                    <Icon size={12} strokeWidth={1.8} />{l}
                  </button>
                ))}
              </div>

              {/* ── Profil ── */}
              {view === 'edit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="modal-grid">
                    <div><label className="label">Ad Soyad</label>
                      <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="inp" disabled={!isAdmin && sel.id !== myId} />
                    </div>
                    <div><label className="label">Telefon</label>
                      <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
                    </div>
                    <div><label className="label">Rol</label>
                      <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="inp" disabled={!isAdmin || sel.id === myId}>
                        <option value="admin">Admin</option>
                        <option value="manager">Yönetici</option>
                        <option value="member">Üye</option>
                      </select>
                    </div>
                    <div><label className="label">Departman</label>
                      <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="inp">
                        <option value="">— Seçin —</option>
                        {DEPTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  {(() => {
                    const r = ROLES.find(r => r.v === form.role)
                    return r ? (
                      <div style={{ background: r.bg, borderRadius: 9, padding: '10px 14px', border: `1px solid ${r.color}22` }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: r.color, marginBottom: 3 }}>{r.l} — {r.desc}</p>
                        <p style={{ fontSize: 11.5, color: 'var(--tx2)', lineHeight: 1.5 }}>Erişilen sayfalar: {r.pages}</p>
                      </div>
                    ) : null
                  })()}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={save} disabled={saving} style={{ padding: '8px 20px' }}>
                      {saving ? 'Kaydediliyor...' : '✓ Kaydet'}
                    </button>
                    {isAdmin && sel?.id !== myId && (
                      <button onClick={() => { setPwdModal(true); setPwdForm({ pw1: '', pw2: '' }) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--amber2)', border: '1px solid rgba(240,168,67,.25)', borderRadius: 9, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--amber)' }}>
                        <KeyRound size={13} strokeWidth={2} />Şifre Değiştir
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Sayfa Erişimi ── */}
              {view === 'access' && (
                <div>
                  <div style={{ background: 'var(--s2)', borderRadius: 9, padding: '10px 14px', marginBottom: 12, border: '1px solid var(--bdr)', fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.6 }}>
                    Erişim otomatik olarak role göre belirlenir. Değiştirmek için rolü güncelleyin.
                  </div>
                  <div style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 10, overflow: 'hidden' }}>
                    {Object.entries(PAGE_LABELS).map(([key, label]) => {
                      const hasAccess = (PAGE_ACCESS[sel.role] || []).includes(key)
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid var(--bdr)' }}>
                          <span style={{ fontSize: 13, color: hasAccess ? 'var(--tx)' : 'var(--tx3)' }}>{label}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: hasAccess ? 'var(--green)' : 'var(--tx3)' }}>
                            {hasAccess ? <><Check size={12} strokeWidth={2.5} />Var</> : <>✕ Yok</>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Giriş Logları ── */}
              {view === 'logs' && (
                <div>
                  {/* Son giriş özet */}
                  {sel.last_sign_in_at ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--green2)', borderRadius: 10, border: '1px solid rgba(34,211,160,.2)', marginBottom: 12 }}>
                      <LogIn size={14} style={{ color: 'var(--green)' }} strokeWidth={2} />
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>Son giriş: {fmtDateTime(sel.last_sign_in_at)}</p>
                        <p style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>{fmtRelative(sel.last_sign_in_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--red2)', borderRadius: 10, border: '1px solid rgba(242,87,87,.2)', marginBottom: 12 }}>
                      <AlertCircle size={14} style={{ color: 'var(--red)' }} strokeWidth={2} />
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--red)' }}>Bu kullanıcı hiç giriş yapmamış</p>
                    </div>
                  )}

                  <div style={{ background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 10, overflow: 'hidden' }}>
                    {loginLogs.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>Log kaydı yok</div>
                    ) : loginLogs.map((log, i) => (
                      <div key={log.id} className="log-row">
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--green2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <LogIn size={13} style={{ color: 'var(--green)' }} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 600 }}>Sisteme Giriş</p>
                          <p style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>{fmtDateTime(log.created_at)}</p>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>
                          {fmtRelative(log.created_at)}
                        </span>
                      </div>
                    ))}
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

      {/* Davet Modal */}
      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p className="modal-title" style={{ margin: 0 }}>Kullanıcı Davet Et</p>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ background: 'var(--blue2)', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: 'var(--blue)', lineHeight: 1.6, border: '1px solid rgba(78,168,240,.15)' }}>
              Kişi /login adresinden kendi e-postasıyla kayıt olmalı. Bu form davet kaydı oluşturur.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label className="label">E-posta *</label>
                <input value={inv.email} onChange={e => setInv(p => ({ ...p, email: e.target.value }))} placeholder="kullanici@mail.com" className="inp" autoFocus />
              </div>
              <div><label className="label">Ad Soyad</label>
                <input value={inv.full_name} onChange={e => setInv(p => ({ ...p, full_name: e.target.value }))} className="inp" />
              </div>
              <div className="modal-grid">
                <div><label className="label">Rol</label>
                  <select value={inv.role} onChange={e => setInv(p => ({ ...p, role: e.target.value }))} className="inp">
                    <option value="admin">Admin</option>
                    <option value="manager">Yönetici</option>
                    <option value="member">Üye</option>
                  </select>
                </div>
                <div><label className="label">Departman</label>
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
      {/* Şifre Değiştir Modal */}
      {pwdModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setPwdModal(false) }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p className="modal-title" style={{ margin: 0 }}>🔐 Şifre Değiştir</p>
              <button onClick={() => setPwdModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ background: 'var(--amber2)', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: 'var(--amber)', border: '1px solid rgba(240,168,67,.2)' }}>
              <strong>{sel?.full_name}</strong> kullanıcısının şifresini değiştiriyorsunuz.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Yeni Şifre (en az 6 karakter)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={pwdShow ? 'text' : 'password'}
                    value={pwdForm.pw1}
                    onChange={e => setPwdForm(p => ({ ...p, pw1: e.target.value }))}
                    placeholder="Yeni şifre..."
                    className="inp"
                    style={{ paddingRight: 38 }}
                    autoFocus
                  />
                  <button onClick={() => setPwdShow(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', padding: 0 }}>
                    {pwdShow ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Şifre Tekrar</label>
                <input
                  type={pwdShow ? 'text' : 'password'}
                  value={pwdForm.pw2}
                  onChange={e => setPwdForm(p => ({ ...p, pw2: e.target.value }))}
                  placeholder="Tekrar girin..."
                  className="inp"
                  onKeyDown={e => e.key === 'Enter' && resetPassword()}
                />
              </div>
              {pwdForm.pw1 && pwdForm.pw2 && pwdForm.pw1 !== pwdForm.pw2 && (
                <p style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>⚠ Şifreler eşleşmiyor</p>
              )}
              <button
                className="btn"
                onClick={resetPassword}
                disabled={pwdSaving || !pwdForm.pw1 || pwdForm.pw1 !== pwdForm.pw2}
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                {pwdSaving ? 'Değiştiriliyor...' : '🔐 Şifreyi Değiştir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
