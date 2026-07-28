import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MusteriPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: tokenRow } = await sb
    .from('client_portal_tokens')
    .select('*, client:clients(id,name,email,phone,company)')
    .eq('token', token)
    .eq('is_client_token', true)
    .single()

  if (!tokenRow) return notFound()

  const client = tokenRow.client
  if (!client) return notFound()

  const { data: projects } = await sb
    .from('projects')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  const projectIds = (projects || []).map((p: any) => p.id)

  const [{ data: allStages }, { data: allFiles }] = await Promise.all([
    projectIds.length > 0
      ? sb.from('project_stages').select('*').in('project_id', projectIds).order('order_index')
      : Promise.resolve({ data: [] }),
    projectIds.length > 0
      ? sb.from('project_files').select('*').in('project_id', projectIds).eq('is_client_visible', true).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const PROJ_S: Record<string, { l: string; c: string }> = {
    active:    { l: 'Aktif',        c: '#22d3a0' },
    paused:    { l: 'Duraklatıldı', c: '#f0a843' },
    completed: { l: 'Tamamlandı',   c: '#4ea8f0' },
    cancelled: { l: 'İptal',        c: '#f25757' },
  }

  const STAGE_S: Record<string, { l: string; c: string }> = {
    pending:          { l: 'Bekliyor',      c: '#50506a' },
    in_progress:      { l: 'Devam Ediyor',  c: '#4ea8f0' },
    waiting_approval: { l: 'Onay Bekliyor', c: '#f0a843' },
    approved:         { l: 'Onaylandı',     c: '#22d3a0' },
    done:             { l: 'Tamamlandı',    c: '#22d3a0' },
  }

  const fmtSize = (b: number) => !b ? '' : b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1048576).toFixed(1)}MB`
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{client.name} — Müşteri Portalı</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{background:#0c0c10;color:#f0f0f5;font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh}
          .wrap{max-width:680px;margin:0 auto;padding:32px 16px 80px}
          .hdr{background:#131318;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:24px;margin-bottom:16px}
          .card{background:#131318;border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden;margin-bottom:14px}
          .card-h{padding:13px 18px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:8px}
          .card-title{font-size:11px;font-weight:700;color:#50506a;text-transform:uppercase;letter-spacing:.06em}
          .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:3px 9px;border-radius:5px}
          .row{display:flex;align-items:center;gap:12px;padding:11px 18px;border-top:1px solid rgba(255,255,255,.04)}
          .dl{display:inline-flex;align-items:center;gap:5px;background:#7c6af718;color:#7c6af7;border:1px solid #7c6af730;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap}
          .dl:hover{background:#7c6af730}
          .prog{height:5px;background:#1e1e28;border-radius:3px;overflow:hidden;margin-top:6px}
          .prog-fill{height:100%;border-radius:3px}
          .empty{padding:28px;text-align:center;color:#50506a;font-size:13px}
          @media(max-width:480px){.wrap{padding:16px 12px 60px}.hdr{padding:16px}}
        `}</style>
      </head>
      <body>
        <div className="wrap">
          {/* Header */}
          <div className="hdr">
            <p style={{ fontSize: 11, color: '#50506a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Müşteri Portalı</p>
            <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.3px', marginBottom: 4 }}>{client.name}</p>
            {client.company && <p style={{ fontSize: 13, color: '#9090a8' }}>{client.company}</p>}
            <p style={{ fontSize: 12, color: '#50506a', marginTop: 8 }}>
              Daydream Production tarafından hazırlanmıştır · {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Projeler */}
          {(projects || []).length === 0 ? (
            <div className="card"><div className="empty">Henüz aktif proje yok</div></div>
          ) : (projects || []).map((proj: any) => {
            const stages = (allStages || []).filter((s: any) => s.project_id === proj.id)
            const files = (allFiles || []).filter((f: any) => f.project_id === proj.id)
            const ps = PROJ_S[proj.status] || PROJ_S.active
            const done = stages.filter((s: any) => s.status === 'done' || s.status === 'approved').length

            return (
              <div key={proj.id}>
                {/* Proje Başlık */}
                <div className="card">
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                      <p style={{ fontSize: 16, fontWeight: 700 }}>{proj.name}</p>
                      <span className="badge" style={{ background: `${ps.c}18`, color: ps.c, flexShrink: 0 }}>{ps.l}</span>
                    </div>
                    {proj.description && <p style={{ fontSize: 13, color: '#9090a8', marginBottom: 12 }}>{proj.description}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#50506a' }}>İlerleme</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#7c6af7' }}>{proj.progress || 0}%</span>
                    </div>
                    <div className="prog">
                      <div className="prog-fill" style={{ width: `${proj.progress || 0}%`, background: '#7c6af7' }} />
                    </div>
                    {stages.length > 0 && (
                      <p style={{ fontSize: 11.5, color: '#50506a', marginTop: 8 }}>{done}/{stages.length} aşama tamamlandı</p>
                    )}
                  </div>
                </div>

                {/* Aşamalar */}
                {stages.length > 0 && (
                  <div className="card">
                    <div className="card-h">
                      <span className="card-title">Proje Aşamaları</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#50506a' }}>{stages.length} adım</span>
                    </div>
                    {stages.map((s: any, i: number) => {
                      const sm = STAGE_S[s.status] || STAGE_S.pending
                      const isDone = s.status === 'done' || s.status === 'approved'
                      return (
                        <div key={s.id} className="row">
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${sm.c}18`, color: sm.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                            {isDone ? '✓' : i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: isDone ? '#50506a' : '#f0f0f5', textDecoration: isDone ? 'line-through' : 'none' }}>{s.title}</p>
                            {s.description && <p style={{ fontSize: 12, color: '#50506a', marginTop: 2 }}>{s.description}</p>}
                          </div>
                          <span className="badge" style={{ background: `${sm.c}15`, color: sm.c, flexShrink: 0 }}>{sm.l}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Dosyalar */}
                {files.length > 0 && (
                  <div className="card">
                    <div className="card-h">
                      <span className="card-title">Dosyalar</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#50506a' }}>{files.length} dosya</span>
                    </div>
                    {files.map((f: any) => (
                      <div key={f.id} className="row">
                        <div style={{ fontSize: 20, flexShrink: 0 }}>
                          {f.mime_type?.includes('image') ? '🖼' : f.mime_type?.includes('pdf') ? '📄' : '📎'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                          <p style={{ fontSize: 11.5, color: '#50506a', marginTop: 2 }}>{fmtSize(f.file_size)} · {fmtDate(f.created_at)}</p>
                        </div>
                        <a href={f.file_path} download={f.name} target="_blank" rel="noreferrer" className="dl">İndir</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <p style={{ textAlign: 'center', fontSize: 11.5, color: '#343444', marginTop: 24 }}>
            Daydream Production — Müşteri Portalı
          </p>
        </div>
      </body>
    </html>
  )
}
