'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { TrendingUp, TrendingDown, Minus, Save, ChevronLeft, ChevronRight } from 'lucide-react'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
]

function getMonday(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatWeek(monday: Date) {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function pct(now: number, prev: number) {
  if (!prev) return null
  return Math.round(((now - prev) / prev) * 100)
}

function Trend({ now, prev }: { now: number; prev: number }) {
  const p = pct(now, prev)
  if (p === null) return <span style={{ color: 'var(--tx3)', fontSize: 11 }}>—</span>
  if (p > 0) return <span style={{ color: 'var(--green)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2 }}><TrendingUp size={11} />+{p}%</span>
  if (p < 0) return <span style={{ color: 'var(--red)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2 }}><TrendingDown size={11} />{p}%</span>
  return <span style={{ color: 'var(--tx3)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2 }}><Minus size={11} />0%</span>
}

const emptyForm = () => ({
  post_count: '', story_count: '', total_likes: '', followers: '',
  reach: '', impressions: '',
  prev_post_count: '', prev_total_likes: '', prev_followers: '',
  notes: ''
})

export default function SosyalMedyaPage() {
  const [clients, setClients] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [myId, setMyId] = useState('')
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()))
  const [selClient, setSelClient] = useState<string>('')
  const [selPlatform, setSelPlatform] = useState('instagram')
  const [form, setForm] = useState<any>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'giris' | 'ozet'>('giris')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  const weekStart = toISO(monday)
  const weekEnd = toISO(new Date(monday.getTime() + 6 * 86400000))
  const weekLabel = formatWeek(monday)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => { if (user) setMyId(user.id) })
    sb.from('clients').select('id, name, brand_name').eq('status', 'active').order('name').then(({ data }) => setClients(data || []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const sb = createClient()
    const { data } = await sb.from('social_media_reports')
      .select('*, clients(name, brand_name)')
      .eq('week_start', weekStart)
      .order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  // Mevcut raporu forma yükle
  useEffect(() => {
    if (!selClient || !selPlatform) return
    const existing = reports.find(r => r.client_id === selClient && r.platform === selPlatform)
    if (existing) {
      setForm({
        post_count: existing.post_count ?? '',
        story_count: existing.story_count ?? '',
        total_likes: existing.total_likes ?? '',
        followers: existing.followers ?? '',
        reach: existing.reach ?? '',
        impressions: existing.impressions ?? '',
        prev_post_count: existing.prev_post_count ?? '',
        prev_total_likes: existing.prev_total_likes ?? '',
        prev_followers: existing.prev_followers ?? '',
        notes: existing.notes ?? ''
      })
    } else {
      setForm(emptyForm())
    }
  }, [selClient, selPlatform, reports])

  async function save() {
    if (!selClient) { showToast('Marka seçin'); return }
    setSaving(true)
    const sb = createClient()
    const payload = {
      client_id: selClient,
      week_start: weekStart,
      week_end: weekEnd,
      platform: selPlatform,
      post_count: Number(form.post_count) || 0,
      story_count: Number(form.story_count) || 0,
      total_likes: Number(form.total_likes) || 0,
      followers: Number(form.followers) || 0,
      reach: Number(form.reach) || 0,
      impressions: Number(form.impressions) || 0,
      prev_post_count: Number(form.prev_post_count) || 0,
      prev_total_likes: Number(form.prev_total_likes) || 0,
      prev_followers: Number(form.prev_followers) || 0,
      notes: form.notes,
      created_by: myId,
      updated_at: new Date().toISOString()
    }
    const existing = reports.find(r => r.client_id === selClient && r.platform === selPlatform)
    if (existing) {
      await sb.from('social_media_reports').update(payload).eq('id', existing.id)
    } else {
      await sb.from('social_media_reports').insert(payload)
    }
    await load()
    showToast('Kaydedildi ✓')
    setSaving(false)
  }

  const n = (v: any) => Number(v) || 0

  // Özet: tüm markaların bu haftaki verileri
  const ozet = clients.map(c => {
    const r = reports.find(x => x.client_id === c.id && x.platform === selPlatform)
    return { ...c, report: r }
  }).filter(c => c.report)

  return (
    <>
      <style>{`
        .sm-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:18px}
        .sm-label{font-size:11px;font-weight:600;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
        .sm-inp{width:100%;background:var(--s2);border:1px solid var(--bdr);border-radius:7px;padding:8px 10px;font-size:13px;color:var(--tx);outline:none;box-sizing:border-box}
        .sm-inp:focus{border-color:var(--ac)}
        .sm-tab{padding:7px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;border:none;background:transparent;color:var(--tx3)}
        .sm-tab.active{background:var(--ac);color:#fff}
        .sm-stat{background:var(--s2);border-radius:8px;padding:12px 14px}
        .sm-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .sm-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
        @media(max-width:600px){.sm-row{grid-template-columns:1fr}.sm-row3{grid-template-columns:1fr 1fr}}
      `}</style>

      <TopBar title="Sosyal Medya Raporu" />

      {toast && (
        <div style={{position:'fixed',top:18,right:18,background:'var(--green)',color:'#fff',borderRadius:8,padding:'10px 18px',fontSize:13,fontWeight:600,zIndex:9999}}>
          {toast}
        </div>
      )}

      <div style={{ padding: '20px 24px', maxWidth: 860, margin: '0 auto' }}>

        {/* Hafta navigasyonu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button className="btn" style={{ padding: '6px 10px' }} onClick={() => setMonday(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd })}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{weekLabel}</div>
            <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>Haftalık Rapor</div>
          </div>
          <button className="btn" style={{ padding: '6px 10px' }} onClick={() => setMonday(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd })}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Platform seçimi */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {PLATFORMS.map(p => (
            <button key={p.value} className={`sm-tab${selPlatform === p.value ? ' active' : ''}`}
              style={{ border: '1px solid var(--bdr)' }}
              onClick={() => setSelPlatform(p.value)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Tab */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button className={`sm-tab${tab === 'giris' ? ' active' : ''}`} style={{ border: '1px solid var(--bdr)' }} onClick={() => setTab('giris')}>Veri Girişi</button>
          <button className={`sm-tab${tab === 'ozet' ? ' active' : ''}`} style={{ border: '1px solid var(--bdr)' }} onClick={() => setTab('ozet')}>Özet Görünüm</button>
        </div>

        {tab === 'giris' && (
          <div className="sm-card">
            {/* Marka seçimi */}
            <div style={{ marginBottom: 16 }}>
              <div className="sm-label">Marka *</div>
              <select className="sm-inp" value={selClient} onChange={e => setSelClient(e.target.value)}>
                <option value="">— Marka Seçin —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.brand_name || c.name}</option>
                ))}
              </select>
            </div>

            {selClient && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
                  Bu Hafta
                </div>
                <div className="sm-row3" style={{ marginBottom: 14 }}>
                  {[
                    { key: 'post_count', label: 'Post Sayısı' },
                    { key: 'story_count', label: 'Story Sayısı' },
                    { key: 'total_likes', label: 'Toplam Like' },
                    { key: 'followers', label: 'Takipçi' },
                    { key: 'reach', label: 'Erişim (Reach)' },
                    { key: 'impressions', label: 'Gösterim' },
                  ].map(f => (
                    <div key={f.key}>
                      <div className="sm-label">{f.label}</div>
                      <input type="number" min={0} className="sm-inp" value={form[f.key]}
                        onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>
                  Önceki Hafta (Karşılaştırma)
                </div>
                <div className="sm-row" style={{ marginBottom: 14 }}>
                  {[
                    { key: 'prev_post_count', label: 'Önceki Post' },
                    { key: 'prev_total_likes', label: 'Önceki Like' },
                    { key: 'prev_followers', label: 'Önceki Takipçi' },
                  ].map(f => (
                    <div key={f.key}>
                      <div className="sm-label">{f.label}</div>
                      <input type="number" min={0} className="sm-inp" value={form[f.key]}
                        onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>

                {/* Anlık karşılaştırma */}
                {(n(form.prev_post_count) > 0 || n(form.prev_total_likes) > 0 || n(form.prev_followers) > 0) && (
                  <div className="sm-row" style={{ marginBottom: 14 }}>
                    <div className="sm-stat">
                      <div className="sm-label">Post Değişimi</div>
                      <Trend now={n(form.post_count)} prev={n(form.prev_post_count)} />
                    </div>
                    <div className="sm-stat">
                      <div className="sm-label">Like Değişimi</div>
                      <Trend now={n(form.total_likes)} prev={n(form.prev_total_likes)} />
                    </div>
                    <div className="sm-stat">
                      <div className="sm-label">Takipçi Değişimi</div>
                      <Trend now={n(form.followers)} prev={n(form.prev_followers)} />
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div className="sm-label">Notlar</div>
                  <textarea className="sm-inp" rows={3} value={form.notes}
                    onChange={e => setForm((p: any) => ({ ...p, notes: e.target.value }))}
                    placeholder="Bu haftaya dair notlar..." style={{ resize: 'vertical' }} />
                </div>

                <button className="btn" onClick={save} disabled={saving}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                  <Save size={14} />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </>
            )}
          </div>
        )}

        {tab === 'ozet' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--tx3)', padding: 40 }}>Yükleniyor...</div>
            ) : ozet.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--tx3)', padding: 40 }}>
                Bu hafta için {PLATFORMS.find(p => p.value === selPlatform)?.label} verisi girilmemiş.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ozet.map(c => {
                  const r = c.report
                  return (
                    <div key={c.id} className="sm-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{c.brand_name || c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{PLATFORMS.find(p => p.value === selPlatform)?.label} · {weekLabel}</div>
                        </div>
                      </div>
                      <div className="sm-row3">
                        <div className="sm-stat">
                          <div className="sm-label">Post</div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{r.post_count}</div>
                          <Trend now={r.post_count} prev={r.prev_post_count} />
                        </div>
                        <div className="sm-stat">
                          <div className="sm-label">Story</div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{r.story_count}</div>
                        </div>
                        <div className="sm-stat">
                          <div className="sm-label">Like</div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{r.total_likes?.toLocaleString('tr-TR')}</div>
                          <Trend now={r.total_likes} prev={r.prev_total_likes} />
                        </div>
                        <div className="sm-stat">
                          <div className="sm-label">Takipçi</div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{r.followers?.toLocaleString('tr-TR')}</div>
                          <Trend now={r.followers} prev={r.prev_followers} />
                        </div>
                        {r.reach > 0 && <div className="sm-stat">
                          <div className="sm-label">Erişim</div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{r.reach?.toLocaleString('tr-TR')}</div>
                        </div>}
                        {r.impressions > 0 && <div className="sm-stat">
                          <div className="sm-label">Gösterim</div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{r.impressions?.toLocaleString('tr-TR')}</div>
                        </div>}
                      </div>
                      {r.notes && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--tx3)', background: 'var(--s2)', borderRadius: 6, padding: '8px 10px' }}>{r.notes}</div>}
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
