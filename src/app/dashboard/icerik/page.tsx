'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, X, Send, Upload, Download, Trash2, ChevronDown, AlertCircle, CheckCircle, Clock, RotateCcw, Eye } from 'lucide-react'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'tiktok',    label: 'TikTok',    emoji: '🎵' },
  { value: 'linkedin',  label: 'LinkedIn',  emoji: '💼' },
  { value: 'youtube',   label: 'YouTube',   emoji: '▶️' },
  { value: 'genel',     label: 'Genel',     emoji: '🌐' },
]

const TYPES = [
  { value: 'post',   label: 'Post',   icon: '🖼' },
  { value: 'story',  label: 'Story',  icon: '⭕' },
  { value: 'reels',  label: 'Reels',  icon: '🎬' },
  { value: 'blog',   label: 'Blog',   icon: '📝' },
  { value: 'ad',     label: 'Reklam', icon: '📣' },
  { value: 'other',  label: 'Diğer',  icon: '📌' },
]

const COLUMNS = [
  { id: 'draft',     label: 'Taslak',       color: '#6b7280', bg: 'rgba(107,114,128,.1)' },
  { id: 'pending',   label: 'İç Onay',      color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
  { id: 'approved',  label: 'Müşteri Onayı',color: '#3b82f6', bg: 'rgba(59,130,246,.1)'  },
  { id: 'revision',  label: 'Revizyon',     color: '#ef4444', bg: 'rgba(239,68,68,.1)'   },
  { id: 'published', label: 'Yayında',      color: '#22c55e', bg: 'rgba(34,197,94,.1)'   },
]

// Hangi durumdan hangi duruma geçilebilir (role bazlı da kontrol edilir)
const TRANSITIONS: Record<string, string[]> = {
  draft:     ['pending'],
  pending:   ['approved', 'revision', 'draft'],
  approved:  ['published', 'revision'],
  revision:  ['pending', 'draft'],
  published: [],
}

const emptyForm = () => ({
  title: '', caption: '', client_id: '', platform: 'instagram',
  type: 'post', assigned_to: '', publish_date: '', notes: ''
})

function fmtDate(s: string | null) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function fmtSize(b: number) {
  if (!b) return ''
  if (b < 1024) return b + 'B'
  if (b < 1048576) return (b/1024).toFixed(0) + 'KB'
  return (b/1048576).toFixed(1) + 'MB'
}

function fileIcon(name: string) {
  const ext = name?.split('.').pop()?.toLowerCase() || ''
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼'
  if (['mp4','mov','avi','webm'].includes(ext)) return '🎬'
  if (['pdf'].includes(ext)) return '📄'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['zip','rar'].includes(ext)) return '📦'
  return '📎'
}

export default function IcerikPage() {
  const [items,    setItems]    = useState<any[]>([])
  const [clients,  setClients]  = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [myId,     setMyId]     = useState('')
  const [myRole,   setMyRole]   = useState('')
  const [modal,    setModal]    = useState(false)
  const [sel,      setSel]      = useState<any>(null)
  const [selFiles, setSelFiles] = useState<any[]>([])
  const [toast,    setToast]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState<any>(emptyForm())
  const [saving,   setSaving]   = useState(false)
  const [filterClient,   setFilterClient]   = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  // Dosya yükleme
  const [uploadFiles, setUploadFiles]   = useState<File[]>([])
  const [uploadNote,  setUploadNote]    = useState('')
  const [uploading,   setUploading]     = useState(false)
  // Revizyon notu
  const [revNote, setRevNote] = useState('')
  const [showRevModal, setShowRevModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Seçili içeriğin dosyalarını yükle
  const loadFiles = useCallback(async (contentId: string) => {
    const sb = createClient()
    const { data } = await sb.from('content_files')
      .select('*, uploader:uploaded_by(full_name)')
      .eq('content_id', contentId)
      .order('version', { ascending: false })
    setSelFiles(data || [])
  }, [])

  useEffect(() => {
    if (sel?.id) loadFiles(sel.id)
    else setSelFiles([])
  }, [sel?.id, loadFiles])

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
      notes: form.notes, created_by: user?.id
    })
    if (error) showToast('Hata: ' + error.message)
    else { showToast('İçerik oluşturuldu ✓'); setModal(false); setForm(emptyForm()); load() }
    setSaving(false)
  }

  async function changeStatus(id: string, status: string, note?: string) {
    const item = items.find(x => x.id === id) || sel
    if (myRole === 'member' && item?.assigned_to !== myId) { showToast('Yetki yok'); return }
    const sb = createClient()

    // Onaya gönderilince approval kaydı oluştur
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

    const updateData: any = { status }
    if (note) updateData.revision_note = note
    if (status !== 'revision') updateData.revision_note = null

    const { error } = await sb.from('contents').update(updateData).eq('id', id)
    if (error) { showToast('Hata: ' + error.message); return }
    setItems(prev => prev.map(x => x.id === id ? { ...x, status, revision_note: note || null } : x))
    if (sel?.id === id) setSel((s: any) => s ? { ...s, status, revision_note: note || null } : null)
    showToast(COLUMNS.find(c => c.id === status)?.label + ' ✓')
    setShowRevModal(false)
    setRevNote('')
  }

  // Dosya yükle
  async function uploadContentFiles() {
    if (!uploadFiles.length || !sel) return
    setUploading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()

    // Mevcut en yüksek versiyon
    const maxVersion = selFiles.length ? Math.max(...selFiles.map(f => f.version)) : 0

    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i]
      const version = maxVersion + i + 1
      const path = `${sel.id}/v${version}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      const { error: upErr } = await sb.storage.from('content-files').upload(path, file, { upsert: false })
      if (upErr) { showToast('Yükleme hatası: ' + upErr.message); setUploading(false); return }

      const { data: { publicUrl } } = sb.storage.from('content-files').getPublicUrl(path)

      await sb.from('content_files').insert({
        content_id: sel.id, file_name: file.name, file_url: publicUrl,
        file_size: file.size, version, note: uploadNote || null, uploaded_by: user?.id
      })
    }

    setUploadFiles([])
    setUploadNote('')
    await loadFiles(sel.id)
    showToast(`${uploadFiles.length} dosya yüklendi ✓`)
    setUploading(false)
  }

  async function deleteFile(fileId: string, fileUrl: string) {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return
    const sb = createClient()
    // Storage'dan sil
    const path = fileUrl.split('/content-files/')[1]
    if (path) await sb.storage.from('content-files').remove([path])
    await sb.from('content_files').delete().eq('id', fileId)
    setSelFiles(prev => prev.filter(f => f.id !== fileId))
    showToast('Dosya silindi')
  }

  async function deleteContent(id: string) {
    if (!confirm('Bu içeriği silmek istediğinize emin misiniz?')) return
    const sb = createClient()
    await sb.from('contents').delete().eq('id', id)
    setItems(prev => prev.filter(x => x.id !== id))
    setSel(null)
    showToast('Silindi')
  }

  // Drag & drop
  function onDragStart(id: string) { setDragging(id) }
  function onDragOver(e: React.DragEvent, col: string) { e.preventDefault(); setDragOver(col) }
  function onDrop(col: string) {
    if (dragging && dragging !== col) {
      const item = items.find(x => x.id === dragging)
      if (item && TRANSITIONS[item.status]?.includes(col)) {
        if (col === 'revision') {
          setSel(item)
          setShowRevModal(true)
        } else {
          changeStatus(dragging, col)
        }
      } else {
        showToast('Bu geçiş yapılamaz')
      }
    }
    setDragging(null); setDragOver(null)
  }

  const filtered = items.filter(i => {
    if (filterClient !== 'all' && i.client_id !== filterClient) return false
    if (filterPlatform !== 'all' && i.platform !== filterPlatform) return false
    return true
  })

  const colItems = (colId: string) => filtered.filter(i => i.status === colId)

  return (
    <>
      <style>{`
        .kb-wrap{display:flex;gap:12px;overflow-x:auto;padding:16px;flex:1;align-items:flex-start}
        .kb-wrap::-webkit-scrollbar{height:6px}.kb-wrap::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}
        .kb-col{flex-shrink:0;width:255px;display:flex;flex-direction:column;gap:8px;border-radius:12px;padding:10px;min-height:120px;transition:background .15s,outline .15s}
        .kb-col.dov{background:rgba(124,106,247,.07);outline:2px dashed var(--ac)}
        .kb-col-h{display:flex;align-items:center;justify-content:space-between;padding:4px 2px 10px}
        .kb-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:12px;cursor:pointer;transition:all .12s;user-select:none}
        .kb-card:hover{border-color:var(--bdr2);transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
        .kb-card.sel{border-color:var(--ac);background:var(--ac2)}
        .kb-card.drag{opacity:.35}
        .detail{width:330px;flex-shrink:0;border-left:1px solid var(--bdr);overflow-y:auto;display:flex;flex-direction:column}
        .detail-body{padding:18px;display:flex;flex-direction:column;gap:14px;flex:1}
        .chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid var(--bdr);color:var(--tx3);background:var(--s2)}
        .fbar{display:flex;gap:6px;padding:10px 16px;border-bottom:1px solid var(--bdr);overflow-x:auto;flex-shrink:0;align-items:center}
        .fbar::-webkit-scrollbar{height:0}
        .fbtn{padding:4px 11px;border-radius:20px;font-size:11.5px;font-weight:600;cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--tx3);white-space:nowrap;transition:all .12s}
        .fbtn.on{background:var(--ac);color:#fff;border-color:var(--ac)}
        .inp{background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:9px 12px;color:var(--tx);font-size:13px;width:100%;outline:none;box-sizing:border-box}
        .inp:focus{border-color:var(--ac)}
        .lbl{font-size:10.5px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;display:block}
        .mbg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:14px}
        .tr-btn{width:100%;padding:9px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--bdr);background:var(--s2);color:var(--tx);transition:all .12s;text-align:left;display:flex;align-items:center;gap:8px}
        .tr-btn:hover{border-color:var(--bdr2);background:var(--s3)}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .drop-area{border:2px dashed var(--bdr);border-radius:10px;padding:18px;text-align:center;cursor:pointer;transition:border-color .15s}
        .drop-area:hover{border-color:var(--ac)}
        .file-row{display:flex;align-items:center;gap:8px;padding:9px 10px;background:var(--s2);border-radius:8px;margin-bottom:5px}
        .rev-badge{display:flex;align-items:flex-start;gap:8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:10px 12px}
        @media(max-width:900px){.detail{display:none}.kb-col{width:220px}}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
        <TopBar title="İçerik Merkezi" subtitle={`${items.length} içerik`} action={
          <button className="btn" style={{background:'var(--ac)',color:'#fff',border:'none'}}
            onClick={() => { setForm(emptyForm()); setModal(true) }}>
            <Plus size={13} strokeWidth={2}/> Yeni İçerik
          </button>
        }/>

        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}

        {/* Filtre */}
        <div className="fbar">
          <span style={{fontSize:10.5,fontWeight:700,color:'var(--tx3)',marginRight:2}}>MARKA</span>
          <button className={`fbtn${filterClient==='all'?' on':''}`} onClick={()=>setFilterClient('all')}>Tümü</button>
          {clients.map(c=>(
            <button key={c.id} className={`fbtn${filterClient===c.id?' on':''}`} onClick={()=>setFilterClient(c.id)}>
              {c.brand_name||c.name}
            </button>
          ))}
          <div style={{width:1,background:'var(--bdr)',margin:'0 4px',alignSelf:'stretch'}}/>
          <span style={{fontSize:10.5,fontWeight:700,color:'var(--tx3)',marginRight:2}}>PLATFORM</span>
          <button className={`fbtn${filterPlatform==='all'?' on':''}`} onClick={()=>setFilterPlatform('all')}>Tümü</button>
          {PLATFORMS.map(p=>(
            <button key={p.value} className={`fbtn${filterPlatform===p.value?' on':''}`} onClick={()=>setFilterPlatform(p.value)}>
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          {/* Kanban */}
          <div className="kb-wrap">
            {loading ? <div style={{color:'var(--tx3)',padding:40}}>Yükleniyor...</div> : (
              COLUMNS.map(col => (
                <div key={col.id}
                  className={`kb-col${dragOver===col.id?' dov':''}`}
                  onDragOver={e=>onDragOver(e,col.id)}
                  onDrop={()=>onDrop(col.id)}
                  onDragLeave={()=>setDragOver(null)}
                >
                  <div className="kb-col-h">
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:col.color,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:700,color:'var(--tx)'}}>{col.label}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,background:col.bg,color:col.color,padding:'2px 8px',borderRadius:20}}>
                      {colItems(col.id).length}
                    </span>
                  </div>

                  {colItems(col.id).length===0 && (
                    <div style={{textAlign:'center',color:'var(--tx3)',fontSize:11,padding:'16px 0',opacity:.4}}>Boş</div>
                  )}

                  {colItems(col.id).map(item=>(
                    <div key={item.id}
                      className={`kb-card${sel?.id===item.id?' sel':''}${dragging===item.id?' drag':''}`}
                      draggable
                      onDragStart={()=>onDragStart(item.id)}
                      onDragEnd={()=>{setDragging(null);setDragOver(null)}}
                      onClick={()=>setSel(sel?.id===item.id?null:item)}
                    >
                      <div style={{display:'flex',gap:4,marginBottom:7,flexWrap:'wrap'}}>
                        <span className="chip">{PLATFORMS.find(p=>p.value===item.platform)?.emoji} {PLATFORMS.find(p=>p.value===item.platform)?.label}</span>
                        <span className="chip">{TYPES.find(t=>t.value===item.type)?.icon} {TYPES.find(t=>t.value===item.type)?.label}</span>
                      </div>
                      <p style={{fontSize:13,fontWeight:600,color:'var(--tx)',marginBottom:5,lineHeight:1.4}}>{item.title}</p>
                      {item.caption&&(
                        <p style={{fontSize:11,color:'var(--tx3)',marginBottom:5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                          {item.caption}
                        </p>
                      )}
                      {item.revision_note&&(
                        <div style={{fontSize:11,color:'#ef4444',background:'rgba(239,68,68,.08)',borderRadius:6,padding:'4px 8px',marginBottom:5}}>
                          ⚠️ {item.revision_note}
                        </div>
                      )}
                      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                        {item.client&&(
                          <span style={{fontSize:11,color:'var(--tx3)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            🏷 {item.client.brand_name||item.client.name}
                          </span>
                        )}
                        {item.publish_date&&(
                          <span style={{fontSize:11,color:'var(--tx3)',whiteSpace:'nowrap'}}>📅 {fmtDate(item.publish_date)}</span>
                        )}
                      </div>
                      {item.assignee&&(
                        <div style={{marginTop:7,display:'flex',alignItems:'center',gap:5}}>
                          <div style={{width:18,height:18,borderRadius:'50%',background:'var(--ac)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:'#fff',flexShrink:0}}>
                            {item.assignee.full_name?.[0]||'?'}
                          </div>
                          <span style={{fontSize:11,color:'var(--tx3)'}}>{item.assignee.full_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Detay Paneli */}
          {sel&&(
            <div className="detail">
              <div className="detail-body">

                {/* Başlık */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',gap:4,marginBottom:6,flexWrap:'wrap'}}>
                      <span className="chip">{PLATFORMS.find(p=>p.value===sel.platform)?.emoji} {PLATFORMS.find(p=>p.value===sel.platform)?.label}</span>
                      <span className="chip">{TYPES.find(t=>t.value===sel.type)?.icon} {TYPES.find(t=>t.value===sel.type)?.label}</span>
                    </div>
                    <div style={{fontSize:15,fontWeight:700,lineHeight:1.4}}>{sel.title}</div>
                    {sel.client&&<div style={{fontSize:12,color:'var(--tx3)',marginTop:3}}>🏷 {sel.client.brand_name||sel.client.name}</div>}
                  </div>
                  <button onClick={()=>setSel(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--tx3)',padding:4,flexShrink:0}}><X size={15}/></button>
                </div>

                {/* Revizyon notu */}
                {sel.revision_note&&(
                  <div className="rev-badge">
                    <AlertCircle size={14} color="#ef4444" style={{flexShrink:0,marginTop:1}}/>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:'#ef4444',marginBottom:2}}>Revizyon Notu</div>
                      <div style={{fontSize:12,color:'var(--tx)',lineHeight:1.5}}>{sel.revision_note}</div>
                    </div>
                  </div>
                )}

                {/* Caption */}
                {sel.caption&&(
                  <div>
                    <span className="lbl">Caption</span>
                    <div style={{fontSize:12,color:'var(--tx)',lineHeight:1.6,background:'var(--s2)',borderRadius:8,padding:'10px 12px',whiteSpace:'pre-wrap',maxHeight:140,overflowY:'auto'}}>
                      {sel.caption}
                    </div>
                  </div>
                )}

                {/* Bilgiler */}
                <div style={{display:'flex',gap:16}}>
                  {sel.publish_date&&<div><span className="lbl">Yayın</span><div style={{fontSize:12}}>{fmtDate(sel.publish_date)}</div></div>}
                  {sel.assignee&&<div><span className="lbl">Sorumlu</span><div style={{fontSize:12}}>{sel.assignee.full_name}</div></div>}
                </div>

                {sel.notes&&(
                  <div>
                    <span className="lbl">Notlar</span>
                    <div style={{fontSize:12,color:'var(--tx3)',lineHeight:1.5}}>{sel.notes}</div>
                  </div>
                )}

                {/* ── DOSYALAR ── */}
                <div>
                  <span className="lbl">Dosyalar ({selFiles.length})</span>

                  {selFiles.length===0&&(
                    <div style={{fontSize:12,color:'var(--tx3)',textAlign:'center',padding:'12px 0',opacity:.6}}>Henüz dosya yok</div>
                  )}

                  {selFiles.map(f=>(
                    <div key={f.id} className="file-row">
                      <span style={{fontSize:18,flexShrink:0}}>{fileIcon(f.file_name)}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.file_name}</div>
                        <div style={{fontSize:10,color:'var(--tx3)'}}>
                          v{f.version} · {fmtSize(f.file_size)} · {f.uploader?.full_name||'—'}
                          {f.note&&<span> · {f.note}</span>}
                        </div>
                      </div>
                      <a href={`/api/download?url=${encodeURIComponent(f.file_url)}&name=${encodeURIComponent(f.file_name)}`}
                        download={f.file_name} title="İndir"
                        style={{color:'var(--ac)',display:'flex',alignItems:'center',padding:4}}>
                        <Download size={13}/>
                      </a>
                      {(myRole==='admin'||myRole==='manager')&&(
                        <button onClick={()=>deleteFile(f.id,f.file_url)}
                          style={{background:'none',border:'none',cursor:'pointer',color:'var(--tx3)',padding:4}}>
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Dosya yükle */}
                  <div style={{marginTop:8}}>
                    <div className="drop-area" onClick={()=>fileInputRef.current?.click()}>
                      <Upload size={18} color="var(--tx3)" style={{margin:'0 auto 6px'}}/>
                      <div style={{fontSize:12,color:'var(--tx3)'}}>
                        {uploadFiles.length>0 ? `${uploadFiles.length} dosya seçildi` : 'Dosya seçmek için tıklayın'}
                      </div>
                      <div style={{fontSize:10,color:'var(--tx3)',marginTop:2,opacity:.6}}>
                        {sel.status==='revision'?'Revize edilmiş dosyayı yükleyin':'Görsel, video, PDF...'}
                      </div>
                      <input ref={fileInputRef} type="file" multiple style={{display:'none'}}
                        onChange={e=>setUploadFiles(Array.from(e.target.files||[]))}
                        accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.pdf,.doc,.docx,.zip"/>
                    </div>

                    {uploadFiles.length>0&&(
                      <div style={{marginTop:8}}>
                        <input className="inp" placeholder="Versiyon notu (opsiyonel)..."
                          value={uploadNote} onChange={e=>setUploadNote(e.target.value)}
                          style={{marginBottom:8,fontSize:12,padding:'7px 10px'}}/>
                        <button className="btn" onClick={uploadContentFiles} disabled={uploading}
                          style={{width:'100%',justifyContent:'center',background:'var(--ac)',color:'#fff',border:'none',padding:'9px'}}>
                          <Upload size={13}/>{uploading?'Yükleniyor...':uploadFiles.length===1?'Dosyayı Yükle':`${uploadFiles.length} Dosyayı Yükle`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── GEÇİŞLER ── */}
                {TRANSITIONS[sel.status]?.length>0&&(
                  <div>
                    <span className="lbl">Durumu Değiştir</span>
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {TRANSITIONS[sel.status].map(next=>{
                        const col = COLUMNS.find(c=>c.id===next)!
                        return (
                          <button key={next} className="tr-btn"
                            style={{borderLeft:`3px solid ${col.color}`}}
                            onClick={()=>{
                              if(next==='revision'){setShowRevModal(true)}
                              else changeStatus(sel.id,next)
                            }}>
                            <span style={{color:col.color,fontSize:14}}>→</span>
                            {col.label}
                            {next==='pending'&&sel.status==='revision'&&<span style={{fontSize:10,color:'var(--tx3)',marginLeft:'auto'}}>Yeni versiyonu yüklediniz mi?</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Sil */}
                {(myRole==='admin'||myRole==='manager')&&(
                  <button onClick={()=>deleteContent(sel.id)}
                    style={{background:'none',border:'1px solid var(--red)',color:'var(--red)',borderRadius:8,padding:'8px',fontSize:12,fontWeight:600,cursor:'pointer',width:'100%',marginTop:'auto'}}>
                    İçeriği Sil
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revizyon Notu Modalı */}
      {showRevModal&&(
        <div className="mbg" onClick={e=>e.target===e.currentTarget&&setShowRevModal(false)}>
          <div className="modal" style={{maxWidth:400}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:15,fontWeight:700}}>Revizyon Notu</span>
              <button onClick={()=>setShowRevModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--tx3)'}}><X size={16}/></button>
            </div>
            <div style={{fontSize:12,color:'var(--tx3)'}}>Ekibe ne değiştirilmesi gerektiğini açıklayın.</div>
            <textarea className="inp" rows={4} value={revNote} onChange={e=>setRevNote(e.target.value)}
              placeholder="Örn: Renk tonu daha koyu olsun, logo solda olacak..." style={{resize:'vertical'}}/>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowRevModal(false)}
                style={{flex:1,background:'none',border:'1px solid var(--bdr)',borderRadius:8,padding:'9px',fontSize:13,cursor:'pointer',color:'var(--tx3)'}}>
                İptal
              </button>
              <button onClick={()=>changeStatus(sel?.id,'revision',revNote||undefined)}
                style={{flex:2,background:'#ef4444',color:'#fff',border:'none',borderRadius:8,padding:'9px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                Revizyona Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yeni İçerik Modalı */}
      {modal&&(
        <div className="mbg" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:16,fontWeight:700}}>Yeni İçerik</span>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--tx3)'}}><X size={18}/></button>
            </div>

            <div>
              <span className="lbl">Başlık *</span>
              <input className="inp" value={form.title} onChange={e=>setForm((p:any)=>({...p,title:e.target.value}))} placeholder="İçerik başlığı..."/>
            </div>

            <div className="g2">
              <div>
                <span className="lbl">Marka *</span>
                <select className="inp" value={form.client_id} onChange={e=>setForm((p:any)=>({...p,client_id:e.target.value}))}>
                  <option value="">— Seçin —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.brand_name||c.name}</option>)}
                </select>
              </div>
              <div>
                <span className="lbl">Sorumlu</span>
                <select className="inp" value={form.assigned_to} onChange={e=>setForm((p:any)=>({...p,assigned_to:e.target.value}))}>
                  <option value="">— Seçin —</option>
                  {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
            </div>

            <div className="g2">
              <div>
                <span className="lbl">Platform</span>
                <select className="inp" value={form.platform} onChange={e=>setForm((p:any)=>({...p,platform:e.target.value}))}>
                  {PLATFORMS.map(p=><option key={p.value} value={p.value}>{p.emoji} {p.label}</option>)}
                </select>
              </div>
              <div>
                <span className="lbl">Tür</span>
                <select className="inp" value={form.type} onChange={e=>setForm((p:any)=>({...p,type:e.target.value}))}>
                  {TYPES.map(t=><option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <span className="lbl">Yayın Tarihi</span>
              <input type="date" className="inp" value={form.publish_date} onChange={e=>setForm((p:any)=>({...p,publish_date:e.target.value}))}/>
            </div>

            <div>
              <span className="lbl">Caption / Metin</span>
              <textarea className="inp" rows={4} value={form.caption}
                onChange={e=>setForm((p:any)=>({...p,caption:e.target.value}))}
                placeholder="Paylaşım metni, hashtag'ler..." style={{resize:'vertical'}}/>
            </div>

            <div>
              <span className="lbl">Ekip Notu</span>
              <textarea className="inp" rows={2} value={form.notes}
                onChange={e=>setForm((p:any)=>({...p,notes:e.target.value}))}
                placeholder="Ekip içi notlar..." style={{resize:'vertical'}}/>
            </div>

            <button className="btn" onClick={add} disabled={saving}
              style={{background:'var(--ac)',color:'#fff',border:'none',width:'100%',justifyContent:'center',padding:'11px',fontSize:14}}>
              {saving?'Oluşturuluyor...':'İçerik Oluştur'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
