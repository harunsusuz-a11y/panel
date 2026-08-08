'use client'
import { useState, useRef } from 'react'
import { CheckCircle2, RotateCcw, Upload, X, FileText, Image, Film, Paperclip } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return <Image size={16} />
  if (['mp4','mov','avi','webm'].includes(ext)) return <Film size={16} />
  if (['pdf','doc','docx','xls','xlsx','ppt','pptx'].includes(ext)) return <FileText size={16} />
  return <Paperclip size={16} />
}

function fmtSize(b: number) {
  if (!b) return ''
  if (b < 1024) return b + 'B'
  if (b < 1048576) return (b/1024).toFixed(0) + 'KB'
  return (b/1048576).toFixed(1) + 'MB'
}

export default function ClientActions({ token, currentDecision, projectId }: {
  token: string
  currentDecision: string
  projectId?: string
}) {
  const [decision, setDecision] = useState(currentDecision || 'pending')
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)
  const [files, setFiles]       = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<{name:string;url:string}[]>([])
  const [uploadErr, setUploadErr] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function submitDecision(d: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/portal/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, decision: d, note })
      })
      if (res.ok) { setDecision(d); setDone(true) }
    } catch {}
    setSaving(false)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selected])
    e.target.value = ''
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_,i) => i !== idx))
  }

  async function uploadFiles() {
    if (!files.length) return
    setUploading(true)
    setUploadErr('')
    const results: {name:string;url:string}[] = []
    for (const file of files) {
      const path = `portal/${token}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
      const { error } = await sb.storage.from('project-files').upload(path, file, { upsert: true })
      if (error) { setUploadErr('Hata: ' + error.message); setUploading(false); return }
      const { data: { publicUrl } } = sb.storage.from('project-files').getPublicUrl(path)
      results.push({ name: file.name, url: publicUrl })
      // project_files tablosuna kaydet (varsa)
      if (projectId) {
        await sb.from('project_files').insert({
          project_id: projectId,
          name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          uploaded_by_client: true,
          is_client_visible: true,
          created_at: new Date().toISOString()
        }).select()
      }
    }
    setUploaded(prev => [...prev, ...results])
    setFiles([])
    setUploading(false)
  }

  const cardStyle = {
    background: '#131318',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16
  }

  return (
    <>
      {/* Dosya Yükleme */}
      <div style={cardStyle}>
        <p style={{fontSize:13,fontWeight:700,color:'#f0f0f5',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
          <Upload size={15} color="#7c6af7" /> Dosya Yükle
        </p>

        {/* Drop area */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed rgba(124,106,247,.35)',
            borderRadius: 10,
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: 12,
            transition: 'border-color .15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,106,247,.7)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(124,106,247,.35)')}
        >
          <Upload size={22} color="#7c6af7" style={{margin:'0 auto 8px'}} />
          <p style={{fontSize:13,color:'#9090a8'}}>Dosya seçmek için tıklayın</p>
          <p style={{fontSize:11,color:'#50506a',marginTop:4}}>PDF, DOC, XLS, resim, video — maks. 50MB</p>
          <input ref={inputRef} type="file" multiple style={{display:'none'}} onChange={onFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.zip,.rar" />
        </div>

        {/* Seçili dosyalar */}
        {files.length > 0 && (
          <div style={{marginBottom:12}}>
            {files.map((f,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'rgba(255,255,255,.04)',borderRadius:8,marginBottom:6}}>
                <span style={{color:'#7c6af7'}}>{fileIcon(f.name)}</span>
                <span style={{flex:1,fontSize:12,color:'#d0d0e0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                <span style={{fontSize:11,color:'#50506a',whiteSpace:'nowrap'}}>{fmtSize(f.size)}</span>
                <button onClick={() => removeFile(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#50506a',padding:2}}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button onClick={uploadFiles} disabled={uploading} style={{
              width:'100%',background:'#7c6af7',color:'#fff',border:'none',borderRadius:9,
              padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              opacity: uploading ? .7 : 1,marginTop:4
            }}>
              <Upload size={14}/>{uploading ? 'Yükleniyor...' : `${files.length} Dosyayı Gönder`}
            </button>
          </div>
        )}

        {uploadErr && <p style={{fontSize:12,color:'#f25757',marginBottom:8}}>{uploadErr}</p>}

        {/* Yüklenenler */}
        {uploaded.length > 0 && (
          <div>
            <p style={{fontSize:11,color:'#50506a',marginBottom:6,fontWeight:600}}>GÖNDERİLENLER</p>
            {uploaded.map((f,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px',background:'rgba(34,211,160,.08)',borderRadius:8,marginBottom:4}}>
                <CheckCircle2 size={14} color="#22d3a0"/>
                <a href={`/api/download?url=${encodeURIComponent(f.url)}&name=${encodeURIComponent(f.name)}`} download={f.name}
                  style={{flex:1,fontSize:12,color:'#22d3a0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:'none'}}>
                  {f.name}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Onay/Revizyon */}
      {done || decision !== 'pending' ? (
        <div style={{...cardStyle, background: decision==='approved' ? 'rgba(34,211,160,.1)' : 'rgba(240,168,67,.1)', border:`1px solid ${decision==='approved'?'rgba(34,211,160,.3)':'rgba(240,168,67,.3)'}`}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {decision==='approved'
              ? <CheckCircle2 size={20} color="#22d3a0" strokeWidth={2}/>
              : <RotateCcw size={20} color="#f0a843" strokeWidth={2}/>}
            <div>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f5'}}>{decision==='approved'?'✓ Onayladınız':'Revizyon Talep Edildi'}</p>
              <p style={{fontSize:12,color:'#50506a',marginTop:2}}>Yanıtınız ajansa iletildi.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <p style={{fontSize:14,fontWeight:700,color:'#f0f0f5',marginBottom:12}}>Değerlendirmeniz</p>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Not ekleyin (isteğe bağlı)..."
            style={{width:'100%',background:'#1a1a22',border:'1px solid rgba(255,255,255,.07)',borderRadius:8,color:'#f0f0f5',padding:'10px 12px',fontSize:13,resize:'vertical',outline:'none',marginBottom:12,fontFamily:'Inter,sans-serif',lineHeight:1.5}}
            rows={3}/>
          <div style={{display:'flex',gap:10}}>
            <button onClick={() => submitDecision('approved')} disabled={saving}
              style={{flex:1,background:'rgba(34,211,160,.15)',border:'1px solid rgba(34,211,160,.3)',borderRadius:9,color:'#22d3a0',fontWeight:700,fontSize:14,padding:'11px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:saving?.6:1}}>
              <CheckCircle2 size={16} strokeWidth={2.5}/>Onaylıyorum
            </button>
            <button onClick={() => submitDecision('revision')} disabled={saving}
              style={{flex:1,background:'rgba(240,168,67,.15)',border:'1px solid rgba(240,168,67,.3)',borderRadius:9,color:'#f0a843',fontWeight:700,fontSize:14,padding:'11px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:saving?.6:1}}>
              <RotateCcw size={16} strokeWidth={2.5}/>Revizyon
            </button>
          </div>
        </div>
      )}
    </>
  )
}
