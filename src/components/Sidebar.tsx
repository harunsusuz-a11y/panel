'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, FolderOpen, CheckSquare, CalendarDays,
  FileText, Activity, AlertCircle, ShieldCheck,
  Receipt, BarChart2, TrendingUp, UserCog, Workflow,
  SlidersHorizontal, LogOut
} from 'lucide-react'

// Daydream erişim matrisi
const NAV_ALL = [
  { g: 'Genel', items: [
    { href: '/dashboard',                label: 'Dashboard',    Icon: LayoutDashboard, roles: ['admin','manager','member'] },
  ]},
  { g: 'İş Yönetimi', items: [
    { href: '/dashboard/musteriler',     label: 'Müşteriler',   Icon: Users,           roles: ['admin','manager'] },
    { href: '/dashboard/projeler',       label: 'Projeler',     Icon: FolderOpen,      roles: ['admin','manager','member'] },
    { href: '/dashboard/gorevler',       label: 'Görevler',     Icon: CheckSquare,     roles: ['admin','manager','member'] },
    { href: '/dashboard/takvim',         label: 'Takvim',       Icon: CalendarDays,    roles: ['admin','manager','member'] },
  ]},
  { g: 'Operasyon', items: [
    { href: '/dashboard/icerik',         label: 'İçerik',       Icon: FileText,        roles: ['admin','manager','member'] },
    { href: '/dashboard/operasyon',      label: 'Operasyon',    Icon: Activity,        roles: ['admin','manager'] },
    { href: '/dashboard/gecikmeler',     label: 'Gecikmeler',   Icon: AlertCircle,     roles: ['admin','manager'] },
    { href: '/dashboard/onay',           label: 'Onay',         Icon: ShieldCheck,     roles: ['admin','manager','member'] },
  ]},
  { g: 'Finans', items: [
    { href: '/dashboard/muhasebe',       label: 'Muhasebe',     Icon: Receipt,         roles: ['admin','manager'] },
    { href: '/dashboard/finans',         label: 'Finans',       Icon: BarChart2,       roles: ['admin','manager'] },
    { href: '/dashboard/performans',     label: 'Performans',   Icon: TrendingUp,      roles: ['admin','manager'] },
  ]},
  { g: 'Sistem', items: [
    { href: '/dashboard/kullanicilar',   label: 'Kullanıcılar', Icon: UserCog,         roles: ['admin'] },
    { href: '/dashboard/otomasyonlar',   label: 'Otomasyonlar', Icon: Workflow,        roles: ['admin','manager'] },
    { href: '/dashboard/ayarlar',        label: 'Ayarlar',      Icon: SlidersHorizontal, roles: ['admin','manager','member'] },
  ]},
]

const ROLE_L: Record<string, string> = {
  admin: 'Yönetici', manager: 'Operasyon Müdürü', member: 'Ekip'
}

export default function Sidebar() {
  const pathname = usePathname()
  const [name, setName] = useState('')
  const [init, setInit] = useState('?')
  const [role, setRole] = useState('member')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('full_name,role').eq('id', user.id).single().then(({ data }) => {
        const n = data?.full_name || user.email?.split('@')[0] || ''
        setName(n)
        setInit(n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2))
        setRole(data?.role || 'member')
      })
    })
  }, [])

  const active = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  // Role göre filtrele
  const filteredNav = NAV_ALL.map(sec => ({
    ...sec,
    items: sec.items.filter(item => item.roles.includes(role))
  })).filter(sec => sec.items.length > 0)

  return (
    <aside className="sb">
      <div className="sb-logo">
        <div className="sb-mark">
          <LayoutDashboard size={14} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-.2px', lineHeight: 1.2 }}>Daydream Production</p>
          <p style={{ fontSize: 9.5, color: 'var(--tx3)', marginTop: 2 }}>Agency ERP</p>
        </div>
      </div>

      {/* Rol badge */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--bdr)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'var(--s2)', borderRadius: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: role === 'admin' ? 'var(--ac)' : role === 'manager' ? 'var(--blue)' : 'var(--tx3)', flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, color: role === 'admin' ? 'var(--ac)' : role === 'manager' ? 'var(--blue)' : 'var(--tx3)', fontWeight: 600 }}>
            {ROLE_L[role] || role}
          </span>
        </div>
      </div>

      <nav className="sb-nav">
        {filteredNav.map(sec => (
          <div key={sec.g}>
            <p className="sb-group">{sec.g}</p>
            {sec.items.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={`sb-item ${active(href) ? 'active' : ''}`}>
                <span className="sb-icon"><Icon size={14} strokeWidth={1.8} /></span>
                <span style={{ flex: 1 }}>{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-user" onClick={logout}>
        <div className="sb-av">{init}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name || '...'}
          </p>
          <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 1 }}>{ROLE_L[role]}</p>
        </div>
        <LogOut size={13} style={{ color: 'var(--tx3)', flexShrink: 0 }} strokeWidth={1.8} />
      </div>
    </aside>
  )
}
