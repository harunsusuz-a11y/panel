'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Star, Link2, Trash2 } from 'lucide-react'

type Row = {
  id: string; full_name: string | null; company: string | null
  q1_satisfaction: number; q2_creative: number; q3_communication: number; q4_process: number
  comment: string | null; created_at: string
}

const avg = (r: Row) => (r.q1_satisfaction + r.q2_creative + r.q3_communication + r.q4_process) / 4
const color = (v: number) => (v >= 4 ? 'var(--green)' : v >= 3 ? 'var(--amber)' : 'var(--red)')

export default function AnketeKatilanlarPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [copied, setCopied] = useState(false)

  async function load() {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single()
      setRole(p?.role || '')
    }
    const { data } = await sb.from('survey_responses').select('*').order('created_at', { ascending: false })
    setRows((data as Row[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    if (!rows.length) return null
    const m = (k: keyof Row) => rows.reduce((s, r) => s + (r[k] as number), 0) / rows.length
    return {
      total: rows.length,
      overall: rows.reduce((s, r) => s + avg(r), 0) / rows.length,
      q: [m('q1_satisfaction'), m('q2_creative'), m('q3_communication'), m('q4_process')],
    }
  }, [rows])

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/anket`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function remove(id: string) {
    if (!confirm('Bu yanıt silinsin mi?')) return
    const { error } = await createClient().from('survey_responses').delete().eq('id', id)
    if (!error) setRows(r => r.filter(x => x.id !== id))
  }

  const labels = ['Genel memnuniyet', 'Yaratıcı kalite', 'İletişim', 'Süreç']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar title="Ankete Katılanlar" subtitle={`${rows.length} yanıt`}
        action={<button className="btn-ghost" onClick={copyLink}><Link2 size={13} />{copied ? 'Kopyalandı ✓' : 'Anket linkini kopyala'}</button>} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 80px' }}>
        {loading ? <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</p>
        : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Star size={40} style={{ color: 'var(--tx3)', opacity: .6 }} strokeWidth={1.5} />
            <p style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>Henüz yanıt yok</p>
            <p style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>Anket linkini müşterilerinle paylaş: <b>/anket</b></p>
          </div>
        ) : (<>
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 18 }}>
              <div className="card" style={{ padding: 14 }}>
                <p style={{ fontSize: 11, color: 'var(--tx3)' }}>Toplam katılım</p>
                <p style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</p>
              </div>
              <div className="card" style={{ padding: 14 }}>
                <p style={{ fontSize: 11, color: 'var(--tx3)' }}>Genel ortalama</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: color(stats.overall) }}>{stats.overall.toFixed(2)} <span style={{ fontSize: 12, color: 'var(--tx3)' }}>/ 5</span></p>
              </div>
              {stats.q.map((v, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <p style={{ fontSize: 11, color: 'var(--tx3)' }}>{labels[i]}</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: color(v) }}>{v.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => {
              const a = avg(r)
              return (
                <div key={r.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{r.full_name || 'Anonim'}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
                        {[r.company, new Date(r.created_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="badge" style={{ background: 'var(--s3)', color: color(a) }}>Ort. {a.toFixed(1)}</span>
                    {role === 'admin' && (
                      <button className="btn-ghost" onClick={() => remove(r.id)} title="Sil"><Trash2 size={13} /></button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {[r.q1_satisfaction, r.q2_creative, r.q3_communication, r.q4_process].map((v, i) => (
                      <span key={i} className="badge badge-muted">{labels[i]}: <b style={{ marginLeft: 4, color: color(v) }}>{v}</b></span>
                    ))}
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.comment}</p>
                  )}
                </div>
              )
            })}
          </div>
        </>)}
      </div>
    </div>
  )
}
