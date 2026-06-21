import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Download, FolderOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import ClientActions from './ClientActions'

const STAGE_S: Record<string,{l:string;color:string}> = {
  pending:          {l:'Bekliyor',      color:'#50506a'},
  in_progress:      {l:'Devam Ediyor',  color:'#4ea8f0'},
  waiting_approval: {l:'Onay Bekliyor', color:'#f0a843'},
  approved:         {l:'Onaylandı',     color:'#22d3a0'},
  done:             {l:'Tamamlandı',    color:'#22d3a0'},
}

const STATUS: Record<string,{l:string;color:string}> = {
  active:    {l:'Aktif',        color:'#22d3a0'},
  paused:    {l:'Duraklatıldı', color:'#f0a843'},
  completed: {l:'Tamamlandı',   color:'#4ea8f0'},
  cancelled: {l:'İptal',        color:'#f25757'},
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sb = await createClient()

  // Token doğrula
  // Client decision güncelleme için action parametresi kontrol
  const { data: tokenRow, error: tokenErr } = await sb
    .from('client_portal_tokens')
    .select('*, client:clients(id,name,email,phone), project:projects(*)')
    .eq('token', token)
    .single()

  if (tokenErr || !tokenRow) return notFound()

  // is_client_token=true ise yeni müşteri paneline yönlendir
  if (tokenRow.is_client_token) {
    const { redirect } = await import('next/navigation')
    redirect(`/portal/musteri/${tokenRow.token}`)
  }

  const project = tokenRow.project
  const client  = tokenRow.client

  // project null ise müşteri paneline yönlendir
  if (!project?.id) {
    const { redirect } = await import('next/navigation')
    redirect(`/portal/musteri/${tokenRow.token}`)
  }

  // Aşamalar ve dosyalar
  const [{ data: stages }, { data: files }] = await Promise.all([
    sb.from('project_stages').select('*').eq('project_id', project.id).order('order_index'),
    sb.from('project_files').select('*').eq('project_id', project.id).eq('is_client_visible', true).order('created_at', { ascending: false }),
  ])

  const fmtSize = (b: number) => !b ? '' : b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(0)}KB` : `${(b/1048576).toFixed(1)}MB`
  const st = STATUS[project.status] || STATUS.active

  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{project.name} — Müşteri Portalı</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{background:#0c0c10;color:#f0f0f5;font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh}
          ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a2a36;border-radius:4px}
          .wrap{max-width:680px;margin:0 auto;padding:32px 20px 80px}
          .header{background:#131318;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:24px;margin-bottom:20px}
          .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px}
          .card{background:#131318;border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;margin-bottom:16px}
          .card-h{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.07)}
          .card-title{font-size:13px;font-weight:700;color:#9090a8;text-transform:uppercase;letter-spacing:.06em}
          .stage{display:flex;align-items:flex-start;gap:14px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.05)}
          .stage:last-child{border-bottom:none}
          .stage-num{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;margin-top:1px}
          .file{display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.05)}
          .file:last-child{border-bottom:none}
          .dl-btn{display:inline-flex;align-items:center;gap:6px;background:#7c6af7;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12.5px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s;white-space:nowrap}
          .dl-btn:hover{opacity:.85}
          .prog{height:6px;background:#2a2a36;border-radius:3px;overflow:hidden;margin-top:8px}
          .prog-fill{height:100%;border-radius:3px;transition:width .8s ease}
          @media(max-width:480px){.wrap{padding:20px 14px 60px}.header{padding:18px}}
        `}</style>
      </head>
      <body>
        <div className="wrap">
          {/* Header */}
          <div className="header">
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#7c6af7,#5b4de0)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <FolderOpen size={18} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <p style={{fontSize:11,color:'#50506a',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>Müşteri Portalı</p>
                <p style={{fontSize:18,fontWeight:700,letterSpacing:'-.3px'}}>{project.name}</p>
              </div>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:16}}>
              <span className="badge" style={{background:`${st.color}18`,color:st.color}}>{st.l}</span>
              {project.deadline && (
                <span className="badge" style={{background:'rgba(255,255,255,.05)',color:'#9090a8',display:'flex',alignItems:'center',gap:5}}>
                  <Clock size={11} strokeWidth={2} />Son: {project.deadline}
                </span>
              )}
              {client && (
                <span className="badge" style={{background:'rgba(255,255,255,.05)',color:'#9090a8'}}>{client.name}</span>
              )}
            </div>

            {/* İlerleme */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:12,color:'#50506a'}}>Genel İlerleme</span>
                <span style={{fontSize:12,fontWeight:700,fontFamily:'JetBrains Mono',color: project.progress >= 70 ? '#22d3a0' : project.progress >= 40 ? '#7c6af7' : '#f25757'}}>{project.progress || 0}%</span>
              </div>
              <div className="prog">
                <div className="prog-fill" style={{width:`${project.progress||0}%`,background:project.progress>=70?'#22d3a0':project.progress>=40?'#7c6af7':'#f25757'}} />
              </div>
            </div>

            {project.description && (
              <p style={{fontSize:13,color:'#9090a8',marginTop:14,lineHeight:1.6,paddingTop:14,borderTop:'1px solid rgba(255,255,255,.05)'}}>{project.description}</p>
            )}
          </div>

          {/* Aşamalar */}
          {stages && stages.length > 0 && (
            <div className="card">
              <div className="card-h">
                <CheckCircle2 size={15} color="#7c6af7" strokeWidth={2} />
                <span className="card-title">Proje Aşamaları</span>
                <span style={{marginLeft:'auto',fontSize:11,color:'#50506a'}}>{stages.length} adım</span>
              </div>
              {stages.map((s: any, i: number) => {
                const sm = STAGE_S[s.status] || STAGE_S.pending
                const isDone = s.status === 'done' || s.status === 'approved'
                return (
                  <div key={s.id} className="stage">
                    <div className="stage-num" style={{background:`${sm.color}18`,color:sm.color,border:`1px solid ${sm.color}30`}}>
                      {isDone ? '✓' : i+1}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                        <span style={{fontSize:13.5,fontWeight:600,color: isDone ? '#9090a8' : '#f0f0f5',textDecoration:isDone?'line-through':'none'}}>{s.title}</span>
                        <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:5,background:`${sm.color}15`,color:sm.color}}>{sm.l}</span>
                        {s.requires_approval && !isDone && (
                          <span style={{fontSize:11,color:'#f0a843',display:'flex',alignItems:'center',gap:3}}>
                            <AlertCircle size={11} />Onay Gerekli
                          </span>
                        )}
                      </div>
                      {s.description && <p style={{fontSize:12.5,color:'#50506a',lineHeight:1.5}}>{s.description}</p>}
                      {s.due_date && <p style={{fontSize:11.5,color:'#50506a',marginTop:4}}>📅 {s.due_date}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Müşteri Onay Butonu */}
          <ClientActions token={token} currentDecision={tokenRow.client_decision || 'pending'} />

          {/* Dosyalar */}
          <div className="card">
            <div className="card-h">
              <Download size={15} color="#7c6af7" strokeWidth={2} />
              <span className="card-title">Dosyalar</span>
              <span style={{marginLeft:'auto',fontSize:11,color:'#50506a'}}>{files?.length || 0} dosya</span>
            </div>
            {!files || files.length === 0 ? (
              <div style={{padding:'32px 20px',textAlign:'center',color:'#50506a',fontSize:13}}>
                Henüz paylaşılan dosya yok
              </div>
            ) : files.map((f: any) => (
              <div key={f.id} className="file">
                <div style={{fontSize:22,flexShrink:0}}>
                  {f.mime_type?.includes('image')?'🖼':f.mime_type?.includes('pdf')?'📄':f.mime_type?.includes('sheet')?'📊':'📎'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</p>
                  <p style={{fontSize:11.5,color:'#50506a',marginTop:2}}>{fmtSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString('tr-TR', {day:'numeric',month:'short',year:'numeric'}) + ' ' + new Date(f.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</p>
                </div>
                <a href={f.file_path} download={f.name} target="_blank" rel="noreferrer" className="dl-btn">
                  <Download size={13} strokeWidth={2} />İndir
                </a>
              </div>
            ))}
          </div>

          <p style={{textAlign:'center',fontSize:11.5,color:'#343444',marginTop:24}}>
            Daydream Production — Müşteri Portalı
          </p>
        </div>
      </body>
    </html>
  )
}
