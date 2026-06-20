'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { ArrowUpRight } from 'lucide-react'
import { fmtDeadline } from '@/lib/utils'

function Bar({ bars }: { bars: { l: string; v: number; hi?: boolean }[] }) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), 80); return () => clearTimeout(t) }, [])
  const max = Math.max(...bars.map(b => b.v), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          {b.v > 0 && <span style={{ fontSize: 9, color: b.hi ? 'var(--ac)' : 'var(--tx3)', fontFamily: 'JetBrains Mono,monospace', fontWeight: b.hi ? 600 : 400 }}>₺{b.v}K</span>}
          <div style={{ width: '100%', height: m ? `${Math.max((b.v / max) * 80, b.v > 0 ? 3 : 0)}px` : '0', background: b.hi ? 'linear-gradient(180deg,var(--ac),rgba(124,106,247,.4))' : 'var(--s4)', borderRadius: '4px 4px 0 0', boxShadow: b.hi ? '0 0 12px rgba(124,106,247,.35)' : 'none', transition: `height .55s cubic-bezier(.22,1,.36,1) ${i * 30}ms` }} />
          <span style={{ fontSize: 9.5, color: b.hi ? 'var(--ac)' : 'var(--tx3)', fontWeight: b.hi ? 600 : 400 }}>{b.l}</span>
        </div>
      ))}
    </div>
  )
}

export default function FinansPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().from('transactions').select('*').order('date').then(({ data }) => { setRows(data || []); setLoading(false) })
  }, [])

  const income  = rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0)
  const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0)
  const net = income - expense
  const pending = rows.filter(r => r.status === 'pending' || r.status === 'overdue').reduce((s, r) => s + Number(r.amount), 0)
  const fmt = (v: number) => v >= 1000 ? `₺${Math.round(v / 1000)}K` : `₺${v}`

  const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const cm = new Date().getMonth()
  const bars = Array.from({ length: 6 }, (_, i) => {
    const m = (cm - 5 + i + 12) % 12
    const v = rows.filter(r => r.type === 'income' && r.date && new Date(r.date).getMonth() === m).reduce((s, r) => s + Number(r.amount), 0)
    return { l: MONTHS[m], v: Math.round(v / 1000), hi: i === 5 }
  })

  const catMap: Record<string, number> = {}
  rows.filter(r => r.type === 'income').forEach(r => { catMap[r.category || 'Diğer'] = (catMap[r.category || 'Diğer'] || 0) + Number(r.amount) / 1000 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar title="Finans" subtitle="Gelir & Gider Analizi" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 80px' }}>
        {loading ? <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Yükleniyor...</p> : (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
            {[{ l: 'Toplam Gelir', v: income, c: 'var(--green)' }, { l: 'Toplam Gider', v: expense, c: 'var(--red)' }, { l: 'Net Kar', v: net, c: net >= 0 ? 'var(--ac)' : 'var(--red)' }, { l: 'Tahsilat Bekleyen', v: pending, c: 'var(--amber)' }].map(s => (
              <div key={s.l} className="kpi" style={{ borderLeft: `2.5px solid ${s.c}` }}>
                <p className="kpi-label">{s.l}</p>
                <p className="kpi-value" style={{ color: s.c }}>₺{Math.round(s.v).toLocaleString('tr-TR')}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="card">
              <div className="card-h"><span className="card-title">Aylık Gelir</span><span className="card-meta">Son 6 ay</span></div>
              <div style={{ padding: '16px 18px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--tx)', letterSpacing: '-1px', lineHeight: 1 }}>{fmt(income)}</span>
                  <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}><ArrowUpRight size={13} strokeWidth={2.5} />Bu ay</span>
                </div>
                <Bar bars={bars} />
              </div>
            </div>
            <div className="card">
              <div className="card-h"><span className="card-title">Gelir / Gider</span></div>
              <div style={{ padding: '16px 18px' }}>
                {[{ l: 'Gelir', v: income, c: 'var(--green)' }, { l: 'Gider', v: expense, c: 'var(--red)' }, { l: 'Net', v: net, c: 'var(--ac)' }].map(s => (
                  <div key={s.l} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--tx2)' }}>{s.l}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.c, fontFamily: 'JetBrains Mono,monospace' }}>₺{Math.round(s.v).toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="prog">
                      <div className="prog-fill" style={{ width: `${income ? Math.abs(s.v) / (income + expense) * 100 : 0}%`, background: s.c }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-h"><span className="card-title">Son İşlemler</span></div>
            {rows.slice(0, 8).map((r, i) => (
              <div key={r.id} className="row" style={{ borderBottom: i < 7 ? '1px solid var(--bdr)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: r.type === 'income' ? 'var(--green2)' : 'var(--red2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{r.type === 'income' ? '↑' : '↓'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>{r.category || '—'} · {fmtDeadline(r.date)}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.type === 'income' ? 'var(--green)' : 'var(--red)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>
                  {r.type === 'income' ? '+' : '−'}₺{Number(r.amount).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
}
