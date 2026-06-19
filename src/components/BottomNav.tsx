'use client'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="11" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  )},
  { href: '/dashboard/gorevler', label: 'Görevler', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  )},
  { href: '/dashboard/projeler', label: 'Projeler', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  )},
  { href: '/dashboard/musteriler', label: 'Müşteriler', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { href: '/dashboard/finans', label: 'Finans', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  )},
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <nav style={{
      width: '100%',
      height: 56,
      background: 'rgba(13,15,24,0.97)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
    }}>
      {NAV.map(item => {
        const active = isActive(item.href)
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              height: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--gold)' : 'var(--t2)',
              padding: 0,
              transition: 'color 0.15s',
            }}
          >
            <span style={{ opacity: active ? 1 : 0.5 }}>{item.icon}</span>
            <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, letterSpacing: '0.01em' }}>{item.label}</span>
            {active && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: 28,
                height: 2,
                background: 'var(--gold)',
                borderRadius: '2px 2px 0 0',
                boxShadow: '0 0 8px var(--gold)',
              }}/>
            )}
          </button>
        )
      })}
    </nav>
  )
}
