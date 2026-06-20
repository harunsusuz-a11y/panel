'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, FolderOpen, Users, BarChart2 } from 'lucide-react'

const NAV = [
  { href:'/dashboard',            label:'Dashboard',  Icon:LayoutDashboard },
  { href:'/dashboard/gorevler',   label:'Görevler',   Icon:CheckSquare },
  { href:'/dashboard/projeler',   label:'Projeler',   Icon:FolderOpen },
  { href:'/dashboard/musteriler', label:'Müşteriler', Icon:Users },
  { href:'/dashboard/finans',     label:'Finans',     Icon:BarChart2 },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href)
  return (
    <nav className="bnav">
      {NAV.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={`bi ${isActive(href) ? 'active' : ''}`}>
          <Icon size={18} strokeWidth={1.8} style={{ opacity: isActive(href) ? 1 : 0.4 }} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
