'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, FolderOpen, Users, BarChart2 } from 'lucide-react'

const NAV = [
  { href:'/dashboard',            label:'Dashboard',  Icon:LayoutDashboard },
  { href:'/dashboard/gorevler',   label:'Görevler',   Icon:CheckSquare     },
  { href:'/dashboard/projeler',   label:'Projeler',   Icon:FolderOpen      },
  { href:'/dashboard/musteriler', label:'Müşteriler', Icon:Users           },
  { href:'/dashboard/finans',     label:'Finans',     Icon:BarChart2       },
]

export default function BottomNav() {
  const pathname = usePathname()
  const active = (href:string) =>
    href==='/dashboard' ? pathname===href : pathname.startsWith(href)

  return (
    <>
      <style>{`
        .bnav{width:100%;height:52px;background:rgba(11,14,23,0.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid var(--bdr);display:flex;align-items:stretch}
        .bi{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--t2);font-size:9px;font-weight:400;text-decoration:none;transition:color .1s;position:relative}
        .bi.act{color:var(--gold);font-weight:600}
        .bi.act::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:18px;height:1.5px;background:var(--gold);border-radius:1px 1px 0 0}
        .bi-icon{opacity:.45;display:flex}
        .bi.act .bi-icon{opacity:1}
      `}</style>
      <nav className="bnav">
        {NAV.map(({href,label,Icon})=>{
          const a = active(href)
          return (
            <Link key={href} href={href} className={`bi${a?' act':''}`}>
              <span className="bi-icon"><Icon size={17} strokeWidth={1.75}/></span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}