'use client'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { group: 'Genel', items: [
    { href: '/dashboard', icon: '▪', label: 'Dashboard' },
    { href: '/dashboard/takvim', icon: '◻', label: 'Takvim' },
  ]},
  { group: 'CRM', items: [
    { href: '/dashboard/musteriler', icon: '◻', label: 'Müşteriler', badge: null },
    { href: '/dashboard/iletisimler', icon: '◻', label: 'İletişimler' },
  ]},
  { group: 'Projeler', items: [
    { href: '/dashboard/projeler', icon: '◻', label: 'Tüm Projeler' },
    { href: '/dashboard/gorevler', icon: '◻', label: 'Görevlerim', badge: 'warn' },
    { href: '/dashboard/gecikmeler', icon: '◻', label: 'Gecikmeler', badge: 'red' },
    { href: '/dashboard/zaman', icon: '◻', label: 'Zaman Takibi' },
  ]},
  { group: 'İçerik', items: [
    { href: '/dashboard/icerik', icon: '◻', label: 'İçerik Panosu' },
    { href: '/dashboard/yayın', icon: '◻', label: 'Yayın Takvimi' },
    { href: '/dashboard/onay', icon: '◻', label: 'Onay Akışı', badge: 'warn' },
  ]},
  { group: 'Raporlar', items: [
    { href: '/dashboard/performans', icon: '◻', label: 'Performans' },
    { href: '/dashboard/dokumanlar', icon: '◻', label: 'Dökümanlar' },
  ]},
  { group: 'Sistem', items: [
    { href: '/dashboard/ekip', icon: '◻', label: 'Ekip & Yetkiler' },
    { href: '/dashboard/ayarlar', icon: '◻', label: 'Ayarlar' },
  ]},
]

const icons: Record<string, string> = {
  '/dashboard': '⊞',
  '/dashboard/takvim': '📅',
  '/dashboard/musteriler': '🏢',
  '/dashboard/iletisimler': '📞',
  '/dashboard/projeler': '📁',
  '/dashboard/gorevler': '✓',
  '/dashboard/gecikmeler': '⚠',
  '/dashboard/zaman': '⏱',
  '/dashboard/icerik': '✏',
  '/dashboard/yayın': '📆',
  '/dashboard/onay': '✅',
  '/dashboard/performans': '📊',
  '/dashboard/dokumanlar': '📄',
  '/dashboard/ekip': '👥',
  '/dashboard/ayarlar': '⚙',
}

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (user?.user_metadata?.full_name || user?.email || 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside style={{ width: 224, background: 'var(--s1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, background: 'var(--gold)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#000"><rect x="3" y="3" width="7" height="11" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Panel</div>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>Ajans Yönetim Sistemi</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0 12px' }}>
        {nav.map(section => (
          <div key={section.group}>
            <div style={{ padding: '18px 14px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--t3)', textTransform: 'uppercase' }}>
              {section.group}
            </div>
            {section.items.map(item => {
              const active = pathname === item.href
              return (
                <div
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 12px', margin: '1px 6px', borderRadius: 7,
                    cursor: 'pointer', fontSize: 12.5, fontWeight: active ? 500 : 400,
                    color: active ? 'var(--gold)' : 'var(--t2)',
                    background: active ? 'var(--gold-d)' : 'transparent',
                    position: 'relative', transition: 'all .12s',
                  }}
                >
                  {active && <div style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', width: 2.5, height: 16, background: 'var(--gold)', borderRadius: '0 2px 2px 0' }} />}
                  <span style={{ fontSize: 13, width: 17, textAlign: 'center' }}>{icons[item.href] || '·'}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge === 'red' && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: 'rgba(240,68,68,0.1)', color: 'var(--red)' }}>!</span>}
                  {item.badge === 'warn' && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>!</span>}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        onClick={logout}
        style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
        title="Çıkış yap"
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t2)' }}>
            {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>Çıkış için tıkla</div>
        </div>
      </div>
    </aside>
  )
}
