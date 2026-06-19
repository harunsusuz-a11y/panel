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
  { g:'Genel', items:[
    { href:'/dashboard',                label:'Dashboard',      Icon:LayoutDashboard },
  ]},
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
    { href:'/dashboard/entegrasyonlar', label:'Entegrasyonlar', Icon:Link2 },
    { href:'/dashboard/ayarlar',        label:'Ayarlar',        Icon:SlidersHorizontal },
  ]},
]

const ROLE_L: Record<string,string> = { admin:'Yönetici', manager:'Müdür', member:'Üye' }

export default function Sidebar() {
  const pathname = usePathname()
  const [name, setName]   = useState('')
  const [init, setInit]   = useState('?')
  const [role, setRole]   = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      sb.from('profiles').select('full_name,role').eq('id', user.id).single().then(({ data }) => {
        const n = data?.full_name || user.email?.split('@')[0] || ''
        setName(n)
        setInit(n.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0, 2))
        setRole(ROLE_L[data?.role] || data?.role || '')
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
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-mark">
          <LayoutDashboard size={15} color="#fff" strokeWidth={2}/>
        </div>
        <div>
          <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)',letterSpacing:'-.2px',lineHeight:1.2}}>Agency ERP</div>
          <div style={{fontSize:10,color:'var(--text-faint)',marginTop:2}}>Operasyon Yönetimi</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {NAV.map(section => (
          <div key={section.g}>
            <div className="sb-grp">{section.g}</div>
            {section.items.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={`sb-item${active(href) ? ' active' : ''}`}>
                <span className="sb-icon"><Icon size={14} strokeWidth={1.8}/></span>
                <span style={{flex:1}}>{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="sb-user" onClick={logout} title="Çıkış yap">
        <div className="sb-av">{init}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:500,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name||'...'}</div>
          <div style={{fontSize:11,color:'var(--text-faint)',marginTop:1}}>{role}</div>
        </div>
        <LogOut size={13} color="var(--text-faint)" strokeWidth={1.8}/>
      </div>
    </aside>
  )
}