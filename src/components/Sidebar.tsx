'use client'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const NAV = [
  { group: 'Genel', items: [
    { href: '/dashboard', label: 'Dashboard', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="11" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    )},
  ]},
  { group: 'İş Yönetimi', items: [
    { href: '/dashboard/musteriler', label: 'CRM / Müşteriler', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )},
    { href: '/dashboard/projeler', label: 'Projeler', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    )},
    { href: '/dashboard/gorevler', label: 'Görev Yönetimi', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    )},
    { href: '/dashboard/takvim', label: 'Takvim', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    )},
  ]},
  { group: 'İçerik & Operasyon', items: [
    { href: '/dashboard/icerik', label: 'İçerik Merkezi', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    )},
    { href: '/dashboard/operasyon', label: 'Operasyon', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    )},
    { href: '/dashboard/gecikmeler', label: 'Gecikmeler', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    )},
    { href: '/dashboard/onay', label: 'Onay Bekleyen', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    )},
  ]},
  { group: 'Finans', items: [
    { href: '/dashboard/muhasebe', label: 'Muhasebe', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
    )},
    { href: '/dashboard/finans', label: 'Finans', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    )},
    { href: '/dashboard/performans', label: 'Performans', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    )},
  ]},
  { group: 'Sistem', items: [
    { href: '/dashboard/kullanicilar', label: 'Kullanıcılar', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )},
    { href: '/dashboard/otomasyonlar', label: 'Otomasyonlar', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    )},
    { href: '/dashboard/entegrasyonlar', label: 'Entegrasyonlar', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
    )},
    { href: '/dashboard/ayarlar', label: 'Ayarlar', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    )},
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('?')
  const [role, setRole] = useState('member')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const n = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
        setName(n)
        setInitials(n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2))
        setRole(user.user_metadata?.role || 'Admin')
      }
    })
  }, [])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <aside style={{
      width: 228,
      background: 'var(--s1)',
      borderRight: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--gold-g)',
          borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(240,180,41,0.3)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
            <rect x="3" y="3" width="7" height="11" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>Agency ERP</div>
          <div style={{ fontSize: 9.5, color: 'var(--t3)', fontWeight: 500, marginTop: 1 }}>Ajans Yönetim Sistemi</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 12px' }}>
        {NAV.map(section => (
          <div key={section.group} style={{ marginBottom: 4 }}>
            <div style={{
              padding: '12px 8px 4px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--t3)',
              textTransform: 'uppercase',
            }}>
              {section.group}
            </div>
            {section.items.map(item => {
              const active = isActive(item.href)
              return (
                <div
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px',
                    margin: '1px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--gold)' : 'var(--t2)',
                    background: active ? 'rgba(240,180,41,0.09)' : 'transparent',
                    border: active ? '1px solid rgba(240,180,41,0.15)' : '1px solid transparent',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--text)'
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--s3)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--t2)'
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, display: 'flex', opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && (
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'var(--gold)',
                      boxShadow: '0 0 6px var(--gold)',
                      flexShrink: 0,
                    }}/>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        onClick={logout}
        style={{
          padding: '12px 12px',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--s3)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--gold-g)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#000',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(240,180,41,0.3)',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name || 'Yükleniyor...'}
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 1 }}>Çıkış için tıkla</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </div>
    </aside>
  )
}