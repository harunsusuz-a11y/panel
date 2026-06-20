'use client'
import { useState } from 'react'
import { CheckCircle2, RotateCcw, Send } from 'lucide-react'

export default function ClientActions({ token, currentDecision }: { token: string; currentDecision: string }) {
  const [decision, setDecision] = useState(currentDecision || 'pending')
  const [note,     setNote]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const [done,     setDone]     = useState(false)

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

  if (done || decision !== 'pending') {
    return (
      <div style={{ background: decision === 'approved' ? 'rgba(34,211,160,.1)' : 'rgba(240,168,67,.1)', border: `1px solid ${decision === 'approved' ? 'rgba(34,211,160,.3)' : 'rgba(240,168,67,.3)'}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        {decision === 'approved'
          ? <CheckCircle2 size={20} color="#22d3a0" strokeWidth={2} />
          : <RotateCcw size={20} color="#f0a843" strokeWidth={2} />}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5' }}>{decision === 'approved' ? '✓ Onayladınız' : 'Revizyon Talep Edildi'}</p>
          <p style={{ fontSize: 12, color: '#50506a', marginTop: 2 }}>Yanıtınız ajansa iletildi.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#131318', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '18px', marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5', marginBottom: 12 }}>Değerlendirmeniz</p>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Not ekleyin (isteğe bağlı)..."
        style={{ width: '100%', background: '#1a1a22', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, color: '#f0f0f5', padding: '10px 12px', fontSize: 13, resize: 'vertical', outline: 'none', marginBottom: 12, fontFamily: 'Inter,sans-serif', lineHeight: 1.5 }}
        rows={3}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => submitDecision('approved')} disabled={saving}
          style={{ flex: 1, background: 'rgba(34,211,160,.15)', border: '1px solid rgba(34,211,160,.3)', borderRadius: 9, color: '#22d3a0', fontWeight: 700, fontSize: 14, padding: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? .6 : 1 }}>
          <CheckCircle2 size={16} strokeWidth={2.5} />Onaylıyorum
        </button>
        <button onClick={() => submitDecision('revision')} disabled={saving}
          style={{ flex: 1, background: 'rgba(240,168,67,.15)', border: '1px solid rgba(240,168,67,.3)', borderRadius: 9, color: '#f0a843', fontWeight: 700, fontSize: 14, padding: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? .6 : 1 }}>
          <RotateCcw size={16} strokeWidth={2.5} />Revizyon
        </button>
      </div>
    </div>
  )
}
