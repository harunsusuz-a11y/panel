'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, Trash2, Bell, BellOff, Edit3, Check, X, MessageSquare, Clock, StickyNote } from 'lucide-react'

type Note = {
  id: string
  title: string
  content: string
  reminder_at: string | null
  sms_enabled: boolean
  sms_sent: boolean
  created_at: string
  updated_at: string
}

function fmtDt(s: string | null) {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(val: string) {
  if (!val) return null
  return new Date(val).toISOString()
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPhone, setHasPhone] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    content: '',
    reminder_at: '',
    sms_enabled: false,
  })

  const fetchNotes = useCallback(async () => {
    const res = await fetch('/api/notes')
    const json = await res.json()
    setNotes(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotes()
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('phone').eq('id', user.id).single().then(({ data }) => {
        setHasPhone(!!(data?.phone))
      })
    })
  }, [fetchNotes])

  function openNew() {
    setEditId(null)
    setForm({ title: '', content: '', reminder_at: '', sms_enabled: false })
    setShowForm(true)
  }

  function openEdit(n: Note) {
    setEditId(n.id)
    setForm({
      title: n.title,
      content: n.content,
      reminder_at: toLocalInput(n.reminder_at),
      sms_enabled: n.sms_enabled,
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const body = {
      title: form.title,
      content: form.content,
      reminder_at: fromLocalInput(form.reminder_at),
      sms_enabled: form.sms_enabled,
    }
    if (editId) {
      await fetch(`/api/notes/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    setShowForm(false)
    fetchNotes()
  }

  async function deleteNote(id: string) {
    setDeleting(id)
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    setDeleting(null)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const isPast = (iso: string | null) => iso ? new Date(iso) < new Date() : false

  return (
    <>
      <style>{`
        .note-card{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,transform .15s}
        .note-card:hover{border-color:var(--ac);transform:translateY(-1px)}
        .notes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;width:100%;max-width:480px;padding:24px;display:flex;flex-direction:column;gap:16px}
        .inp{background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:10px 12px;color:var(--tx);font-size:13.5px;width:100%;outline:none;transition:border-color .15s}
        .inp:focus{border-color:var(--ac)}
        .inp::placeholder{color:var(--tx3)}
        .ta{resize:vertical;min-height:90px;font-family:inherit}
        .sms-toggle{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--s2);border:1px solid var(--bdr);border-radius:8px;cursor:pointer;transition:border-color .15s}
        .sms-toggle:hover{border-color:var(--ac)}
        @media(max-width:600px){.notes-grid{grid-template-columns:1fr}}
      `}</style>

      <TopBar
        title="Notlarım"
        subtitle="Kişisel not ve hatırlatmalar"
        action={
          <button onClick={openNew} style={{ display:'flex',alignItems:'center',gap:6,background:'var(--ac)',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontSize:13,fontWeight:600,cursor:'pointer' }}>
            <Plus size={14} strokeWidth={2.5} /> Yeni Not
          </button>
        }
      />

      <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
        {!hasPhone && (
          <div style={{ background:'rgba(242,87,87,.08)',border:'1px solid rgba(242,87,87,.25)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12.5,color:'var(--red)',display:'flex',alignItems:'center',gap:8 }}>
            <MessageSquare size={13} strokeWidth={2} />
            Profil sayfandan telefon numaranı eklersen hatırlatma SMS&apos;i alabilirsin.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center',padding:60,color:'var(--tx3)',fontSize:14 }}>Yükleniyor...</div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign:'center',padding:80,color:'var(--tx3)' }}>
            <StickyNote size={40} style={{ margin:'0 auto 12px',opacity:.3 }} />
            <p style={{ fontSize:14 }}>Henüz not yok</p>
            <p style={{ fontSize:12,marginTop:4 }}>Sağ üstten yeni not ekleyebilirsin</p>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map(n => {
              const past = isPast(n.reminder_at)
              return (
                <div key={n.id} className="note-card">
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8 }}>
                    <h3 style={{ fontSize:14,fontWeight:600,flex:1,lineHeight:1.4 }}>{n.title || 'Başlıksız'}</h3>
                    <div style={{ display:'flex',gap:4,flexShrink:0 }}>
                      <button onClick={() => openEdit(n)} style={{ background:'var(--s3)',border:'none',borderRadius:6,padding:'5px',cursor:'pointer',color:'var(--tx2)',display:'flex' }}>
                        <Edit3 size={12} strokeWidth={2} />
                      </button>
                      <button onClick={() => deleteNote(n.id)} disabled={deleting===n.id} style={{ background:'var(--red2)',border:'none',borderRadius:6,padding:'5px',cursor:'pointer',color:'var(--red)',display:'flex' }}>
                        <Trash2 size={12} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {n.content && (
                    <p style={{ fontSize:12.5,color:'var(--tx2)',lineHeight:1.6,whiteSpace:'pre-wrap' }}>{n.content}</p>
                  )}

                  {n.reminder_at && (
                    <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:11.5,color: past&&n.sms_sent ? 'var(--green)' : past ? 'var(--red)' : 'var(--ac)',background: past&&n.sms_sent ? 'var(--green2)' : past ? 'var(--red2)' : 'var(--ac2)',borderRadius:6,padding:'4px 8px' }}>
                      <Clock size={11} strokeWidth={2} />
                      {fmtDt(n.reminder_at)}
                      {past && n.sms_sent && <span style={{marginLeft:2}}>· SMS gönderildi ✓</span>}
                      {past && !n.sms_sent && n.sms_enabled && <span style={{marginLeft:2}}>· SMS bekliyor...</span>}
                      {past && !n.sms_enabled && <span style={{marginLeft:2}}>· Geçti</span>}
                    </div>
                  )}

                  {n.sms_enabled && (
                    <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--tx3)' }}>
                      <MessageSquare size={11} strokeWidth={2} style={{color:'var(--green)'}} />
                      SMS hatırlatma aktif
                    </div>
                  )}

                  <p style={{ fontSize:10.5,color:'var(--tx3)',marginTop:'auto' }}>
                    {new Date(n.updated_at).toLocaleDateString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-bg" onClick={e => { if (e.target===e.currentTarget) setShowForm(false) }}>
          <div className="modal">
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <h2 style={{ fontSize:16,fontWeight:700 }}>{editId ? 'Notu Düzenle' : 'Yeni Not'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--tx3)',display:'flex' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <input
              className="inp"
              placeholder="Başlık *"
              value={form.title}
              onChange={e => setForm(f => ({...f, title: e.target.value}))}
            />

            <textarea
              className="inp ta"
              placeholder="Not içeriği..."
              value={form.content}
              onChange={e => setForm(f => ({...f, content: e.target.value}))}
            />

            <div>
              <label style={{ fontSize:11.5,color:'var(--tx3)',display:'block',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em' }}>
                <Bell size={10} strokeWidth={2} style={{display:'inline',marginRight:4}} />
                Hatırlatma Zamanı
              </label>
              <input
                type="datetime-local"
                className="inp"
                value={form.reminder_at}
                onChange={e => setForm(f => ({...f, reminder_at: e.target.value}))}
              />
            </div>

            {form.reminder_at && (
              <div
                className="sms-toggle"
                onClick={() => {
                  if (!hasPhone) return
                  setForm(f => ({...f, sms_enabled: !f.sms_enabled}))
                }}
                style={{ opacity: hasPhone ? 1 : 0.5, cursor: hasPhone ? 'pointer' : 'not-allowed' }}
              >
                <div style={{ width:36,height:20,borderRadius:10,background:form.sms_enabled?'var(--green)':'var(--s4)',position:'relative',transition:'background .2s',flexShrink:0 }}>
                  <div style={{ width:16,height:16,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:form.sms_enabled?18:2,transition:'left .2s' }} />
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13,fontWeight:600,color:'var(--tx)' }}>SMS Hatırlatma</p>
                  <p style={{ fontSize:11,color:'var(--tx3)',marginTop:2 }}>
                    {hasPhone ? 'Belirlenen saatte profilindeki numaraya SMS gönderilir' : 'Profil sayfandan önce telefon numarası ekle'}
                  </p>
                </div>
                {form.sms_enabled ? <MessageSquare size={15} style={{color:'var(--green)',flexShrink:0}} /> : <BellOff size={15} style={{color:'var(--tx3)',flexShrink:0}} />}
              </div>
            )}

            <div style={{ display:'flex',gap:8,marginTop:4 }}>
              <button onClick={() => setShowForm(false)} style={{ flex:1,padding:'10px',background:'var(--s3)',border:'none',borderRadius:8,cursor:'pointer',color:'var(--tx2)',fontSize:13,fontWeight:500 }}>
                İptal
              </button>
              <button onClick={save} disabled={saving||!form.title.trim()} style={{ flex:2,padding:'10px',background:'var(--ac)',border:'none',borderRadius:8,cursor:'pointer',color:'#fff',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6,opacity:saving||!form.title.trim()?0.6:1 }}>
                {saving ? 'Kaydediliyor...' : <><Check size={14} strokeWidth={2.5} /> {editId ? 'Güncelle' : 'Kaydet'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
