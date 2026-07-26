'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import { Printer, Calendar, Users, CheckCircle2, Clock, ListChecks, LogIn } from 'lucide-react'

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', manager: 'Yönetici', member: 'Üye', muhasebe: 'Muhasebe' }

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
function fmtMin(min: number) {
  if (!min) return '0 dk'
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  return h > 0 ? `${h} sa ${m > 0 ? m + ' dk' : ''}`.trim() : `${m} dk`
}

export default function RaporPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const sb = createClient()
      const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role !== 'admin') { router.push('/dashboard'); return }
      setAllowed(true)
    })
  }, [router])

  useEffect(() => { if (allowed) load() }, [allowed, date])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/daily?date=${date}`)
      const data = await res.json()
      setReport(data)
    } finally {
      setLoading(false)
    }
  }

  if (allowed === null) return null

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })

  return (
    <>
      <style>{`
        .rp-card{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;padding:16px;margin-bottom:14px}
        .rp-card-h{font-size:13px;font-weight:700;display:flex;align-items:center;gap:7px;margin-bottom:12px}
        .rp-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .rp-stat{background:var(--s2);border-radius:9px;padding:12px;text-align:center}
        .rp-stat-n{font-size:22px;font-weight:800;color:var(--ac)}
        .rp-stat-l{font-size:10.5px;color:var(--tx3);margin-top:2px}
        .rp-user{border:1px solid var(--bdr);border-radius:10px;padding:14px;margin-bottom:10px}
        .rp-user-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .rp-section-t{font-size:10.5px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.05em;margin:10px 0 6px}
        .rp-li{font-size:12.5px;padding:5px 0;border-bottom:1px solid var(--bdr);display:flex;justify-content:space-between;gap:10px}
        .rp-li:last-child{border-bottom:none}
        @media(max-width:900px){.rp-stat-grid{grid-template-columns:repeat(2,1fr)}}
        @media print{
          body *{visibility:hidden}
          .rp-print-area,.rp-print-area *{visibility:visible}
          .rp-print-area{position:absolute;left:0;top:0;width:100%;padding:20px}
          .rp-card{border:1px solid #ccc;break-inside:avoid}
          .rp-user{border:1px solid #ccc;break-inside:avoid}
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Günlük Operasyon Raporu" subtitle={dateLabel} action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="inp" style={{ width: 150 }} max={new Date().toISOString().slice(0, 10)} />
            <button className="btn" onClick={() => window.print()}><Printer size={13} strokeWidth={2} />PDF İndir</button>
          </div>
        } />

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading ? <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Rapor hazırlanıyor...</p> : !report ? null : (
            <div className="rp-print-area">
              {/* Genel özet */}
              <div className="rp-card">
                <div className="rp-card-h"><Calendar size={14} />Genel Özet — {dateLabel}</div>
                <div className="rp-stat-grid">
                  <div className="rp-stat"><div className="rp-stat-n">{report.summary.active_users}/{report.summary.total_users}</div><div className="rp-stat-l">Aktif Kullanıcı</div></div>
                  <div className="rp-stat"><div className="rp-stat-n">{report.summary.logins_count}</div><div className="rp-stat-l">Sisteme Giriş</div></div>
                  <div className="rp-stat"><div className="rp-stat-n">{report.summary.tasks_created}</div><div className="rp-stat-l">Yeni Görev</div></div>
                  <div className="rp-stat"><div className="rp-stat-n">{report.summary.tasks_completed}</div><div className="rp-stat-l">Tamamlanan Görev</div></div>
                  <div className="rp-stat"><div className="rp-stat-n">{report.summary.contents_created}</div><div className="rp-stat-l">Yeni İçerik</div></div>
                  <div className="rp-stat"><div className="rp-stat-n">{report.summary.approvals_opened}</div><div className="rp-stat-l">Onay Talebi</div></div>
                  <div className="rp-stat"><div className="rp-stat-n">{report.summary.sms_sent}</div><div className="rp-stat-l">SMS Gönderildi</div></div>
                  <div className="rp-stat"><div className="rp-stat-n">{report.summary.shares_added}</div><div className="rp-stat-l">Paylaşım Eklendi</div></div>
                </div>
              </div>

              {/* Haftalık şablonlar */}
              <div className="rp-card">
                <div className="rp-card-h"><ListChecks size={14} />Haftalık Görev Şablonları</div>
                {report.templates_applied.length === 0 && report.templates_not_applied.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: 'var(--tx3)' }}>Aktif şablon yok.</p>
                ) : <>
                  {report.templates_applied.map((t: any, i: number) => (
                    <div key={i} className="rp-li">
                      <span>✓ {t.title} {t.assigned_to ? `— ${t.assigned_to}` : ''}</span>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>Uygulandı</span>
                    </div>
                  ))}
                  {report.templates_not_applied.map((t: any, i: number) => (
                    <div key={i} className="rp-li">
                      <span style={{ color: 'var(--tx3)' }}>○ {t.title} {t.assigned_to ? `— ${t.assigned_to}` : ''}</span>
                      <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Henüz Uygulanmadı</span>
                    </div>
                  ))}
                </>}
              </div>

              {/* Kullanıcı bazlı detay */}
              <div className="rp-card">
                <div className="rp-card-h"><Users size={14} />Kullanıcı Bazlı Aktivite</div>
                {report.users.length === 0 ? <p style={{ fontSize: 12.5, color: 'var(--tx3)' }}>Bugün kayıtlı aktivite yok.</p> :
                  report.users.map((u: any) => (
                    <div key={u.id} className="rp-user">
                      <div className="rp-user-h">
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13.5 }}>{u.full_name}</span>
                          <span className="badge badge-muted" style={{ marginLeft: 8, fontSize: 10 }}>{ROLE_LABEL[u.role] || u.role}</span>
                        </div>
                        {!u.active_today && <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Bugün aktivite yok</span>}
                      </div>

                      {u.logins.length > 0 && (
                        <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <LogIn size={11} />Giriş: {u.logins.map((l: string) => fmtTime(l)).join(', ')}
                        </div>
                      )}

                      {u.tasks_created.length > 0 && <>
                        <div className="rp-section-t">Oluşturduğu Görevler ({u.tasks_created.length})</div>
                        {u.tasks_created.map((t: any, i: number) => (
                          <div key={i} className="rp-li"><span>{t.title}{t.client ? ` — ${t.client}` : ''}{t.from_template ? ' 📅' : ''}</span></div>
                        ))}
                      </>}

                      {u.tasks_completed.length > 0 && <>
                        <div className="rp-section-t">Tamamladığı Görevler ({u.tasks_completed.length})</div>
                        {u.tasks_completed.map((t: any, i: number) => (
                          <div key={i} className="rp-li"><span>{t.title}{t.client ? ` — ${t.client}` : ''}</span><span style={{ color: 'var(--tx3)' }}>{fmtTime(t.at)}</span></div>
                        ))}
                      </>}

                      {u.stage_transitions.length > 0 && <>
                        <div className="rp-section-t">Aşama Geçişleri ({u.stage_transitions.length})</div>
                        {u.stage_transitions.map((t: any, i: number) => (
                          <div key={i} className="rp-li"><span>{t.title}: {t.from} → {t.to}</span><span style={{ color: 'var(--tx3)' }}>{fmtTime(t.at)}</span></div>
                        ))}
                      </>}

                      {u.approvals_requested.length > 0 && <>
                        <div className="rp-section-t">Onay Talepleri ({u.approvals_requested.length})</div>
                        {u.approvals_requested.map((a: any, i: number) => (
                          <div key={i} className="rp-li"><span>{a.title}</span><span style={{ color: 'var(--tx3)' }}>{a.status}</span></div>
                        ))}
                      </>}

                      {u.time_spent_minutes > 0 && (
                        <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={11} />Toplam süre: {fmtMin(u.time_spent_minutes)}
                        </div>
                      )}

                      {u.checklist && (
                        <div style={{ marginTop: 8, padding: '8px 10px', background: u.checklist.done === u.checklist.total ? 'var(--green2)' : 'var(--amber2)', borderRadius: 7, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={12} style={{ color: u.checklist.done === u.checklist.total ? 'var(--green)' : 'var(--amber)' }} />
                          Gün Sonu Checklist: {u.checklist.done}/{u.checklist.total} tamamlandı
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>

              <p style={{ fontSize: 10.5, color: 'var(--tx3)', textAlign: 'center', marginTop: 10 }}>
                Rapor {new Date(report.generated_at).toLocaleString('tr-TR')} tarihinde otomatik oluşturuldu.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
