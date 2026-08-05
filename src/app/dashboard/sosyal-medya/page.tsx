'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { TrendingUp, TrendingDown, Minus, Save, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', fields: ['post_count','story_count','total_likes','comments','saves','shares','followers','reach','impressions'] },
  { value: 'tiktok',    label: 'TikTok',    fields: ['post_count','total_likes','comments','shares','followers','reach','impressions'] },
  { value: 'linkedin',  label: 'LinkedIn',  fields: ['post_count','total_likes','comments','shares','followers','impressions'] },
  { value: 'youtube',   label: 'YouTube',   fields: ['post_count','total_likes','comments','shares','followers','impressions'] },
]

const FIELD_META: Record<string, { label: string; prev?: string }> = {
  post_count:      { label: 'Post Sayısı',      prev: 'prev_post_count' },
  story_count:     { label: 'Story Sayısı' },
  total_likes:     { label: 'Toplam Like',       prev: 'prev_total_likes' },
  comments:        { label: 'Yorum' },
  saves:           { label: 'Kaydetme' },
  shares:          { label: 'Paylaşım' },
  followers:       { label: 'Takipçi',           prev: 'prev_followers' },
  reach:           { label: 'Erişim (Reach)' },
  impressions:     { label: 'Gösterim' },
}

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0,0,0,0)
  return date
}
function formatWeek(monday: Date) {
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('tr-TR', { day:'numeric', month:'short' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}
function toISO(d: Date) { return d.toISOString().slice(0,10) }
function pct(now: number, prev: number) {
  if (!prev || prev === 0) return null
  return Math.round(((now - prev) / prev) * 100)
}
function fmt(n: number) { return n?.toLocaleString('tr-TR') || '0' }

function Trend({ now, prev }: { now: number; prev: number }) {
  const p = pct(now, prev)
  if (p === null) return <span style={{color:'var(--tx3)',fontSize:11}}>—</span>
  if (p > 0) return <span style={{color:'var(--green)',fontSize:11,display:'flex',alignItems:'center',gap:2}}><TrendingUp size={11}/>+{p}%</span>
  if (p < 0) return <span style={{color:'var(--red)',fontSize:11,display:'flex',alignItems:'center',gap:2}}><TrendingDown size={11}/>{p}%</span>
  return <span style={{color:'var(--tx3)',fontSize:11,display:'flex',alignItems:'center',gap:2}}><Minus size={11}/>0%</span>
}

const emptyForm = () => ({
  post_count:'', story_count:'', total_likes:'', comments:'', saves:'', shares:'',
  followers:'', reach:'', impressions:'',
  prev_post_count:'', prev_total_likes:'', prev_followers:'',
  notes:''
})

export default function SosyalMedyaPage() {
  const [clients, setClients]       = useState<any[]>([])
  const [reports, setReports]       = useState<any[]>([])
  const [myId, setMyId]             = useState('')
  const [monday, setMonday]         = useState<Date>(() => getMonday(new Date()))
  const [selClient, setSelClient]   = useState('')
  const [selPlatform, setSelPlatform] = useState('instagram')
  const [form, setForm]             = useState<any>(emptyForm())
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState('')
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<'giris'|'ozet'>('giris')
  const ozetRef                     = useRef<HTMLDivElement>(null)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }
  const weekStart = toISO(monday)
  const weekEnd   = toISO(new Date(monday.getTime() + 6 * 86400000))
  const weekLabel = formatWeek(monday)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => { if (user) setMyId(user.id) })
    sb.from('clients').select('id, name, brand_name').eq('status','active').order('name').then(({ data }) => setClients(data || []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await createClient().from('social_media_reports')
      .select('*, clients(name, brand_name)')
      .eq('week_start', weekStart)
      .order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selClient || !selPlatform) return
    const ex = reports.find(r => r.client_id === selClient && r.platform === selPlatform)
    setForm(ex ? {
      post_count: ex.post_count ?? '', story_count: ex.story_count ?? '',
      total_likes: ex.total_likes ?? '', comments: ex.comments ?? '',
      saves: ex.saves ?? '', shares: ex.shares ?? '',
      followers: ex.followers ?? '', reach: ex.reach ?? '', impressions: ex.impressions ?? '',
      prev_post_count: ex.prev_post_count ?? '', prev_total_likes: ex.prev_total_likes ?? '',
      prev_followers: ex.prev_followers ?? '', notes: ex.notes ?? ''
    } : emptyForm())
  }, [selClient, selPlatform, reports])

  async function save() {
    if (!selClient) { showToast('Marka seçin'); return }
    setSaving(true)
    const n = (v: any) => Number(v) || 0
    const followers = n(form.followers)
    const total_likes = n(form.total_likes)
    const comments = n(form.comments)
    const post_count = n(form.post_count)
    const engagement_rate = followers > 0 && post_count > 0
      ? Math.round(((total_likes + comments) / (followers * post_count)) * 10000) / 100
      : 0
    const payload = {
      client_id: selClient, week_start: weekStart, week_end: weekEnd, platform: selPlatform,
      post_count, story_count: n(form.story_count), total_likes, comments,
      saves: n(form.saves), shares: n(form.shares), followers,
      reach: n(form.reach), impressions: n(form.impressions), engagement_rate,
      prev_post_count: n(form.prev_post_count), prev_total_likes: n(form.prev_total_likes),
      prev_followers: n(form.prev_followers), notes: form.notes,
      created_by: myId, updated_at: new Date().toISOString()
    }
    const sb = createClient()
    const ex = reports.find(r => r.client_id === selClient && r.platform === selPlatform)
    if (ex) await sb.from('social_media_reports').update(payload).eq('id', ex.id)
    else await sb.from('social_media_reports').insert(payload)
    await load()
    showToast('Kaydedildi ✓')
    setSaving(false)
  }

  function printPDF() {
    const style = `
      <style>
        body { font-family: Arial, sans-serif; color: #111; padding: 32px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .sub { font-size: 12px; color: #666; margin-bottom: 24px; }
        .brand-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 16px; break-inside: avoid; }
        .brand-title { font-size: 15px; font-weight: 700; margin-bottom: 12px; }
        .platform-label { font-size: 11px; color: #888; margin-bottom: 8px; }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .metric { background: #f5f5f5; border-radius: 6px; padding: 10px; }
        .metric-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
        .metric-value { font-size: 16px; font-weight: 700; margin: 2px 0; }
        .metric-trend { font-size: 10px; color: #666; }
        .trend-up { color: #16a34a; }
        .trend-down { color: #dc2626; }
        .notes { margin-top: 10px; font-size: 11px; color: #555; background: #f9f9f9; padding: 8px; border-radius: 4px; }
        .eng { display: inline-block; margin-top: 8px; background: #ede9fe; color: #7c3aed; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        @media print { @page { margin: 20mm; } }
      </style>
    `
    const platform = PLATFORMS.find(p => p.value === selPlatform)?.label || selPlatform
    const rows = clients.map(c => {
      const r = reports.find(x => x.client_id === c.id && x.platform === selPlatform)
      if (!r) return ''
      const trendHtml = (now: number, prev: number) => {
        const p = pct(now, prev)
        if (p === null) return '<span class="metric-trend">—</span>'
        if (p > 0) return `<span class="metric-trend trend-up">▲ +${p}%</span>`
        if (p < 0) return `<span class="metric-trend trend-down">▼ ${p}%</span>`
        return '<span class="metric-trend">→ 0%</span>'
      }
      const metrics = [
        { label:'Post', value: r.post_count, trend: trendHtml(r.post_count, r.prev_post_count) },
        ...(r.story_count ? [{ label:'Story', value: r.story_count, trend: '' }] : []),
        { label:'Like', value: r.total_likes?.toLocaleString('tr-TR'), trend: trendHtml(r.total_likes, r.prev_total_likes) },
        ...(r.comments ? [{ label:'Yorum', value: r.comments?.toLocaleString('tr-TR'), trend: '' }] : []),
        ...(r.saves ? [{ label:'Kaydetme', value: r.saves?.toLocaleString('tr-TR'), trend: '' }] : []),
        ...(r.shares ? [{ label:'Paylaşım', value: r.shares?.toLocaleString('tr-TR'), trend: '' }] : []),
        { label:'Takipçi', value: r.followers?.toLocaleString('tr-TR'), trend: trendHtml(r.followers, r.prev_followers) },
        ...(r.reach ? [{ label:'Erişim', value: r.reach?.toLocaleString('tr-TR'), trend: '' }] : []),
        ...(r.impressions ? [{ label:'Gösterim', value: r.impressions?.toLocaleString('tr-TR'), trend: '' }] : []),
      ]
      return `
        <div class="brand-card">
          <div class="brand-title">${c.brand_name || c.name}</div>
          <div class="platform-label">${platform}</div>
          <div class="metrics">
            ${metrics.map(m => `
              <div class="metric">
                <div class="metric-label">${m.label}</div>
                <div class="metric-value">${m.value || 0}</div>
                ${m.trend}
              </div>
            `).join('')}
          </div>
          ${r.engagement_rate > 0 ? `<div class="eng">Engagement Rate: %${r.engagement_rate}</div>` : ''}
          ${r.notes ? `<div class="notes">📝 ${r.notes}</div>` : ''}
        </div>
      `
    }).join('')

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Sosyal Medya Raporu - ${weekLabel}</title>${style}</head>
      <body>
        <h1>Sosyal Medya Raporu</h1>
        <div class="sub">${platform} · ${weekLabel} · ${new Date().toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' })}</div>
        ${rows || '<p style="color:#888">Bu hafta için veri girilmemiş.</p>'}
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 400)
  }

  const platform = PLATFORMS.find(p => p.value === selPlatform)!
  const ozetData = clients.map(c => ({ ...c, report: reports.find(x => x.client_id === c.id && x.platform === selPlatform) })).filter(c => c.report)

  return (
    <>
      <style>{`
        .sm-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:18px}
        .sm-label{font-size:11px;font-weight:600;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:block}
        .sm-inp{width:100%;background:var(--s2);border:1px solid var(--bdr);border-radius:7px;padding:8px 10px;font-size:13px;color:var(--tx);outline:none;box-sizing:border-box}
        .sm-inp:focus{border-color:var(--ac)}
        .sm-tab{padding:7px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--bdr);background:transparent;color:var(--tx3)}
        .sm-tab.active{background:var(--ac);color:#fff;border-color:var(--ac)}
        .sm-stat{background:var(--s2);border-radius:8px;padding:12px 14px}
        .sm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .sm-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .sm-section{font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;margin:16px 0 10px}
        .eng-badge{display:inline-flex;align-items:center;gap:4px;background:var(--ac);color:#fff;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;margin-top:10px}
        @media(max-width:600px){.sm-grid{grid-template-columns:1fr 1fr}.sm-grid2{grid-template-columns:1fr}}
      `}</style>

      <TopBar title="Sosyal Medya Raporu" />

      {toast && <div style={{position:'fixed',top:18,right:18,background:'var(--green)',color:'#fff',borderRadius:8,padding:'10px 18px',fontSize:13,fontWeight:600,zIndex:9999}}>{toast}</div>}

      <div style={{padding:'20px 24px',maxWidth:900,margin:'0 auto'}}>

        {/* Hafta nav */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <button className="btn" style={{padding:'6px 10px'}} onClick={() => setMonday(d => { const nd=new Date(d); nd.setDate(nd.getDate()-7); return nd })}><ChevronLeft size={16}/></button>
          <div style={{flex:1,textAlign:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--tx)'}}>{weekLabel}</div>
            <div style={{fontSize:10,color:'var(--tx3)',marginTop:2}}>Haftalık Rapor</div>
          </div>
          <button className="btn" style={{padding:'6px 10px'}} onClick={() => setMonday(d => { const nd=new Date(d); nd.setDate(nd.getDate()+7); return nd })}><ChevronRight size={16}/></button>
        </div>

        {/* Platform */}
        <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
          {PLATFORMS.map(p => (
            <button key={p.value} className={`sm-tab${selPlatform===p.value?' active':''}`} onClick={() => setSelPlatform(p.value)}>{p.label}</button>
          ))}
        </div>

        {/* Tab */}
        <div style={{display:'flex',gap:6,marginBottom:16,justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',gap:6}}>
            <button className={`sm-tab${tab==='giris'?' active':''}`} onClick={() => setTab('giris')}>Veri Girişi</button>
            <button className={`sm-tab${tab==='ozet'?' active':''}`} onClick={() => setTab('ozet')}>Özet Görünüm</button>
          </div>
          {tab==='ozet' && (
            <div style={{display:'flex',gap:6}}>
              <button className="btn" style={{gap:6,fontSize:12}} onClick={load}><RefreshCw size={13}/>Yenile</button>
              <button className="btn" style={{gap:6,fontSize:12,background:'var(--ac)',color:'#fff'}} onClick={printPDF}><Download size={13}/>PDF İndir</button>
            </div>
          )}
        </div>

        {/* VERİ GİRİŞİ */}
        {tab==='giris' && (
          <div className="sm-card">
            <div style={{marginBottom:16}}>
              <span className="sm-label">Marka *</span>
              <select className="sm-inp" value={selClient} onChange={e => setSelClient(e.target.value)}>
                <option value="">— Marka Seçin —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>)}
              </select>
            </div>

            {selClient && (
              <>
                <div className="sm-section">Bu Hafta — {platform.label}</div>
                <div className="sm-grid" style={{marginBottom:14}}>
                  {platform.fields.map(key => (
                    <div key={key}>
                      <span className="sm-label">{FIELD_META[key]?.label || key}</span>
                      <input type="number" min={0} className="sm-inp" value={form[key] ?? ''}
                        onChange={e => setForm((p: any) => ({...p, [key]: e.target.value}))} placeholder="0" />
                    </div>
                  ))}
                </div>

                <div className="sm-section">Önceki Hafta (Karşılaştırma)</div>
                <div className="sm-grid2" style={{marginBottom:14}}>
                  {[
                    {key:'prev_post_count', label:'Önceki Post'},
                    {key:'prev_total_likes', label:'Önceki Like'},
                    {key:'prev_followers', label:'Önceki Takipçi'},
                  ].map(f => (
                    <div key={f.key}>
                      <span className="sm-label">{f.label}</span>
                      <input type="number" min={0} className="sm-inp" value={form[f.key] ?? ''}
                        onChange={e => setForm((p: any) => ({...p, [f.key]: e.target.value}))} placeholder="0" />
                    </div>
                  ))}
                </div>

                {/* Canlı karşılaştırma */}
                {(Number(form.prev_post_count)>0 || Number(form.prev_total_likes)>0 || Number(form.prev_followers)>0) && (
                  <div className="sm-grid2" style={{marginBottom:14}}>
                    <div className="sm-stat"><span className="sm-label">Post Değişimi</span><Trend now={Number(form.post_count)||0} prev={Number(form.prev_post_count)||0}/></div>
                    <div className="sm-stat"><span className="sm-label">Like Değişimi</span><Trend now={Number(form.total_likes)||0} prev={Number(form.prev_total_likes)||0}/></div>
                    <div className="sm-stat"><span className="sm-label">Takipçi Değişimi</span><Trend now={Number(form.followers)||0} prev={Number(form.prev_followers)||0}/></div>
                    {Number(form.followers)>0 && Number(form.post_count)>0 && (
                      <div className="sm-stat">
                        <span className="sm-label">Eng. Rate (tahmini)</span>
                        <span style={{fontSize:14,fontWeight:700,color:'var(--ac)'}}>
                          %{Math.round(((Number(form.total_likes)||0)+(Number(form.comments)||0))/(Number(form.followers)*Number(form.post_count))*10000)/100}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{marginBottom:16}}>
                  <span className="sm-label">Notlar / Öne Çıkan İçerikler</span>
                  <textarea className="sm-inp" rows={4} value={form.notes}
                    onChange={e => setForm((p: any) => ({...p, notes: e.target.value}))}
                    placeholder="En iyi performans gösteren içerik, önemli gelişmeler, notlar..." style={{resize:'vertical'}} />
                </div>

                <button className="btn" onClick={save} disabled={saving} style={{width:'100%',justifyContent:'center',padding:'10px',background:'var(--ac)',color:'#fff'}}>
                  <Save size={14}/>{saving?'Kaydediliyor...':'Kaydet'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ÖZET */}
        {tab==='ozet' && (
          <div ref={ozetRef}>
            {loading ? (
              <div style={{textAlign:'center',color:'var(--tx3)',padding:40}}>Yükleniyor...</div>
            ) : ozetData.length===0 ? (
              <div style={{textAlign:'center',color:'var(--tx3)',padding:40}}>Bu hafta için {platform.label} verisi girilmemiş.</div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {ozetData.map(c => {
                  const r = c.report
                  return (
                    <div key={c.id} className="sm-card">
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:15}}>{c.brand_name||c.name}</div>
                          <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{platform.label} · {weekLabel}</div>
                        </div>
                        {r.engagement_rate>0 && (
                          <div className="eng-badge">Eng. %{r.engagement_rate}</div>
                        )}
                      </div>
                      <div className="sm-grid">
                        <div className="sm-stat">
                          <span className="sm-label">Post</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.post_count)}</div>
                          <Trend now={r.post_count} prev={r.prev_post_count}/>
                        </div>
                        {r.story_count>0 && <div className="sm-stat">
                          <span className="sm-label">Story</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.story_count)}</div>
                        </div>}
                        <div className="sm-stat">
                          <span className="sm-label">Like</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.total_likes)}</div>
                          <Trend now={r.total_likes} prev={r.prev_total_likes}/>
                        </div>
                        {r.comments>0 && <div className="sm-stat">
                          <span className="sm-label">Yorum</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.comments)}</div>
                        </div>}
                        {r.saves>0 && <div className="sm-stat">
                          <span className="sm-label">Kaydetme</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.saves)}</div>
                        </div>}
                        {r.shares>0 && <div className="sm-stat">
                          <span className="sm-label">Paylaşım</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.shares)}</div>
                        </div>}
                        <div className="sm-stat">
                          <span className="sm-label">Takipçi</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.followers)}</div>
                          <Trend now={r.followers} prev={r.prev_followers}/>
                        </div>
                        {r.reach>0 && <div className="sm-stat">
                          <span className="sm-label">Erişim</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.reach)}</div>
                        </div>}
                        {r.impressions>0 && <div className="sm-stat">
                          <span className="sm-label">Gösterim</span>
                          <div style={{fontSize:20,fontWeight:700}}>{fmt(r.impressions)}</div>
                        </div>}
                      </div>
                      {r.notes && (
                        <div style={{marginTop:12,fontSize:12,color:'var(--tx3)',background:'var(--s2)',borderRadius:6,padding:'10px 12px',lineHeight:1.5}}>
                          📝 {r.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
