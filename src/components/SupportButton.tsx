'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LifeBuoy, X, ChevronDown } from 'lucide-react'

const TYPES = [
  { value: 'oneri',   label: '💡 Öneri',   color: 'var(--blue)'  },
  { value: 'hata',    label: '🐛 Hata',    color: 'var(--red)'   },
  { value: 'sikayet', label: '😤 Şikayet', color: 'var(--amber)' },
  { value: 'diger',   label: '💬 Diğer',   color: 'var(--tx3)'   },
]

export default function SupportButton() {
  const [open,    setOpen]    = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [form,    setForm]    = useState({ type: 'oneri', title: '', note: '' })

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 3000) }

  async function submit() {
    if (!form.title.trim()) { showToast('Başlık zorunlu'); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    const { error } = await sb.from('support_tickets').insert({
      user_id: user?.id,
      type: form.type,
      title: form.title.trim(),
      note: form.note.trim() || null,
    })
    setSaving(false)
    if (error) { showToast('Hata: ' + error.message); return }
    showToast('✓ Talebiniz iletildi!')
    setOpen(false)
    setForm({ type: 'oneri', title: '', note: '' })

    // Admin + manager'a bildirim
    try {
      const { data: admins } = await sb.from('profiles').select('id').in('role', ['admin', 'manager'])
      if (admins?.length) {
        await sb.from('notifications').insert(
          admins.map((a: any) => ({
            user_id: a.id,
            type: 'support',
            title: `📩 Yeni Destek Talebi`,
            body: `${TYPES.find(t => t.value === form.type)?.label} — "${form.title.trim()}"`,
            entity_type: 'support_tickets',
            is_read: false,
          }))
        )
      }
    } catch {}
  }

  return (
    <>
      {/* Floating buton */}
      <button
        onClick={() => setOpen(true)}
        title="Destek Talebi Oluştur"
        style={{
          position: 'fixed', bottom: 80, right: 18, zIndex: 900,
          width: 42, height: 42, borderRadius: '50%',
          background: 'var(--ac)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(124,106,247,.45)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(124,106,247,.6)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(124,106,247,.45)' }}
      >
        <LifeBuoy size={18} color="#fff" strokeWidth={2} />
      </button>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 130, right: 18, zIndex: 1000,
          background: toast.startsWith('Hata') ? 'var(--red2)' : 'var(--green2)',
          color: toast.startsWith('Hata') ? 'var(--red)' : 'var(--green)',
          border: `1px solid ${toast.startsWith('Hata') ? 'var(--red)' : 'var(--green)'}30`,
          borderRadius: 9, padding: '9px 14px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 14px rgba(0,0,0,.2)',
        }}>
          {toast}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 950,
            background: 'rgba(0,0,0,.55)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div style={{
            background: 'var(--s1)', borderRadius: 14, padding: 22,
            width: '100%', maxWidth: 420,
            border: '1px solid var(--bdr)',
            boxShadow: '0 20px 60px rgba(0,0,0,.4)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--ac2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LifeBuoy size={15} style={{ color: 'var(--ac)' }} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize: 14.5, fontWeight: 700 }}>Destek Talebi</p>
                  <p style={{ fontSize: 11, color: 'var(--tx3)' }}>Emir ve Mert'e iletilir</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* Tür */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>
                  Talep Türü
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      style={{
                        padding: '9px 12px', borderRadius: 9, border: `1px solid ${form.type === t.value ? t.color : 'var(--bdr)'}`,
                        background: form.type === t.value ? `${t.color}15` : 'var(--s2)',
                        color: form.type === t.value ? t.color : 'var(--tx2)',
                        fontSize: 13, fontWeight: form.type === t.value ? 700 : 400,
                        cursor: 'pointer', transition: 'all .12s', textAlign: 'left',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Başlık */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>
                  Başlık *
                </label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Kısaca ne olduğunu yaz..."
                  autoFocus
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 8, color: 'var(--tx)', fontSize: 13, outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
              </div>

              {/* Not */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 7 }}>
                  Detay / Not
                </label>
                <textarea
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="İsteğe bağlı — daha fazla detay ekle..."
                  rows={3}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderRadius: 8, color: 'var(--tx)', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button
                onClick={submit}
                disabled={saving || !form.title.trim()}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  background: saving || !form.title.trim() ? 'var(--s3)' : 'var(--ac)',
                  color: saving || !form.title.trim() ? 'var(--tx3)' : '#fff',
                  border: 'none', fontSize: 14, fontWeight: 700, cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all .15s',
                }}
              >
                {saving ? 'Gönderiliyor...' : 'Talebi Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
