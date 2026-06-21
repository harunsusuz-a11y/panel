import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Download, CheckCircle2, FileText } from 'lucide-react'
import ClientActions from '@/app/portal/[token]/ClientActions'

const STAGE_S: Record<string,{l:string;c:string}> = {
  pending:          {l:'Bekliyor',      c:'#50506a'},
  in_progress:      {l:'Devam Ediyor',  c:'#4ea8f0'},
  waiting_approval: {l:'Onay Bekliyor', c:'#f0a843'},
  approved:         {l:'Onaylandı',     c:'#22d3a0'},
  done:             {l:'Tamamlandı',    c:'#22d3a0'},
}
const PROJ_S: Record<string,{l:string;c:string}> = {
  active:    {l:'Aktif',        c:'#22d3a0'},
  paused:    {l:'Duraklatıldı', c:'#f0a843'},
  completed: {l:'Tamamlandı',   c:'#4ea8f0'},
  cancelled: {l:'İptal',        c:'#f25757'},
}
const APPROVAL_S: Record<string,{l:string;c:string}> = {
  pending:  {l:'Bekliyor',  c:'#f0a843'},
  approved: {l:'Onaylandı', c:'#22d3a0'},
  rejected: {l:'Reddedildi',c:'#f25757'},
}

const BASE = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#0c0c10;color:#f0f0f5;font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a2a36;border-radius:4px}
  .wrap{max-width:720px;margin:0 auto;padding:28px 16px 80px}
  .hdr{background:#131318;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:22px;margin-bottom:16px}
  .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:3px 9px;border-radius:5px}
  .card{background:#131318;border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;margin-bottom:14px}
  .sec-h{padding:11px 18px;display:flex;align-items:center;gap:8px;border-top:1px solid rgba(255,255,255,.05)}
  .sec-label{font-size:11px;font-weight:700;color:#50506a;text-transform:uppercase;letter-spacing:.05em}
  .row-item{display:flex;align-items:center;gap:12px;padding:10px 18px;border-top:1px solid rgba(255,255,255,.04)}
  .prog{height:5px;background:#1e1e28;border-radius:3px;overflow:hidden;margin-top:6px}
  .prog-fill{height:100%;border-radius:3px}
  .dl{display:inline-flex;align-items:center;gap:5px;background:#7c6af718;color:#7c6af7;border:1px solid #7c6af730;border-radius:7px;padding:6px 11px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0}
  .dl:hover{background:#7c6af730}
  .stat{background:rgba(255,255,255,.04);border-radius:10px;padding:12px;text-align:center;border:1px solid rgba(255,255,255,.06)}
  @media(max-width:480px){.wrap{padding:14px 12px 60px}.hdr{padding:16px}}
`

export default async function MusteriPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sb = await createClient()

  const { data: tokenRow } = await sb
    .from('client_portal_tokens')
    .select('*, client:clients(id,name,email,phone,company)')
    .eq('token', token)
    .eq('is_client_token', true)
    .single()

  if (!tokenRow) return notFound()
  const client = tokenRow.client

  const { data: projects } = await sb
    .from('projects')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  const projectIds = (projects||[]).map((p:any) => p.id)

  const [{ data: allStages }, { data: allFiles }, { data: allApprovals }] = await Promise.all([
    projectIds.length > 0
      ? sb.from('project_stages').select('*').in('project_id', projectIds).order('order_index')
      : Promise.resolve({ data: [] }),
    projectIds.length > 0
      ? sb.from('project_files').select('*').in('project_id', projectIds).eq('is_client_visible', true).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    sb.from('approvals').select('id,title,type,status,created_at,notes').eq('client_id', client.id).order('created_at', { ascending: false }),
  ])

  const byProj = (arr: any[], key: string) =>
    (arr||[]).reduce((acc:Record<string,any[]>, x:any) => {
      ;(acc[x[key]] = acc[x[key]]||[]).push(x); return acc
    }, {})

  const stagesByProj  = byProj(allStages||[], 'project_id')
  const filesByProj   = byProj(allFiles||[], 'project_id')

  const fmtSz = (b:number) => !b?'':b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(0)}KB`:`${(b/1048576).toFixed(1)}MB`
  const fmtDt = (d:string) => d?new Date(d).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):'—'

  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>{client.name} — Müşteri Paneli</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
        <style>{BASE}</style>
      </head>
      <body>
        <div className="wrap">

          {/* Header */}
          <div className="hdr">
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
              <div style={{width:46,height:46,borderRadius:13,background:'linear-gradient(135deg,#7c6af7,#5b4de0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:800,color:'#fff',flexShrink:0}}>
                {(client.name||'?').slice(0,2).toUpperCase()}
              </div>
              <div>
                <p style={{fontSize:10.5,color:'#50506a',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>Müşteri Paneli</p>
                <h1 style={{fontSize:21,fontWeight:800,letterSpacing:'-.4px'}}>{client.name}</h1>
                {client.company&&<p style={{fontSize:12,color:'#50506a',marginTop:2}}>{client.company}</p>}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:9}}>
              {[
                {l:'Proje',  v:(projects||[]).length,                                  c:'#7c6af7'},
                {l:'Dosya',  v:(allFiles||[]).length,                                   c:'#4ea8f0'},
                {l:'Onay',   v:(allApprovals||[]).filter((a:any)=>a.status==='approved').length, c:'#22d3a0'},
              ].map(s=>(
                <div key={s.l} className="stat">
                  <p style={{fontSize:24,fontWeight:800,color:s.c,fontFamily:'JetBrains Mono',lineHeight:1}}>{s.v}</p>
                  <p style={{fontSize:10,color:'#50506a',marginTop:4,textTransform:'uppercase',letterSpacing:'.05em'}}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Projeler */}
          {(projects||[]).length === 0 ? (
            <div className="card" style={{padding:'40px 20px',textAlign:'center',color:'#50506a',fontSize:13}}>
              Henüz aktif proje bulunmuyor.
            </div>
          ) : (projects||[]).map((proj:any) => {
            const ps     = PROJ_S[proj.status]||PROJ_S.active
            const stages = stagesByProj[proj.id]||[]
            const files  = filesByProj[proj.id]||[]
            const done   = stages.filter((s:any)=>s.status==='done'||s.status==='approved').length

            return (
              <div key={proj.id} className="card">
                {/* Proje başlık */}
                <div style={{padding:'16px 18px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                        <h2 style={{fontSize:15.5,fontWeight:700}}>{proj.name}</h2>
                        <span className="badge" style={{background:`${ps.c}18`,color:ps.c}}>{ps.l}</span>
                      </div>
                      {proj.description&&<p style={{fontSize:12.5,color:'#50506a',lineHeight:1.6}}>{proj.description}</p>}
                    </div>
                    {proj.deadline&&(
                      <div style={{flexShrink:0,textAlign:'right'}}>
                        <p style={{fontSize:10,color:'#50506a',marginBottom:1}}>Bitiş</p>
                        <p style={{fontSize:12,fontWeight:600,color:'#9090a8'}}>{proj.deadline}</p>
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:11.5,color:'#50506a'}}>
                      {stages.length>0?`${done}/${stages.length} aşama`:'İlerleme'}
                    </span>
                    <span style={{fontSize:12,fontWeight:700,fontFamily:'JetBrains Mono',color:proj.progress>=70?'#22d3a0':proj.progress>=40?'#7c6af7':'#f25757'}}>
                      {proj.progress||0}%
                    </span>
                  </div>
                  <div className="prog">
                    <div className="prog-fill" style={{width:`${proj.progress||0}%`,background:proj.progress>=70?'#22d3a0':proj.progress>=40?'#7c6af7':'#f25757'}}/>
                  </div>
                </div>

                {/* Aşamalar */}
                {stages.length>0&&(
                  <>
                    <div className="sec-h" style={{borderTop:'none',paddingTop:'12px'}}>
                      <CheckCircle2 size={12} color="#7c6af7" strokeWidth={2}/>
                      <span className="sec-label">Aşamalar</span>
                    </div>
                    {stages.map((s:any,i:number)=>{
                      const sm = STAGE_S[s.status]||STAGE_S.pending
                      const isDone = s.status==='done'||s.status==='approved'
                      return (
                        <div key={s.id} className="row-item">
                          <div style={{width:22,height:22,borderRadius:'50%',background:`${sm.c}18`,color:sm.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9.5,fontWeight:800,flexShrink:0,border:`1px solid ${sm.c}25`}}>
                            {isDone?'✓':i+1}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                              <span style={{fontSize:13,fontWeight:600,color:isDone?'#50506a':'#f0f0f5',textDecoration:isDone?'line-through':'none'}}>{s.title}</span>
                              <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,background:`${sm.c}15`,color:sm.c}}>{sm.l}</span>
                            </div>
                            {s.description&&<p style={{fontSize:12,color:'#50506a',marginTop:2,lineHeight:1.5}}>{s.description}</p>}
                            {s.due_date&&<p style={{fontSize:11,color:'#50506a',marginTop:2}}>📅 {s.due_date}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

                {/* Dosyalar */}
                {files.length>0&&(
                  <>
                    <div className="sec-h">
                      <Download size={12} color="#7c6af7" strokeWidth={2}/>
                      <span className="sec-label">Dosyalar</span>
                      <span style={{marginLeft:'auto',fontSize:11,color:'#50506a'}}>{files.length}</span>
                    </div>
                    {files.map((f:any)=>(
                      <div key={f.id} className="row-item">
                        <span style={{fontSize:18,flexShrink:0}}>
                          {f.mime_type?.includes('image')?'🖼':f.mime_type?.includes('pdf')?'📄':f.mime_type?.includes('sheet')?'📊':'📎'}
                        </span>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</p>
                          <p style={{fontSize:11,color:'#50506a',marginTop:1}}>{fmtSz(f.file_size)} · {fmtDt(f.created_at)}</p>
                        </div>
                        <a href={f.file_path} download={f.name} target="_blank" rel="noreferrer" className="dl">
                          <Download size={11} strokeWidth={2}/>İndir
                        </a>
                      </div>
                    ))}
                  </>
                )}

                {stages.length===0&&files.length===0&&(
                  <div style={{padding:'24px 18px',textAlign:'center',color:'#50506a',fontSize:13}}>
                    Henüz içerik eklenmemiş
                  </div>
                )}
              </div>
            )
          })}

          {/* Bekleyen onay varsa müşteri değerlendirme butonu */}
          {(allApprovals||[]).some((a:any) => a.status==='approved' && (a.client_status==='sent' || a.client_status==='not_sent')) && (() => {
            const pendingApproval = (allApprovals||[]).find((a:any) => a.status==='approved' && (a.client_status==='sent' || a.client_status==='not_sent'))
            if (!pendingApproval) return null
            // Bu onay için token bul — ana portal tokenini kullanıyoruz
            return (
              <div className="card" style={{marginBottom:14}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                  <p style={{fontSize:13,fontWeight:700,marginBottom:4}}>📋 {pendingApproval.title}</p>
                  <p style={{fontSize:12,color:'#50506a'}}>Değerlendirmenizi bekliyoruz</p>
                </div>
                <div style={{padding:'14px 18px'}}>
                  <ClientActions token={token} currentDecision="pending" />
                </div>
              </div>
            )
          })()}

          {/* Onay Geçmişi */}
          {(allApprovals||[]).length>0&&(
            <div className="card">
              <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',gap:8}}>
                <FileText size={13} color="#7c6af7" strokeWidth={2}/>
                <span className="sec-label">Onay Geçmişi</span>
                <span style={{marginLeft:'auto',fontSize:11,color:'#50506a'}}>{(allApprovals||[]).length}</span>
              </div>
              {(allApprovals||[]).map((a:any)=>{
                const as = APPROVAL_S[a.status]||APPROVAL_S.pending
                return (
                  <div key={a.id} className="row-item">
                    <div style={{width:7,height:7,borderRadius:'50%',background:as.c,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</p>
                      <p style={{fontSize:11,color:'#50506a',marginTop:1}}>{fmtDt(a.created_at)}</p>
                    </div>
                    <span style={{fontSize:10.5,fontWeight:700,padding:'2px 7px',borderRadius:4,background:`${as.c}15`,color:as.c,flexShrink:0}}>{as.l}</span>
                  </div>
                )
              })}
            </div>
          )}

          <p style={{textAlign:'center',fontSize:11,color:'#2a2a3a',marginTop:20}}>
            Daydream Production · Müşteri Paneli
          </p>
        </div>
      </body>
    </html>
  )
}
