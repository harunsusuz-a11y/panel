'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import { Plus, X } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'

const ST: Record<string,any> = { paid:{l:'Ödendi',c:'var(--green)',bg:'var(--green2)'}, pending:{l:'Bekliyor',c:'var(--amber)',bg:'var(--amber2)'}, overdue:{l:'Gecikti',c:'var(--red)',bg:'var(--red2)'} }

export default function MuhasebePage() {
  const [tab, setTab]     = useState<'income'|'expense'>('income')
  const [rows, setRows]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm]   = useState({ description:'', amount:'', category:'', status:'paid', date: new Date().toISOString().slice(0,10) })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  async function load() {
    setLoading(true)
    const { data } = await createClient().from('transactions').select('*').order('date', { ascending: false })
    setRows(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function add() {
    if (!form.description || !form.amount) return
    const { error } = await createClient().from('transactions').insert({ type: tab, description: form.description, amount: Number(form.amount), category: form.category, status: form.status, date: form.date })
    if (error) showToast('Hata: ' + error.message)
    else { showToast('Kaydedildi!'); setModal(false); load(); setForm({ description:'', amount:'', category:'', status:'paid', date: new Date().toISOString().slice(0,10) }) }
  }

  async function del(id: string) {
    if (!confirm('Kaydı silmek istediğinize emin misiniz?')) return
    await createClient().from('transactions').delete().eq('id', id); load()
  }

  const stats = {
    income:  rows.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0),
    expense: rows.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0),
  }
  const net = stats.income - stats.expense
  const filtered = rows.filter(r => r.type === tab)

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <TopBar title="Muhasebe" action={<button className="btn" onClick={() => setModal(true)}><Plus size={14} strokeWidth={2} />Ekle</button>} />
        {toast && <div className={`toast ${toast.startsWith('Hata') ? 'toast-err' : 'toast-ok'}`}>{toast}</div>}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            {[{ l:'Toplam Gelir', v:stats.income, c:'var(--green)' }, { l:'Toplam Gider', v:stats.expense, c:'var(--red)' }, { l:'Net Kar', v:net, c: net >= 0 ? 'var(--ac)' : 'var(--red)' }].map(s => (
              <div key={s.l} className="kpi" style={{ borderLeft: `2.5px solid ${s.c}` }}>
                <p className="kpi-label">{s.l}</p>
                <p className="kpi-value" style={{ color: s.c }}>₺{Math.round(s.v).toLocaleString('tr-TR')}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['income', 'expense'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn' : 'btn-ghost'} style={{ fontSize: 12.5 }}>
                {t === 'income' ? 'Gelirler' : 'Giderler'}
              </button>
            ))}
          </div>
          <div className="card">
            {loading ? <p style={{ padding: 24, color: 'var(--tx3)', textAlign: 'center', fontSize: 13 }}>Yükleniyor...</p>
            : filtered.length === 0 ? <p style={{ padding: 40, color: 'var(--tx3)', textAlign: 'center', fontSize: 13 }}>Kayıt yok.</p>
            : filtered.map((r, i) => (
              <div key={r.id} className="row" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>{r.category || '—'} · {r.date}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.type === 'income' ? 'var(--green)' : 'var(--red)', fontFamily: 'JetBrains Mono,monospace', flexShrink: 0 }}>
                  {r.type === 'income' ? '+' : '−'}₺{Number(r.amount).toLocaleString('tr-TR')}
                </span>
                <span className="badge" style={{ background: ST[r.status]?.bg, color: ST[r.status]?.c, flexShrink: 0 }}>{ST[r.status]?.l}</span>
                <button onClick={() => del(r.id)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal">
            <p className="modal-title">{tab === 'income' ? 'Gelir' : 'Gider'} Ekle</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label className="label">Açıklama</label><input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="inp" autoFocus /></div>
              <div className="modal-grid">
                <div><label className="label">Tutar (₺)</label><input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="inp" /></div>
                <div><label className="label">Tarih</label><input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="inp" /></div>
                <div><label className="label">Kategori</label><input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="inp" /></div>
                <div><label className="label">Durum</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="inp">
                    <option value="paid">Ödendi</option><option value="pending">Bekliyor</option><option value="overdue">Gecikti</option>
                  </select>
                </div>
              </div>
              <button className="btn" onClick={add} style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 4 }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
