'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import InfoBox from '@/components/InfoBox'
import { CheckCircle2, XCircle, Clock, Send, Link2, FileText, FolderOpen, Receipt, MoreHorizontal, ChevronRight, Plus, X, MessageSquare } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'

// İç onay statüsü
const APPROVAL_ST: Record<string,any> = {
  pending:  { l:'Bekliyor',   cls:'badge-amber', Icon: Clock },
  approved: { l:'Onaylandı',  cls:'badge-green', Icon: CheckCircle2 },
  rejected: { l:'Reddedildi', cls:'badge-red',   Icon: XCircle },
}

// Müşteri gönderim statüsü
const CLIENT_ST: Record<string,any> = {
  not_sent:      { l:'Gönderilmedi',      color:'var(--tx3)' },
  sent:          { l:'Müşteriye Gönderildi', color:'var(--blue)' },
  client_approved: { l:'Müşteri Onayladı',  color:'var(--green)' },
  client_rejected: { l:'Müşteri Reddetti',  color:'var(--red)' },
}

const TYPE_ICON: Record<string,any> = {
  content: FileText,
  project: FolderOpen,
  invoice: Receipt,
  other:   MoreHorizontal,
}
const TYPE_L: Record<string,string> = { content:'İçerik', project:'Proje', invoice:'Fatura', other:'Diğer' }

export default function OnayPage() {
  const [items,       setItems]       = useState<any[]>([])
  const [filter,      setFilter]      = useState('pending')
  const [toast,       setToast]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [sel,         setSel]         = useState<any>(null)
  const [portalLink,  setPortalLink]  = useState('')
  const [sending,     setSending]     = useState(false)
  const [newModal,    setNewModal]    = useState(false)
  const [clients,     setClients]     = useState<any[]>([])
  const [newForm,     setNewForm]     = useState({ title: '', type: 'content', client_id: '', notes: '' })
  const [creating,    setCreating]    = useState(false)

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3500) }

  async function load() {
    const sb = createClient()
    const [u, c] = await Promise.all([
      sb.auth.getUser(),
      sb.from('clients').select('id,name').order('name'),
    ])
    setClients(c.data || [])

    if (u.data.user) {
      const { data: p } = await sb.from('profiles').select('role,full_name').eq('id', u.data.user.id).single()
      setCurrentUser({ ...u.data.user, ...p })

      const role = p?.role || 'member'
      // Member → sadece kendi oluşturduğu onay talepleri
      let q = sb.from('approvals')
        .select('*, requester:profiles!approvals_requested_by_fkey(full_name), approver:profiles!approvals_approved_by_fkey(full_name), client:clients(id,name,email)')
        .order('created_at', { ascending: false })
      if (role === 'member') q = q.eq('requested_by', u.data.user.id)
      const { data: a } = await q
      setItems(a || [])
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function resolve(id: string, status: 'approved' | 'rejected') {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    await sb.from('approvals').update({
      status,
      approved_by: user?.id,
      resolved_at: new Date().toISOString(),
      internal_note: status === 'approved' ? 'İç onay tamamlandı' : 'Reddedildi',
    }).eq('id', id)
    showToast(status === 'approved' ? '✓ Onaylandı! Şimdi müşteriye gönderebilirsiniz.' : '✕ Reddedildi.')
    load()
    if (sel?.id === id) setSel((s:any) => s ? { ...s, status, approved_by: user?.id } : null)
  }

  async function sendToClient(item: any) {
    if (!item.client_id) { showToast('Hata: Müşteri atanmamış'); return }
    setSending(true)
    const sb = createClient()
    // Portal token oluştur
    // Önce mevcut token var mı?
    let tokenData = null
    try {
      const {data: existingToken} = await sb.from('client_portal_tokens')
        .select().eq('approval_id', item.id).limit(1).single()
      if (existingToken) tokenData = existingToken
    } catch {}
    if (!tokenData) {
      const {data: newToken} = await sb.from('client_portal_tokens')
        .insert({ client_id: item.client_id, approval_id: item.id }).select().single()
      tokenData = newToken
    }

    if (tokenData) {
      const link = `${window.location.origin}/portal/approval/${tokenData.token}`
      setPortalLink(link)
      try { navigator.clipboard.writeText(link) } catch {}
      // client_sent_at güncelle
      await sb.from('approvals').update({
        client_status: 'sent',
        client_sent_at: new Date().toISOString(),
        portal_link: link,
      }).eq('id', item.id)
      showToast('✓ Portal linki oluşturuldu ve kopyalandı!')
      load()
    } else {
      // Fallback: doğrudan link
      const link = `${window.location.origin}/portal/approval/${item.id}`
      setPortalLink(link)
      try { navigator.clipboard.writeText(link) } catch {}
      showToast('✓ Link oluşturuldu (kopyalandı)')
    }
    setSending(false)
  }

  async function createApproval() {
    if (!newForm.title.trim()) { showToast('Hata: Başlık zorunlu'); return }
    setCreating(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { error } = await sb.from('approvals').insert({
      title: newForm.title.trim(),
      type: newForm.type,
      status: 'pending',
      client_id: newForm.client_id || null,
      requested_by: user?.id,
      notes: newForm.notes || null,
    })
    setCreating(false)
    if (error) { showToast('Hata: ' + error.message); return }
    showToast('✓ Onay talebi oluşturuldu!')
    setNewModal(false)
    setNewForm({ title: '', type: 'content', client_id: '', notes: '' })
    load()
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  const pendingCount = items.filter(i => i.status === 'pending').length

  return (
    <>
      <style>{`
        .on-wrap{flex:1;display:flex;overflow:hidden}
        .on-l{flex:1;overflow-y:auto;padding:16px 16px 80px}
        .on-r{width:320px;border-left:1px solid var(--bdr);overflow-y:auto;padding:18px;flex-shrink:0}
        .step{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--bdr)}
        .step:last-child{border-bottom:none}
        .step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0;margin-top:1px}
        @media(max-width:768px){.on-wrap{flex-direction:column}.on-r{width:100%;border-left:none;border-top:1px solid var(--bdr)}}
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar
          title="Onay Yönetimi"
          subtitle={pendingCount > 0 ? `${pendingCount} iç onay bekliyor` : 'Temiz'}
          action={isAdmin ? (
            <button className="btn" onClick={() => setNewModal(true)}>
              <Plus size={14} strokeWidth={2} />Onay Talebi Oluştur
            </button>
          ) : undefined}
        />
        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        {/* Akış şeması banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '9px 20px', background: 'var(--s2)', borderBottom: '1px solid var(--bdr)', overflowX: 'auto', flexShrink: 0 }}>
          {[
            { n: 1, l: 'Talep Oluştur', c: 'var(--tx3)' },
            { n: 2, l: 'İç Onay', c: 'var(--amber)' },
            { n: 3, l: 'Müşteriye Gönder', c: 'var(--blue)' },
            { n: 4, l: 'Müşteri Onayı', c: 'var(--green)' },
          ].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${s.c}22`, border: `1px solid ${s.c}55`, color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800 }}>{s.n}</div>
                <span style={{ fontSize: 11.5, color: s.c, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.l}</span>
              </div>
              {i < 3 && <ChevronRight size={13} style={{ color: 'var(--tx3)', margin: '0 6px' }} />}
            </div>
          ))}
        </div>

        <div className="on-wrap">
          <div className="on-l">
            {/* Filtre */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={filter === s ? 'btn' : 'btn-ghost'}
                  style={{ fontSize: 11.5, padding: '5px 12px' }}>
                  {s === 'all' ? `Tümü (${items.length})` : `${APPROVAL_ST[s]?.l} (${items.filter(i => i.status === s).length})`}
                </button>
              ))}
            </div>

            {loading ? (
              <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</p>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>
                <CheckCircle2 size={28} strokeWidth={1.5} style={{ opacity: .3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                Onay talebi bulunamadı
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {filtered.map(item => {
                  const st = APPROVAL_ST[item.status] || APPROVAL_ST.pending
                  const cst = CLIENT_ST[item.client_status || 'not_sent']
                  const TypeIcon = TYPE_ICON[item.type] || MoreHorizontal
                  const isSel = sel?.id === item.id
                  return (
                    <div key={item.id}
                      onClick={() => { setSel(item); setPortalLink(item.portal_link || '') }}
                      style={{
                        background: isSel ? 'var(--ac2)' : 'var(--s1)',
                        border: `1px solid ${isSel ? 'var(--ac)' : 'var(--bdr)'}`,
                        borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all .12s',
                        borderLeft: `3px solid ${isSel ? 'var(--ac)' : item.status === 'pending' ? 'var(--amber)' : item.status === 'approved' ? 'var(--green)' : 'var(--red)'}`
                      }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <TypeIcon size={14} style={{ color: 'var(--tx3)' }} strokeWidth={1.8} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className="badge badge-ac" style={{ fontSize: 10 }}>{TYPE_L[item.type] || item.type}</span>
                            <span className={`badge ${st.cls}`} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <st.Icon size={9} strokeWidth={2.5} />{st.l}
                            </span>
                            {item.client?.name && (
                              <span className="badge badge-muted" style={{ fontSize: 10 }}>{item.client.name}</span>
                            )}
                            <span style={{ fontSize: 10.5, color: cst.color, fontWeight: 600 }}>· {cst.l}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, color: 'var(--tx3)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>
                          {fmtDateTime(item.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sağ panel — detay + aksiyon */}
          {sel ? (
            <div className="on-r">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700 }}>{sel.title}</p>
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>

              {/* Akış adımları */}
              <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '4px 14px', marginBottom: 16, border: '1px solid var(--bdr)' }}>

                {/* Adım 1: Talep */}
                <div className="step">
                  <div className="step-num" style={{ background: 'var(--s4)', color: 'var(--tx2)' }}>1</div>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600 }}>Talep Oluşturuldu</p>
                    <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>
                      {sel.requester?.full_name || '—'} · {fmtDateTime(sel.created_at)}
                    </p>
                    {sel.notes && <p style={{ fontSize: 11.5, color: 'var(--tx2)', marginTop: 4, lineHeight: 1.5 }}>{sel.notes}</p>}
                  </div>
                </div>

                {/* Adım 2: İç Onay */}
                <div className="step">
                  <div className="step-num" style={{
                    background: sel.status === 'approved' ? 'var(--green2)' : sel.status === 'rejected' ? 'var(--red2)' : 'var(--amber2)',
                    color: sel.status === 'approved' ? 'var(--green)' : sel.status === 'rejected' ? 'var(--red)' : 'var(--amber)',
                  }}>2</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600 }}>İç Onay</p>
                    <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>
                      {sel.status === 'pending' ? 'Bekliyor...' : sel.status === 'approved' ? `✓ ${sel.approver?.full_name || 'Onaylayan'} onayladı` : `✕ Reddedildi`}
                    </p>
                    {sel.status === 'pending' && isAdmin && (
                      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
                        <button onClick={() => resolve(sel.id, 'approved')}
                          style={{ flex: 1, background: 'var(--green2)', border: '1px solid rgba(34,211,160,.2)', borderRadius: 8, color: 'var(--green)', fontWeight: 700, fontSize: 12, padding: '7px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <CheckCircle2 size={13} strokeWidth={2.5} />Onayla
                        </button>
                        <button onClick={() => resolve(sel.id, 'rejected')}
                          style={{ flex: 1, background: 'var(--red2)', border: '1px solid rgba(242,87,87,.2)', borderRadius: 8, color: 'var(--red)', fontWeight: 700, fontSize: 12, padding: '7px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <XCircle size={13} strokeWidth={2.5} />Reddet
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Adım 3: Müşteriye Gönder */}
                <div className="step">
                  <div className="step-num" style={{
                    background: sel.client_status === 'sent' || sel.client_status?.includes('client') ? 'var(--blue2)' : 'var(--s4)',
                    color: sel.client_status === 'sent' || sel.client_status?.includes('client') ? 'var(--blue)' : 'var(--tx3)',
                  }}>3</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600 }}>Müşteriye Gönder</p>
                    <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>
                      {CLIENT_ST[sel.client_status || 'not_sent'].l}
                    </p>
                    {sel.status === 'approved' && sel.client_id && (
                      <button onClick={() => sendToClient(sel)} disabled={sending}
                        style={{ marginTop: 10, width: '100%', background: 'var(--blue2)', border: '1px solid rgba(78,168,240,.2)', borderRadius: 8, color: 'var(--blue)', fontWeight: 700, fontSize: 12, padding: '8px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: sending ? .6 : 1 }}>
                        <Send size={12} strokeWidth={2.5} />{sending ? 'Gönderiliyor...' : 'Portal Linki Oluştur'}
                      </button>
                    )}
                    {sel.status === 'approved' && !sel.client_id && (
                      <p style={{ fontSize: 11, color: 'var(--amber)', marginTop: 6 }}>⚠ Müşteri atanmamış</p>
                    )}
                    {portalLink && (
                      <div style={{ marginTop: 8, background: 'var(--s3)', borderRadius: 7, padding: '8px 10px', fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'var(--blue)', wordBreak: 'break-all', border: '1px solid rgba(78,168,240,.15)' }}>
                        📋 {portalLink}
                      </div>
                    )}
                  </div>
                </div>

                {/* Adım 4: Müşteri Onayı */}
                <div className="step" style={{ borderBottom: 'none' }}>
                  <div className="step-num" style={{
                    background: sel.client_status === 'client_approved' ? 'var(--green2)' : sel.client_status === 'client_rejected' ? 'var(--red2)' : 'var(--s4)',
                    color: sel.client_status === 'client_approved' ? 'var(--green)' : sel.client_status === 'client_rejected' ? 'var(--red)' : 'var(--tx3)',
                  }}>4</div>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600 }}>Müşteri Onayı</p>
                    <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>
                      {sel.client_status === 'client_approved' ? '✓ Müşteri onayladı'
                        : sel.client_status === 'client_rejected' ? '✕ Müşteri reddetti'
                        : 'Bekliyor...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detay bilgiler */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { l: 'Tür',     v: TYPE_L[sel.type] || sel.type },
                  { l: 'Müşteri', v: sel.client?.name || '— Atanmamış' },
                  { l: 'Oluşturuldu', v: fmtDateTime(sel.created_at) },
                  { l: 'Çözüldü', v: sel.resolved_at ? fmtDateTime(sel.resolved_at) : '—' },
                ].map(f => (
                  <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--s2)', borderRadius: 7 }}>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{f.l}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{f.v}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ width: 280, borderLeft: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--tx3)', fontSize: 13 }}>
              <Link2 size={24} strokeWidth={1.5} style={{ opacity: .3 }} />
              Talep seçin
            </div>
          )}
        </div>
      </div>
      {/* Yeni Onay Modal */}
      {newModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setNewModal(false) }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p className="modal-title" style={{ margin: 0 }}>Onay Talebi Oluştur</p>
              <button onClick={() => setNewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Başlık *</label>
                <input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} placeholder="Onay başlığı..." className="inp" autoFocus />
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Tür</label>
                  <select value={newForm.type} onChange={e => setNewForm(p => ({ ...p, type: e.target.value }))} className="inp">
                    <option value="content">İçerik</option>
                    <option value="project">Proje</option>
                    <option value="invoice">Fatura</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Müşteri</label>
                  <select value={newForm.client_id} onChange={e => setNewForm(p => ({ ...p, client_id: e.target.value }))} className="inp">
                    <option value="">— Seçin —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Not / Açıklama</label>
                <textarea value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))} className="inp" rows={3} placeholder="Brief, açıklama veya link..." />
              </div>
              <div style={{ background: 'var(--blue2)', borderRadius: 9, padding: '10px 14px', fontSize: 12.5, color: 'var(--blue)', border: '1px solid rgba(78,168,240,.15)', lineHeight: 1.6 }}>
                💡 Talep oluşturulduktan sonra Onay sayfasından iç onayı verin, ardından müşteriye portal linki gönderin.
              </div>
              <button className="btn" onClick={createApproval} disabled={creating || !newForm.title.trim()} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                {creating ? 'Oluşturuluyor...' : 'Onay Talebi Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
