'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, CheckSquare, Users, BarChart2, FileText, ShieldCheck } from 'lucide-react'

const NAV_ALL = [
  { href:'/dashboard',            label:'Dashboard',  Icon:LayoutDashboard, roles:['admin','manager','member'] },
  { href:'/dashboard/gorevler',   label:'Görevler',   Icon:CheckSquare,     roles:['admin','manager','member'] },
  { href:'/dashboard/musteriler', label:'Müşteriler', Icon:Users,           roles:['admin','manager'] },
  { href:'/dashboard/icerik',     label:'İçerik',     Icon:FileText,        roles:['admin','manager','member'] },
  { href:'/dashboard/onay',       label:'Onay',       Icon:ShieldCheck,     roles:['admin','manager','member'] },
  { href:'/dashboard/finans',     label:'Finans',     Icon:BarChart2,       roles:['admin','manager'] },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [role, setRole] = useState<string>('member')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        setRole(data?.role || 'member')
      })
    })
  }, [])

  const nav = NAV_ALL.filter(item => item.roles.includes(role))
  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="bnav">
      {nav.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={`bi ${isActive(href) ? 'active' : ''}`}>
          <Icon size={18} strokeWidth={1.8} style={{ opacity: isActive(href) ? 1 : 0.4 }} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
