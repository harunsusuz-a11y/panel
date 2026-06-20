'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, FolderOpen, CheckSquare, CalendarDays,
  FileText, Activity, AlertCircle, ShieldCheck,
  Receipt, BarChart2, TrendingUp, UserCog, Workflow, Link2,
  SlidersHorizontal, LogOut
} from 'lucide-react'

const NAV = [
  { g: 'Genel', items: [
    { href: '/dashboard',                label: 'Dashboard',      Icon: LayoutDashboard },
  ]},
  { g: 'İş Yönetimi', items: [
    { href: '/dashboard/musteriler',     label: 'Müşteriler',     Icon: Users },
    { href: '/dashboard/projeler',       label: 'Projeler',       Icon: FolderOpen },
    { href: '/dashboard/gorevler',       label: 'Görevler',       Icon: CheckSquare },
    { href: '/dashboard/takvim',         label: 'Takvim',         Icon: CalendarDays },
  ]},
  { g: 'Operasyon', items: [
    { href: '/dashboard/icerik',         label: 'İçerik',         Icon: FileText },
    { href: '/dashboard/operasyon',      label: 'Operasyon',      Icon: Activity },
    { href: '/dashboard/gecikmeler',     label: 'Gecikmeler',     Icon: AlertCircle },
    { href: '/dashboard/onay',           label: 'Onay',           Icon: ShieldCheck },
  ]},
  { g: 'Finans', items: [
    { href: '/dashboard/muhasebe',       label: 'Muhasebe',       Icon: Receipt },
    { href: '/dashboard/finans',         label: 'Finans',         Icon: BarChart2 },
    { href: '/dashboard/performans',     label: 'Performans',     Icon: TrendingUp },
  ]},
  { g: 'Sistem', items: [
    { href: '/dashboard/kullanicilar',   label: 'Kullanıcılar',   Icon: UserCog },
    { href: '/dashboard/otomasyonlar',   label: 'Otomasyonlar',   Icon: Workflow },
    { href: '/dashboard/entegrasyonlar', label: 'Entegrasyonlar', Icon: Link2 },
    { href: '/dashboard/ayarlar',        label: 'Ayarlar',        Icon: SlidersHorizontal },
  ]},
]

const ROLE_LABEL: Record<string, string> = { admin: 'Yönetici', manager: 'Müdür', member: 'Üye' }

export default function Sidebar() {
  const pathname = usePathname()
  const [name,     setName]     = useState('')
  const [initials, setInitials] = useState('?')
  const [role,     setRole]     = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('full_name,role').eq('id', user.id).single()
        .then(({ data }) => {
          const n = data?.full_name || user.email?.split('@')[0] || ''
          setName(n)
          setInitials(n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2))
          setRole(ROLE_LABEL[data?.role] || data?.role || '')
        })
    })
  }, [])

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="erp-sidebar">
      {/* Logo */}
      <div className="erp-sidebar-logo">
        <div className="erp-sidebar-mark">
          <LayoutDashboard size={14} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
            Agency ERP
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
            Operasyon Paneli
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="erp-sidebar-nav">
        {NAV.map(section => (
          <div key={section.g}>
            <p className="erp-sidebar-group">{section.g}</p>
            {section.items.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`erp-sidebar-item ${isActive(href) ? 'active' : ''}`}
              >
                <span className="erp-icon">
                  <Icon size={14} strokeWidth={1.8} />
                </span>
                <span style={{ flex: 1 }}>{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="erp-sidebar-user" onClick={logout} title="Çıkış yap">
        <div className="erp-sidebar-avatar">{initials}</div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name || '...'}
          </p>
          <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>{role}</p>
        </div>
        <LogOut size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} strokeWidth={1.8} />
      </div>
    </aside>
  )
}