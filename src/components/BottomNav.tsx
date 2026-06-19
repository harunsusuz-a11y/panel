'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, FolderKanban, Users, DollarSign } from 'lucide-react'

const NAV = [
  { href: '/dashboard',            label: 'Ana Sayfa',  Icon: LayoutDashboard },
  { href: '/dashboard/gorevler',   label: 'Görevler',   Icon: CheckSquare },
  { href: '/dashboard/projeler',   label: 'Projeler',   Icon: FolderKanban },
  { href: '/dashboard/musteriler', label: 'Müşteriler', Icon: Users },
  { href: '/dashboard/finans',     label: 'Finans',     Icon: DollarSign },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <>
      <style>{`
        .bnav{width:100%;height:54px;background:rgba(13,17,23,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid var(--glass-border);display:flex;align-items:stretch}
        .bnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--t2);font-size:9px;font-weight:400;text-decoration:none;position:relative;transition:color 0.1s}
        .bnav-item.act{color:var(--gold);font-weight:600}
        .bnav-item.act::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:20px;height:2px;background:var(--gold);border-radius:2px 2px 0 0}
        .bnav-icon{opacity:0.45;display:flex}
        .bnav-item.act .bnav-icon{opacity:1}
      `}</style>
      <nav className="bnav">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} className={`bnav-item${active ? ' act' : ''}`}>
              <span className="bnav-icon"><Icon size={18} strokeWidth={1.8}/></span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
