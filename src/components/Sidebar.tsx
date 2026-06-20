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

const NAV = [
  { g:'Genel', items:[{ href:'/dashboard', label:'Dashboard', Icon:LayoutDashboard }]},
  { g:'İş Yönetimi', items:[
    { href:'/dashboard/musteriler',     label:'Müşteriler',     Icon:Users },
    { href:'/dashboard/projeler',       label:'Projeler',       Icon:FolderOpen },
    { href:'/dashboard/gorevler',       label:'Görevler',       Icon:CheckSquare },
    { href:'/dashboard/takvim',         label:'Takvim',         Icon:CalendarDays },
  ]},
  { g:'Operasyon', items:[
    { href:'/dashboard/icerik',         label:'İçerik',         Icon:FileText },
    { href:'/dashboard/operasyon',      label:'Operasyon',      Icon:Activity },
    { href:'/dashboard/gecikmeler',     label:'Gecikmeler',     Icon:AlertCircle },
    { href:'/dashboard/onay',           label:'Onay',           Icon:ShieldCheck },
  ]},
  { g:'Finans', items:[
    { href:'/dashboard/muhasebe',       label:'Muhasebe',       Icon:Receipt },
    { href:'/dashboard/finans',         label:'Finans',         Icon:BarChart2 },
    { href:'/dashboard/performans',     label:'Performans',     Icon:TrendingUp },
  ]},
  { g:'Sistem', items:[
    { href:'/dashboard/kullanicilar',   label:'Kullanıcılar',   Icon:UserCog },
    { href:'/dashboard/otomasyonlar',   label:'Otomasyonlar',   Icon:Workflow },
    { href:'/dashboard/ayarlar',        label:'Ayarlar',        Icon:SlidersHorizontal },
  ]},
]

const ROLE: Record<string,string> = { admin:'Yönetici', manager:'Müdür', member:'Üye' }

export default function Sidebar() {
  const pathname = usePathname()
  const [name, setName] = useState('')
  const [init, setInit] = useState('?')
  const [role, setRole] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('full_name,role').eq('id', user.id).single().then(({ data }) => {
        const n = data?.full_name || user.email?.split('@')[0] || ''
        setName(n)
        setInit(n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2))
        setRole(ROLE[data?.role] || data?.role || '')
      })
    })
  }, [])

  const active = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

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

      <nav className="sb-nav">
        {NAV.map(sec => (
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
          <p style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 1 }}>{role}</p>
        </div>
        <LogOut size={13} style={{ color: 'var(--tx3)', flexShrink: 0 }} strokeWidth={1.8} />
      </div>
    </aside>
  )
}
