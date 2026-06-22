'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, Video, X, Copy, CheckCheck, Calendar, Clock, Users, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'
import ConfirmModal from '@/components/ConfirmModal'

const STATUS_MAP: Record<string,{l:string;c:string}> = {
  scheduled: {l:'Planlandı', c:'var(--blue)'},
  completed: {l:'Tamamlandı', c:'var(--green)'},
  cancelled:  {l:'İptal',    c:'var(--red)'},
}

export default function ToplantiPage() {
  const [meetings,    setMeetings]    = useState<any[]>([])
  const [profiles,    setProfiles]    = useState<any[]>([])
  const [clients,     setClients]     = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(false)
  const [sel,         setSel]         = useState<any>(null)
  const [toast,       setToast]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [copied,      setCopied]      = useState('')
  const [confirmId,   setConfirmId]   = useState<string|null>(null)
  const [googleConn,  setGoogleConn]  = useState(false)
  const [myId,        setMyId]        = useState('')
  const [filter,      setFilter]      = useState<'all'|'upcoming'|'past'>('upcoming')

  const [form, setForm] = useState({
    title: '', description: '', start_time: '', end_time: '',
    participants: [] as string[], client_id: '',
  })

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 3500) }

  async function load() {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) setMyId(user.id)

    const [m, p, c, gt] = await Promise.all([
      sb.from('meetings')
        .select('*, creator:profiles!meetings_created_by_fkey(full_name), client:clients(name), participants:meeting_participants(user_id, profile:profiles(full_name))')
        .order('start_time', { ascending: false }),
      sb.from('profiles').select('id,full_name,department').not('full_name','is',null),
      sb.from('clients').select('id,name').order('name'),
      sb.from('google_tokens').select('id').eq('user_id', user?.id || '').maybeSingle(),
    ])
    setMeetings(m.data || [])
    setProfiles((p.data || []).filter((x:any) => x.full_name))
    setClients(c.data || [])
    setGoogleConn(!!gt.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === '1') {
      showToast('✓ Google Calendar bağlandı!')
      window.history.replaceState({}, '', '/dashboard/toplanti')
    }
    if (params.get('error')) showToast('Hata: Google bağlantısı başarısız')
  }, [])

  async function createMeeting() {
    if (!form.title.trim() || !form.start_time || !form.end_time) {
      showToast('Hata: Başlık, başlangıç ve bitiş zorunlu')
      return
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      showToast('Hata: Bitiş saati başlangıçtan sonra olmalı')
      return
    }
    setSaving(true)
    const res = await fetch('/api/meetings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { showToast('Hata: ' + json.error); return }
    showToast(json.meetLink ? '✓ Toplantı oluşturuldu ve Meet linki hazır!' : '✓ Toplantı oluşturuldu (Google bağlı değil)')
    setModal(false)
    setForm({ title:'', description:'', start_time:'', end_time:'', participants:[], client_id:'' })
    load()
  }

  async function deleteMeeting(id: string) {
    await createClient().from('meetings').delete().eq('id', id)
    setMeetings(ms => ms.filter(m => m.id !== id))
    if (sel?.id === id) setSel(null)
    setConfirmId(null)
    showToast('Toplantı silindi.')
  }

  async function updateStatus(id: string, status: string) {
    await createClient().from('meetings').update({ status }).eq('id', id)
    setMeetings(ms => ms.map(m => m.id === id ? { ...m, status } : m))
    if (sel?.id === id) setSel((s:any) => s ? { ...s, status } : null)
  }

  async function copyLink(link: string, id: string) {
    try { await navigator.clipboard.writeText(link) } catch {}
    setCopied(id); setTimeout(() => setCopied(''), 2500)
  }

  const now = new Date()
  const filtered = meetings.filter(m => {
    if (filter === 'upcoming') return new Date(m.start_time) >= now && m.status === 'scheduled'
    if (filter === 'past') return new Date(m.start_time) < now || m.status !== 'scheduled'
    return true
  })

  const upcoming = meetings.filter(m => new Date(m.start_time) >= now && m.status === 'scheduled')

  function fmtDur(start: string, end: string) {
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000
    if (diff < 60) return `${diff} dk`
    return `${Math.floor(diff/60)}s ${diff%60>0 ? diff%60+'dk' : ''}`
  }

  return (
    <>
      <style>{`
        .mt-wrap{flex:1;display:flex;overflow:hidden}
        .mt-l{width:300px;border-right:1px solid var(--bdr);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
        .mt-r{flex:1;display:flex;flex-direction:column;overflow:hidden}
        .mt-card{padding:12px 14px;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .1s;border-left:3px solid transparent}
        .mt-card:hover:not(.sel){background:var(--s2)}
        .mt-card.sel{background:var(--ac2);border-left-color:var(--ac)}
        @media(max-width:768px){.mt-wrap{flex-direction:column}.mt-l{width:100%;max-height:260px}}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="Toplantılar" subtitle={`${upcoming.length} yaklaşan toplantı`} action={
          <button className="btn" onClick={() => setModal(true)}>
            <Plus size={14} strokeWidth={2}/>Toplantı Planla
          </button>
        }/>
        {toast && <div className={`toast ${toast.startsWith('Hata')?'toast-err':'toast-ok'}`}>{toast}</div>}

        {/* Google bağlantı uyarısı */}
        {!googleConn && (
          <div style={{padding:'10px 16px',background:'var(--amber2)',borderBottom:'1px solid rgba(240,168,67,.2)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:13,color:'var(--amber)'}}>⚠ Google Calendar bağlı değil — Meet linki otomatik oluşturulamaz</span>
            <a href="/api/auth/google"
              style={{fontSize:12.5,fontWeight:700,color:'var(--amber)',background:'rgba(240,168,67,.15)',padding:'5px 12px',borderRadius:7,border:'1px solid rgba(240,168,67,.3)',textDecoration:'none',display:'flex',alignItems:'center',gap:5}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google Calendar Bağla
            </a>
          </div>
        )}
        {googleConn && (
          <div style={{padding:'8px 16px',background:'var(--green2)',borderBottom:'1px solid rgba(34,211,160,.15)',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>
            <span style={{fontSize:12.5,color:'var(--green)',fontWeight:600}}>Google Calendar bağlı — Meet linkleri otomatik oluşturulur</span>
          </div>
        )}

        {/* Filtre */}
        <div style={{display:'flex',gap:6,padding:'10px 14px',borderBottom:'1px solid var(--bdr)',background:'var(--s1)',flexShrink:0}}>
          {([['upcoming','Yaklaşan'],['all','Tümü'],['past','Geçmiş']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{padding:'5px 12px',borderRadius:8,border:`1px solid ${filter===k?'var(--ac)':'var(--bdr)'}`,background:filter===k?'var(--ac2)':'var(--s2)',color:filter===k?'var(--ac)':'var(--tx2)',fontSize:12.5,fontWeight:filter===k?700:400,cursor:'pointer'}}>
              {l} {k==='upcoming'?`(${upcoming.length})`:''}
            </button>
          ))}
        </div>

        <div className="mt-wrap">
          {/* Liste */}
          <div className="mt-l">
            <div style={{flex:1,overflowY:'auto'}}>
              {loading ? <p style={{padding:16,color:'var(--tx3)',fontSize:13}}>Yükleniyor...</p>
              : filtered.length === 0 ? (
                <div style={{padding:24,textAlign:'center',color:'var(--tx3)',fontSize:13}}>
                  <Calendar size={24} strokeWidth={1.5} style={{opacity:.3,display:'block',margin:'0 auto 8px'}}/>
                  {filter==='upcoming' ? 'Yaklaşan toplantı yok' : 'Toplantı yok'}
                </div>
              ) : filtered.map(m => {
                const st = STATUS_MAP[m.status] || STATUS_MAP.scheduled
                const isPast = new Date(m.start_time) < now
                return (
                  <div key={m.id} className={`mt-card${sel?.id===m.id?' sel':''}`} onClick={() => setSel(m)}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:5}}>
                      <p style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,color:sel?.id===m.id?'var(--ac)':'var(--tx)'}}>{m.title}</p>
                      <span style={{fontSize:10.5,fontWeight:700,padding:'2px 7px',borderRadius:5,background:`${st.c}15`,color:st.c,flexShrink:0}}>{st.l}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <Clock size={10} style={{color:'var(--tx3)'}} strokeWidth={2}/>
                      <span style={{fontSize:11.5,color:isPast?'var(--tx3)':'var(--blue)',fontFamily:'JetBrains Mono,monospace'}}>
                        {new Date(m.start_time).toLocaleDateString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                    {m.meet_link && (
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <Video size={10} style={{color:'var(--green)'}} strokeWidth={2}/>
                        <span style={{fontSize:11,color:'var(--green)'}}>Meet linki var</span>
                      </div>
                    )}
                    {m.client?.name && (
                      <p style={{fontSize:11,color:'var(--tx3)',marginTop:3}}>🏢 {m.client.name}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detay */}
          {sel ? (
            <div className="mt-r">
              <div style={{padding:'14px 18px',borderBottom:'1px solid var(--bdr)',display:'flex',alignItems:'center',gap:10,flexShrink:0,background:'var(--s2)'}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:15,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sel.title}</p>
                  <p style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>{sel.creator?.full_name} tarafından oluşturuldu</p>
                </div>
                <button onClick={() => setSel(null)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={16}/></button>
              </div>

              <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>
                {/* Meet linki */}
                {sel.meet_link ? (
                  <div style={{background:'var(--green2)',border:'1px solid rgba(34,211,160,.2)',borderRadius:12,padding:'14px 16px',marginBottom:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <Video size={16} style={{color:'var(--green)'}} strokeWidth={2}/>
                      <span style={{fontSize:13.5,fontWeight:700,color:'var(--green)'}}>Google Meet Linki</span>
                    </div>
                    <p style={{fontSize:12,fontFamily:'JetBrains Mono,monospace',color:'var(--green)',marginBottom:10,wordBreak:'break-all'}}>{sel.meet_link}</p>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={() => copyLink(sel.meet_link, sel.id)}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:'rgba(34,211,160,.15)',border:'1px solid rgba(34,211,160,.3)',borderRadius:8,cursor:'pointer',fontSize:12.5,fontWeight:600,color:'var(--green)'}}>
                        {copied===sel.id ? <><CheckCheck size={13}/>Kopyalandı!</> : <><Copy size={13}/>Kopyala</>}
                      </button>
                      <a href={sel.meet_link} target="_blank" rel="noreferrer"
                        style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:'var(--green)',border:'none',borderRadius:8,cursor:'pointer',fontSize:12.5,fontWeight:700,color:'#fff',textDecoration:'none'}}>
                        <ExternalLink size={13}/>Toplantıya Katıl
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{background:'var(--s2)',border:'1px solid var(--bdr)',borderRadius:12,padding:'14px 16px',marginBottom:14,textAlign:'center'}}>
                    <Video size={20} strokeWidth={1.5} style={{opacity:.3,display:'block',margin:'0 auto 6px'}}/>
                    <p style={{fontSize:13,color:'var(--tx3)'}}>Meet linki yok — Google Calendar bağla</p>
                    {!googleConn && <a href="/api/auth/google" style={{fontSize:12.5,color:'var(--ac)',fontWeight:600}}>Bağla →</a>}
                  </div>
                )}

                {/* Detaylar */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                  {[
                    {l:'Başlangıç', v: fmtDateTime(sel.start_time)},
                    {l:'Bitiş',    v: fmtDateTime(sel.end_time)},
                    {l:'Süre',     v: fmtDur(sel.start_time, sel.end_time)},
                    {l:'Müşteri',  v: sel.client?.name || '—'},
                  ].map(f => (
                    <div key={f.l} style={{background:'var(--s2)',borderRadius:9,padding:'10px 12px',border:'1px solid var(--bdr)'}}>
                      <p style={{fontSize:10.5,color:'var(--tx3)',marginBottom:4}}>{f.l}</p>
                      <p style={{fontSize:13,fontWeight:500}}>{f.v}</p>
                    </div>
                  ))}
                </div>

                {sel.description && (
                  <div style={{background:'var(--s2)',borderRadius:9,padding:'12px 14px',border:'1px solid var(--bdr)',marginBottom:14}}>
                    <p style={{fontSize:11,color:'var(--tx3)',marginBottom:5}}>Açıklama</p>
                    <p style={{fontSize:13.5,color:'var(--tx2)',lineHeight:1.7}}>{sel.description}</p>
                  </div>
                )}

                {/* Katılımcılar */}
                {sel.participants?.length > 0 && (
                  <div style={{marginBottom:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:9}}>Katılımcılar ({sel.participants.length})</p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                      {sel.participants.map((p:any) => (
                        <div key={p.user_id} style={{display:'flex',alignItems:'center',gap:7,background:'var(--s2)',borderRadius:8,padding:'6px 10px',border:'1px solid var(--bdr)'}}>
                          <div style={{width:22,height:22,borderRadius:'50%',background:'var(--ac2)',color:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800}}>
                            {(p.profile?.full_name||'?').slice(0,2).toUpperCase()}
                          </div>
                          <span style={{fontSize:12.5,fontWeight:500}}>{p.profile?.full_name||'—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Durum */}
                <div style={{marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:9}}>Durum Güncelle</p>
                  <div style={{display:'flex',gap:8}}>
                    {Object.entries(STATUS_MAP).map(([k,v]) => (
                      <button key={k} onClick={() => updateStatus(sel.id, k)}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:`1px solid ${sel.status===k?v.c:'var(--bdr)'}`,background:sel.status===k?`${v.c}15`:'var(--s2)',color:sel.status===k?v.c:'var(--tx2)',fontSize:12.5,fontWeight:sel.status===k?700:400,cursor:'pointer'}}>
                        {k==='completed'&&<CheckCircle2 size={12}/>}
                        {v.l} {sel.status===k&&'✓'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sil */}
                <button onClick={() => setConfirmId(sel.id)}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,border:'none',background:'var(--red2)',color:'var(--red)',cursor:'pointer',fontSize:13,fontWeight:600}}>
                  <Trash2 size={13}/>Toplantıyı Sil
                </button>
              </div>
            </div>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8,color:'var(--tx3)',fontSize:13}}>
              <Calendar size={28} strokeWidth={1.5} style={{opacity:.3}}/>
              Toplantı seçin
            </div>
          )}
        </div>
      </div>

      {/* Toplantı Oluştur Modal */}
      {modal && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setModal(false) }}>
          <div className="modal" style={{maxWidth:480}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
              <p className="modal-title" style={{margin:0}}>📅 Toplantı Planla</p>
              <button onClick={() => setModal(false)} style={{background:'none',border:'none',color:'var(--tx3)',cursor:'pointer'}}><X size={16}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:13}}>
              <div>
                <label className="label">Başlık *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Toplantı başlığı..." className="inp" autoFocus/>
              </div>
              <div className="modal-grid">
                <div>
                  <label className="label">Başlangıç *</label>
                  <input type="datetime-local" value={form.start_time} onChange={e=>setForm(f=>({...f,start_time:e.target.value}))} className="inp"/>
                </div>
                <div>
                  <label className="label">Bitiş *</label>
                  <input type="datetime-local" value={form.end_time} onChange={e=>setForm(f=>({...f,end_time:e.target.value}))} className="inp"/>
                </div>
              </div>
              <div>
                <label className="label">Müşteri</label>
                <select value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))} className="inp">
                  <option value="">— Seçin —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Katılımcılar</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,padding:'8px',background:'var(--s3)',borderRadius:9,border:'1px solid var(--bdr)',minHeight:42}}>
                  {profiles.map(p => {
                    const sel = form.participants.includes(p.id)
                    return (
                      <button key={p.id} onClick={() => setForm(f => ({
                        ...f, participants: sel ? f.participants.filter(x=>x!==p.id) : [...f.participants, p.id]
                      }))}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'4px 9px',borderRadius:6,border:`1px solid ${sel?'var(--ac)':'var(--bdr)'}`,background:sel?'var(--ac2)':'var(--s2)',color:sel?'var(--ac)':'var(--tx2)',fontSize:12,fontWeight:sel?600:400,cursor:'pointer'}}>
                        {sel && <CheckCircle2 size={11} strokeWidth={2.5}/>}
                        {p.full_name}
                      </button>
                    )
                  })}
                </div>
                <p style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>{form.participants.length} kişi seçildi</p>
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="inp" rows={2} placeholder="Toplantı notları..."/>
              </div>
              {!googleConn && (
                <div style={{padding:'10px 12px',background:'var(--amber2)',borderRadius:8,fontSize:12.5,color:'var(--amber)',border:'1px solid rgba(240,168,67,.2)'}}>
                  ⚠ Google Calendar bağlı değil — Meet linki oluşturulamaz. Toplantı kaydedilir ama link olmaz.
                </div>
              )}
              <button onClick={createMeeting} disabled={saving || !form.title.trim() || !form.start_time || !form.end_time}
                className="btn" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14}}>
                {saving ? 'Oluşturuluyor...' : googleConn ? '📅 Toplantı Oluştur + Meet Linki' : '📅 Toplantı Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmId}
        title="Toplantıyı Sil"
        message="Bu toplantıyı silmek istediğinize emin misiniz?"
        onConfirm={() => confirmId && deleteMeeting(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </>
  )
}
